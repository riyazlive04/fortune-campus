import { UserRole } from '../../types/enums';
import { Response } from 'express';
import bcrypt from 'bcryptjs';

import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getTrainers = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, branchId, isActive, search } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.user = {
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
        ],
      };
    }

    const [trainers, total] = await Promise.all([
      prisma.trainer.findMany({
        where,
        skip,
        take,
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          branch: {
            select: { id: true, name: true },
          },
          courses: {
            where: { isActive: true },
            include: {
              course: {
                select: { id: true, name: true, code: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.trainer.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { trainers, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch trainers', 500, error);
  }
};

export const getTrainerById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const trainer = await prisma.trainer.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
            phone: true,
            role: true, // sending role might be useful
          },
        },
        branch: true,
        courses: {
          include: {
            course: true,
          },
        },
        incentives: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!trainer) {
      return errorResponse(res, 'Trainer not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && trainer.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, trainer);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch trainer', 500, error);
  }
};

export const createTrainer = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const {
      email,
      firstName,
      lastName,
      phone,
      employeeId,
      specialization,
      experience,
      qualification,
      branchId,
    } = req.body;

    const effectiveBranchId = branchId || req.user?.branchId;

    if (!effectiveBranchId) {
      return errorResponse(res, 'Branch ID is required', 400);
    }

    // Create user account for trainer
    const defaultPassword = await bcrypt.hash('Trainer@123', 10);

    const result = await prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          password: defaultPassword,
          firstName,
          lastName,
          phone,
          role: UserRole.TRAINER,
          branchId: effectiveBranchId,
        },
      });

      const trainer = await tx.trainer.create({
        data: {
          userId: user.id,
          employeeId,
          specialization,
          experience,
          qualification,
          branchId: effectiveBranchId,
        },
        include: {
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              phone: true,
            },
          },
          branch: {
            select: { id: true, name: true },
          },
        },
      });

      return trainer;
    });

    return successResponse(res, result, 'Trainer created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create trainer', 500, error);
  }
};

export const updateTrainer = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { specialization, experience, qualification, isActive } = req.body;

    const existingTrainer = await prisma.trainer.findUnique({ where: { id } });
    if (!existingTrainer) {
      return errorResponse(res, 'Trainer not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && existingTrainer.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const trainer = await prisma.trainer.update({
      where: { id },
      data: {
        specialization,
        experience,
        qualification,
        isActive,
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse(res, trainer, 'Trainer updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update trainer', 500, error);
  }
};

export const deleteTrainer = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingTrainer = await prisma.trainer.findUnique({ where: { id } });
    if (!existingTrainer) {
      return errorResponse(res, 'Trainer not found', 404);
    }

    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN && existingTrainer.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Delete trainer (will cascade to user)
    await prisma.trainer.delete({ where: { id } });

    return successResponse(res, null, 'Trainer deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete trainer', 500, error);
  }
};
