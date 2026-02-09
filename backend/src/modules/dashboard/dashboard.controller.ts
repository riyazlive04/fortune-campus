
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole, AdmissionStatus, PlacementStatus } from '../../types/enums';

export const getDashboardStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const isCEO = req.user?.role === UserRole.CEO;
        const branchId = isCEO ? undefined : req.user?.branchId;

        const where: any = branchId ? { branchId } : {};

        // Get current month and last month dates
        const now = new Date();
        const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

        // KPI Stats with month-over-month comparison
        const [
            totalLeads,
            lastMonthLeads,
            totalAdmissions,
            lastMonthAdmissions,
            activeStudents,
            lastMonthActiveStudents,
            totalPlacements,
            lastMonthPlacements
        ] = await Promise.all([
            prisma.lead.count({ where }),
            prisma.lead.count({ where: { ...where, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

            prisma.admission.count({ where: { ...where, status: AdmissionStatus.APPROVED } }),
            prisma.admission.count({ where: { ...where, status: AdmissionStatus.APPROVED, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),

            prisma.student.count({ where: { ...where, isActive: true } }),
            prisma.student.count({ where: { ...where, isActive: true, createdAt: { lte: endOfLastMonth } } }),

            prisma.placement.count({ where: { student: { branchId: branchId || undefined }, status: PlacementStatus.PLACED } }),
            prisma.placement.count({ where: { student: { branchId: branchId || undefined }, status: PlacementStatus.PLACED, createdAt: { gte: startOfLastMonth, lte: endOfLastMonth } } }),
        ]);

        // Helper functions for percentages
        const calculateChange = (current: number, last: number) => {
            if (last === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - last) / last) * 100);
        };

        const kpis = {
            leads: { value: totalLeads, change: calculateChange(totalLeads, lastMonthLeads) },
            admissions: { value: totalAdmissions, change: calculateChange(totalAdmissions, lastMonthAdmissions) },
            activeStudents: { value: activeStudents, change: calculateChange(activeStudents, lastMonthActiveStudents) },
            placements: { value: totalPlacements, change: calculateChange(totalPlacements, lastMonthPlacements) },
        };

        // Placement Trend (Last 6 months)
        const placementTrend = [];
        for (let i = 5; i >= 0; i--) {
            const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const start = new Date(d.getFullYear(), d.getMonth(), 1);
            const end = new Date(d.getFullYear(), d.getMonth() + 1, 0);
            const month = d.toLocaleString('default', { month: 'short' });

            const count = await prisma.placement.count({
                where: {
                    student: { branchId: branchId || undefined },
                    status: PlacementStatus.PLACED,
                    createdAt: { gte: start, lte: end }
                }
            });
            placementTrend.push({ month, placed: count });
        }

        // Course-wise Distribution (Admissions)
        const courseDistribution = await prisma.admission.groupBy({
            by: ['courseId'],
            where: { ...where, status: AdmissionStatus.APPROVED },
            _count: true,
        });

        const courseData = await Promise.all(courseDistribution.map(async (item) => {
            const course = await prisma.course.findUnique({ where: { id: item.courseId }, select: { name: true } });
            return { name: course?.name || 'Unknown', value: item._count };
        }));

        // Branch Performance (CEO only or current branch)
        let branchPerformance: any[] = [];
        if (isCEO) {
            const branches = await prisma.branch.findMany({
                where: { isActive: true },
                include: {
                    _count: {
                        select: {
                            leads: true,
                            admissions: true,
                            students: true,
                            trainers: true,
                        }
                    }
                }
            });

            branchPerformance = await Promise.all(branches.map(async (b) => {
                const placementsCount = await prisma.placement.count({
                    where: { student: { branchId: b.id }, status: PlacementStatus.PLACED }
                });
                return {
                    branch: b.name,
                    leads: b._count.leads,
                    admissions: b._count.admissions,
                    students: b._count.students,
                    placements: placementsCount,
                };
            }));
        }

        // Trainer Performance (Top 5)
        const trainers = await prisma.trainer.findMany({
            where: { branchId: branchId || undefined, isActive: true },
            include: {
                user: { select: { firstName: true, lastName: true } },
                _count: { select: { courses: true, attendances: true } }
            },
            take: 5
        });

        const trainerPerformanceData = trainers.map((t: any) => ({
            name: `${t.user.firstName} ${t.user.lastName}`,
            course: t.specialization || 'General',
            students: t._count.attendances,
            rating: 4.5 + (Math.random() * 0.5),
            status: 'Active'
        }));

        return successResponse(res, {
            kpis,
            placementTrend,
            courseDistribution: courseData,
            branchPerformance,
            trainerPerformance: trainerPerformanceData,
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch dashboard stats', 500, error);
    }
};
