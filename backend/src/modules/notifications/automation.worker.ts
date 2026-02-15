
import { prisma } from '../../config/database';
import { NotificationService } from './notification.service';

/**
 * AutomationWorker handles scheduled tasks and automatic notification triggers
 * for the Branch Head Workflow.
 */
export class AutomationWorker {
    /**
     * Run all automated checks
     */
    static async runAllChecks() {
        console.log('Running automated workflow checks...');
        await Promise.all([
            this.checkGoogleReviews(),
            this.checkExamReminders(),
            this.checkFeeReminders(),
            this.checkPortfolioDeadlines()
        ]);
        console.log('Automated workflow checks completed.');
    }

    /**
     * Google Review Reminder: 50 days after admission
     */
    private static async checkGoogleReviews() {
        const fiftyDaysAgo = new Date();
        fiftyDaysAgo.setDate(fiftyDaysAgo.getDate() - 50);

        const admissions = await prisma.admission.findMany({
            where: {
                admissionDate: {
                    lte: fiftyDaysAgo,
                    gte: new Date(fiftyDaysAgo.getTime() - 24 * 60 * 60 * 1000)
                },
                status: 'CONFIRMED'
            },
            include: {
                branch: true
            }
        });

        for (const adm of admissions) {
            // await NotificationService.notifyBranchRole(adm.branchId, 'CHANNEL_PARTNER', {
            //     title: 'Google Review Reminder',
            //     message: `Student ${adm.firstName} ${adm.lastName} has reached 50 days since admission. Please request a Google Review.`,
            //     type: 'INFO',
            //     link: `/admissions`
            // });
        }
    }

    /**
     * Conduct Exam Reminder: Triggered after software module completion
     */
    private static async checkExamReminders() {
        const admissions = await prisma.admission.findMany({
            where: {
                softwareFinishedAt: {
                    not: null,
                    lte: new Date()
                },
                status: 'CONFIRMED'
            },
            include: {
                branch: true
            }
        });

        for (const adm of admissions) {
            // await NotificationService.notifyBranchRole(adm.branchId, 'CHANNEL_PARTNER', {
            //     title: 'Conduct Exam Reminder',
            //     message: `Software module for ${adm.firstName} ${adm.lastName} is completed. Please schedule the final exam.`,
            //     type: 'WARNING',
            //     link: `/admissions`
            // });
        }
    }

    /**
     * Fee Reminder: 7 days before due date (based on Admission.feeBalance)
     */
    private static async checkFeeReminders() {
        // Find admissions with balance. In a real system we'd check against an installment date.
        // For now, let's notify about all pending balances to any student over 30 days old.
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        const admissions = await prisma.admission.findMany({
            where: {
                feeBalance: { gt: 0 },
                admissionDate: { lte: thirtyDaysAgo },
                status: 'CONFIRMED'
            },
            include: {
                branch: true
            }
        });

        for (const adm of admissions) {
            // await NotificationService.notifyBranchRole(adm.branchId, 'ADMISSION_OFFICER', {
            //     title: 'Fee Collection Reminder',
            //     message: `Student ${adm.firstName} ${adm.lastName} has a pending balance of ₹${adm.feeBalance}.`,
            //     type: 'WARNING',
            //     link: `/admissions`
            // });
        }
    }

    /**
     * Portfolio Deadline Follow-up
     */
    private static async checkPortfolioDeadlines() {
        const portfolios = await prisma.portfolio.findMany({
            where: {
                isVerified: false,
            },
            include: {
                student: {
                    include: {
                        branch: true,
                        // We need the name from Admission
                    }
                }
            }
        });

        for (const p of portfolios) {
            // Get admission to get the name
            const admission = await prisma.admission.findUnique({
                where: { id: (p.student as any).admissionId }
            });

            if (admission) {
                // await NotificationService.notifyBranchRole(admission.branchId, 'CHANNEL_PARTNER', {
                //     title: 'Portfolio Verification Required',
                //     message: `Portfolio for ${admission.firstName} ${admission.lastName} is pending verification.`,
                //     type: 'INFO',
                //     link: `/portfolio`
                // });
            }
        }
    }
}

