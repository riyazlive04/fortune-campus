import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

/**
 * Get Student Dashboard Overview
 * Returns comprehensive summary of student's academic status
 */
export const getStudentOverview = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        // Get student profile with all relations
        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                user: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true,
                    },
                },
                course: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        duration: true,
                    },
                },
                batch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                        startTime: true,
                        endTime: true,
                        trainer: {
                            select: {
                                user: {
                                    select: {
                                        firstName: true,
                                        lastName: true,
                                    },
                                },
                            },
                        },
                    },
                },
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
                admission: {
                    select: {
                        admissionNumber: true,
                        feeAmount: true,
                        feePaid: true,
                        feeBalance: true,
                    },
                },
            },
        });

        if (!student) {
            console.error(`No student profile found for userId: ${userId}`);
            return errorResponse(res, 'Student profile not found. Please contact admin to create your student profile.', 404);
        }

        // Calculate attendance percentage
        const totalAttendance = await prisma.attendance.count({
            where: { studentId: student.id },
        });

        const presentAttendance = await prisma.attendance.count({
            where: {
                studentId: student.id,
                status: 'PRESENT',
            },
        });

        const attendancePercentage = totalAttendance > 0
            ? Math.round((presentAttendance / totalAttendance) * 100)
            : 0;

        // Calculate portfolio completion
        const totalPortfolioTasks = await prisma.portfolioTask.count({
            where: { courseId: student.courseId },
        });

        const approvedSubmissions = await prisma.portfolioSubmission.count({
            where: {
                studentId: student.id,
                status: 'APPROVED',
            },
        });

        const portfolioPercentage = totalPortfolioTasks > 0
            ? Math.round((approvedSubmissions / totalPortfolioTasks) * 100)
            : 0;

        // Get test status
        let testStatus = 'PENDING';
        let passedTests = 0;
        let totalTests = 0;
        try {
            const testScores = await prisma.testScore.findMany({
                where: { studentId: student.id },
                include: {
                    test: {
                        select: {
                            title: true,
                            passMarks: true,
                        },
                    },
                },
            });

            passedTests = testScores.filter(
                (score: any) => score.isPass
            ).length;

            totalTests = testScores.length;
            testStatus = totalTests === 0 ? 'PENDING' : passedTests === totalTests ? 'PASSED' : 'PARTIAL';
        } catch (err) {
            console.error('Error fetching tests:', (err as any).message);
        }

        // Get software progress
        let softwareProgress = null;
        try {
            // SoftwareProgress is an array in Student model, but findUnique/findFirst on the table directly works
            softwareProgress = await prisma.softwareProgress.findFirst({
                where: { studentId: student.id },
                orderBy: { lastUpdated: 'desc' }
            });
        } catch (err) {
            console.error('Error fetching software progress:', (err as any).message);
        }

        // Calculate eligibility
        const certificateEligible =
            attendancePercentage >= 75 &&
            portfolioPercentage === 100 &&
            testStatus === 'PASSED';

        const placementEligible = certificateEligible && student.placementEligible;

        // Build overview response
        const overview = {
            student: {
                name: `${student.user.firstName} ${student.user.lastName}`,
                email: student.user.email,
                phone: student.user.phone,
                enrollmentNumber: student.enrollmentNumber,
            },
            course: {
                name: student.course.name,
                code: student.course.code,
                duration: student.course.duration,
            },
            batch: student.batch ? {
                name: student.batch.name,
                code: student.batch.code,
                timing: `${student.batch.startTime || 'TBD'} - ${student.batch.endTime || 'TBD'}`,
                trainer: student.batch.trainer ?
                    `${student.batch.trainer.user.firstName} ${student.batch.trainer.user.lastName}` :
                    'Not Assigned',
            } : null,
            branch: {
                name: student.branch.name,
                code: student.branch.code,
            },
            attendance: {
                percentage: attendancePercentage,
                status: attendancePercentage >= 75 ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
                present: presentAttendance,
                total: totalAttendance,
            },
            portfolio: {
                percentage: portfolioPercentage,
                status: portfolioPercentage === 100 ? 'COMPLETED' : 'IN_PROGRESS',
                approved: approvedSubmissions,
                total: totalPortfolioTasks,
            },
            tests: {
                status: testStatus,
                passed: passedTests,
                total: totalTests,
            },
            softwareProgress: {
                percentage: softwareProgress?.progress || 0,
                currentTopic: softwareProgress?.currentTopic || 'Not Started',
            },
            eligibility: {
                certificate: {
                    eligible: certificateEligible,
                    status: certificateEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
                    missingRequirements: [
                        ...(attendancePercentage < 75 ? ['Attendance below 75%'] : []),
                        ...(portfolioPercentage < 100 ? ['Portfolio not completed'] : []),
                        ...(testStatus !== 'PASSED' ? ['Tests not passed'] : []),
                    ],
                },
                placement: {
                    eligible: placementEligible,
                    status: placementEligible ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
                },
            },
            fees: {
                total: student.admission.feeAmount,
                paid: student.admission.feePaid,
                balance: student.admission.feeBalance,
            },
        };

        return successResponse(res, overview);
    } catch (error: any) {
        console.error('Get student overview error:', error);
        return errorResponse(res, 'Failed to fetch student overview', 500, error);
    }
};

