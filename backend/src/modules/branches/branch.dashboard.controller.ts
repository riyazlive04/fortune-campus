
import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { UserRole } from '../../types/enums';

export const getBranchOverview = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        if (!branchId && req.user?.role !== UserRole.CEO) {
            return errorResponse(res, 'Branch ID not found for user', 400);
        }

        const where: any = branchId ? { branchId } : {};
        const now = new Date();
        const todayStart = new Date(now.setHours(0, 0, 0, 0));
        const weekStart = new Date(now.setDate(now.getDate() - 7));
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);


        const [
            activeStudents,
            newAdmissionsToday,
            newAdmissionsWeekly,
            newAdmissionsMonthly,
            totalLeads,
            totalAdmissionsCount,
            totalTrainers,
            attendanceToday,
            trainerAttendanceToday,
            revenueStats,
            placementEligible
        ] = await Promise.all([
            prisma.student.count({ where: { ...where, isActive: true } }),
            prisma.admission.count({ where: { ...where, createdAt: { gte: todayStart } } }),
            prisma.admission.count({ where: { ...where, createdAt: { gte: weekStart } } }),
            prisma.admission.count({ where: { ...where, createdAt: { gte: monthStart } } }),
            prisma.lead.count({ where }),
            prisma.admission.count({ where }),
            prisma.trainer.count({ where }),
            prisma.attendance.groupBy({
                by: ['status'],
                where: {
                    ...(branchId ? { student: { branchId } } : {}),
                    date: { gte: todayStart }
                },
                _count: true
            }),
            prisma.trainerAttendance.groupBy({
                by: ['status'],
                where: {
                    ...(branchId ? { trainer: { branchId } } : {}),
                    date: { gte: todayStart }
                },
                _count: true
            }),
            prisma.admission.aggregate({
                where,
                _sum: { feePaid: true, feeBalance: true, feeAmount: true }
            }),
            prisma.student.count({ where: { ...where, placementEligible: true } })
        ]);

        const conversionRate = totalLeads > 0 ? Math.round((totalAdmissionsCount / totalLeads) * 100) : 0;

        const attendanceSummary = {
            present: attendanceToday.find(a => a.status === 'PRESENT')?._count || 0,
            absent: attendanceToday.find(a => a.status === 'ABSENT')?._count || 0,
            studentsMarked: attendanceToday.length > 0,

            trainerPresent: trainerAttendanceToday.find(a => a.status === 'PRESENT')?._count || 0,
            trainerAbsent: trainerAttendanceToday.find(a => a.status === 'ABSENT')?._count || 0,
            trainersMarked: trainerAttendanceToday.length > 0
        };

        return successResponse(res, {
            kpis: {
                activeStudents,
                admissions: {
                    today: newAdmissionsToday,
                    weekly: newAdmissionsWeekly,
                    monthly: newAdmissionsMonthly,
                    conversionRate
                },
                totalLeads,
                totalAdmissions: totalAdmissionsCount,
                trainers: totalTrainers,
                attendance: attendanceSummary,
                revenue: {
                    collected: revenueStats._sum.feePaid || 0,
                    pending: revenueStats._sum.feeBalance || 0,
                    total: revenueStats._sum.feeAmount || 0
                },
                placementEligible
            }
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch branch overview', 500, error);
    }
};

export const getAdmissionsStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const [leadsBySource, admissionsTrend, recentLeads, pendingAdmissions] = await Promise.all([
            prisma.lead.groupBy({
                by: ['source'],
                where,
                _count: true
            }),
            prisma.admission.groupBy({
                by: ['status'],
                where,
                _count: true
            }),
            prisma.lead.findMany({
                where: { ...where, status: 'NEW' },
                orderBy: { createdAt: 'desc' },
                take: 10
            }),
            prisma.admission.findMany({
                where: { ...where, status: 'PENDING' },
                include: { course: true },
                orderBy: { createdAt: 'desc' },
                take: 10
            })
        ]);

        return successResponse(res, { leadsBySource, admissionsTrend, recentLeads, pendingAdmissions });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch admissions stats', 500, error);
    }
};

export const convertLead = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { leadId } = req.body;
        console.log('--- Convert Lead Request ---');
        console.log('User:', req.user?.id, req.user?.email);
        console.log('Body:', req.body);
        console.log('LeadID:', leadId);

        if (!leadId) {
            console.error('Lead ID is missing');
            return errorResponse(res, 'Lead ID is required', 400);
        }

        const lead = await prisma.lead.update({
            where: { id: leadId },
            data: { status: 'CONVERTED' }
        });
        console.log('Lead updated successfully:', lead.id);

        // Optionally, create a skeleton admission here if needed, 
        // but for now we just mark the lead as converted.

        return successResponse(res, lead, 'Lead converted successfully');
    } catch (error: any) {
        console.error('Convert Lead Error:', error);
        return errorResponse(res, 'Failed to convert lead', 500, error);
    }
};

