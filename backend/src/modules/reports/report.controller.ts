import { UserRole, LeadStatus, AdmissionStatus, PlacementStatus } from '../../types/enums';;
import { Response } from 'express';
;
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getBranchReport = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { branchId } = req.query;

    const effectiveBranchId = req.user?.role === UserRole.CEO && branchId
      ? branchId as string
      : req.user?.branchId;

    if (!effectiveBranchId) {
      return errorResponse(res, 'Branch ID is required', 400);
    }

    const [
      totalStudents,
      activeStudents,
      totalTrainers,
      activeTrainers,
      totalLeads,
      convertedLeads,
      totalAdmissions,
      approvedAdmissions,
      totalPlacements,
      successfulPlacements,
    ] = await Promise.all([
      prisma.student.count({ where: { branchId: effectiveBranchId } }),
      prisma.student.count({ where: { branchId: effectiveBranchId, isActive: true } }),
      prisma.trainer.count({ where: { branchId: effectiveBranchId } }),
      prisma.trainer.count({ where: { branchId: effectiveBranchId, isActive: true } }),
      prisma.lead.count({ where: { branchId: effectiveBranchId } }),
      prisma.lead.count({ where: { branchId: effectiveBranchId, status: LeadStatus.CONVERTED } }),
      prisma.admission.count({ where: { branchId: effectiveBranchId } }),
      prisma.admission.count({ where: { branchId: effectiveBranchId, status: AdmissionStatus.CONVERTED } }),
      prisma.placement.count({ where: { student: { branchId: effectiveBranchId } } }),
      prisma.placement.count({ where: { student: { branchId: effectiveBranchId }, status: PlacementStatus.PLACED } }),
    ]);

    const report = {
      branchId: effectiveBranchId,
      students: {
        total: totalStudents,
        active: activeStudents,
      },
      trainers: {
        total: totalTrainers,
        active: activeTrainers,
      },
      leads: {
        total: totalLeads,
        converted: convertedLeads,
        conversionRate: totalLeads > 0 ? ((convertedLeads / totalLeads) * 100).toFixed(2) : '0',
      },
      admissions: {
        total: totalAdmissions,
        approved: approvedAdmissions,
      },
      placements: {
        total: totalPlacements,
        successful: successfulPlacements,
        placementRate: totalStudents > 0 ? ((successfulPlacements / totalStudents) * 100).toFixed(2) : '0',
      },
    };

    return successResponse(res, report);
  } catch (error) {
    return errorResponse(res, 'Failed to generate branch report', 500, error);
  }
};

export const getTrainerReport = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { trainerId, branchId } = req.query;

    const where: any = {};

    if (trainerId) {
      where.id = trainerId as string;
    }

    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    const trainers = await prisma.trainer.findMany({
      where,
      include: {
        user: {
          select: { firstName: true, lastName: true, email: true },
        },
        courses: {
          include: {
            course: {
              select: { name: true, code: true },
            },
          },
        },
        attendances: {
          select: { id: true },
        },
        incentives: {
          select: {
            amount: true,
            type: true,
            isPaid: true,
          },
        },
      },
    });

    const report = trainers.map(trainer => ({
      trainerId: trainer.id,
      name: `${trainer.user.firstName} ${trainer.user.lastName}`,
      email: trainer.user.email,
      courses: trainer.courses.length,
      attendanceMarked: trainer.attendances.length,
      totalIncentives: trainer.incentives.reduce((sum, inc) => sum + Number(inc.amount), 0),
      paidIncentives: trainer.incentives.filter(inc => inc.isPaid).reduce((sum, inc) => sum + Number(inc.amount), 0),
      pendingIncentives: trainer.incentives.filter(inc => !inc.isPaid).reduce((sum, inc) => sum + Number(inc.amount), 0),
    }));

    return successResponse(res, report);
  } catch (error) {
    return errorResponse(res, 'Failed to generate trainer report', 500, error);
  }
};

