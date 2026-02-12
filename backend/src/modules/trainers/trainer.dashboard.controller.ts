import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getTrainerDashboardStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const trainer = await prisma.trainer.findUnique({
            where: { userId },
            include: { branch: true }
        });

        if (!trainer) {
            return errorResponse(res, 'Trainer profile not found', 404);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

        // 1. Total Active Students (assigned to this trainer's batches)
        const activeStudentsCount = await (prisma as any).student.count({
            where: {
                batch: { trainerId: trainer.id },
                isActive: true
            }
        });

        // 2. All Active Classes (batches assigned to this trainer)
        const activeBatches = await (prisma as any).batch.findMany({
            where: {
                trainerId: trainer.id,
                isActive: true,
            },
            select: { id: true, name: true, startTime: true, endTime: true, code: true }
        });

        // 3. Today's Classes (batches assigned to this trainer)
        // In a real system, we'd check against a class schedule,
        // but here every active batch is considered a class.
        const todayClasses = activeBatches.length; // Simplified as per the comment logic

        // 4. Attendance Counts (Today)
        const attendances = await prisma.attendance.findMany({
            where: {
                trainerId: trainer.id,
                date: {
                    gte: today,
                    lt: tomorrow
                }
            },
            select: { status: true }
        });

        const presentCount = attendances.filter(a => a.status === 'PRESENT').length;
        const absentCount = attendances.filter(a => a.status === 'ABSENT').length;

        // 4. Low Attendance Students (< 75%)
        const students = await (prisma as any).student.findMany({
            where: { batch: { trainerId: trainer.id }, isActive: true },
            include: {
                _count: {
                    select: {
                        attendances: true,
                    }
                },
                attendances: {
                    where: { status: 'PRESENT' },
                    select: { id: true }
                }
            }
        });

        const studentAttendanceStats = students.map((s: any) => {
            const total = s._count.attendances;
            const present = s.attendances.length;
            const percentage = total > 0 ? (present / total) * 100 : 100;
            return { id: s.id, percentage };
        });

        const lowAttendanceCount = studentAttendanceStats.filter((s: any) => s.percentage < 75).length;

        // 5. Portfolio Approvals Pending
        const pendingPortfolios = await (prisma as any).portfolioSubmission.count({
            where: {
                trainerId: trainer.id,
                status: 'PENDING'
            }
        });

        // 6. Placement & Certificate Eligibility
        // Criteria: Attendance >= 75%, Portfolio Approved, Tests Passed
        // This is a simplified fetch for the stats panel
        const eligibleForPlacement = await (prisma as any).student.count({
            where: {
                batch: { trainerId: trainer.id },
                placementEligible: true,
                isActive: true
            }
        });

        const eligibleForCertificate = await (prisma as any).student.count({
            where: {
                batch: { trainerId: trainer.id },
                certificateLocked: false,
                isActive: true
            }
        });

        return successResponse(res, {
            activeStudents: activeStudentsCount,
            todayClasses: todayClasses.length,
            presentToday: presentCount,
            absentToday: absentCount,
            lowAttendance: lowAttendanceCount,
            pendingPortfolios,
            eligibleForPlacement,
            eligibleForCertificate,
            classes: activeBatches
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch trainer dashboard stats', 500, error);
    }
};

export const getStudentsByBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { batchId } = req.params;
        const students = await (prisma as any).student.findMany({
            where: { batchId, isActive: true },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                // Include today's attendance if exists
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                    },
                    take: 1
                },
                admission: {
                    select: {
                        totalFees: true,
                        pendingFees: true
                    }
                }
            }
        });
        return successResponse(res, students);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch students for batch', 500, error);
    }
};

export const checkBatchEligibility = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { batchId } = req.params;
        const students = await (prisma as any).student.findMany({
            where: { batchId, isActive: true },
            include: { attendances: true, portfolioSubmissions: true }
        });

        const updates = [];
        for (const student of students) {
            // 1. Attendance Check (>75%)
            // Calculate total days since batch started
            const batchStartDate = new Date(student.batch?.createdAt || student.createdAt);
            const today = new Date();
            const timeDiff = today.getTime() - batchStartDate.getTime();
            const daysSinceStart = Math.ceil(timeDiff / (1000 * 3600 * 24));

            // Avoid division by zero, min 1 day
            const totalDays = Math.max(1, daysSinceStart);

            const presentDays = student.attendances.filter((a: any) => a.status === 'PRESENT').length;
            const attendancePercentage = (presentDays / totalDays) * 100;

            // 2. Portfolio Check (At least one approved or specific logic)
            // Simplified: If certificate is unlocked, they are eligible for placement
            // Or check if they have submitted all required tasks
            const isPortfolioCleared = !student.certificateLocked;

            const isEligible = attendancePercentage >= 75 && isPortfolioCleared;

            if (student.placementEligible !== isEligible) {
                updates.push((prisma as any).student.update({
                    where: { id: student.id },
                    data: { placementEligible: isEligible }
                }));
            }
        }

        await Promise.all(updates);

        return successResponse(res, { message: 'Eligibility updated', updatedCount: updates.length });
    } catch (error) {
        return errorResponse(res, 'Failed to update eligibility', 500, error);
    }
};
