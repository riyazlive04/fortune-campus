import { Response } from 'express';
import { UserRole, PlacementStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getPlacements = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, studentId, companyId, status, search } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (companyId) {
      where.companyId = companyId as string;
    }

    if (status) {
      where.status = status as PlacementStatus;
    }

    if (search) {
      where.OR = [
        { position: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    // Branch filtering
    if (req.user?.role !== UserRole.CEO) {
      where.student = {
        branchId: req.user?.branchId,
      };
    }

    const [placements, total] = await Promise.all([
      prisma.placement.findMany({
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
          company: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.placement.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { placements, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch placements', 500, error);
  }
};

export const getPlacementById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const placement = await prisma.placement.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true, phone: true },
            },
            course: true,
            branch: {
              select: { id: true, name: true },
            },
            portfolios: true,
          },
        },
        company: true,
      },
    });

    if (!placement) {
      return errorResponse(res, 'Placement not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && placement.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, placement);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch placement', 500, error);
  }
};

export const createPlacement = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { studentId, companyId, position, package: packageAmount, joiningDate, remarks } = req.body;

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

    const placement = await prisma.placement.create({
      data: {
        studentId,
        companyId,
        position,
        package: packageAmount,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        remarks,
        status: PlacementStatus.APPLIED,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        company: true,
      },
    });

    return successResponse(res, placement, 'Placement created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create placement', 500, error);
  }
};

export const updatePlacement = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { position, package: packageAmount, joiningDate, status, remarks } = req.body;

    const existingPlacement = await prisma.placement.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingPlacement) {
      return errorResponse(res, 'Placement not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingPlacement.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const placement = await prisma.placement.update({
      where: { id },
      data: {
        position,
        package: packageAmount,
        joiningDate: joiningDate ? new Date(joiningDate) : undefined,
        status,
        remarks,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        company: true,
      },
    });

    return successResponse(res, placement, 'Placement updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update placement', 500, error);
  }
};

export const deletePlacement = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingPlacement = await prisma.placement.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingPlacement) {
      return errorResponse(res, 'Placement not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingPlacement.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.placement.delete({ where: { id } });

    return successResponse(res, null, 'Placement deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete placement', 500, error);
  }
};

export const updatePlacementStatus = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const existingPlacement = await prisma.placement.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingPlacement) {
      return errorResponse(res, 'Placement not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingPlacement.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const placement = await prisma.placement.update({
      where: { id },
      data: { status },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        company: true,
      },
    });

    return successResponse(res, placement, 'Placement status updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update placement status', 500, error);
  }
};
