
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole, PlacementStatus } from '../../types/enums';
import { getCachedData, setCachedData } from '../../utils/cache';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const isCEO = req.user?.role === UserRole.CEO;
        const branchId = isCEO ? undefined : req.user?.branchId;

        const cacheKey = `dashboard_stats_${branchId || 'global'}`;
        const cachedStats = await getCachedData(cacheKey);

        if (cachedStats) {
            console.log(`[Dashboard Cache Hit] Key: ${cacheKey}`);
            return successResponse(res, cachedStats);
        }

        console.log('Dashboard Stats Debug:', { role: req.user?.role, isCEO, branchId });

        const where: any = branchId ? { branchId } : {};
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // Revenue filter for last month
        const lastMonthRevenueWhere: any = branchId
            ? { status: 'APPROVED', student: { branchId }, updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } }
            : { status: 'APPROVED', updatedAt: { gte: startOfLastMonth, lte: endOfLastMonth } };

        // Fetch Denormalized Totals (Instant)
        const branchStats = branchId
            ? await (prisma.branch as any).findUnique({
                where: { id: branchId },
                select: { totalLeads: true, totalAdmissions: true, totalStudents: true, totalRevenue: true, totalPlacements: true }
            })
            : await (prisma.branch as any).aggregate({
                _sum: { totalLeads: true, totalAdmissions: true, totalStudents: true, totalRevenue: true, totalPlacements: true }
            });

        const totals = branchId ? branchStats : branchStats._sum;

        const kpiPromises = [
            // Trend data still needs live counts based on dates
            prisma.lead.count({ where: { ...where, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
            prisma.user.count({ where: { ...where, role: UserRole.STUDENT, isActive: true, createdAt: { lte: endOfLastMonth } } }),
            prisma.placement.count({
                where: {
                    ...(branchId ? { student: { branchId } } : {}),
                    status: { notIn: [PlacementStatus.REJECTED, PlacementStatus.NOT_ELIGIBLE] },
                    createdAt: { gte: startOfLastMonth, lte: endOfLastMonth }
                }
            }),
            prisma.feePaymentRequest.aggregate({ where: lastMonthRevenueWhere, _sum: { amount: true } }),
        ];

        const placementTrendPromises = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const month = d.toLocaleString('default', { month: 'short' });
            placementTrendPromises.push(
                prisma.placement.count({
                    where: {
                        ...(branchId ? { student: { branchId } } : {}),
                        status: { notIn: [PlacementStatus.REJECTED, PlacementStatus.NOT_ELIGIBLE] },
                        createdAt: { gte: start, lte: end }
                    }
                }).then(count => ({ month, placed: count }))
            );
        }

        const [
            kpiResults,
            placementTrend,
            courseDistribution,
            trainers,
            branches
        ] = await Promise.all([
            Promise.all(kpiPromises),
            Promise.all(placementTrendPromises),
            prisma.admission.groupBy({
                by: ['courseId'],
                where,
                _count: true,
            }),
            prisma.trainer.findMany({
                where: { branchId: branchId || undefined, isActive: true },
                include: {
                    user: { select: { firstName: true, lastName: true } },
                    _count: { select: { courses: true, attendances: true } }
                },
                take: 5
            }),
            isCEO ? prisma.branch.findMany({
                where: { isActive: true },
                // Denormalized fields are already here!
            }) : Promise.resolve([]),
        ]);

        // Process KPI stats
        const [
            lastMonthLeads,
            lastMonthActiveStudents,
            lastMonthPlacements,
            lastMonthRevenueResult
        ] = kpiResults as any[];

        const totalLeads = totals?.totalLeads || 0;
        const totalRevenue = totals?.totalRevenue || 0;
        const activeStudents = totals?.totalStudents || 0;
        const totalPlacements = totals?.totalPlacements || 0;
        const lastMonthRevenue = Number(lastMonthRevenueResult._sum?.amount || 0);

        const calculateChange = (current: number, last: number) => {
            if (last === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - last) / last) * 100);
        };

        const kpis = {
            leads: { value: totalLeads, change: calculateChange(totalLeads, lastMonthLeads) },
            revenue: { value: totalRevenue, change: calculateChange(totalRevenue, lastMonthRevenue) },
            activeStudents: { value: activeStudents, change: calculateChange(activeStudents, lastMonthActiveStudents) },
            placements: { value: totalPlacements, change: calculateChange(totalPlacements, lastMonthPlacements) },
        };

        // Course distribution names
        const courseIds = courseDistribution.map(item => item.courseId);
        const courses = await prisma.course.findMany({
            where: { id: { in: courseIds } },
            select: { id: true, name: true }
        });
        const courseNameMap = Object.fromEntries(courses.map(c => [c.id, c.name]));
        const courseData = courseDistribution.map(item => ({
            name: courseNameMap[item.courseId] || 'Unknown',
            value: item._count
        }));

        // Process Branch Performance (CEO only)
        let branchPerformance: any[] = [];
        if (isCEO) {
            branchPerformance = branches.map((b: any) => ({
                branch: b.name,
                leads: b.totalLeads,
                admissions: b.totalAdmissions,
                students: b.totalStudents,
                placements: b.totalPlacements,
                revenue: b.totalRevenue
            }));
        }

        const trainerPerformanceData = trainers.map((t: any) => ({
            name: `${t.user.firstName} ${t.user.lastName}`,
            course: t.specialization || 'General',
            students: t._count.attendances,
            rating: 4.5,
            status: 'Active'
        }));

        const responseData = {
            stats: {
                kpis,
                placementTrend,
                courseDistribution: courseData,
                branchPerformance,
                trainerPerformance: trainerPerformanceData,
            }
        };

        await setCachedData(cacheKey, responseData, 300);

        return successResponse(res, responseData);
    } catch (error) {
        console.error('[Dashboard Error]:', error);
        return errorResponse(res, 'Failed to fetch dashboard stats', 500, error);
    }
};
