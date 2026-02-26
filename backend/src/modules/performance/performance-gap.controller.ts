import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

/**
 * Create a new performance gap entry
 */
export const createPerformanceGap = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { targetUserId, category, weakness, improvementPlan } = req.body;

        if (!targetUserId || !category || !weakness) {
            return errorResponse(res, 'Target user, category, and weakness are required', 400);
        }

        const gap = await prisma.performanceGap.create({
            data: {
                targetUserId,
                category,
                weakness,
                improvementPlan,
                createdById: req.user!.id,
                branchId: req.user!.branchId!
            }
        });

        return successResponse(res, gap, 'Performance gap logged successfully', 201);
    } catch (error) {
        console.error('Create performance gap error:', error);
        return errorResponse(res, 'Failed to log performance gap', 500);
    }
};

/**
 * Get performance gaps with filtering (for CEO/Branch Head)
 */
export const getPerformanceGaps = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { category, branchId } = req.query;

        const whereClause: any = {};
        if (category) whereClause.category = category as string;

        if (req.user?.role !== UserRole.CEO) {
            whereClause.branchId = req.user?.branchId;
        } else if (branchId) {
            whereClause.branchId = branchId as string;
        }

        const gaps = await prisma.performanceGap.findMany({
            where: whereClause,
            include: {
                targetUser: { select: { firstName: true, lastName: true, role: true } },
                createdBy: { select: { firstName: true, lastName: true } },
                branch: { select: { name: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        return successResponse(res, gaps);
    } catch (error) {
        console.error('Get performance gaps error:', error);
        return errorResponse(res, 'Failed to fetch performance gaps', 500);
    }
};