export const getAttendanceStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { student: { branchId } } : {};

        const [latestAttendance, lowAttendanceStudents] = await Promise.all([
            prisma.attendance.findMany({
                where,
                take: 10,
                orderBy: { date: 'desc' },
                include: { student: { include: { user: true } } }
            }),
            // Simplified: in real app, we would aggregate attendance percentages
            prisma.student.findMany({
                where: { ...where, isActive: true },
                include: { user: true, _count: { select: { attendances: true } } },
                take: 5
            })
        ]);

        return successResponse(res, { latestAttendance, lowAttendanceStudents });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch attendance stats', 500, error);
    }
};

export const getBranchAttendance = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;
        const date = req.query.date ? new Date(req.query.date as string) : undefined;

        const where: any = branchId ? { student: { branchId } } : {};
        if (date) {
            const startOfDay = new Date(date);
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date(date);
            endOfDay.setHours(23, 59, 59, 999);
            where.date = { gte: startOfDay, lte: endOfDay };
        }

        // 1. Get distinct (student, date) groups for pagination
        const distinctGroups = await prisma.attendance.findMany({
            where,
            distinct: ['studentId', 'date'],
            orderBy: { date: 'desc' },
            skip,
            take: limit,
            select: { studentId: true, date: true }
        });

        // 2. Hydrate these groups with full data
        const attendance = await Promise.all(distinctGroups.map(async (group) => {
            const records = await prisma.attendance.findMany({
                where: {
                    studentId: group.studentId,
                    date: group.date
                },
                include: {
                    student: { include: { user: true } },
                    course: true,
                    batch: true
                },
                orderBy: { period: 'asc' }
            });

            const first = records[0];
            return {
                id: first.id, // Use the first ID as key
                date: first.date,
                student: first.student,
                course: first.course,
                batch: first.batch,
                periods: records.map(r => ({ period: r.period, status: r.status }))
            };
        }));

        // 3. Get accurate count of groups
        const uniqueCount = await prisma.attendance.groupBy({
            by: ['studentId', 'date'],
            where,
        });
        const total = uniqueCount.length;

        return successResponse(res, { attendance, total, page, limit });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch branch attendance', 500, error);
    }
};

export const getProgressStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const where = branchId ? { branchId } : {};

        const [courseDistribution, softwareProgress, totalStudents] = await Promise.all([
            prisma.student.groupBy({
                by: ['courseId'],
                where: { ...where, isActive: true },
                _count: true
            }),
            prisma.softwareProgress.findMany({
                where: { student: { branchId, isActive: true } },
                skip,
                take: limit,
                orderBy: { progress: 'desc' }, // Descending order for top progress
                include: {
                    student: { include: { user: true } },
                    course: true
                }
            }),
            prisma.softwareProgress.count({
                where: { student: { branchId, isActive: true } }
            })
        ]);

        return successResponse(res, { courseDistribution, softwareProgress, total, page, limit });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch progress stats', 500, error);
    }
};

export const getPortfolioStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { student: { branchId } } : {};

        const [submissions, pendingApprovals] = await Promise.all([
            prisma.portfolioSubmission.count({ where }),
            prisma.portfolioSubmission.count({ where: { ...where, status: 'PENDING' } })
        ]);

        return successResponse(res, { submissions, pendingApprovals });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch portfolio stats', 500, error);
    }
};

export const getTrainerStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId } : {};

        const trainers = await prisma.trainer.findMany({
            where,
            include: {
                user: true,
                batches: {
                    include: {
                        _count: { select: { students: true } }
                    }
                }
            }
        });

        const performance = trainers.map(t => ({
            id: t.id,
            name: `${t.user.firstName} ${t.user.lastName}`,
            batchesCount: t.batches.length,
            totalStudents: t.batches.reduce((acc: number, b: any) => acc + (b._count?.students || 0), 0),
            rating: 4.8,
            efficiency: '92%'
        }));

        return successResponse(res, { performance });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch trainer stats', 500, error);
    }
};

