import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';

// POST /api/ratings/trainer
// Student submits a 1-5 star rating for their trainer (one per trainer per month)
export const submitTrainerRating = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        if (req.user?.role !== 'STUDENT') {
            return errorResponse(res, 'Only students can submit ratings', 403);
        }

        const { trainerId, rating, comment } = req.body;

        if (!trainerId || typeof rating !== 'number' || rating < 1 || rating > 5) {
            return errorResponse(res, 'trainerId and rating (1-5) are required', 400);
        }

        // Get the student profile for this user
        const student = await prisma.student.findUnique({
            where: { userId: req.user.id }
        });
        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // Upsert: update if already rated this trainer this month, else create
        const trainerRating = await prisma.trainerRating.upsert({
            where: {
                trainerId_studentId_month_year: {
                    trainerId,
                    studentId: student.id,
                    month,
                    year,
                }
            },
            create: {
                trainerId,
                studentId: student.id,
                rating: Math.round(rating * 10) / 10,
                comment: comment || null,
                month,
                year,
            },
            update: {
                rating: Math.round(rating * 10) / 10,
                comment: comment || null,
            }
        });

        return successResponse(res, trainerRating, 'Rating submitted successfully');
    } catch (error: any) {
        console.error('submitTrainerRating error:', error);
        return errorResponse(res, error.message || 'Failed to submit rating', 500);
    }
};

// GET /api/ratings/trainer/:trainerId/average
// Returns average rating, total ratings, and this month's data for a trainer
export const getTrainerAverageRating = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { trainerId } = req.params;

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // All-time aggregate
        const allTime = await prisma.trainerRating.aggregate({
            where: { trainerId },
            _avg: { rating: true },
            _count: { id: true },
        });

        // Current month aggregate
        const thisMonth = await prisma.trainerRating.aggregate({
            where: { trainerId, month, year },
            _avg: { rating: true },
            _count: { id: true },
        });

        return successResponse(res, {
            trainerId,
            avgRating: allTime._avg.rating ? Math.round(allTime._avg.rating * 10) / 10 : null,
            totalRatings: allTime._count.id,
            thisMonth: {
                avgRating: thisMonth._avg.rating ? Math.round(thisMonth._avg.rating * 10) / 10 : null,
                totalRatings: thisMonth._count.id,
                month,
                year,
            }
        });
    } catch (error: any) {
        console.error('getTrainerAverageRating error:', error);
        return errorResponse(res, error.message || 'Failed to get rating', 500);
    }
};

// GET /api/ratings/trainer/:trainerId/my-rating
// Returns the current student's rating for this trainer this month
export const getMyRatingForTrainer = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        if (req.user?.role !== 'STUDENT') {
            return errorResponse(res, 'Only students can check their ratings', 403);
        }

        const { trainerId } = req.params;

        const student = await prisma.student.findUnique({
            where: { userId: req.user.id }
        });
        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        const existing = await prisma.trainerRating.findUnique({
            where: {
                trainerId_studentId_month_year: {
                    trainerId,
                    studentId: student.id,
                    month,
                    year,
                }
            }
        });

        return successResponse(res, { existing: existing || null });
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to get rating', 500);
    }
};

export const getAllTrainersAverageRatings = async (_req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const ratings = await prisma.trainerRating.groupBy({
            by: ['trainerId'],
            _avg: { rating: true },
            _count: { id: true },
        });

        const result = ratings.map((r: { trainerId: string; _avg: { rating: number | null }; _count: { id: number } }) => ({
            trainerId: r.trainerId,
            avgRating: r._avg.rating ? Math.round(r._avg.rating * 10) / 10 : null,
            totalRatings: r._count.id,
        }));

        return successResponse(res, result);
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to get ratings', 500);
    }
};

