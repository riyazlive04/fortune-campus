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
                    include: { user: { select: { firstName: true, lastName: true, email: true } } }
                }
            }
        });

        if (!batch) {
            return errorResponse(res, 'Batch not found', 404);
        }

        if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && batch.branchId !== req.user?.branchId) {
            return errorResponse(res, 'Access denied', 403);
        }

        return successResponse(res, batch);
    } catch (error) {
        return errorResponse(res, 'Failed to fetch batch', 500, error);
    }
}
