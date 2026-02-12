
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';

// Get progress for all students in a batch
export const getBatchProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { batchId } = req.params;

        const students = await (prisma as any).student.findMany({
            where: { batchId, isActive: true },
            select: {
                id: true,
                user: {
                    select: { firstName: true, lastName: true, email: true }
                },
                softwareProgress: {
                    take: 1
                }
            }
        });

        // Format response
        const formatted = students.map((s: any) => ({
            studentId: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            email: s.user.email,
            progress: s.softwareProgress[0] ? {
                id: s.softwareProgress[0].id,
                completedTopics: JSON.parse(s.softwareProgress[0].completedTopics || "[]"),
                currentTopic: s.softwareProgress[0].currentTopic,
                percentage: s.softwareProgress[0].progress
            } : null
        }));

        return successResponse(res, formatted);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch batch progress', 500, error);
    }
};

// Update progress for a specific student
export const updateStudentProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { studentId } = req.params;
        const { completedTopics, currentTopic, progress } = req.body;

        const updatedProgress = await (prisma as any).softwareProgress.upsert({
            where: {
                studentId: studentId
            },
            update: {
                completedTopics: JSON.stringify(completedTopics || []),
                currentTopic,
                progress,
                lastUpdated: new Date()
            },
            create: {
                studentId,
                completedTopics: JSON.stringify(completedTopics || []),
                currentTopic,
                progress
            }
        });

        return successResponse(res, updatedProgress);
    } catch (error) {
        return errorResponse(res, 'Failed to update progress', 500, error);
    }
};
