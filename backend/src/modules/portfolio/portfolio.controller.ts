import { UserRole } from '../../types/enums';;
import { Response } from 'express';
;
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getPortfolios = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, studentId, isVerified, search } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (isVerified !== undefined) {
      where.isVerified = isVerified === 'true';
    }

    if (search) {
      where.OR = [
        { title: { contains: search as string, mode: 'insensitive' } },
        { description: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Branch filtering and Role filtering
    if (req.user?.role !== UserRole.CEO) {
      if (req.user?.role === UserRole.TRAINER) {
        // If trainer, grab the trainerId and only allow students in their batches
        const trainerParams = await prisma.trainer.findUnique({
          where: { userId: req.user.id },
          select: { id: true, branchId: true }
        });
        if (trainerParams) {
          where.student = {
            branchId: trainerParams.branchId,
            batch: {
              trainerId: trainerParams.id
            }
          };
        }
      } else {
        where.student = {
          branchId: req.user?.branchId,
        };
      }
    }

    const [portfolios, total] = await Promise.all([
      prisma.portfolio.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true, email: true },
              },
              course: {
                select: { name: true, code: true },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.portfolio.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { portfolios, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch portfolios', 500, error);
  }
};

export const getPortfolioById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const portfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
            course: true,
            branch: {
              select: { id: true, name: true },
            },
          },
        },
      },
    });

    if (!portfolio) {
      return errorResponse(res, 'Portfolio not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO) {
      if (req.user?.role === UserRole.TRAINER) {
        const trainerParams = await prisma.trainer.findUnique({
          where: { userId: req.user.id },
          select: { id: true }
        });

        // Ensure student is in one of the trainer's batches
        const isTrainerStudent = await prisma.student.findFirst({
          where: {
            id: portfolio.studentId,
            batch: { trainerId: trainerParams?.id }
          }
        });

        if (!isTrainerStudent) {
          return errorResponse(res, 'Access denied', 403);
        }
      } else if (portfolio.student.branchId !== req.user?.branchId) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    return successResponse(res, portfolio);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch portfolio', 500, error);
  }
};

export const createPortfolio = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { studentId, title, description, projectUrl, githubUrl, technologies, completedAt } = req.body;

    // Verify student exists
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      return errorResponse(res, 'Student not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const portfolio = await prisma.portfolio.create({
      data: {
        studentId,
        title,
        description,
        projectUrl,
        githubUrl,
        technologies: technologies || [],
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return successResponse(res, portfolio, 'Portfolio created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create portfolio', 500, error);
  }
};

export const updatePortfolio = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { title, description, projectUrl, githubUrl, technologies, completedAt } = req.body;

    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingPortfolio) {
      return errorResponse(res, 'Portfolio not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingPortfolio.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: {
        title,
        description,
        projectUrl,
        githubUrl,
        technologies,
        completedAt: completedAt ? new Date(completedAt) : undefined,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return successResponse(res, portfolio, 'Portfolio updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update portfolio', 500, error);
  }
};

export const deletePortfolio = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingPortfolio) {
      return errorResponse(res, 'Portfolio not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingPortfolio.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.portfolio.delete({ where: { id } });

    return successResponse(res, null, 'Portfolio deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete portfolio', 500, error);
  }
};

export const verifyPortfolio = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { isVerified } = req.body;

    const existingPortfolio = await prisma.portfolio.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingPortfolio) {
      return errorResponse(res, 'Portfolio not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingPortfolio.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const portfolio = await prisma.portfolio.update({
      where: { id },
      data: { isVerified },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return successResponse(res, portfolio, 'Portfolio verification updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to verify portfolio', 500, error);
  }
};
