import { UserRole } from '../../types/enums';
import { Response } from 'express';

import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { NotificationService } from '../notifications/notification.service';

export const getCourses = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, branchId, isActive, search } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO) {
      where.OR = [
        { branchId: req.user?.branchId },
        { branchId: null }
      ];
    } else if (branchId) {
      where.branchId = branchId as string;
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

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip,
        take,
        include: {
          branch: {
            select: { id: true, name: true },
          },
          trainers: {
            where: { isActive: true },
            include: {
              trainer: {
                include: {
                  user: {
                    select: { id: true, firstName: true, lastName: true },
                  },
                },
              },
            },
          },
          _count: {
            select: {
              students: true,
              admissions: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.course.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { courses, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch courses', 500, error);
  }
};

export const getCourseById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const course = await prisma.course.findUnique({
      where: { id },
      include: {
        branch: true,
        trainers: {
          include: {
            trainer: {
              include: {
                user: {
                  select: { id: true, firstName: true, lastName: true, email: true },
                },
              },
            },
          },
        },
        _count: {
          select: {
            students: true,
            admissions: true,
          },
        },
      },
    });

    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO && course.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, course);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch course', 500, error);
  }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, code, description, duration, fees, syllabus, prerequisites, branchId } = req.body;

    console.log('--- Course Creation Attempt ---');
    console.log('User Role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    console.log('User BranchID:', req.user?.branchId);
    console.log('Incoming branchId:', branchId);

    const targetBranchId = branchId || (req.user?.role === UserRole.CEO ? null : req.user?.branchId!);
    console.log('Final targetBranchId:', targetBranchId);

    const courseData: any = {
      name,
      code,
      description,
      duration: Number(duration),
      fees: Number(fees),
      syllabus,
      prerequisites,
      branchId: targetBranchId,
    };

    const course = await prisma.course.create({
      data: courseData,
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    console.log('Course created successfully in DB:', course.id);

    try {
      await NotificationService.notifyRole(UserRole.CEO, {
        title: 'New Course Added',
        message: `${course.name} (${course.code}) is now available.`,
        type: 'INFO',
        link: '/courses'
      });
      console.log('Notification sent for new course');
    } catch (notifError: any) {
      console.error('Notification failed (non-blocking):', notifError.message);
    }

    return successResponse(res, course, 'Course created successfully', 201);
  } catch (error: any) {
    console.error('Create Course Error:', error);
    if (error.code === 'P2002') {
      return errorResponse(res, 'Course code already exists', 400);
    }
    return errorResponse(res, 'Failed to create course', 500, error);
  }
};

export const updateCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, code, description, duration, fees, syllabus, prerequisites, isActive } = req.body;

    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return errorResponse(res, 'Course not found', 404);
    }

    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO && existingCourse.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const course = await prisma.course.update({
      where: { id },
      data: {
        name,
        code,
        description,
        duration,
        fees,
        syllabus,
        prerequisites,
        isActive,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
      },
    });

    return successResponse(res, course, 'Course updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update course', 500, error);
  }
};

export const deleteCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingCourse = await prisma.course.findUnique({
      where: { id },
      include: {
        _count: {
          select: { students: true, admissions: true },
        },
      },
    });

    if (!existingCourse) {
      return errorResponse(res, 'Course not found', 404);
    }

    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO && existingCourse.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (existingCourse._count.students > 0 || existingCourse._count.admissions > 0) {
      return errorResponse(res, 'Cannot delete course with associated students/admissions', 400);
    }

    await prisma.course.delete({ where: { id } });

    return successResponse(res, null, 'Course deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete course', 500, error);
  }
};

export const assignTrainerToCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { trainerId } = req.body;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO && course.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
    if (!trainer) {
      return errorResponse(res, 'Trainer not found', 404);
    }

    if (trainer.branchId !== course.branchId) {
      return errorResponse(res, 'Trainer must be from the same branch as course', 400);
    }

    const assignment = await prisma.courseTrainer.create({
      data: {
        courseId: id,
        trainerId,
      },
      include: {
        trainer: {
          include: {
            user: {
              select: { id: true, firstName: true, lastName: true },
            },
          },
        },
      },
    });

    return successResponse(res, assignment, 'Trainer assigned to course successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to assign trainer', 500, error);
  }
};

export const removeTrainerFromCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id, trainerId } = req.params;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return errorResponse(res, 'Course not found', 404);
    }

    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO && course.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.courseTrainer.deleteMany({
      where: {
        courseId: id,
        trainerId,
      },
    });

    return successResponse(res, null, 'Trainer removed from course successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to remove trainer', 500, error);
  }
};
