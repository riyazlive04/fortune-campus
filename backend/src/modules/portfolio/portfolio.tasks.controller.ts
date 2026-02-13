
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getPortfolioTasksByCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { courseId } = req.params;
        const tasks = await (prisma as any).portfolioTask.findMany({
            where: { courseId },
            orderBy: { order: 'asc' }
        });
        return successResponse(res, tasks);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch tasks', 500, error);
    }
};

export const createPortfolioTask = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { courseId, title, description, order } = req.body;
        const task = await (prisma as any).portfolioTask.create({
            data: { courseId, title, description, order: order || 0 }
        });
        return successResponse(res, task, 'Portfolio task created successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to create task', 500, error);
    }
};

export const submitPortfolioWork = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { taskId, studentId, workUrl, behanceUrl, remarks } = req.body;

        const task = await (prisma as any).portfolioTask.findUnique({ where: { id: taskId } });
        if (!task) return errorResponse(res, 'Portfolio task not found', 404);

        // Check if there's an existing submission and update or Create
        const existingSubmission = await (prisma as any).portfolioSubmission.findFirst({
            where: { studentId, taskId }
        });

        let submission;
        if (existingSubmission) {
            submission = await (prisma as any).portfolioSubmission.update({
                where: { id: existingSubmission.id },
                data: {
                    workUrl,
                    behanceUrl,
                    remarks: remarks || existingSubmission.remarks,
                    status: 'PENDING', // Reset to pending on re-upload
                    submittedAt: new Date()
                }
            });
        } else {
            submission = await (prisma as any).portfolioSubmission.create({
                data: {
                    studentId,
                    taskId,
                    workUrl,
                    behanceUrl,
                    remarks,
                    status: 'PENDING'
                }
            });
        }

        return successResponse(res, submission, 'Portfolio work submitted successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to submit work', 500, error);
    }
};

export const getPendingPortfolioSubmissions = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const trainer = await prisma.trainer.findUnique({
            where: { userId }
        });

        if (!trainer) {
            return errorResponse(res, 'Trainer profile not found', 404);
        }

        const submissions = await (prisma as any).portfolioSubmission.findMany({
            where: {
                status: 'PENDING',
                student: {
                    branchId: trainer.branchId
                }
            },
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        course: { select: { name: true } }
                    }
                },
                task: true
            },
            orderBy: { submittedAt: 'desc' }
        });
        return successResponse(res, submissions);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch pending submissions', 500, error);
    }
};

export const reviewPortfolioSubmission = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { status, remarks } = req.body;

        if (!['APPROVED', 'REJECTED'].includes(status)) {
            return errorResponse(res, 'Invalid status. Must be APPROVED or REJECTED', 400);
        }

        const existingSubmission = await (prisma as any).portfolioSubmission.findUnique({
            where: { id },
            include: { task: true }
        });

        if (!existingSubmission) {
            return errorResponse(res, 'Submission not found', 404);
        }

        const updateData: any = {
            status,
            remarks,
            reviewedAt: new Date(),
            trainerId: req.user?.id
        };

        if (status === 'REJECTED') {
            updateData.rejectionCount = { increment: 1 };
        }

        const submission = await (prisma as any).portfolioSubmission.update({
            where: { id },
            data: updateData,
            include: { student: true, task: true }
        });

        // Portfolio Completion Logic
        const studentId = submission.studentId;
        const courseId = submission.task.courseId;

        // Get all mandatory tasks for the course
        const mandatoryTasks = await (prisma as any).portfolioTask.findMany({
            where: { courseId, isMandatory: true }
        });

        const mandatoryTaskIds = mandatoryTasks.map((t: any) => t.id);

        // Get count of approved mandatory submissions
        const approvedMandatoryCount = await (prisma as any).portfolioSubmission.count({
            where: {
                studentId,
                status: 'APPROVED',
                taskId: { in: mandatoryTaskIds }
            }
        });

        const totalMandatoryCount = mandatoryTasks.length;
        const completionRate = totalMandatoryCount > 0
            ? Math.round((approvedMandatoryCount / totalMandatoryCount) * 100)
            : 100;

        // Update student status
        // Rules: If completionRate < 100, lock certificate and block placement override
        await (prisma as any).student.update({
            where: { id: studentId },
            data: {
                certificateLocked: completionRate < 100,
                // Only block if not already eligible or force block if not completed
                placementEligible: completionRate < 100 ? false : undefined
                // Note: if completionRate is 100, we don't auto-set placementEligible to true,
                // it just enables the trainer to mark it true later.
            }
        });

        return successResponse(res, {
            submission,
            completionRate,
            isCompleted: completionRate >= 100
        }, `Portfolio submission ${status.toLowerCase()} successfully`);
    } catch (error) {
        return errorResponse(res, 'Failed to review submission', 500, error);
    }
};