export const getFeeStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 20;
        const skip = (page - 1) * limit;

        const where = branchId ? { branchId } : {};

        const [revenueByCourse, studentFees, total, overallStats] = await Promise.all([
            prisma.admission.groupBy({
                by: ['courseId'],
                where,
                _sum: { feePaid: true, feeBalance: true }
            }),
            prisma.admission.findMany({
                where,
                skip,
                take: limit,
                orderBy: { createdAt: 'desc' },
                include: {
                    student: {
                        include: { user: true }
                    },
                    course: true
                }
            }),
            prisma.admission.count({ where }),
            prisma.admission.aggregate({
                where,
                _sum: {
                    feeAmount: true,
                    feePaid: true,
                    feeBalance: true
                }
            })
        ]);

        return successResponse(res, { revenueByCourse, studentFees, total, page, limit, overallStats });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch fee stats', 500, error);
    }
};

export const updateAdmissionFees = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const { id } = req.params;
        const { feeAmount, feePaid } = req.body;

        if (feeAmount === undefined || feePaid === undefined) {
            return errorResponse(res, 'Fee amount and fee paid are required', 400);
        }

        const admission = await prisma.admission.findUnique({
            where: { id }
        });

        if (!admission) {
            return errorResponse(res, 'Admission record not found', 404);
        }

        const feeBalance = parseFloat(feeAmount) - parseFloat(feePaid);

        const updatedAdmission = await prisma.admission.update({
            where: { id },
            data: {
                feeAmount: parseFloat(feeAmount),
                feePaid: parseFloat(feePaid),
                feeBalance
            }
        });

        return successResponse(res, { admission: updatedAdmission });
    } catch (error) {
        return errorResponse(res, 'Failed to update admission fees', 500, error);
    }
};

export const getPlacementStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where: any = branchId ? { branchId } : {};

        const [eligibleCount, recentPlacements, totalStudents] = await Promise.all([
            prisma.student.count({ where: { ...where, placementEligible: true } }),
            prisma.placement.findMany({
                where: {
                    student: branchId ? { branchId: branchId } : undefined
                },
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { student: { include: { user: true } }, company: true }
            }),
            prisma.student.count({ where: { ...where, isActive: true } })
        ]);

        const notEligibleCount = totalStudents - eligibleCount;

        return successResponse(res, {
            eligibleCount,
            notEligibleCount,
            recentPlacements
        });
    } catch (error) {
        return errorResponse(res, 'Failed to fetch placement stats', 500, error);
    }
};

export const getComplianceStats = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        if (!branchId && req.user?.role !== UserRole.CEO) {
            return errorResponse(res, 'Branch ID required', 400);
        }

        const whereStudent = branchId ? { branchId, isActive: true } : { isActive: true };

        // 1. Attendance Compliance (< 75%)
        // fetching all students and calculating attendance is expensive, so we'll do a simplified check or aggregate if possible
        // For now, let's fetch students with their attendance count and total days (simplified)
        // A better approach in production: have a computed field or periodic job. 
        // Here we will just look for students with recent 'ABSENT' status or many absences.

        // Let's get students with > 3 absences in the last 30 days
        const last30Days = new Date();
        last30Days.setDate(last30Days.getDate() - 30);

        const studentsWithHighAbsence = await prisma.student.findMany({
            where: {
                ...whereStudent,
                attendances: {
                    some: {
                        date: { gte: last30Days },
                        status: 'ABSENT'
                    }
                }
            },
            select: {
                id: true,
                user: { select: { firstName: true, lastName: true, email: true } },
                course: { select: { name: true } },
                _count: {
                    select: {
                        attendances: { where: { status: 'ABSENT', date: { gte: last30Days } } }
                    }
                }
            },
        });

        // Filter for those with notable absence count (e.g., > 4 days absent in month ~ <80% roughly)
        const lowAttendanceList = studentsWithHighAbsence
            .map(s => ({
                id: s.id,
                name: `${s.user.firstName} ${s.user.lastName}`,
                course: s.course?.name,
                absentDays: s._count.attendances,
                risk: s._count.attendances > 6 ? 'CRITICAL' : 'WARNING'
            }))
            .filter(s => s.absentDays > 3)
            .sort((a, b) => b.absentDays - a.absentDays);


        // 2. Fee Compliance (Overdue)
        const overdueStudents = await prisma.admission.findMany({
            where: {
                branchId: branchId || undefined,
                feeBalance: { gt: 0 },
                // Assuming we had a nextInstallmentDate, but for now just showing pending balance
                status: 'APPROVED'
            },
            select: {
                student: { select: { id: true, user: { select: { firstName: true, lastName: true } } } },
                course: { select: { name: true } },
                feeBalance: true,
                feePaid: true,
                feeAmount: true
            },
            orderBy: { feeBalance: 'desc' },
            take: 20
        });

        const feeCompliance = overdueStudents.map(adm => ({
            name: `${adm.student?.user?.firstName} ${adm.student?.user?.lastName}`,
            course: adm.course?.name,
            pending: adm.feeBalance,
            paid: adm.feePaid,
            total: adm.feeAmount
        }));

        // 3. Portfolio Compliance (Pending Approvals > 7 days)
        // Assuming createdAt is submission date
        const warningDate = new Date();
        warningDate.setDate(warningDate.getDate() - 7);

        const delayedPortfolios = await prisma.portfolioSubmission.findMany({
            where: {
                student: { branchId: branchId || undefined },
                status: 'PENDING',
                submittedAt: { lte: warningDate }
            },
            include: {
                student: { include: { user: true } },
                task: true
            }
        });

        return successResponse(res, {
            attendanceRisks: lowAttendanceList,
            feeRisks: feeCompliance,
            portfolioDelays: delayedPortfolios.map(p => ({
                id: p.id,
                studentName: `${p.student.user.firstName} ${p.student.user.lastName}`,
                taskTitle: p.task.title,
                submittedAt: p.submittedAt
            }))
        });

    } catch (error) {
        return errorResponse(res, 'Failed to fetch compliance stats', 500, error);
    }
};

