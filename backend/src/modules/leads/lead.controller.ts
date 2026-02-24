import { UserRole, LeadStatus } from '../../types/enums';
import { Response, Request } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { whatsappService } from '../../services/whatsapp.service';

export const getLeads = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, status, branchId, assignedToId, search } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    // Branch filtering - CEOs can filter by branchId from query, others are forced to their own branch
    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId && branchId !== 'all') {
      where.branchId = branchId as string;
    }

    if (status && status !== 'all' && status !== 'ALL') {
      where.status = status as LeadStatus;
    }

    if (assignedToId && assignedToId !== 'all') {
      where.assignedToId = assignedToId as string;
    }

    if (search) {
      where.OR = [
        { firstName: { contains: search as string, mode: 'insensitive' } },
        { lastName: { contains: search as string, mode: 'insensitive' } },
        { email: { contains: search as string, mode: 'insensitive' } },
        { phone: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    console.log(`[getLeads] Request by: ${req.user?.role} (${req.user?.id})`);
    console.log(`[getLeads] Query Params:`, JSON.stringify(req.query, null, 2));
    console.log(`[getLeads] Final Filters: branchId=${where.branchId}, status=${where.status}, assignedToId=${where.assignedToId}`);
    console.log(`[getLeads] Where Clause:`, JSON.stringify(where, null, 2));

    const [leads, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        skip,
        take,
        include: {
          branch: {
            select: { id: true, name: true, code: true },
          },
          createdBy: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          assignedTo: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.lead.count({ where }),
    ]);

    console.log(`[getLeads] Found ${leads.length} leads out of ${total} total.`);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { leads, meta });
  } catch (error) {
    console.error('[getLeads] Error:', error);
    return errorResponse(res, 'Failed to fetch leads', 500, error);
  }
};

export const getLeadById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const lead = await prisma.lead.findUnique({
      where: { id },
      include: {
        branch: true,
        createdBy: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true, email: true },
        },
        admission: true,
        whatsappLogs: {
          orderBy: { sentAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && lead.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    return successResponse(res, { lead });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch lead', 500, error);
  }
};

export const createLead = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const {
      firstName,
      lastName,
      email,
      phone,
      source,
      interestedCourse,
      notes,
      followUpDate,
      branchId,
      assignedToId,
      location,
    } = req.body;

    if (!req.user?.id) {
      return errorResponse(res, 'Unauthorized', 401);
    }

    const leadBranchId = branchId || req.user.branchId!;
    let finalAssignedToId = assignedToId;

    // Round-robin assignment if no specific telecaller assigned
    if (!finalAssignedToId) {
      const telecallers = await prisma.user.findMany({
        where: { branchId: leadBranchId, role: UserRole.TELECALLER, isActive: true },
        select: { id: true }
      });

      if (telecallers.length > 0) {
        // Simple round-robin based on lead count
        const assignments = await prisma.lead.groupBy({
          by: ['assignedToId'],
          where: { assignedToId: { in: telecallers.map(t => t.id) } },
          _count: { assignedToId: true }
        });

        const countsMap = new Map(assignments.map(a => [a.assignedToId, a._count.assignedToId]));
        telecallers.sort((a, b) => (countsMap.get(a.id) || 0) - (countsMap.get(b.id) || 0));
        finalAssignedToId = telecallers[0].id;
      } else {
        finalAssignedToId = req.user.id; // Fallback to creator
      }
    }

    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        source,
        interestedCourse,
        branchId: leadBranchId,
        createdById: req.user.id,
        assignedToId: finalAssignedToId,
        location,
        status: LeadStatus.NEW,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        createdBy: {
          select: { id: true, firstName: true, lastName: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Initial status history log
    await prisma.leadStatusHistory.create({
      data: {
        leadId: lead.id,
        newStatus: LeadStatus.NEW,
        changedById: req.user.id,
        notes: 'Initial creation',
      }
    });

    // Send WhatsApp notification (async, don't wait)
    whatsappService.sendNewLeadNotification(lead).catch(err => {
      console.error('Failed to send WhatsApp notification:', err);
    });

    // Create a follow-up task if provided
    if (followUpDate && finalAssignedToId) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          telecallerId: finalAssignedToId,
          scheduledDate: new Date(followUpDate),
          notes: notes || 'Scheduled during lead creation',
          type: 'CALL',
        }
      });
    }

    return successResponse(res, lead, 'Lead created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create lead', 500, error);
  }
};

