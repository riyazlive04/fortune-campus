import { Response } from 'express';
import { UserRole, AttendanceStatus } from '@prisma/client';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, studentId, courseId, date, status } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (studentId) {
      where.studentId = studentId as string;
    }

    if (courseId) {
      where.courseId = courseId as string;
    }

    if (date) {
      const targetDate = new Date(date as string);
      where.date = {
        gte: new Date(targetDate.setHours(0, 0, 0, 0)),
        lt: new Date(targetDate.setHours(23, 59, 59, 999)),
      };
    }

    if (status) {
      where.status = status as AttendanceStatus;
    }

    // Branch filtering
    if (req.user?.role !== UserRole.CEO) {
      where.student = {
        branchId: req.user?.branchId,
      };
    }

    const [attendance, total] = await Promise.all([
      prisma.attendance.findMany({
        where,
        skip,
        take,
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
          course: {
            select: { id: true, name: true, code: true },
          },
          trainer: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
            },
          },
        },
        orderBy: { date: 'desc' },
      }),
      prisma.attendance.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { attendance, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch attendance', 500, error);
  }
};

export const getAttendanceById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const attendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true, email: true },
            },
            branch: {
              select: { id: true, name: true },
            },
          },
        },
        course: true,
        trainer: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
      },
    });

    if (!attendance) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && attendance.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, attendance);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch attendance', 500, error);
  }
};

export const markAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { studentId, courseId, date, status, remarks, trainerId } = req.body;

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

    const attendance = await prisma.attendance.create({
      data: {
        studentId,
        courseId,
        date: new Date(date),
        status,
        remarks,
        trainerId: trainerId || undefined,
      },
      include: {
        student: {
          include: {
            user: {
              select: { firstName: true, lastName: true },
            },
          },
        },
        course: {
          select: { name: true, code: true },
        },
      },
    });

    return successResponse(res, attendance, 'Attendance marked successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to mark attendance', 500, error);
  }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { courseId, date, trainerId, attendanceRecords } = req.body;
    // attendanceRecords: [{ studentId, status, remarks }]

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return errorResponse(res, 'Invalid attendance records', 400);
    }

    const attendanceDate = new Date(date);

    const result = await prisma.$transaction(
      attendanceRecords.map((record: any) =>
        prisma.attendance.create({
          data: {
            studentId: record.studentId,
            courseId,
            date: attendanceDate,
            status: record.status,
            remarks: record.remarks,
            trainerId: trainerId || undefined,
          },
        })
      )
    );

    return successResponse(res, result, `${result.length} attendance records created successfully`, 201);
  } catch (error) {
    return errorResponse(res, 'Failed to mark bulk attendance', 500, error);
  }
};

export const updateAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { status, remarks } = req.body;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingAttendance) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingAttendance.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const attendance = await prisma.attendance.update({
      where: { id },
      data: {
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
        course: {
          select: { name: true },
        },
      },
    });

    return successResponse(res, attendance, 'Attendance updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update attendance', 500, error);
  }
};

export const deleteAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingAttendance = await prisma.attendance.findUnique({
      where: { id },
      include: {
        student: {
          select: { branchId: true },
        },
      },
    });

    if (!existingAttendance) {
      return errorResponse(res, 'Attendance record not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingAttendance.student.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    await prisma.attendance.delete({ where: { id } });

    return successResponse(res, null, 'Attendance deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete attendance', 500, error);
  }
};
