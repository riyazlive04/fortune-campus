
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

export const markTrainerAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { trainerId, date, status, remarks, inTime, outTime } = req.body;
        let branchId = req.user?.branchId;

        if (!trainerId || !date || !status) {
            return errorResponse(res, 'Trainer ID, date, and status are required', 400);
        }

        // If branchId is not in the user profile (common for CEO/Global roles), 
        // get it from the trainer record
        if (!branchId) {
            const trainer = await prisma.trainer.findUnique({
                where: { id: trainerId },
                select: { branchId: true }
            });
            if (!trainer) {
                return errorResponse(res, 'Trainer not found', 404);
            }
            branchId = trainer.branchId;
        }

        if (!branchId) {
            return errorResponse(res, 'Branch ID not found for this operation', 400);
        }

        const attendanceDate = new Date(date);
        attendanceDate.setHours(0, 0, 0, 0);

        const attendance = await prisma.trainerAttendance.upsert({
            where: {
                trainerId_date: {
                    trainerId,
                    date: attendanceDate
                }
            },
            update: {
                status,
                remarks,
                inTime: inTime ? new Date(inTime) : undefined,
                outTime: outTime ? new Date(outTime) : undefined,
            },
            create: {
                trainerId,
                branchId: branchId as string,
                date: attendanceDate,
                status,
                remarks,
                inTime: inTime ? new Date(inTime) : undefined,
                outTime: outTime ? new Date(outTime) : undefined,
            }
        });

        return successResponse(res, attendance, 'Trainer attendance marked successfully');
    } catch (error) {
        console.error("DEBUG: markTrainerAttendance error:", error);
        return errorResponse(res, 'Failed to mark trainer attendance', 500, error);
    }
};

export const getTrainerAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const { trainerId, startDate, endDate } = req.query;

        const where: any = {
            branchId: branchId || undefined,
            trainerId: trainerId ? (trainerId as string) : undefined,
        };

        if (startDate || endDate) {
            where.date = {};
            if (startDate) {
                const s = new Date(startDate as string);
                s.setHours(0, 0, 0, 0);
                where.date.gte = s;
            }
            if (endDate) {
                const e = new Date(endDate as string);
                e.setHours(23, 59, 59, 999);
                where.date.lte = e;
            }
        }

        const attendance = await prisma.trainerAttendance.findMany({
            where,
            include: {
                trainer: {
                    include: { user: true }
                }
            },
            orderBy: { date: 'desc' }
        });

        return successResponse(res, attendance, 'Trainer attendance fetched successfully');
    } catch (error) {
        return errorResponse(res, 'Failed to fetch trainer attendance', 500, error);
    }
};
