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

    const where: any = { AND: [] };

    // ─── Visibility filter ──────────────────────────────────────────────────
    // CEO & ADMIN: see all courses (optionally filtered by branchId query param)
    // Others: see their own branch courses + global courses (branchId = null)
    if (req.user?.role !== UserRole.ADMIN && req.user?.role !== UserRole.CEO) {
      where.AND.push({
        OR: [
          { branchId: req.user?.branchId },
          { branchId: null },
        ],
      });
    } else if (branchId) {
      where.AND.push({ branchId: branchId as string });
    }

    // ─── isActive filter ────────────────────────────────────────────────────
    if (isActive !== undefined) {
      where.AND.push({ isActive: isActive === 'true' });
    }

    // ─── Search filter ──────────────────────────────────────────────────────
    if (search) {
      where.AND.push({
        OR: [
          { name: { contains: search as string, mode: 'insensitive' } },
          { code: { contains: search as string, mode: 'insensitive' } },
        ],
      });
    }

    // Simplify: if AND is empty, remove it so Prisma doesn't complain
    if (where.AND.length === 0) {
      delete where.AND;
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

export const getPublicCourses = async (_req: any, res: Response): Promise<Response> => {
  try {
    const courses = await prisma.course.findMany({
      where: { isActive: true },
      select: {
        id: true,
        name: true,
        code: true,
        description: true,
        duration: true,
        fees: true
      },
      orderBy: { name: 'asc' }
    });

    return successResponse(res, courses);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch public courses', 500, error);
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

    // CEO and ADMIN can access any course.
    // Other users can access:
    //   - their own branch's courses
    //   - global courses (branchId = null) created by CEO
    const isCeoOrAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO;
    const isGlobalCourse = course.branchId === null;
    const isSameBranch = course.branchId === req.user?.branchId;

    if (!isCeoOrAdmin && !isGlobalCourse && !isSameBranch) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, course);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch course', 500, error);
  }
};

export const createCourse = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, code, description, duration, fees, syllabus, prerequisites } = req.body;

    console.log('--- Course Creation Attempt ---');
    console.log('User Role:', req.user?.role);
    console.log('User ID:', req.user?.id);
    console.log('User BranchID:', req.user?.branchId);

    // ─── Branch assignment rules ────────────────────────────────────────────
    // CEO → global course (visible to ALL branches) → branchId = null
    // Channel Partner / Admin → scoped to their own branch
    let targetBranchId: string | null;

    if (req.user?.role === UserRole.CEO) {
      // CEO courses are ALWAYS global
      targetBranchId = null;
    } else {
      // Channel Partner / Admin courses are scoped to their branch
      targetBranchId = req.user?.branchId ?? null;
    }

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

    // Notify CEO only if a Channel Partner created the course
    if (req.user?.role !== UserRole.CEO) {
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
    const { name, code, description, duration, fees, syllabus, prerequisites, isActive, branchId: rawBranchId } = req.body;

    const existingCourse = await prisma.course.findUnique({ where: { id } });
    if (!existingCourse) {
      return errorResponse(res, 'Course not found', 404);
    }

    const isCeoOrAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO;
    const isGlobalCourse = existingCourse.branchId === null;
    const isSameBranch = existingCourse.branchId === req.user?.branchId;

    // CEO/Admin can edit any course.
    // Channel Partners can only edit courses belonging to their own branch.
    // Nobody (except CEO/Admin) can edit global (CEO-created) courses.
    if (!isCeoOrAdmin && (!isSameBranch || isGlobalCourse)) {
      return errorResponse(res, 'Access denied', 403);
    }

    // ─── Resolve branchId for update ────────────────────────────────────────
    // CEO/Admin can reassign the course branch:
    //   empty string "" or undefined → null (All Branches / Global)
    //   any other value → that branch id
    // Channel Partners: keep the existing branchId (they cannot change it)
    let resolvedBranchId: string | null | undefined;
    if (isCeoOrAdmin) {
      resolvedBranchId = (rawBranchId === '' || rawBranchId === undefined || rawBranchId === null)
        ? null
        : rawBranchId;
    } else {
      // Channel Partner: branchId stays unchanged
      resolvedBranchId = undefined; // undefined = don't touch this field in prisma
    }

    const updateData: any = {
      name,
      code,
      description,
      duration,
      fees,
      syllabus,
      prerequisites,
      isActive,
    };

    // Only include branchId in the update when CEO/Admin explicitly set it
    if (isCeoOrAdmin) {
      updateData.branchId = resolvedBranchId;
    }

    const course = await prisma.course.update({
      where: { id },
      data: updateData,
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

    const isCeoOrAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO;
    const isGlobalCourse = existingCourse.branchId === null;
    const isSameBranch = existingCourse.branchId === req.user?.branchId;

    if (!isCeoOrAdmin && (!isSameBranch || isGlobalCourse)) {
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

    const isCeoOrAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO;
    const isGlobalCourse = course.branchId === null;
    const isSameBranch = course.branchId === req.user?.branchId;

    if (!isCeoOrAdmin && !isGlobalCourse && !isSameBranch) {
      return errorResponse(res, 'Access denied', 403);
    }

    const trainer = await prisma.trainer.findUnique({ where: { id: trainerId } });
    if (!trainer) {
      return errorResponse(res, 'Trainer not found', 404);
    }

    // For branch-scoped courses, trainer must be from same branch
    if (!isGlobalCourse && trainer.branchId !== course.branchId) {
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

    const isCeoOrAdmin = req.user?.role === UserRole.ADMIN || req.user?.role === UserRole.CEO;
    const isGlobalCourse = course.branchId === null;
    const isSameBranch = course.branchId === req.user?.branchId;

    if (!isCeoOrAdmin && !isGlobalCourse && !isSameBranch) {
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
