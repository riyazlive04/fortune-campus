import { UserRole } from '../types/enums';;
import { prisma } from '../config/database';
;

class ReportService {
  /**
   * Get dashboard statistics for a branch
   */
  async getDashboardStats(branchId?: string, userRole?: UserRole): Promise<any> {
    try {
      const where: any = {};
      
      if (userRole !== UserRole.CEO && branchId) {
        where.branchId = branchId;
      }

      const [
        totalStudents,
        totalTrainers,
        totalLeads,
        totalAdmissions,
        monthlyAdmissions,
        recentPlacements,
      ] = await Promise.all([
        prisma.student.count({ where }),
        prisma.trainer.count({ where }),
        prisma.lead.count({ where }),
        prisma.admission.count({ where }),
        this.getMonthlyAdmissions(branchId, userRole),
        this.getRecentPlacements(branchId, userRole, 5),
      ]);

      return {
        students: totalStudents,
        trainers: totalTrainers,
        leads: totalLeads,
        admissions: totalAdmissions,
        monthlyAdmissions,
        recentPlacements,
      };
    } catch (error) {
      console.error('Failed to get dashboard stats:', error);
      throw error;
    }
  }

  /**
   * Get monthly admissions trend
   */
  async getMonthlyAdmissions(branchId?: string, userRole?: UserRole): Promise<any> {
    try {
      const currentDate = new Date();
      const startDate = new Date(currentDate.getFullYear(), currentDate.getMonth() - 5, 1);

      const where: any = {
        admissionDate: {
          gte: startDate,
        },
      };

      if (userRole !== UserRole.CEO && branchId) {
        where.branchId = branchId;
      }

      const admissions = await prisma.admission.findMany({
        where,
        select: {
          admissionDate: true,
        },
      });

      // Group by month
      const monthlyData: any = {};
      admissions.forEach(admission => {
        const monthKey = `${admission.admissionDate.getFullYear()}-${String(admission.admissionDate.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = (monthlyData[monthKey] || 0) + 1;
      });

      return Object.entries(monthlyData).map(([month, count]) => ({
        month,
        count,
      }));
    } catch (error) {
      console.error('Failed to get monthly admissions:', error);
      throw error;
    }
  }

  /**
   * Get recent placements
   */
  async getRecentPlacements(branchId?: string, userRole?: UserRole, limit: number = 10): Promise<any> {
    try {
      const where: any = {};

      if (userRole !== UserRole.CEO && branchId) {
        where.student = {
          branchId,
        };
      }

      const placements = await prisma.placement.findMany({
        where,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          student: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
              course: {
                select: {
                  name: true,
                },
              },
            },
          },
          company: {
            select: {
              name: true,
            },
          },
        },
      });

      return placements.map(p => ({
        id: p.id,
        student: `${p.student.user.firstName} ${p.student.user.lastName}`,
        course: p.student.course.name,
        company: p.company.name,
        position: p.position,
        package: p.package,
        status: p.status,
        date: p.createdAt,
      }));
    } catch (error) {
      console.error('Failed to get recent placements:', error);
      throw error;
    }
  }

  /**
   * Get attendance statistics
   */
  async getAttendanceStats(branchId?: string, userRole?: UserRole, days: number = 30): Promise<any> {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const where: any = {
        date: {
          gte: startDate,
        },
      };

      if (userRole !== UserRole.CEO && branchId) {
        where.student = {
          branchId,
        };
      }

      const attendances = await prisma.attendance.groupBy({
        by: ['status'],
        where,
        _count: true,
      });

      const total = attendances.reduce((sum, item) => sum + item._count, 0);
      const present = attendances.find(item => item.status === 'PRESENT')?._count || 0;
      const attendanceRate = total > 0 ? ((present / total) * 100).toFixed(2) : '0';

      return {
        total,
        byStatus: attendances.map(item => ({
          status: item.status,
          count: item._count,
        })),
        attendanceRate,
      };
    } catch (error) {
      console.error('Failed to get attendance stats:', error);
      throw error;
    }
  }
}

export const reportService = new ReportService();
