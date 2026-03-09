
import { Response } from 'express';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';

// Get progress for all students in a trainer's branch
export const getBranchProgress = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const trainer = await prisma.trainer.findUnique({
            where: { userId }
        });

        if (!trainer) {
            return errorResponse(res, 'Trainer profile not found', 404);
        }

        const students = await (prisma as any).student.findMany({
            where: {
                branchId: trainer.branchId,
                isActive: true
            },
            select: {
                id: true,
                user: {
                    select: { firstName: true, lastName: true, email: true }
                },
                softwareProgress: {
                    take: 1
                },
                course: {
                    select: { syllabus: true }
                }
            }
        });

        // Format response
        const formatted = students.map((s: any) => ({
            studentId: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            email: s.user.email,
            syllabus: (() => {
                if (!s.course?.syllabus) return null;
                try {
                    let parsed = JSON.parse(s.course.syllabus);
                    while (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch (e) {
                            break;
                        }
                    }
                    return Array.isArray(parsed) ? parsed : null;
                } catch (e) {
                    return null;
                }
            })(),
            progress: s.softwareProgress[0] ? {
                id: s.softwareProgress[0].id,
                completedTopics: (() => {
                    if (!s.softwareProgress[0].completedTopics) return [];
                    try {
                        let parsed = JSON.parse(s.softwareProgress[0].completedTopics);
                        while (typeof parsed === 'string') {
                            try {
                                parsed = JSON.parse(parsed);
                            } catch (e) {
                                break;
                            }
                        }
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        return [];
                    }
                })(),
                currentTopic: s.softwareProgress[0].currentTopic,
                percentage: s.softwareProgress[0].progress
            } : null
        }));

        return successResponse(res, formatted);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch branch progress', 500, error);
    }
};

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
                },
                course: {
                    select: { syllabus: true }
                }
            }
        });

        // Format response
        const formatted = students.map((s: any) => ({
            studentId: s.id,
            name: `${s.user.firstName} ${s.user.lastName}`,
            email: s.user.email,
            syllabus: (() => {
                if (!s.course?.syllabus) return null;
                try {
                    let parsed = JSON.parse(s.course.syllabus);
                    while (typeof parsed === 'string') {
                        try {
                            parsed = JSON.parse(parsed);
                        } catch (e) {
                            break;
                        }
                    }
                    return Array.isArray(parsed) ? parsed : null;
                } catch (e) {
                    return null;
                }
            })(),
            progress: s.softwareProgress[0] ? {
                id: s.softwareProgress[0].id,
                completedTopics: (() => {
                    if (!s.softwareProgress[0].completedTopics) return [];
                    try {
                        let parsed = JSON.parse(s.softwareProgress[0].completedTopics);
                        while (typeof parsed === 'string') {
                            try {
                                parsed = JSON.parse(parsed);
                            } catch (e) {
                                break;
                            }
                        }
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (e) {
                        return [];
                    }
                })(),
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
        const { completedTopics, currentTopic } = req.body;
        let { progress } = req.body;

        // If completedTopics is provided, calculate progress percentage based on course syllabus
        if (Array.isArray(completedTopics)) {
            const student = await (prisma as any).student.findUnique({
                where: { id: studentId },
                include: { course: { select: { syllabus: true } } }
            });

            if (student?.course?.syllabus) {
                try {
                    let syllabusTopics = JSON.parse(student.course.syllabus);
                    while (typeof syllabusTopics === 'string') {
                        try { syllabusTopics = JSON.parse(syllabusTopics); }
                        catch (e) { break; }
                    }
                    if (Array.isArray(syllabusTopics) && syllabusTopics.length > 0) {
                        progress = Math.round((completedTopics.length / syllabusTopics.length) * 100);
                    }
                } catch (e) {
                    console.error("Failed to parse course syllabus for progress calculation:", e);
                }
            }
        }

        const updatedProgress = await (prisma as any).softwareProgress.upsert({
            where: {
                studentId: studentId
            },
            update: {
                completedTopics: JSON.stringify(completedTopics || []),
                currentTopic,
                progress: progress !== undefined ? progress : undefined,
                lastUpdated: new Date()
            },
            create: {
                studentId,
                completedTopics: JSON.stringify(completedTopics || []),
                currentTopic,
                progress: progress || 0
            }
        });

        return successResponse(res, updatedProgress);
    } catch (error) {
        return errorResponse(res, 'Failed to update progress', 500, error);
    }
};