// GET /api/ratings/trainer/:trainerId/performance-metrics
// Calculates a weighted score out of 100 based on the 30/70 model
export const getPerformanceMetrics = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { trainerId } = req.params;
        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();

        // 1. Trainer Rating (15% weight)
        const ratingAgg = await prisma.trainerRating.aggregate({
            where: { trainerId },
            _avg: { rating: true }
        });
        const avgRating = ratingAgg._avg.rating || 0;
        const ratingScore = (avgRating / 5) * 15;

        // 2. Trainer Attendance (15% weight)
        // Calculating for the current month
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        const attendanceRecords = await prisma.trainerAttendance.findMany({
            where: {
                trainerId,
                date: { gte: startOfMonth, lte: endOfMonth }
            }
        });
        const totalAttendance = attendanceRecords.length;
        const presentAttendance = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'HALFDAY').length;
        const attendanceScore = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 15 : 0;

        // 3. Student Portfolio Approval (35% weight)
        // Get all students associated with his batches
        const batches = await prisma.batch.findMany({
            where: { trainerId },
            select: { id: true }
        });
        const batchIds = batches.map(b => b.id);

        const portfolioSubmissions = await prisma.portfolioSubmission.findMany({
            where: {
                student: { batchId: { in: batchIds } }
            }
        });
        const totalPortfolios = portfolioSubmissions.length;
        const approvedPortfolios = portfolioSubmissions.filter(p => p.status === 'APPROVED').length;
        const portfolioScore = totalPortfolios > 0 ? (approvedPortfolios / totalPortfolios) * 35 : 0;

        // 4. Student Test Scores (35% weight)
        const testScores = await prisma.testScore.findMany({
            where: {
                student: { batchId: { in: batchIds } }
            },
            include: { test: true }
        });

        let totalPercentage = 0;
        testScores.forEach(score => {
            if (score.test && score.test.totalMarks > 0) {
                totalPercentage += (score.marksObtained / score.test.totalMarks) * 100;
            }
        });

        const avgTestPercentage = testScores.length > 0 ? totalPercentage / testScores.length : 0;
        const testScoreVal = (avgTestPercentage / 100) * 35;

        const totalScore = Math.round(ratingScore + attendanceScore + portfolioScore + testScoreVal);

        return successResponse(res, {
            trainerId,
            metrics: {
                rating: { score: ratingScore, raw: avgRating, weight: 15 },
                attendance: { score: attendanceScore, raw: presentAttendance, total: totalAttendance, weight: 15 },
                portfolio: { score: portfolioScore, raw: approvedPortfolios, total: totalPortfolios, weight: 35 },
                tests: { score: testScoreVal, raw: avgTestPercentage, weight: 35 }
            },
            totalScore
        });
    } catch (error: any) {
        console.error('getPerformanceMetrics error:', error);
        return errorResponse(res, error.message || 'Failed to calculate performance metrics', 500);
    }
};

// GET /api/ratings/trainers/performance-metrics
// Calculates weighted scores for ALL trainers for the current month
export const getAllPerformanceMetrics = async (_req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const trainers = await prisma.trainer.findMany({
            where: { isActive: true },
            select: { id: true, user: { select: { firstName: true, lastName: true } } }
        });

        const now = new Date();
        const month = now.getMonth() + 1;
        const year = now.getFullYear();
        const startOfMonth = new Date(year, month - 1, 1);
        const endOfMonth = new Date(year, month, 0, 23, 59, 59);

        // Fetch everything in bulk
        const results = await Promise.all(trainers.map(async (trainer) => {
            // Rating (15%)
            const ratingAgg = await prisma.trainerRating.aggregate({
                where: { trainerId: trainer.id },
                _avg: { rating: true }
            });
            const avgRating = ratingAgg._avg.rating || 0;
            const ratingScore = (avgRating / 5) * 15;

            // Attendance (15%)
            const attendanceRecords = await prisma.trainerAttendance.findMany({
                where: {
                    trainerId: trainer.id,
                    date: { gte: startOfMonth, lte: endOfMonth }
                }
            });
            const totalAttendance = attendanceRecords.length;
            const presentAttendance = attendanceRecords.filter(a => a.status === 'PRESENT' || a.status === 'HALFDAY').length;
            const attendanceScore = totalAttendance > 0 ? (presentAttendance / totalAttendance) * 15 : 0;

            // Students/Portfolios/Tests (70%)
            const batches = await prisma.batch.findMany({
                where: { trainerId: trainer.id },
                select: { id: true }
            });
            const batchIds = batches.map(b => b.id);

            const portfolioSubmissions = await prisma.portfolioSubmission.findMany({
                where: { student: { batchId: { in: batchIds } } }
            });
            const totalPortfolios = portfolioSubmissions.length;
            const approvedPortfolios = portfolioSubmissions.filter(p => p.status === 'APPROVED').length;
            const portfolioScore = totalPortfolios > 0 ? (approvedPortfolios / totalPortfolios) * 35 : 0;

            const testScores = await prisma.testScore.findMany({
                where: { student: { batchId: { in: batchIds } } },
                include: { test: true }
            });

            let totalPercentage = 0;
            testScores.forEach(score => {
                if (score.test && score.test.totalMarks > 0) {
                    totalPercentage += (score.marksObtained / score.test.totalMarks) * 100;
                }
            });
            const avgTestPercentage = testScores.length > 0 ? totalPercentage / testScores.length : 0;
            const testScoreVal = (avgTestPercentage / 100) * 35;

            const totalScore = Math.round(ratingScore + attendanceScore + portfolioScore + testScoreVal);

            return {
                trainerId: trainer.id,
                trainerName: `${trainer.user.firstName} ${trainer.user.lastName}`,
                totalScore,
                metrics: {
                    rating: avgRating,
                    attendance: totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0,
                    portfolio: totalPortfolios > 0 ? Math.round((approvedPortfolios / totalPortfolios) * 100) : 0,
                    tests: Math.round(avgTestPercentage)
                }
            };
        }));

        return successResponse(res, results);
    } catch (error: any) {
        console.error('getAllPerformanceMetrics error:', error);
        return errorResponse(res, error.message || 'Failed to calculate performance metrics', 500);
    }
};


