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

    // Branch filtering based on user role
    if (req.user?.role !== UserRole.CEO) {
      where.branchId = req.user?.branchId;
    } else if (branchId) {
      where.branchId = branchId as string;
    }

    if (status) {
      where.status = status as LeadStatus;
    }

    if (assignedToId) {
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

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { leads, meta });
  } catch (error) {
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
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [stats, followUpsToday, followUpsOverdue] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: { assignedToId: userId },
        _count: true
      }),
      prisma.followUp.findMany({
        where: { telecallerId: userId, scheduledDate: { gte: today, lt: new Date(today.getTime() + 86400000) }, status: 'PENDING' },
        include: { lead: true }
      }),
      prisma.followUp.findMany({
        where: { telecallerId: userId, scheduledDate: { lt: today }, status: 'PENDING' },
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
          _count: true
        }
      }
    });

    return successResponse(res, branchStats);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch CEO analytics', 500, error);
  }
};
