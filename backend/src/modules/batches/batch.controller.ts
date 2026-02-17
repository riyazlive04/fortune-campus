
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

export const getBatches = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { page = 1, limit = 10, search, isActive } = req.query;
        const { skip, take } = paginationHelper(Number(page), Number(limit));

        const where: any = {};

        // Branch filtering
        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN) {
            where.branchId = req.user?.branchId;
        }

        if (isActive !== undefined) {
            where.isActive = isActive === 'true';
        }

        if (search) {
            where.OR = [
                { name: { contains: search as string, mode: 'insensitive' } },
                { code: { contains: search as string, mode: 'insensitive' } },
            ];
        }

        const [batches, total] = await Promise.all([
            prisma.batch.findMany({
                where,
                skip,
                take,
                include: {
                    course: {
                        select: { id: true, name: true, code: true }
                    },
                    trainer: {
                        include: {
                            user: {
                                select: { firstName: true, lastName: true }
                            }
                        }
                    },
                    branch: {
                        select: { id: true, name: true }
                    },
                    _count: {
                        select: { students: true }
                    }
                },
                orderBy: { startTime: 'asc' } // Order by time for schedule view
            }),
            prisma.batch.count({ where })
        ]);

        const meta = getPaginationMeta(total, Number(page), Number(limit));

        return successResponse(res, { batches, meta });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch batches', 500, error);
    }
};

export const getBatchById = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const batch = await prisma.batch.findUnique({
            where: { id },
            include: {
                course: true,
                trainer: {
                    include: { user: { select: { firstName: true, lastName: true } } }
                },
                students: {
                    where: { isActive: true },
                    include: {
                        user: { select: { firstName: true, lastName: true, email: true } },
                        course: { select: { name: true } }
                    }
                },
                branch: true
            }
        });

        if (!batch) {
            return errorResponse(res, 'Batch not found', 404);
        }

        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && batch.branchId !== req.user?.branchId) {
            return errorResponse(res, 'Access denied', 403);
        }

        return successResponse(res, { batch });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch batch', 500, error);
    }
}

export const createBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { name, code, courseId, trainerId, startTime, endTime, branchId } = req.body;

        // Validation
        if (!name || !code || !courseId) {
            return errorResponse(res, 'Name, Code, and Course are required', 400);
        }

        // Determine branchId
        const targetBranchId = (req.user?.role === UserRole.CEO || req.user?.role === UserRole.ADMIN)
            ? branchId
            : req.user?.branchId;

        if (!targetBranchId) {
            return errorResponse(res, 'Branch ID is required', 400);
        }

        // Check for duplicate code
        const existingBatch = await prisma.batch.findUnique({ where: { code } });
        if (existingBatch) {
            return errorResponse(res, 'Batch code already exists', 400);
        }

        const batch = await prisma.batch.create({
            data: {
                name,
                code,
                courseId,
                branchId: targetBranchId,
                trainerId: trainerId || null,
                startTime,
                endTime,
                isActive: true
            }
        });

        return successResponse(res, { batch }, 'Batch created successfully', 201);
    } catch (error) {
        return errorResponse(res, 'Failed to create batch', 500, error);
    }
};

export const updateBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { name, trainerId, startTime, endTime, isActive } = req.body;

        const existingBatch = await prisma.batch.findUnique({ where: { id } });
        if (!existingBatch) {
            return errorResponse(res, 'Batch not found', 404);
        }

        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && existingBatch.branchId !== req.user?.branchId) {
            return errorResponse(res, 'Access denied', 403);
        }

        const batch = await prisma.batch.update({
            where: { id },
            data: {
                name,
                trainerId: trainerId || null,
                startTime,
                endTime,
                isActive
            }
        });

        return successResponse(res, { batch }, 'Batch updated successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to update batch', 500, error);
    }
};

export const deleteBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;

        const existingBatch = await prisma.batch.findUnique({ where: { id } });
        if (!existingBatch) {
            return errorResponse(res, 'Batch not found', 404);
        }

        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && existingBatch.branchId !== req.user?.branchId) {
            return errorResponse(res, 'Access denied', 403);
        }

        await prisma.batch.delete({ where: { id } });

        return successResponse(res, { id }, 'Batch deleted successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to delete batch', 500, error);
    }
};

export const assignStudentsToBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { studentIds } = req.body;

        if (!Array.isArray(studentIds) || studentIds.length === 0) {
            return errorResponse(res, 'Student IDs array is required', 400);
        }

        const batch = await prisma.batch.findUnique({ where: { id } });
        if (!batch) {
            return errorResponse(res, 'Batch not found', 404);
        }

        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && batch.branchId !== req.user?.branchId) {
            return errorResponse(res, 'Access denied', 403);
        }

        // Verify students belong to same branch and course (optional but good practice)
        // For now, just update them.

        await prisma.student.updateMany({
            where: {
                id: { in: studentIds },
                branchId: batch.branchId // Ensure they are in the same branch
            },
            data: {
                batchId: id
            }
        });

        return successResponse(res, null, 'Students assigned to batch successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to assign students', 500, error);
    }
};

export const removeStudentFromBatch = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id, studentId } = req.params;

        const batch = await prisma.batch.findUnique({ where: { id } });
        if (!batch) {
            return errorResponse(res, 'Batch not found', 404);
        }

        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && batch.branchId !== req.user?.branchId) {
            return errorResponse(res, 'Access denied', 403);
        }

        await prisma.student.update({
            where: { id: studentId },
            data: { batchId: null }
        });

        return successResponse(res, null, 'Student removed from batch successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to remove student', 500, error);
    }
};
