import { UserRole, AdmissionStatus } from '../../types/enums';;
import { Response } from 'express';
;
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getAdmissions = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, status, branchId, courseId, search } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    // Branch filtering based on user role
    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (status) {
      where.status = status as AdmissionStatus;
    }

    if (courseId) {
      where.courseId = courseId as string;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
        { admissionNumber: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [admissions, total] = await Promise.all([
      prisma.admission.findMany({
        where,
        skip,
        take,
        include: {
          branch: {
            select: { id: true, name: true, code: true },
          },
          course: {
            select: { id: true, name: true, code: true, duration: true },
          },
          lead: {
            select: { id: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.admission.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { admissions, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch admissions', 500, error);
  }
};

export const getAdmissionById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const admission = await prisma.admission.findUnique({
      where: { id },
      include: {
        branch: true,
        course: true,
        lead: true,
        student: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true,
              },
            },
          },
        },
        whatsappLogs: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!admission) {
      return errorResponse(res, 'Admission not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && admission.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, admission);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch admission', 500, error);
  }
};

export const createAdmission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      courseId,
      batchName,
      feeAmount,
      branchId,
    } = req.body;

    // Generate admission number
    const effectiveBranchId = branchId || req.user?.branchId;
    const year = new Date().getFullYear().toString().slice(-2);
    const count = await prisma.admission.count({
      where: { branchId: effectiveBranchId },
    });
    const admissionNumber = `ADM${year}${effectiveBranchId!.slice(0, 4).toUpperCase()}${(count + 1).toString().padStart(4, '0')}`;

    const admission = await prisma.admission.create({
      data: {
        admissionNumber,
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        courseId,
        batchName,
        feeAmount,
        feePaid: 0,
        feeBalance: feeAmount,
        branchId: effectiveBranchId!,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        course: {
          select: { id: true, name: true, code: true },
        },
      },
    });

    return successResponse(res, admission, 'Admission created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create admission', 500, error);
  }
};

export const updateAdmission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      dateOfBirth,
      gender,
      address,
      batchName,
      feeAmount,
      feePaid,
      status,
    } = req.body;

    const existingAdmission = await prisma.admission.findUnique({ where: { id } });
    if (!existingAdmission) {
      return errorResponse(res, 'Admission not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingAdmission.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const feeBalance = feeAmount !== undefined && feePaid !== undefined
      ? Number(feeAmount) - Number(feePaid)
      : undefined;

    const admission = await prisma.admission.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        dateOfBirth: dateOfBirth ? new Date(dateOfBirth) : undefined,
        gender,
        address,
        batchName,
        feeAmount,
        feePaid,
        feeBalance,
        status,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        course: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse(res, admission, 'Admission updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update admission', 500, error);
  }
};

export const deleteAdmission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingAdmission = await prisma.admission.findUnique({
      where: { id },
      include: { student: true },
    });

    if (!existingAdmission) {
      return errorResponse(res, 'Admission not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingAdmission.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (existingAdmission.student) {
      return errorResponse(res, 'Cannot delete admission with associated student record', 400);
    }

    await prisma.admission.delete({ where: { id } });

    return successResponse(res, null, 'Admission deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete admission', 500, error);
  }
};

export const approveAdmission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const admission = await prisma.admission.findUnique({ where: { id } });
    if (!admission) {
      return errorResponse(res, 'Admission not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && admission.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (admission.status === AdmissionStatus.APPROVED) {
      return errorResponse(res, 'Admission already approved', 400);
    }

    const updatedAdmission = await prisma.admission.update({
      where: { id },
      data: { status: AdmissionStatus.APPROVED },
      include: {
        branch: true,
        course: true,
      },
    });

    return successResponse(res, updatedAdmission, 'Admission approved successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to approve admission', 500, error);
  }
};