export const updateLead = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const {
      firstName,
      lastName,
      email,
      phone,
      source,
      status,
      interestedCourse,
      branchId,
      notes,
      followUpDate,
      assignedToId,
      location,
    } = req.body;

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingLead.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    const lead = await prisma.lead.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone,
        source,
        status,
        interestedCourse,
        branchId,
        assignedToId,
        location,
      },
      include: {
        branch: {
          select: { id: true, name: true },
        },
        assignedTo: {
          select: { id: true, firstName: true, lastName: true },
        },
      },
    });

    // Log status change if status updated
    if (status && status !== existingLead.status) {
      await prisma.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: existingLead.status,
          newStatus: status,
          changedById: req.user!.id!,
          notes: notes || 'Status updated via lead management',
        }
      });
    }

    // Create a follow-up task if provided
    if (followUpDate && (branchId || lead.assignedToId)) {
      const telecallerId = lead.assignedToId || req.user!.id!;

      // Complete old PENDING/OVERDUE tasks
      await prisma.followUp.updateMany({
        where: {
          leadId: lead.id,
          telecallerId,
          status: { in: ['PENDING', 'OVERDUE'] }
        },
        data: { status: 'COMPLETED' }
      });

      // Create the new one
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          telecallerId,
          scheduledDate: new Date(followUpDate),
          notes: notes || 'Scheduled during lead update',
          type: 'CALL',
        }
      });
    }

    return successResponse(res, lead, 'Lead updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update lead', 500, error);
  }
};

export const deleteLead = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const existingLead = await prisma.lead.findUnique({ where: { id } });
    if (!existingLead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && existingLead.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    // Unlink from admission if exists (to avoid FK constraint errors)
    await prisma.admission.updateMany({
      where: { leadId: id },
      data: { leadId: null }
    });

    await prisma.lead.delete({ where: { id } });

    return successResponse(res, { id }, 'Lead deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete lead', 500, error);
  }
};

export const convertLeadToAdmission = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { courseId, feeAmount, batchName } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id } });
    if (!lead) {
      return errorResponse(res, 'Lead not found', 404);
    }

    // Branch access control
    if (req.user?.role !== UserRole.CEO && lead.branchId && lead.branchId !== req.user?.branchId) {
      return errorResponse(res, 'Access denied', 403);
    }

    if (lead.status === LeadStatus.CONVERTED) {
      return errorResponse(res, 'Lead already converted', 400);
    }

    // Generate admission number
    const year = new Date().getFullYear().toString().slice(-2);
    const effectiveBranchId = lead.branchId || req.user?.branchId || '';
    const count = await prisma.admission.count({
      where: { branchId: effectiveBranchId },
    });
    const branchCode = effectiveBranchId ? effectiveBranchId.slice(0, 4).toUpperCase() : 'GENE';
    const admissionNumber = `ADM${year}${branchCode}${(count + 1).toString().padStart(4, '0')}`;

    // Create admission and update lead in a transaction
    const result = await prisma.$transaction(async (tx) => {
      const admission = await tx.admission.create({
        data: {
          admissionNumber,
          firstName: lead.firstName,
          lastName: lead.lastName,
          email: lead.email,
          phone: lead.phone,
          courseId,
          batchName,
          feeAmount,
          feePaid: 0,
          feeBalance: feeAmount,
          branchId: effectiveBranchId,
          leadId: lead.id,
        },
      });

      await tx.lead.update({
        where: { id: lead.id },
        data: {
          status: LeadStatus.CONVERTED,
        },
      });

      await tx.leadConversionLog.create({
        data: {
          leadId: lead.id,
          admissionId: admission.id,
          convertedById: req.user!.id!,
        }
      });

      await tx.leadStatusHistory.create({
        data: {
          leadId: lead.id,
          oldStatus: lead.status,
          newStatus: LeadStatus.CONVERTED,
          changedById: req.user!.id!,
          notes: 'Lead converted to admission',
        }
      });

      return admission;
    });

    // Send WhatsApp notification (async)
    whatsappService.sendAdmissionConfirmation(result).catch(err => {
      console.error('Failed to send WhatsApp notification:', err);
    });

    return successResponse(res, result, 'Lead converted to admission successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to convert lead', 500, error);
  }
};

export const createPublicLead = async (req: Request, res: Response): Promise<Response> => {
  try {
    console.log('createPublicLead: processing request', req.body);
    const {
      firstName,
      lastName,
      email,
      phone,
      courseId,
      location,
    } = req.body;

    // Find default branch (first one) and default user (CEO)
    const [defaultBranch, defaultUser] = await Promise.all([
      prisma.branch.findFirst(),
      prisma.user.findFirst({ where: { role: UserRole.CEO } }),
    ]);

    console.log('createPublicLead: defaultBranch', defaultBranch?.id);
    console.log('createPublicLead: defaultUser', defaultUser?.id);

    if (!defaultBranch || !defaultUser) {
      console.error('createPublicLead: Missing default branch or user');
      return errorResponse(res, 'System configuration error: Missing default branch or user', 500);
    }

    // Get course name if courseId provided
    let interestedCourse = 'General Enquiry';
    if (courseId) {
      try {
        const course = await prisma.course.findUnique({ where: { id: courseId } });
        if (course) interestedCourse = course.name;
      } catch (err) {
        console.error('createPublicLead: Error fetching course', err);
      }
    }

    console.log('createPublicLead: Creating lead...');
    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        source: 'Website Enquiry',
        interestedCourse,
        branchId: defaultBranch.id,
        assignedToId: defaultUser.id,
        location,
        status: LeadStatus.NEW,
      },
    });
    console.log('createPublicLead: Lead created', lead.id);

    // Send WhatsApp notification
    whatsappService.sendNewLeadNotification(lead).catch(err => {
      console.error('Failed to send WhatsApp notification:', err);
    });

    return successResponse(res, lead, 'Enquiry submitted successfully', 201);
  } catch (error) {
    console.error('createPublicLead: Error', error);
    return errorResponse(res, 'Failed to submit enquiry', 500, error);
  }
};


