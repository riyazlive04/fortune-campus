import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getBranches = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { code: { contains: search as string, mode: 'insensitive' } },
        { city: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [branches, total] = await Promise.all([
      prisma.branch.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: {
              users: true,
              students: true,
              trainers: true,
              leads: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.branch.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { branches, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch branches', 500, error);
  }
};

export const getBranchById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            trainers: true,
            leads: true,
            admissions: true,
            courses: true,
          },
        },
      },
    });

    if (!branch) {
      return errorResponse(res, 'Branch not found', 404);
    }

    return successResponse(res, branch);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch branch', 500, error);
  }
};

export const createBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, code, address, city, state, phone, email } = req.body;

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        address,
        city,
        state,
        phone,
        email,
      },
    });

    return successResponse(res, branch, 'Branch created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create branch', 500, error);
  }
};

export const updateBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, code, address, city, state, phone, email, isActive } = req.body;

    const branch = await prisma.branch.update({
      where: { id },
      data: {
        name,
        code,
        address,
        city,
        state,
        phone,
        email,
        isActive,
      },
    });

    return successResponse(res, branch, 'Branch updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update branch', 500, error);
  }
};

export const deleteBranch = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    // Check if branch has associated records
    const branch = await prisma.branch.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            users: true,
            students: true,
            trainers: true,
          },
        },
      },
    });

    if (!branch) {
      return errorResponse(res, 'Branch not found', 404);
    }

    if (branch._count.users > 0 || branch._count.students > 0 || branch._count.trainers > 0) {
      return errorResponse(res, 'Cannot delete branch with associated records', 400);
    }

    await prisma.branch.delete({ where: { id } });

    return successResponse(res, null, 'Branch deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete branch', 500, error);
  }
};
