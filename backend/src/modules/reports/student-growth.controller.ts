import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

/**
 * Submit a student growth report
 */
export const submitGrowthReport = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const {
            studentId,
            courseId,
            qualityTeaching,
            doubtClearance,
            testScore,
            aiUpdate,
            portfolioFollowUp,
            classFollowUp
        } = req.body;

        // Fetch trainer profile to get trainerId
        const trainer = await prisma.trainer.findUnique({
            where: { userId: req.user?.id }
        });

        if (!trainer) {
            return errorResponse(res, 'Only trainers can submit growth reports', 403);
        }

        const trainerId = trainer.id;

        const report = await prisma.studentGrowthReport.create({
            data: {
                studentId,
                trainerId,
                courseId,
                qualityTeaching: Number(qualityTeaching),
                doubtClearance: Number(doubtClearance),
                testScore: testScore ? Number(testScore) : null,
                aiUpdate,
                portfolioFollowUp: !!portfolioFollowUp,
                classFollowUp: !!classFollowUp,
            },
        });

        return successResponse(res, report, 'Growth report submitted successfully', 201);
    } catch (error) {
        console.error('Submit report error:', error);
        return errorResponse(res, 'Failed to submit growth report', 500);
    }
};

/**
 * Get growth reports for a student
 */
export const getStudentGrowthReports = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { studentId } = req.params;

        const reports = await prisma.studentGrowthReport.findMany({
            where: { studentId },
            include: {
                trainer: {
                    include: {
                        user: {
                            select: { firstName: true, lastName: true }
                        }
                    }
                },
                course: {
                    select: { name: true, code: true }
                }
            },
            orderBy: { reportDate: 'desc' },
        });

        return successResponse(res, reports);
    } catch (error) {
        console.error('Get reports error:', error);
        return errorResponse(res, 'Failed to fetch growth reports', 500);
    }
};

/**
 * Submit a class or portfolio file report
 */
export const submitFileReport = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { title, description, fileUrl, reportType } = req.body;
        // Fetch trainer profile to get trainerId
        const trainer = await prisma.trainer.findUnique({
            where: { userId: req.user?.id }
        });

        if (!trainer) {
            return errorResponse(res, 'Only trainers can submit file reports', 403);
        }

        const trainerId = trainer.id;

        const report = await prisma.classAndPortfolioReport.create({
            data: {
                title,
                description,
                fileUrl,
                reportType,
                trainerId,
            },
        });

        return successResponse(res, report, 'File report submitted successfully', 201);
    } catch (error) {
        console.error('Submit file report error:', error);
        return errorResponse(res, 'Failed to submit file report', 500);
    }
};

/**
 * Get best performer award logic (CEO/Branch Head only)
 */
export const getTrainerPerformance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { branchId, month, year } = req.query;

        const effectiveBranchId = req.user?.role === UserRole.CEO && branchId
            ? branchId as string
            : req.user?.branchId;

        if (!effectiveBranchId) {
            return errorResponse(res, 'Branch ID is required', 400);
        }

        const startDate = new Date(Number(year), Number(month) - 1, 1);
        const endDate = new Date(Number(year), Number(month), 0);

        const trainers = await prisma.trainer.findMany({
            where: { branchId: effectiveBranchId, isActive: true },
            include: {
                user: { select: { firstName: true, lastName: true } },
                growthReports: {
                    where: {
                        reportDate: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                },
                attendances: {
                    where: {
                        date: {
                            gte: startDate,
                            lte: endDate
                        }
                    }
                }
            }
        });

        const performance = trainers.map(trainer => {
            const avgQuality = trainer.growthReports.length > 0
                ? trainer.growthReports.reduce((acc: number, r: any) => acc + r.qualityTeaching, 0) / trainer.growthReports.length
                : 0;

            const avgDoubt = trainer.growthReports.length > 0
                ? trainer.growthReports.reduce((acc: number, r: any) => acc + r.doubtClearance, 0) / trainer.growthReports.length
                : 0;

            const totalReports = trainer.growthReports.length;
            const portfolioChecks = trainer.growthReports.filter(r => r.portfolioFollowUp).length;
            const classFollowUps = trainer.growthReports.filter(r => r.classFollowUp).length;

            // Simple score calculation (out of 100)
            // 30% quality, 20% doubt clearance, 20% report consistency, 15% portfolio follow-up, 15% class follow-up
            const score = (avgQuality * 3) + (avgDoubt * 2) + (Math.min(totalReports, 20) * 1) + (portfolioChecks * 0.5) + (classFollowUps * 0.5);

            return {
                trainerId: trainer.id,
                name: `${trainer.user.firstName} ${trainer.user.lastName}`,
                avgQuality: avgQuality.toFixed(2),
                avgDoubt: avgDoubt.toFixed(2),
                totalReports,
                portfolioChecks,
                classFollowUps,
                score: score.toFixed(2)
            };
        }).sort((a, b) => Number(b.score) - Number(a.score));

        return successResponse(res, performance);
    } catch (error) {
        console.error('Get performance error:', error);
        return errorResponse(res, 'Failed to fetch trainer performance', 500);
    }
};