export const getPlacementReadiness = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const branchId = req.user?.branchId;
        const where = branchId ? { branchId, isActive: true } : { isActive: true };

        const headerRow = await prisma.student.findMany({
            where,
            select: {
                id: true,
                user: { select: { firstName: true, lastName: true } },
                course: { select: { name: true } },
                placementEligible: true,
                softwareProgress: { select: { status: true } }, // Simplified check
                portfolioSubmissions: { where: { status: 'APPROVED' }, select: { id: true } },
                _count: { select: { attendances: { where: { status: 'ABSENT' } } } } // Rough metric
            }
        });

        // Transform to readiness list
        const readinessList = headerRow.map((s: any) => {
            const portfolioCount = s.portfolioSubmissions?.length || 0;
            // Mock logic: Assume need 5 portfolios and < 10 absences
            const isAttendanceSafe = (s._count?.attendances || 0) < 10;
            const isPortfolioReady = portfolioCount >= 5; // simplified threshold

            const missing = [];
            if (!isAttendanceSafe) missing.push('Attendance');
            if (!isPortfolioReady) missing.push('Portfolios');

            return {
                id: s.id,
                name: s.user ? `${s.user.firstName} ${s.user.lastName}` : 'Unknown Student',
                course: s.course?.name || 'Unknown Course',
                status: s.placementEligible ? 'READY' : 'NOT_READY',
                missingRequirements: missing,
                portfolioCount
            };
        });

        return successResponse(res, { students: readinessList });

    } catch (error) {
        console.error('Placement readiness error:', error);
        return errorResponse(res, 'Failed to fetch placement readiness', 500, error);
    }
};