export const getBranchPortfolioStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const trainer = await prisma.trainer.findUnique({
            where: { userId }
        });

        if (!trainer) {
            return errorResponse(res, 'Trainer profile not found', 404);
        }

        const branchId = trainer.branchId;

        // 1. Total Students in branch
        const students = await (prisma as any).student.findMany({
            where: { branchId, isActive: true },
            include: {
                portfolioSubmissions: {
                    include: { task: true }
                },
                course: {
                    include: { portfolioTasks: true }
                },
                user: { select: { firstName: true, lastName: true } }
            }
        });

        const totalStudents = students.length;

        // 2. Portfolio Completion Rate & Stats
        let totalMandatoryTasksCount = 0;
        let totalApprovedMandatoryCount = 0;
        let studentsPendingReview = 0;
        let studentsDelayed = 0;

        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const studentStats = students.map((student: any) => {
            const mandatoryTasks = student.course.portfolioTasks.filter((t: any) => t.isMandatory);
            const approvedMandatory = student.portfolioSubmissions.filter((s: any) =>
                s.status === 'APPROVED' && s.task.isMandatory
            );

            const pendingCount = student.portfolioSubmissions.filter((s: any) => s.status === 'PENDING').length;
            if (pendingCount > 0) studentsPendingReview++;

            const completionRate = mandatoryTasks.length > 0
                ? Math.round((approvedMandatory.length / mandatoryTasks.length) * 100)
                : 100;

            totalMandatoryTasksCount += mandatoryTasks.length;
            totalApprovedMandatoryCount += approvedMandatory.length;

            // Delayed Check: No upload in 7 days AND completion < 100
            const lastSubmission = student.portfolioSubmissions.length > 0
                ? new Date(Math.max(...student.portfolioSubmissions.map((s: any) => new Date(s.submittedAt).getTime())))
                : null;

            const isDelayed = completionRate < 100 && (!lastSubmission || lastSubmission < sevenDaysAgo);
            if (isDelayed) studentsDelayed++;

            return {
                id: student.id,
                name: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`,
                completionRate,
                lastSubmissionDate: lastSubmission,
                isDelayed,
                pendingCount,
                placementEligible: student.placementEligible,
                certificateLocked: student.certificateLocked
            };
        });

        const overallCompletionRate = totalMandatoryTasksCount > 0
            ? Math.round((totalApprovedMandatoryCount / totalMandatoryTasksCount) * 100)
            : 0;

        return successResponse(res, {
            summary: {
                totalStudents,
                overallCompletionRate,
                studentsPendingReview,
                studentsDelayed
            },
            studentStats
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch branch portfolio stats', 500, error);
    }
};

export const getStudentPortfolioDetails = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { studentId } = req.params;

        // Fetch student with course and submissions
        const student = await (prisma as any).student.findUnique({
            where: { id: studentId },
            include: {
                course: {
                    include: { portfolioTasks: { orderBy: { order: 'asc' } } }
                },
                portfolioSubmissions: {
                    include: { task: true }
                },
                user: { select: { firstName: true, lastName: true } }
            }
        });

        if (!student) {
            return errorResponse(res, 'Student not found', 404);
        }

        // Merge tasks with submissions
        const portfolio = student.course.portfolioTasks.map((task: any) => {
            const submission = student.portfolioSubmissions.find((s: any) => s.taskId === task.id);
            return {
                taskId: task.id,
                title: task.title,
                description: task.description,
                isMandatory: task.isMandatory,
                deadlineDays: task.deadlineDays,
                expectedFormat: task.expectedFormat,

                submissionId: submission?.id || null,
                status: submission?.status || 'NOT_STARTED', // PENDING, APPROVED, REJECTED, NOT_STARTED
                submittedAt: submission?.submittedAt || null,
                workUrl: submission?.workUrl || null,
                behanceUrl: submission?.behanceUrl || null,
                remarks: submission?.remarks || null,
                rejectionCount: submission?.rejectionCount || 0
            };
        });

        const mandatoryTasksCount = student.course.portfolioTasks.filter((t: any) => t.isMandatory).length;
        const approvedMandatoryCount = student.portfolioSubmissions.filter((s: any) => s.status === 'APPROVED' && s.task.isMandatory).length;
        const completionRate = mandatoryTasksCount > 0
            ? Math.round((approvedMandatoryCount / mandatoryTasksCount) * 100)
            : 100;

        return successResponse(res, {
            student: {
                id: student.id,
                name: `${student.user?.firstName || ''} ${student.user?.lastName || ''}`,
                courseName: student.course.name,
                batchId: student.batchId,
                completionStats: {
                    totalTasks: student.course.portfolioTasks.length,
                    completedTasks: student.portfolioSubmissions.filter((s: any) => s.status === 'APPROVED').length,
                    mandatoryTasks: mandatoryTasksCount,
                    approvedMandatory: approvedMandatoryCount,
                    completionRate
                }
            },
            portfolio
        });

    } catch (error) {
        return errorResponse(res, 'Failed to fetch student portfolio', 500, error);
    }
};
