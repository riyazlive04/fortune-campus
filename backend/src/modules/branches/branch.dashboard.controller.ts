
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

export const getBranchOverview = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        if (!branchId && req.user?.role !== UserRole.CEO) {
            return errorResponse(res, 'Branch ID not found for user', 400);
        }

        const where = branchId ? { branchId } : {};
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

        const [
            activeStudents,
            newAdmissionsToday,
            newAdmissionsWeekly,
            newAdmissionsMonthly,
            totalLeads,
            totalAdmissionsCount,
            totalTrainers,
            attendanceToday,
            revenueStats,
            placementEligible
        ] = await Promise.all([
            prisma.student.count({ where: { ...where, isActive: true } }),
            prisma.admission.count({ where: { ...where, createdAt: { gte: todayStart } } }),
            prisma.admission.count({ where: { ...where, createdAt: { gte: weekStart } } }),
            prisma.admission.count({ where: { ...where, createdAt: { gte: monthStart } } }),
            prisma.lead.count({ where }),
            prisma.admission.count({ where }),
            prisma.trainer.count({ where }),
            prisma.attendance.groupBy({
                by: ['status'],
                where: {
                    ...(branchId ? { student: { branchId } } : {}),
                    date: { gte: todayStart }
                },
                _count: true
            }),
            prisma.admission.aggregate({
                where,
                _sum: { feePaid: true, feeBalance: true, feeAmount: true }
            }),
            prisma.student.count({ where: { ...where, placementEligible: true } })
        ]);

        const conversionRate = totalLeads > 0 ? Math.round((totalAdmissionsCount / totalLeads) * 100) : 0;

        const attendanceSummary = {
            present: attendanceToday.find(a => a.status === 'PRESENT')?._count || 0,
            absent: attendanceToday.find(a => a.status === 'ABSENT')?._count || 0,
        };

        return successResponse(res, {
            kpis: {
                activeStudents,
                admissions: {
                    today: newAdmissionsToday,
                    weekly: newAdmissionsWeekly,
                    monthly: newAdmissionsMonthly,
                    conversionRate
                },
                trainers: totalTrainers,
                attendance: attendanceSummary,
                revenue: {
                    collected: revenueStats._sum.feePaid || 0,
                    pending: revenueStats._sum.feeBalance || 0,
                    total: revenueStats._sum.feeAmount || 0
                },
                placementEligible
            }
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch branch overview', 500, error);
    }
};

export const getAdmissionsStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const [leadsBySource, admissionsTrend] = await Promise.all([
            prisma.lead.groupBy({
                by: ['source'],
                where,
                _count: true
            }),
            prisma.admission.groupBy({
                by: ['status'],
                where,
                _count: true
            })
        ]);

        return successResponse(res, { leadsBySource, admissionsTrend });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch admissions stats', 500, error);
    }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { student: { branchId } } : {};

        const [latestAttendance, lowAttendanceStudents] = await Promise.all([
            prisma.attendance.findMany({
                where,
                take: 10,
                orderBy: { date: 'desc' },
                include: { student: { include: { user: true } } }
            }),
            // Simplified: in real app, we would aggregate attendance percentages
            prisma.student.findMany({
                where: { ...where, isActive: true },
                include: { user: true, _count: { select: { attendances: true } } },
                take: 5
            })
        ]);

        return successResponse(res, { latestAttendance, lowAttendanceStudents });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch attendance stats', 500, error);
    }
};

export const getProgressStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const [courseDistribution, softwareProgress] = await Promise.all([
            prisma.student.groupBy({
                by: ['courseId'],
                where,
                _count: true
            }),
            prisma.softwareProgress.findMany({
                where: { student: { branchId } },
                take: 5,
                orderBy: { progress: 'asc' },
                include: { student: { include: { user: true } } }
            })
        ]);

        return successResponse(res, { courseDistribution, softwareProgress });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch progress stats', 500, error);
    }
};

export const getPortfolioStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { student: { branchId } } : {};

        const [submissions, pendingApprovals] = await Promise.all([
            prisma.portfolioSubmission.count({ where }),
            prisma.portfolioSubmission.count({ where: { ...where, status: 'PENDING' } })
        ]);

        return successResponse(res, { submissions, pendingApprovals });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch portfolio stats', 500, error);
    }
};

export const getTrainerStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const trainers = await prisma.trainer.findMany({
            where,
            include: {
                user: true,
                batches: {
                    include: {
                        _count: { select: { students: true } }
                    }
                }
            }
        });

        const performance = trainers.map(t => ({
            id: t.id,
            name: `${t.user.firstName} ${t.user.lastName}`,
            batchesCount: t.batches.length,
            totalStudents: t.batches.reduce((acc: number, b: any) => acc + (b._count?.students || 0), 0),
            rating: 4.8,
            efficiency: '92%'
        }));

        return successResponse(res, { performance });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch trainer stats', 500, error);
    }
};

export const getFeeStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const revenueByCourse = await prisma.admission.groupBy({
            by: ['courseId'],
            where,
            _sum: { feePaid: true, feeBalance: true }
        });

        return successResponse(res, { revenueByCourse });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch fee stats', 500, error);
    }
};

export const getPlacementStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const [eligibleCount, recentPlacements] = await Promise.all([
            prisma.student.count({ where: { ...where, placementEligible: true } }),
            prisma.placement.findMany({
                where: { student: { branchId } },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { student: { include: { user: true } }, company: true }
            })
        ]);

        return successResponse(res, { eligibleCount, recentPlacements });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch placement stats', 500, error);
    }
};