export const getBranchReport = async (req: AuthRequest, res: Response): Promise<void> => {
    try {
        const branchId = req.user?.branchId;
        const { type } = req.params;

        if (!branchId) {
            res.status(400).json({ success: false, message: 'Branch ID required' });
            return;
        }

        let data: any[] = [];
        let headers: string[] = [];
        let filename = `report-${type}-${new Date().toISOString().split('T')[0]}.csv`;

        const today = new Date();
        today.setHours(0, 0, 0, 0);

        switch (type) {
            case 'Daily Admission':
                headers = ['Admission No', 'Student Name', 'Course', 'Fee Amount', 'Paid', 'Date'];
                const admissions = await prisma.admission.findMany({
                    where: {
                        branchId,
                        admissionDate: { gte: today }
                    },
                    include: { course: true }
                });
                data = admissions.map(a => [
                    a.admissionNumber,
                    `${a.firstName} ${a.lastName}`,
                    a.course.name,
                    a.feeAmount,
                    a.feePaid,
                    new Date(a.admissionDate).toLocaleDateString()
                ]);
                break;

            case 'Student Discipline':
                headers = ['Student Name', 'Enrollment', 'Course', 'Absent Days (Last 30 Days)', 'Status'];
                // Logic to find students with high absenteeism
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

                const absenteeStudents = await prisma.student.findMany({
                    where: { branchId, isActive: true },
                    include: {
                        user: true,
                        course: true,
                        attendances: {
                            where: {
                                date: { gte: thirtyDaysAgo },
                                status: 'ABSENT'
                            }
                        }
                    }
                });

                // Filter only those with > 3 absences
                data = absenteeStudents
                    .filter(s => s.attendances.length > 3)
                    .map(s => [
                        `${s.user.firstName} ${s.user.lastName}`,
                        s.enrollmentNumber,
                        s.course.name,
                        s.attendances.length,
                        'High Risk'
                    ]);
                break;

            case 'Trainer Efficiency':
                headers = ['Trainer Name', 'Batches', 'Students', 'Avg Attendance', 'Efficiency'];
                // Logic already exists in getTrainerStats, reusing simplified version
                const trainers = await prisma.trainer.findMany({
                    where: {
                        branchId,
                        user: { isActive: true }
                    },
                    include: {
                        user: true,
                        batches: {
                            include: {
                                _count: { select: { students: true } }
                            }
                        }
                    }
                });

                data = trainers.map(t => [
                    `${t.user.firstName} ${t.user.lastName}`,
                    t.batches.length,
                    t.batches.reduce((acc, b) => acc + (b._count?.students || 0), 0),
                    '85%', // Mock data for now as calculation is complex
                    'Good'
                ]);
                break;

            case 'Revenue Collection':
                headers = ['Student Name', 'Enr. No', 'Course', 'Total Fee', 'Paid', 'Balance', 'Status'];
                const fees = await prisma.admission.findMany({
                    where: { branchId },
                    include: { student: { include: { user: true } }, course: true }
                });
                data = fees.map(f => [
                    `${f.firstName} ${f.lastName}`,
                    f.student?.enrollmentNumber || 'N/A',
                    f.course.name,
                    f.feeAmount,
                    f.feePaid,
                    f.feeBalance,
                    f.feeBalance <= 0 ? 'Paid' : 'Pending'
                ]);
                break;

            case 'Placement Readiness':
                // Reusing logic from getPlacementReadiness roughly
                headers = ['Student Name', 'Course', 'Portfolios', 'Attendance Status', 'Readiness'];
                const students = await prisma.student.findMany({
                    where: { branchId, isActive: true },
                    include: {
                        user: true,
                        course: true,
                        portfolioSubmissions: { where: { status: 'APPROVED' } },
                        _count: { select: { attendances: { where: { status: 'ABSENT' } } } }
                    }
                });
                data = students.map(s => [
                    `${s.user.firstName} ${s.user.lastName}`,
                    s.course.name,
                    s.portfolioSubmissions.length,
                    s._count.attendances < 10 ? 'Good' : 'Low',
                    s.placementEligible ? 'Ready' : 'Not Ready'
                ]);
                break;

            case 'Compliance Alert Log':
                headers = ['Student', 'Issue Type', 'Details', 'Severity'];
                // Combining fee and attendance risks
                data = []; // Placeholder for complex logic, or simple aggregation
                // For now returning empty or mock
                break;

            default:
                res.status(400).json({ success: false, message: 'Invalid report type' });
                return;
        }

        // CSV Generation
        const csvRows = [
            headers.join(','),
            ...data.map(row => row.map((field: any) => `"${String(field).replace(/"/g, '""')}"`).join(','))
        ];
        const csvString = csvRows.join('\n');

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
        res.status(200).send(csvString);

    } catch (error) {
        console.error('Report generation error:', error);
        res.status(500).json({ success: false, message: 'Failed to generate report' });
    }
};

export const uploadBranchReport = async (req: AuthRequest, res: Response): Promise<Response> => {
    try {
        const userId = req.user?.id;
        const branchId = req.user?.branchId;
        const file = req.file;
        const { title, description, type } = req.body;

        console.log(`[uploadBranchReport] Upload initiated by user: ${userId}, branch: ${branchId}`);
        console.log(`[uploadBranchReport] Data: title=${title}, type=${type}`);
        console.log(`[uploadBranchReport] File:`, file);

        if (!userId || !branchId) {
            console.log(`[uploadBranchReport] User or Branch ID missing`);
            return errorResponse(res, 'Unauthorized', 401);
        }

        if (!file) {
            console.log(`[uploadBranchReport] No file received`);
            return errorResponse(res, 'No file uploaded', 400);
        }

        // Construct file URL
        const fileUrl = `/uploads/reports/${file.filename}`;
        console.log(`[uploadBranchReport] File URL constructed: ${fileUrl}`);

        const report = await (prisma as any).branchReport.create({
            data: {
                title,
                description,
                type,
                fileUrl,
                branchId,
                uploadedById: userId
            }
        });

        console.log(`[uploadBranchReport] Report created in DB:`, report);
        return successResponse(res, report, 'Report uploaded successfully');

    } catch (error) {
        console.error('Upload report error:', error);
        return errorResponse(res, 'Failed to upload report', 500);
    }
};