export const getAdmissionsReport = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const where: any = {};

    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (startDate || endDate) {
      where.admissionDate = {};
      if (startDate) {
        where.admissionDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.admissionDate.lte = new Date(endDate as string);
      }
    }

    const [admissions, statusCounts] = await Promise.all([
      prisma.admission.groupBy({
        by: ['branchId', 'courseId'],
        where,
        _count: true,
        _sum: {
          feeAmount: true,
          feePaid: true,
          feeBalance: true,
        },
      }),
      prisma.admission.groupBy({
        by: ['status'],
        where,
        _count: true,
      }),
    ]);

    const courseBreakdown = await Promise.all(
      admissions.map(async (item) => {
        const course = await prisma.course.findUnique({
          where: { id: item.courseId },
          select: { name: true, code: true },
        });
        const branch = await prisma.branch.findUnique({
          where: { id: item.branchId },
          select: { name: true },
        });
        return {
          branch: branch?.name,
          course: course?.name,
          count: item._count,
          totalFees: item._sum.feeAmount,
          collected: item._sum.feePaid,
          pending: item._sum.feeBalance,
        };
      })
    );

    const report = {
      statusBreakdown: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
      })),
      courseBreakdown,
    };

    return successResponse(res, report);
  } catch (error) {
    return errorResponse(res, 'Failed to generate admissions report', 500, error);
  }
};

export const getPlacementsReport = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const where: any = {};

    if (req.user?.role !== UserRole.CEO) {
      where.student = {
        branchId: req.user?.branchId,
      };
    } else if (branchId) {
      where.student = {
        branchId: branchId as string,
      };
    }

    if (startDate || endDate) {
      where.appliedAt = {};
      if (startDate) {
        where.appliedAt.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.appliedAt.lte = new Date(endDate as string);
      }
    }

    const [statusCounts, placements] = await Promise.all([
      prisma.placement.groupBy({
        by: ['status'],
        where,
        _count: true,
        _avg: {
          package: true,
        },
      }),
      prisma.placement.findMany({
        where: { ...where, status: PlacementStatus.PLACED },
        include: {
          student: {
            include: {
              user: {
                select: { firstName: true, lastName: true },
              },
              course: {
                select: { name: true },
              },
            },
          },
          company: {
            select: { name: true, industry: true },
          },
        },
        orderBy: { package: 'desc' },
        take: 10,
      }),
    ]);

    const report = {
      statusBreakdown: statusCounts.map(s => ({
        status: s.status,
        count: s._count,
        averagePackage: s._avg.package,
      })),
      topPlacements: placements.map(p => ({
        student: `${p.student.user.firstName} ${p.student.user.lastName}`,
        course: p.student.course.name,
        company: p.company.name,
        position: p.position,
        package: p.package,
      })),
    };

    return successResponse(res, report);
  } catch (error) {
    return errorResponse(res, 'Failed to generate placements report', 500, error);
  }
};

