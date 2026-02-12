
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
        const { taskId, studentId, workUrl, remarks } = req.body;

        const task = await (prisma as any).portfolioTask.findUnique({ where: { id: taskId } });
        if (!task) return errorResponse(res, 'Portfolio task not found', 404);

        const submission = await (prisma as any).portfolioSubmission.create({
            data: {
                studentId,
                taskId,
                workUrl,
                remarks,
                status: 'PENDING'
            }
        });
        return successResponse(res, submission, 'Portfolio work submitted successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to submit work', 500, error);
    }
};

export const getPendingPortfolioSubmissions = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;

        const submissions = await (prisma as any).portfolioSubmission.findMany({
            where: {
                status: 'PENDING',
                student: branchId ? { branchId } : undefined
            },
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
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

        const submission = await (prisma as any).portfolioSubmission.update({
            where: { id },
            data: {
                status,
                remarks,
                reviewedAt: new Date(),
                trainerId: req.user?.id
            },
            include: { student: true, task: true }
        });

        // Business Rule: If APPROVED, check if student has completed all tasks for the course
        if (status === 'APPROVED') {
            const courseId = submission.task.courseId;
            const studentId = submission.studentId;

            const allTasks = await (prisma as any).portfolioTask.findMany({
                where: { courseId }
            });

            const approvedSubmissions = await (prisma as any).portfolioSubmission.count({
                where: {
                    studentId,
                    status: 'APPROVED',
                    task: { courseId }
                }
            });

            if (approvedSubmissions >= allTasks.length) {
                // Unlock certificate or update student status
                await (prisma as any).student.update({
                    where: { id: studentId },
                    data: { certificateLocked: false }
                });
            }
        }

        return successResponse(res, submission, `Portfolio submission ${status.toLowerCase()} successfully`);
    } catch (error) {
        return errorResponse(res, 'Failed to review submission', 500, error);
    }
};
