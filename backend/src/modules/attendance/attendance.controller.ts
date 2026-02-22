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

    return successResponse(res, { attendance });
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

    return successResponse(res, { attendance }, 'Attendance marked successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to mark attendance', 500, error);
  }
};

export const markAttendanceIdempotent = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { studentId, status, remarks, date, period = 1 } = req.body;
    console.log(`[Attendance] Marking ${status} for student ${studentId}, Period ${period}`);

    const now = new Date();
    const attendanceDate = date ? new Date(date) : now;
    attendanceDate.setHours(0, 0, 0, 0);

    // Verify student exists and get branch
    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    if (!student) {
      console.error(`[Attendance] Student ${studentId} not found`);
      return errorResponse(res, 'Student not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && student.branchId !== req.user?.branchId) {
      console.error(`[Attendance] Branch mismatch: user branch ${req.user?.branchId}, student branch ${student.branchId}`);
      return errorResponse(res, 'Access denied', 403);
    }

    // Fetch trainer profile if logged in as trainer
    let profileTrainerId: string | undefined = undefined;
    if (req.user?.role === UserRole.TRAINER) {
      const trainer = await prisma.trainer.findUnique({
        where: { userId: req.user.id }
      });
      profileTrainerId = trainer?.id;
    }

    // Find existing record for today AND period
    const existing = await prisma.attendance.findFirst({
      where: {
        studentId,
        period: Number(period),
        date: {
          gte: attendanceDate,
          lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
        }
      }
    });

    let attendance;
    if (existing) {
      console.log(`[Attendance] Updating existing record ${existing.id} for Period ${period}`);
      attendance = await prisma.attendance.update({
        where: { id: existing.id },
        data: {
          status,
          remarks: remarks || undefined,
          updatedAt: now,
          trainerId: profileTrainerId || undefined
        }
      });
    } else {
      console.log(`[Attendance] Creating new record for Period ${period}`);
      attendance = await prisma.attendance.create({
        data: {
          studentId,
          date: attendanceDate,
          status,
          remarks,
          period: Number(period),
          isVerified: true,
          trainerId: profileTrainerId || undefined,
          courseId: student.courseId,
          batchId: student.batchId || undefined
        }
      });
    }

    return successResponse(res, { attendance }, 'Attendance marked successfully');
  } catch (error) {
    console.error(`[Attendance] Error marking attendance:`, error);
    return errorResponse(res, 'Failed to mark attendance', 500, error);
  }
};

export const bulkMarkAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { courseId, date, trainerId, attendanceRecords } = req.body;

    if (!Array.isArray(attendanceRecords) || attendanceRecords.length === 0) {
      return errorResponse(res, 'Invalid attendance records', 400);
    }

    const now = new Date();
    const attendanceDate = date ? new Date(date) : now;
    attendanceDate.setHours(0, 0, 0, 0);

    const result = await prisma.$transaction(async (tx) => {
      const results = [];
      for (const record of attendanceRecords) {
        const period = record.period || 1;

        const existing = await tx.attendance.findFirst({
          where: {
            studentId: record.studentId,
            courseId,
            period: Number(period),
            date: {
              gte: attendanceDate,
              lt: new Date(attendanceDate.getTime() + 24 * 60 * 60 * 1000)
            }
          }
        });

        if (existing) {
          const updated = await tx.attendance.update({
            where: { id: existing.id },
            data: {
              status: record.status,
              remarks: record.remarks,
              trainerId: trainerId || undefined,
              updatedAt: now
            }
          });
          results.push(updated);
        } else {
          const created = await tx.attendance.create({
            data: {
              studentId: record.studentId,
              courseId,
              date: attendanceDate,
              status: record.status,
              remarks: record.remarks,
              period: Number(period),
              isVerified: true,
              trainerId: trainerId || undefined,
            }
          });
          results.push(created);
        }
      }
      return results;
    });

    return successResponse(res, { result }, `${result.length} attendance records processed successfully`, 201);
  } catch (error) {
    console.error(`[Attendance] Bulk mark error:`, error);
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

    return successResponse(res, { attendance }, 'Attendance updated successfully');
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

    return successResponse(res, { attendance }, 'Entry marked successfully', 201);
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

    return successResponse(res, { attendance }, 'Exit marked successfully');
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

    return successResponse(res, { id }, 'Attendance deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete attendance', 500, error);
  }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { branchId, date } = req.query;

    // Define effective branchId
    const effectiveBranchId = req.user?.role === UserRole.CEO
      ? (branchId as string || undefined)
      : (req.user?.branchId || undefined);

    // Build date filter if a specific date is provided
    let dateFilter: any = {};
    if (date) {
      const selectedDate = new Date(date as string);
      const startOfDay = new Date(selectedDate);
      startOfDay.setHours(0, 0, 0, 0);
      const endOfDay = new Date(selectedDate);
      endOfDay.setHours(23, 59, 59, 999);
      dateFilter = { date: { gte: startOfDay, lte: endOfDay } };
    }

    // Get attendance records grouped by student and status (with optional date filter)
    const stats = await prisma.attendance.groupBy({
      by: ['studentId', 'status'],
      _count: {
        status: true
      },
      where: {
        student: {
          branchId: effectiveBranchId
        },
        ...dateFilter
      }
    });

    // Get ALL students from the branch (or all branches if CEO and no branchId provided)
    const students = await prisma.student.findMany({
      where: {
        branchId: effectiveBranchId
      },
      include: {
        user: {
          select: { firstName: true, lastName: true }
        },
        course: {
          select: { name: true }
        },
        branch: {
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
        branch: student.branch?.name || 'N/A',
        present,
        absent,
        percentage: `${percentage}%`
      };
    });

    return successResponse(res, { summary });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch attendance stats', 500, error);
  }
};
