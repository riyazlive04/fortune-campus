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

        // 1. Total Active Students (assigned to this trainer's branch)
        const activeStudentsCount = await (prisma as any).student.count({
            where: {
                branchId: trainer.branchId,
                isActive: true
            }
        });

        // 2. All Active Classes (Batches in this branch)
        // Trainers should see all batches in their branch to manage tests/attendance if needed
        const activeBatches = await (prisma as any).batch.findMany({
            where: {
                branchId: trainer.branchId,
                isActive: true,
            },
            select: {
                id: true,
                name: true,
                startTime: true,
                endTime: true,
                code: true,
                trainer: {
                    select: { user: { select: { firstName: true, lastName: true } } }
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // 3. Today's Classes
        // Filter active batches to find those that are relevant for "classes" count
        // For now, we count all active batches in branch as potential classes
        const todayClasses = activeBatches.length;

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

        // 5. Portfolio Approvals Pending (Branch-wide)
        const pendingPortfolios = await (prisma as any).portfolioSubmission.count({
            where: {
                status: 'PENDING',
                student: {
                    branchId: trainer.branchId
                }
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
            todayClasses: todayClasses,
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
                        feeAmount: true,
                        feeBalance: true
                    }
                }
            }
        });
        return successResponse(res, { students });
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

export const getBranchStudents = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const trainer = await prisma.trainer.findUnique({
            where: { userId }
        });

        if (!trainer) {
            return errorResponse(res, 'Trainer profile not found', 404);
        }

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const students = await (prisma as any).student.findMany({
            where: {
                branchId: trainer.branchId,
                isActive: true
            },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                attendances: {
                    where: {
                        date: {
                            gte: today,
                            lt: new Date(today.getTime() + 24 * 60 * 60 * 1000)
                        }
                    }
                }
            }
        });

        return successResponse(res, { students });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch branch students', 500, error);
    }
};

export const getStudentDetailsForTrainer = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { studentId } = req.params;
        const student = await (prisma as any).student.findUnique({
            where: { id: studentId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                course: true,
                batch: true,
                branch: true,
                admission: true,
                attendances: {
                    orderBy: { date: 'desc' },
                    take: 50
                },
                portfolioSubmissions: {
                    include: { task: true },
                    orderBy: { createdAt: 'desc' }
                },
                testScores: {
                    include: { test: true },
                    orderBy: { createdAt: 'desc' }
                }
            }
        });

        if (!student) {
            return errorResponse(res, 'Student not found', 404);
        }

        // Calculate some basic stats for the popup
        const totalAttendance = await prisma.attendance.count({ where: { studentId } });
        const presentAttendance = await prisma.attendance.count({ where: { studentId, status: 'PRESENT' } });
        const attendancePercentage = totalAttendance > 0 ? Math.round((presentAttendance / totalAttendance) * 100) : 0;

        return successResponse(res, {
            ...student,
            stats: {
                attendancePercentage,
                totalAttendance,
                presentAttendance
            }
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch student details', 500, error);
    }
};

export const getBranchReports = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        console.log(`[getBranchReports] Fetching reports for user: ${userId}`);

        const trainer = await prisma.trainer.findUnique({
            where: { userId },
            select: { branchId: true }
        });

        console.log(`[getBranchReports] Trainer found:`, trainer);

        if (!trainer || !trainer.branchId) {
            console.log(`[getBranchReports] Trainer or BranchId missing`);
            return errorResponse(res, 'Trainer or Branch not found', 404);
        }

        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);

        // Calculate Total Enrollments this month
        const enrollments = await (prisma as any).admission.count({
            where: {
                branchId: trainer.branchId,
                admissionDate: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            }
        });

        // Calculate Total Collections this month (sum of feePaid)
        const collectionsAgg = await (prisma as any).admission.aggregate({
            where: {
                branchId: trainer.branchId,
                admissionDate: {
                    gte: startOfMonth,
                    lte: endOfMonth
                }
            },
            _sum: {
                feePaid: true
            }
        });
        const totalCollections = collectionsAgg._sum.feePaid || 0;

        // Calculate Trainer Expenses this month (sum of incentives amount)
        const expensesAgg = await (prisma as any).incentive.aggregate({
            where: {
                trainer: {
                    branchId: trainer.branchId
                },
                month: now.getMonth() + 1,
                year: now.getFullYear()
            },
            _sum: {
                amount: true
            }
        });
        const trainerExpense = expensesAgg._sum.amount || 0;

        // Calculate Branch Share (e.g. 70% of collections)
        const branchShare = totalCollections * 0.70;

        const liveReport = {
            id: 'live-report-current-month',
            month: now.toLocaleString('default', { month: 'long', year: 'numeric' }),
            branchId: trainer.branchId,
            status: 'Current Month Live',
            totalCollections,
            totalEnrollments: enrollments,
            trainerExpense,
            branchShare,
            notes: "Live performance data aggregated for the current month."
        };

        const existingReports = await (prisma as any).branchReport.findMany({
            where: {
                branchId: trainer.branchId
            },
            orderBy: {
                createdAt: 'desc'
            },
            include: {
                uploadedBy: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        const formattedExistingReports = existingReports.map((r: any) => ({
            ...r,
            month: new Date(r.createdAt).toLocaleString('default', { month: 'long', year: 'numeric' }),
            totalCollections: 0,
            totalEnrollments: 0,
            trainerExpense: 0,
            branchShare: 0,
            notes: r.description || "Historically uploaded document report."
        }));

        const reports = [liveReport, ...formattedExistingReports];

        console.log(`[getBranchReports] Reports found: ${reports.length}`);
        return successResponse(res, { reports }, 'Branch reports fetched successfully');
    } catch (error) {
        console.error('Fetch reports error:', error);
        return errorResponse(res, 'Failed to fetch reports', 500);
    }
};