export const logCall = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id: leadId } = req.params;
    const { callStatus, notes, nextFollowUpDate, followupType } = req.body;

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) return errorResponse(res, 'Lead not found', 404);

    const result = await prisma.$transaction(async (tx) => {
      const callLog = await tx.callLog.create({
        data: {
          leadId,
          telecallerId: req.user!.id!,
          callStatus,
          notes,
          nextFollowUpDate: nextFollowUpDate ? new Date(nextFollowUpDate) : null,
        }
      });

      // 2. Mark older PENDING and OVERDUE follow-ups as COMPLETED since a new interaction happened
      await tx.followUp.updateMany({
        where: {
          leadId,
          telecallerId: req.user!.id!,
          status: { in: ['PENDING', 'OVERDUE'] }
        },
        data: { status: 'COMPLETED' }
      });

      // 3. Create the next follow-up if scheduled
      if (nextFollowUpDate) {
        await tx.followUp.create({
          data: {
            leadId,
            telecallerId: req.user!.id!,
            scheduledDate: new Date(nextFollowUpDate),
            type: followupType || 'CALL',
            notes,
          }
        });
      }

      return callLog;
    });

    return successResponse(res, result, 'Call logged successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to log call', 500, error);
  }
};

export const getCallLogs = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id: leadId } = req.params;
    const logs = await prisma.callLog.findMany({
      where: { leadId },
      include: { telecaller: { select: { firstName: true, lastName: true } } },
      orderBy: { callDate: 'desc' }
    });
    return successResponse(res, logs);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch call logs', 500, error);
  }
};

export const getLeadStatusHistory = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id: leadId } = req.params;
    const history = await prisma.leadStatusHistory.findMany({
      where: { leadId },
      include: { changedBy: { select: { firstName: true, lastName: true, role: true } } },
      orderBy: { createdAt: 'desc' }
    });
    return successResponse(res, history);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch status history', 500, error);
  }
};

export const getTelecallerDashboard = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const userId = req.user!.id!;
    const userRole = req.user!.role;
    const branchId = req.user!.branchId;

    // Determine the lead filter based on role
    // Admins and CEOs see all leads. Telecallers and others see leads from their branch.
    const isGlobalView = userRole === UserRole.ADMIN || userRole === UserRole.CEO;
    const leadFilter = isGlobalView ? {} : (branchId ? { branchId } : { assignedToId: userId });

    const followUpFilter = isGlobalView
      ? {}
      : (userRole === UserRole.TELECALLER ? { telecallerId: userId } : {});

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date(now);
    todayEnd.setHours(23, 59, 59, 999);

    const [stats, followUpsToday, followUpsOverdue] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: leadFilter,
        _count: true
      }),
      prisma.followUp.findMany({
        where: {
          ...followUpFilter,
          scheduledDate: { gte: todayStart, lte: todayEnd },
          status: 'PENDING'
        },
        include: { lead: true }
      }),
      prisma.followUp.findMany({
        where: {
          ...followUpFilter,
          scheduledDate: { lt: todayStart },
          status: 'PENDING'
        },
        include: { lead: true }
      })
    ]);

    return successResponse(res, { stats, followUpsToday, followUpsOverdue });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch telecaller dashboard', 500, error);
  }
};

export const getCPTelecallerAnalytics = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const branchId = req.user!.branchId!;
    const telecallers = await prisma.user.findMany({
      where: { branchId, role: UserRole.TELECALLER },
      include: {
        _count: { select: { leadsAssigned: true, callLogs: true, conversions: true } }
      }
    });

    return successResponse(res, telecallers);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch CP analytics', 500, error);
  }
};

export const getCEOTelecallerAnalytics = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const branchStats = await prisma.branch.findMany({
      include: {
        _count: { select: { leads: true } },
        leads: {
          where: { status: LeadStatus.CONVERTED },
          select: { id: true }
        }
      }
    });

    // Transform the result to match the expected format (count the converted leads)
    const formattedStats = branchStats.map(branch => ({
      ...branch,
      _count: {
        ...branch._count,
        convertedLeads: branch.leads.length
      },
      leads: undefined // Remove the array of ids from the final response
    }));

    return successResponse(res, formattedStats);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch CEO analytics', 500, error);
  }
};
