import { UserRole, AttendanceStatus } from '../../types/enums';
import { Response } from 'express';

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

export const markEntry = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { studentId, batchId, courseId, latitude, longitude, date } = req.body;
    const now = new Date();
    const attendanceDate = date ? new Date(date) : now;
    attendanceDate.setHours(0, 0, 0, 0);

    // Check for existing record
    const existing = await (prisma as any).attendance.findFirst({
      where: {
        studentId,
        courseId,
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    if (existing) {
      return errorResponse(res, 'Attendance record already exists for this day', 400);
    }

    const attendance = await (prisma as any).attendance.create({
      data: {
        studentId,
        courseId,
        batchId,
        date: attendanceDate,
        inTime: now,
        latitude,
        longitude,
        status: AttendanceStatus.PRESENT,
        isVerified: true,
        trainerId: req.user?.role === UserRole.TRAINER ? req.user?.id : undefined
      }
    });

    return successResponse(res, attendance, 'Entry marked successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to mark entry', 500, error);
  }
};

export const markExit = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const now = new Date();

    const attendance = await (prisma as any).attendance.update({
      where: { id },
      data: {
        outTime: now
      }
    });

    return successResponse(res, attendance, 'Exit marked successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to mark exit', 500, error);
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

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    // Get all attendance records grouped by student and status
    const stats = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      _count: {
        status: true
      },
      where: {
        student: {
          branchId: req.user?.role !== UserRole.CEO ? (req.user?.branchId || undefined) : undefined
        }
      }
    });

    // Get student details for the IDs found
    const studentIds = [...new Set(stats.map(s => s.studentId))];
    const students = await prisma.student.findMany({
      where: {
        id: { in: studentIds }
      },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        course: {
          select: { name: true }
        }
      }
    });

    // Process data to match frontend requirements
    const summary = students.map(student => {
      const studentStats = stats.filter(s => s.studentId === student.id);
      const present = (studentStats.find(s => s.status === AttendanceStatus.PRESENT) as any)?._count?.status || 0;
      const absent = (studentStats.find(s => s.status === AttendanceStatus.ABSENT) as any)?._count?.status || 0;
      const total = present + absent;
      const percentage = total > 0 ? Math.round((present / total) * 100) : 0;

      return {
        id: student.id,
        student: `${student.user?.firstName} ${student.user?.lastName}`,
        course: student.course?.name || 'N/A',
        present,
        absent,
        percentage: `${percentage}%`
      };
    });

    return successResponse(res, summary);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch attendance stats', 500, error);
  }
};
