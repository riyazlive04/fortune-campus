import { IncentiveType } from '../types/enums';;
import { prisma } from '../config/database';
;

interface IncentiveRule {
  type: IncentiveType;
  amount: number;
  description: string;
}

class IncentiveService {
  // Define incentive rules
  private readonly rules: Record<string, IncentiveRule> = {
    ADMISSION: {
      type: IncentiveType.ADMISSION,
      amount: 500,
      description: 'Incentive for new admission',
    },
    PLACEMENT: {
      type: IncentiveType.PLACEMENT,
      amount: 1000,
      description: 'Incentive for successful placement',
    },
  };

  /**
   * Calculate and create incentive for admission
   */
  async createAdmissionIncentive(
    admissionId: string,
    userId: string,
    trainerId?: string
  ): Promise<any> {
    try {
      const rule = this.rules.ADMISSION;
      const currentDate = new Date();

      const incentive = await prisma.incentive.create({
        data: {
          userId,
          trainerId,
          type: rule.type,
          amount: rule.amount,
          description: rule.description,
          referenceId: admissionId,
          referenceType: 'ADMISSION',
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        },
      });

      return incentive;
    } catch (error) {
      console.error('Failed to create admission incentive:', error);
      throw error;
    }
  }

  /**
   * Calculate and create incentive for placement
   */
  async createPlacementIncentive(
    placementId: string,
    trainerId: string
  ): Promise<any> {
    try {
      const placement = await prisma.placement.findUnique({
        where: { id: placementId },
        include: {
          student: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!placement) {
        throw new Error('Placement not found');
      }

      const rule = this.rules.PLACEMENT;
      const currentDate = new Date();

      // Get trainer user
      const trainer = await prisma.trainer.findUnique({
        where: { id: trainerId },
      });

      if (!trainer) {
        throw new Error('Trainer not found');
      }

      const incentive = await prisma.incentive.create({
        data: {
          userId: trainer.userId,
          trainerId: trainer.id,
          type: rule.type,
          amount: rule.amount,
          description: `${rule.description} - ${placement.student.user.firstName} ${placement.student.user.lastName}`,
          referenceId: placementId,
          referenceType: 'PLACEMENT',
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear(),
        },
      });

      return incentive;
    } catch (error) {
      console.error('Failed to create placement incentive:', error);
      throw error;
    }
  }

  /**
   * Calculate monthly incentives for a trainer
   */
  async calculateMonthlyIncentives(
    trainerId: string,
    month: number,
    year: number
  ): Promise<any> {
    try {
      const incentives = await prisma.incentive.findMany({
        where: {
          trainerId,
          month,
          year,
        },
      });

      const total = incentives.reduce((sum, inc) => sum + Number(inc.amount), 0);
      const paid = incentives
        .filter(inc => inc.isPaid)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      const pending = total - paid;

      return {
        trainerId,
        month,
        year,
        total,
        paid,
        pending,
        count: incentives.length,
        incentives,
      };
    } catch (error) {
      console.error('Failed to calculate monthly incentives:', error);
      throw error;
    }
  }

  /**
   * Get incentive summary for a branch
   */
  async getBranchIncentiveSummary(
    branchId: string,
    month?: number,
    year?: number
  ): Promise<any> {
    try {
      const where: any = {
        user: {
          branchId,
        },
      };

      if (month) {
        where.month = month;
      }

      if (year) {
        where.year = year;
      }

      const incentives = await prisma.incentive.findMany({
        where,
        include: {
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
          trainer: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      const total = incentives.reduce((sum, inc) => sum + Number(inc.amount), 0);
      const paid = incentives
        .filter(inc => inc.isPaid)
        .reduce((sum, inc) => sum + Number(inc.amount), 0);
      const pending = total - paid;

      return {
        branchId,
        month,
        year,
        total,
        paid,
        pending,
        count: incentives.length,
        byType: this.groupByType(incentives),
      };
    } catch (error) {
      console.error('Failed to get branch incentive summary:', error);
      throw error;
    }
  }

  /**
   * Group incentives by type
   */
  private groupByType(incentives: any[]): any {
    const grouped: any = {};

    incentives.forEach(inc => {
      if (!grouped[inc.type]) {
        grouped[inc.type] = {
          count: 0,
          total: 0,
          paid: 0,
          pending: 0,
        };
      }

      grouped[inc.type].count++;
      grouped[inc.type].total += Number(inc.amount);
      
      if (inc.isPaid) {
        grouped[inc.type].paid += Number(inc.amount);
      } else {
        grouped[inc.type].pending += Number(inc.amount);
      }
    });

    return grouped;
  }
}

export const incentiveService = new IncentiveService();
