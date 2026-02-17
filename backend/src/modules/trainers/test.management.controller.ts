
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const createTest = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { batchId, title, date, totalMarks, passMarks } = req.body;
        const test = await (prisma as any).test.create({
            data: {
                batchId,
                title,
                date: new Date(date),
                totalMarks: Number(totalMarks),
                passMarks: Number(passMarks)
            }
        });
        return successResponse(res, { test }, 'Test created successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to create test', 500, error);
    }
};

export const getTestsByBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { batchId } = req.params;
        const tests = await (prisma as any).test.findMany({
            where: { batchId },
            include: {
                _count: { select: { scores: true } }
            },
            orderBy: { date: 'desc' }
        });
        return successResponse(res, { tests });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch tests', 500, error);
    }
};

export const updateTestScores = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { testId } = req.params;
        const { scores } = req.body; // Array: [{ studentId, marksObtained, remarks, isPass }]

        if (!Array.isArray(scores)) {
            return errorResponse(res, 'Invalid scores data', 400);
        }

        const results = await prisma.$transaction(
            scores.map((s: any) => (prisma as any).testScore.upsert({
                where: { testId_studentId: { testId, studentId: s.studentId } },
                update: {
                    marksObtained: Number(s.marksObtained),
                    isPass: Boolean(s.isPass),
                    remarks: s.remarks
                },
                create: {
                    testId,
                    studentId: s.studentId,
                    marksObtained: Number(s.marksObtained),
                    isPass: Boolean(s.isPass),
                    remarks: s.remarks
                }
            }))
        );

        return successResponse(res, { results }, 'Test scores updated successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to update test scores', 500, error);
    }
};

export const getTestScores = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { testId } = req.params;
        const scores = await (prisma as any).testScore.findMany({
            where: { testId },
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } }
                    }
                }
            }
        });
        return successResponse(res, { scores });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch test scores', 500, error);
    }
};

export const deleteTest = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { testId } = req.params;
        await (prisma as any).test.delete({
            where: { id: testId }
        });
        return successResponse(res, { testId }, 'Test deleted successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to delete test', 500, error);
    }
};