export const getRevenueReport = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { branchId, startDate, endDate } = req.query;

    const where: any = {};

    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (startDate || endDate) {
      where.admissionDate = {};
      if (startDate) {
        where.admissionDate.gte = new Date(startDate as string);
      }
      if (endDate) {
        where.admissionDate.lte = new Date(endDate as string);
      }
    }

    const [admissions, courses] = await Promise.all([
      prisma.admission.aggregate({
        where,
        _sum: {
          feeAmount: true,
          feePaid: true,
          feeBalance: true,
        },
        _count: true,
      }),
      prisma.admission.groupBy({
        by: ['courseId'],
        where,
        _sum: {
          feeAmount: true,
          feePaid: true,
        },
        _count: true,
      }),
    ]);

    const courseRevenue = await Promise.all(
      courses.map(async (item) => {
        const course = await prisma.course.findUnique({
          where: { id: item.courseId },
          select: { name: true, code: true },
        });
        return {
          course: course?.name,
          admissions: item._count,
          totalFees: item._sum.feeAmount,
          collected: item._sum.feePaid,
        };
      })
    );

    const report = {
      overall: {
        totalAdmissions: admissions._count,
        totalFees: admissions._sum.feeAmount || 0,
        collected: admissions._sum.feePaid || 0,
        pending: admissions._sum.feeBalance || 0,
        collectionRate: admissions._sum.feeAmount
          ? ((Number(admissions._sum.feePaid) / Number(admissions._sum.feeAmount)) * 100).toFixed(2)
          : '0',
      },
      byCourse: courseRevenue,
    };

    return successResponse(res, report);
  } catch (error) {
    return errorResponse(res, 'Failed to generate revenue report', 500, error);
  }
};
export const getCEOOverallReport = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    if (req.user?.role !== UserRole.CEO) {
      return errorResponse(res, 'Unauthorized access: CEO role required', 403);
    }

    const { month, year, startDate, endDate } = req.query;
    let dateFilter: any = {};

    const parseLocalDate = (dateStr: string, endOfDay = false): Date => {
      const [y, m, d] = dateStr.split('-').map(Number);
      if (endOfDay) {
        return new Date(y, m - 1, d, 23, 59, 59, 999);
      }
      return new Date(y, m - 1, d, 0, 0, 0, 0);
    };

    if (startDate || endDate) {
      // Custom or MTD/YTD date range from frontend
      dateFilter = {
        createdAt: {
          ...(startDate ? { gte: parseLocalDate(startDate as string, false) } : {}),
          ...(endDate ? { lte: parseLocalDate(endDate as string, true) } : {}),
        }
      };
    } else if (year) {
      const yr = parseInt(year as string);
      let start: Date;
      let end: Date;

      if (month) {
        const mo = parseInt(month as string);
        start = new Date(yr, mo - 1, 1);
        end = new Date(yr, mo, 0, 23, 59, 59);
      } else {
        start = new Date(yr, 0, 1);
        end = new Date(yr, 11, 31, 23, 59, 59);
      }

      dateFilter = {
        createdAt: {
          gte: start,
          lte: end
        }
      };
    }

    const [
      branches,
      leadSources,
      leadStatuses,
      admissionSummary,
      branchRevenue,
      performanceGaps
    ] = await Promise.all([
      prisma.branch.findMany({ select: { id: true, name: true } }),
      prisma.lead.groupBy({
        by: ['source'],
        where: dateFilter,
        _count: true,
      }),
      prisma.lead.groupBy({
        by: ['status'],
        where: dateFilter,
        _count: true,
      }),
      prisma.admission.aggregate({
        where: {
          admissionDate: dateFilter.createdAt
        },
        _sum: {
          feeAmount: true,
          feePaid: true,
          feeBalance: true,
        },
        _count: true,
      }),
      prisma.admission.groupBy({
        by: ['branchId'],
        where: {
          admissionDate: dateFilter.createdAt
        },
        _sum: {
          feeAmount: true,
          feePaid: true,
        },
        _count: true,
      }),
      prisma.performanceGap.findMany({
        where: dateFilter,
        include: {
          targetUser: { select: { firstName: true, lastName: true, role: true } },
          createdBy: { select: { firstName: true, lastName: true } },
          branch: { select: { name: true } }
        },
        orderBy: { createdAt: 'desc' },
        take: 50
      })
    ]);

    // Map branch revenue to names
    const branchComparison = await Promise.all(branches.map(async (branch) => {
      const revenue = branchRevenue.find(r => r.branchId === branch.id);
      const leadsCount = await prisma.lead.count({
        where: {
          branchId: branch.id,
          ...dateFilter
        }
      });
      const convertedCount = await prisma.lead.count({
        where: {
          branchId: branch.id,
          status: LeadStatus.CONVERTED,
          ...dateFilter
        }
      });

      return {
        branch: branch.name,
        revenue: Number(revenue?._sum.feeAmount || 0),
        collected: Number(revenue?._sum.feePaid || 0),
        leads: leadsCount,
        conversions: convertedCount,
      };
    }));

    const report = {
      overall: {
        totalLeads: leadStatuses.reduce((acc, s) => acc + s._count, 0),
        totalAdmissions: admissionSummary._count,
        totalRevenue: Number(admissionSummary._sum.feeAmount || 0),
        totalCollected: Number(admissionSummary._sum.feePaid || 0),
      },
      leadSources: leadSources.map(s => ({
        source: s.source || 'Unknown',
        count: s._count,
      })),
      conversionFunnel: leadStatuses.map(s => ({
        status: s.status,
        count: s._count,
      })),
      branchComparison,
      performanceGaps: {
        students: performanceGaps.filter(g => g.category === 'STUDENT'),
        trainers: performanceGaps.filter(g => g.category === 'TRAINER'),
        telecallers: performanceGaps.filter(g => g.category === 'TELECALLER'),
      }
    };

    return successResponse(res, report);
  } catch (error) {
    return errorResponse(res, 'Failed to generate CEO overall report', 500, error);
  }
};