/**
 * Get Student Attendance Records
 * Returns daily attendance records
 */
export const getStudentAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        const student = await prisma.student.findUnique({
            where: { userId },
        });

        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        // Get attendance records
        const attendances = await prisma.attendance.findMany({
            where: { studentId: student.id },
            orderBy: { date: 'desc' },
            take: 100, // Last 100 records
            select: {
                id: true,
                date: true,
                status: true,
                remarks: true,
                isVerified: true,
            },
        });

        // Calculate stats
        const totalDays = attendances.length;
        const presentDays = attendances.filter((a) => a.status === 'PRESENT').length;
        const lateDays = attendances.filter((a) => a.status === 'LATE').length;
        const absentDays = attendances.filter((a) => a.status === 'ABSENT').length;

        const attendancePercentage = totalDays > 0 ? Math.round((presentDays / totalDays) * 100) : 0;

        // Check for consecutive absences
        let consecutiveAbsences = 0;
        let maxConsecutiveAbsences = 0;

        for (const attendance of attendances) {
            if (attendance.status === 'ABSENT') {
                consecutiveAbsences++;
                maxConsecutiveAbsences = Math.max(maxConsecutiveAbsences, consecutiveAbsences);
            } else {
                consecutiveAbsences = 0;
            }
        }

        return successResponse(res, {
            records: attendances,
            stats: {
                total: totalDays,
                present: presentDays,
                late: lateDays,
                absent: absentDays,
                percentage: attendancePercentage,
                consecutiveAbsences: maxConsecutiveAbsences,
                eligibilityStatus: attendancePercentage >= 75 ? 'ELIGIBLE' : 'NOT_ELIGIBLE',
            },
            alerts: [
                ...(attendancePercentage < 75 ? ['Attendance below 75% - Certificate and placement locked'] : []),
                ...(maxConsecutiveAbsences >= 3 ? [`${maxConsecutiveAbsences} consecutive absences detected`] : []),
            ],
        });
    } catch (error: any) {
        console.error('Get student attendance error:', error);
        return errorResponse(res, 'Failed to fetch attendance records', 500, error);
    }
};

/**
 * Get Student Course Progress
 * Returns module-wise progress and software completion
 */
export const getStudentProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                course: {
                    select: {
                        name: true,
                        code: true,
                        duration: true,
                        syllabus: true,
                    },
                },
            },
        });

        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        const progress = await prisma.softwareProgress.findUnique({
            where: { studentId: student.id },
        });

        // Parse completed topics (assuming comma-separated or JSON)
        let completedTopics: string[] = [];
        try {
            if (progress?.completedTopics) {
                completedTopics = progress.completedTopics.includes(',')
                    ? progress.completedTopics.split(',').map((t) => t.trim())
                    : JSON.parse(progress.completedTopics);
            }
        } catch {
            completedTopics = [];
        }

        return successResponse(res, {
            course: student.course,
            software: {
                progress: progress?.progress || 0,
                currentTopic: progress?.currentTopic || 'Not Started',
                completedTopics,
                lastUpdated: progress?.lastUpdated,
            },
            estimatedCompletion: student.course.duration ?
                `${student.course.duration} months from admission` :
                'Not specified',
        });
    } catch (error: any) {
        console.error('Get student progress error:', error);
        return errorResponse(res, 'Failed to fetch course progress', 500, error);
    }
};

/**
 * Get Student Portfolio Status
 * Returns tasks, submissions, and approval status
 */
