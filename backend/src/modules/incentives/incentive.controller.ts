import { Response } from 'express';
import { UserRole, IncentiveType } from '@prisma/client';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getIncentives = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, userId, trainerId, type, isPaid, month, year } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (userId) {
      where.userId = userId as string;
    }

    if (trainerId) {
      where.trainerId = trainerId as string;
    }

    if (type) {
      where.type = type as IncentiveType;
    }

    if (isPaid !== undefined) {
      where.isPaid = isPaid === 'true';
    }

    if (month) {
      where.month = parseInt(month as string);
    }

    if (year) {
      where.year = parseInt(year as string);
    }

    // Branch filtering
    if (req.user?.role !== UserRole.CEO) {
      where.user = {
        branchId: req.user?.branchId,
      };
    }

    const [incentives, total] = await Promise.all([
      prisma.incentive.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          trainer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: [{ year: 'desc' }, { month: 'desc' }, { createdAt: 'desc' }],
      }),
      prisma.incentive.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { incentives, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch incentives', 500, error);
  }
};

export const getIncentiveById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const incentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            branchId: true,
          },
        },
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!incentive) {
      return errorResponse(res, 'Incentive not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && incentive.user.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, incentive);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch incentive', 500, error);
  }
};

export const createIncentive = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { userId, trainerId, type, amount, description, referenceId, referenceType, month, year } = req.body;

    // Verify user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return errorResponse(res, 'User not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && user.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const incentive = await prisma.incentive.create({
      data: {
        userId,
        trainerId,
        type,
        amount,
        description,
        referenceId,
        referenceType,
        month: month || new Date().getMonth() + 1,
        year: year || new Date().getFullYear(),
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return successResponse(res, incentive, 'Incentive created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create incentive', 500, error);
  }
};

export const updateIncentive = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { amount, description, type } = req.body;

    const existingIncentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        user: {
          select: { branchId: true },
        },
      },
    });

    if (!existingIncentive) {
      return errorResponse(res, 'Incentive not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingIncentive.user.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const incentive = await prisma.incentive.update({
      where: { id },
      data: {
        amount,
        description,
        type,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return successResponse(res, incentive, 'Incentive updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update incentive', 500, error);
  }
};

export const deleteIncentive = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingIncentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        user: {
          select: { branchId: true },
        },
      },
    });

    if (!existingIncentive) {
      return errorResponse(res, 'Incentive not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingIncentive.user.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.incentive.delete({ where: { id } });

    return successResponse(res, null, 'Incentive deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete incentive', 500, error);
  }
};

export const markIncentivePaid = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isPaid } = req.body;

    const existingIncentive = await prisma.incentive.findUnique({
      where: { id },
      include: {
        user: {
          select: { branchId: true },
        },
      },
    });

    if (!existingIncentive) {
      return errorResponse(res, 'Incentive not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingIncentive.user.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const incentive = await prisma.incentive.update({
      where: { id },
      data: {
        isPaid,
        paidAt: isPaid ? new Date() : null,
      },
      include: {
        user: {
          select: { firstName: true, lastName: true },
        },
      },
    });

    return successResponse(res, incentive, 'Incentive payment status updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update incentive payment status', 500, error);
  }
};
