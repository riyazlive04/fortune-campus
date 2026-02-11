
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { successResponse, errorResponse } from '../../utils/response';

const prisma = new PrismaClient();

/**
 * Get Daily Admissions Report
 */
export const getDailyAdmissions = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const admissions = await prisma.admission.findMany({
            where: {
                branchId: branchId as string,
                createdAt: {
                    gte: today,
                },
            },
            include: {
                course: true,
            },
        });

        return successResponse(res, admissions, 'Daily admissions fetched successfully');
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to fetch daily admissions');
    }
};

/**
 * Get Fees Pending Report
 */
export const getFeesPending = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;

        const pendingFees = await prisma.admission.findMany({
            where: {
                branchId: branchId as string,
                feeBalance: {
                    gt: 0,
                },
            },
            include: {
                course: true,
                student: {
                    include: {
                        user: true,
                    },
                },
            },
        });

        return successResponse(res, pendingFees, 'Fees pending report fetched successfully');
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to fetch fees pending report');
    }
};

/**
 * Get Placement Eligibility Report
 */
export const getPlacementEligible = async (req: Request, res: Response) => {
    try {
        const { branchId, minCgpa } = req.query;

        const eligibleStudents = await prisma.student.findMany({
            where: {
                branchId: branchId as string,
                cgpa: {
                    gte: minCgpa ? parseFloat(minCgpa as string) : 0,
                },
                // Additional eligibility logic can be added here
            },
            include: {
                user: true,
                course: true,
                portfolios: true,
            },
        });

        return successResponse(res, eligibleStudents, 'Placement eligible students fetched successfully');
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to fetch placement eligible students');
    }
};

/**
 * Get Expense Report
 */
export const getExpenseReport = async (req: Request, res: Response) => {
    try {
        const { branchId, month, year } = req.query;

        const startDate = new Date(parseInt(year as string), parseInt(month as string) - 1, 1);
        const endDate = new Date(parseInt(year as string), parseInt(month as string), 0);

        const expenses = await prisma.expense.findMany({
            where: {
                branchId: branchId as string,
                date: {
                    gte: startDate,
                    lte: endDate,
                },
            },
        });

        const totalAmount = expenses.reduce((sum: number, exp: any) => sum + exp.amount, 0);

        return successResponse(res, { expenses, totalAmount }, 'Expense report fetched successfully');
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to fetch expense report');
    }
};

/**
 * Submit Expense
 */
export const submitExpense = async (req: Request, res: Response) => {
    try {
        const { branchId, amount, category, description, date } = req.body;

        const expense = await prisma.expense.create({
            data: {
                branchId,
                amount: parseFloat(amount),
                category,
                description,
                date: date ? new Date(date) : new Date(),
            },
        });

        return successResponse(res, expense, 'Expense submitted successfully', 201);
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to submit expense');
    }
};

/**
 * Get Social Engagement Report
 */
export const getSocialEngagement = async (req: Request, res: Response) => {
    try {
        const { branchId } = req.query;

        const engagement = await prisma.socialMediaEngagement.findMany({
            where: {
                branchId: branchId as string,
            },
            orderBy: {
                date: 'desc',
            },
            take: 10,
        });

        return successResponse(res, engagement, 'Social engagement report fetched successfully');
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to fetch social engagement report');
    }
};

/**
 * Submit Event Plan (IV/Seminar)
 */
export const submitEventPlan = async (req: Request, res: Response) => {
    try {
        const { branchId, type, title, description, date } = req.body;

        const eventPlan = await prisma.eventPlan.create({
            data: {
                branchId,
                type,
                title,
                description,
                date: new Date(date),
            },
        });

        return successResponse(res, eventPlan, 'Event plan submitted successfully', 201);
    } catch (error: any) {
        return errorResponse(res, error.message || 'Failed to submit event plan');
    }
};