export const getStudentPortfolio = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        const student = await prisma.student.findUnique({
            where: { userId },
        });

        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        // Get portfolio tasks for the course
        const tasks = await prisma.portfolioTask.findMany({
            where: { courseId: student.courseId },
            orderBy: { order: 'asc' },
        });

        // Get student's submissions
        const submissions = await prisma.portfolioSubmission.findMany({
            where: { studentId: student.id },
            include: {
                task: {
                    select: {
                        title: true,
                        description: true,
                    },
                },
                trainer: {
                    select: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { submittedAt: 'desc' },
        });

        // Map submissions to tasks
        const tasksWithSubmissions = tasks.map((task) => {
            const submission = submissions.find((s) => s.taskId === task.id);
            return {
                ...task,
                submission: submission || null,
            };
        });

        const totalTasks = tasks.length;
        const approvedTasks = submissions.filter((s) => s.status === 'APPROVED').length;
        const portfolioPercentage = totalTasks > 0 ? Math.round((approvedTasks / totalTasks) * 100) : 0;

        return successResponse(res, {
            tasks: tasksWithSubmissions,
            stats: {
                total: totalTasks,
                approved: approvedTasks,
                pending: submissions.filter((s) => s.status === 'PENDING').length,
                rejected: submissions.filter((s) => s.status === 'REJECTED').length,
                percentage: portfolioPercentage,
            },
            placementReady: portfolioPercentage === 100,
        });
    } catch (error: any) {
        console.error('Get student portfolio error:', error);
        return errorResponse(res, 'Failed to fetch portfolio status', 500, error);
    }
};

/**
 * Submit Portfolio Task
 * Allows student to upload portfolio submission
 */
export const submitPortfolio = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const { taskId, workUrl, remarks } = req.body;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        if (!taskId || !workUrl) {
            return errorResponse(res, 'Task ID and work URL are required', 400);
        }

        const student = await prisma.student.findUnique({
            where: { userId },
        });

        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        // Check if task exists
        const task = await prisma.portfolioTask.findUnique({
            where: { id: taskId },
        });

        if (!task) {
            return errorResponse(res, 'Portfolio task not found', 404);
        }

        // Create submission
        const submission = await prisma.portfolioSubmission.create({
            data: {
                studentId: student.id,
                taskId,
                workUrl,
                remarks: remarks || '',
                status: 'PENDING',
            },
        });

        return successResponse(res, submission, 'Portfolio submitted successfully', 201);
    } catch (error: any) {
        console.error('Submit portfolio error:', error);
        return errorResponse(res, 'Failed to submit portfolio', 500, error);
    }
};

/**
 * Get Student Test Results
 * Returns test schedule and results
 */
export const getStudentTests = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        const student = await prisma.student.findUnique({
            where: { userId },
        });

        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        // Get test scores
        const testScores = await prisma.testScore.findMany({
            where: { studentId: student.id },
            include: {
                test: {
                    select: {
                        title: true,
                        totalMarks: true,
                        passMarks: true,
                        date: true,
                    },
                },
            },
            orderBy: { createdAt: 'desc' },
        });

        // Get upcoming tests (tests in student's batch without scores)
        const upcomingTests = student.batchId ? await prisma.test.findMany({
            where: {
                batchId: student.batchId,
                date: {
                    gte: new Date(),
                },
                scores: {
                    none: {
                        studentId: student.id,
                    },
                },
            },
            orderBy: { date: 'asc' },
        }) : [];

        const passedTests = testScores.filter((score) => score.isPass).length;
        const failedTests = testScores.filter((score) => !score.isPass).length;

        return successResponse(res, {
            upcoming: upcomingTests,
            results: testScores,
            stats: {
                total: testScores.length,
                passed: passedTests,
                failed: failedTests,
                percentage: testScores.length > 0
                    ? Math.round((passedTests / testScores.length) * 100)
                    : 0,
            },
        });
    } catch (error: any) {
        console.error('Get student tests error:', error);
        return errorResponse(res, 'Failed to fetch test results', 500, error);
    }
};

/**
 * Get Student Fee Details
 * Returns fee transparency information
 */
export const getStudentFees = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        const student = await prisma.student.findUnique({
            where: { userId },
            include: {
                admission: {
                    select: {
                        feeAmount: true,
                        feePaid: true,
                        feeBalance: true,
                        admissionDate: true,
                    },
                },
            },
        });

        if (!student) {
            return errorResponse(res, 'Student profile not found', 404);
        }

        const totalFee = student.admission.feeAmount;
        const paid = student.admission.feePaid;
        const balance = student.admission.feeBalance;

        return successResponse(res, {
            total: totalFee,
            paid,
            balance,
            admissionDate: student.admission.admissionDate,
            paymentHistory: [],
        });
    } catch (error: any) {
        console.error('Get student fees error:', error);
        return errorResponse(res, 'Failed to fetch fee details', 500, error);
    }
};

/**
 * Get Student Notifications
 * Returns automated alerts and notifications
 */
export const getStudentNotifications = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;

        if (!userId) {
            return errorResponse(res, 'User not authenticated', 401);
        }

        const notifications = await prisma.notification.findMany({
            where: { recipientId: userId },
            orderBy: { createdAt: 'desc' },
            take: 50,
        });

        return successResponse(res, {
            notifications,
            unreadCount: notifications.filter((n) => !n.isRead).length,
        });
    } catch (error: any) {
        console.error('Get student notifications error:', error);
        return errorResponse(res, 'Failed to fetch notifications', 500, error);
    }
};
