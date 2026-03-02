import { UserRole, LeadStatus } from '../../types/enums';
import { Response, Request } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';
import { whatsappService } from '../../services/whatsapp.service';

const parseDateString = (dateStr: string) => {
  if (!dateStr) return null;
  const [year, month, day] = dateStr.split('-').map(Number);
  // Create at noon in server local time to ensure it falls within the expected day range regardless of minor timezone shifts
  return new Date(year, month - 1, day, 12, 0, 0);
};

export const getLeads = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, status, branchId, assignedToId, search, source, interestedCourse } = req.query;

    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    // Branch filtering - CEOs can filter by branchId from query, others are forced to their own branch
    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.TELECALLER) {
      where.branchId = req.user?.branchId;
    } else if (branchId && branchId !== 'all') {
      where.branchId = branchId as string;
    }

    if (status && status !== 'all' && status !== 'ALL') {
      where.status = status as LeadStatus;
    }

    // Role-based visibility enforcement
    if (req.user?.role === UserRole.TELECALLER) {
      // Telecallers can see leads explicitly assigned to them OR leads in any of their assigned branches
      const telecaller = await prisma.user.findUnique({
        where: { id: req.user.id },
        include: { assignedBranches: true }
      });

      const branchIds = telecaller?.assignedBranches.map(b => b.id) || [];

      where.OR = [
        { assignedToId: req.user.id },
        { branchId: { in: branchIds } }
      ];

      // If a specific assignedToId is requested by a Telecaller, respect it as an AND
      if (assignedToId && assignedToId !== 'all') {
        where.assignedToId = assignedToId as string;
      }
    } else if (assignedToId && assignedToId !== 'all') {
      where.assignedToId = assignedToId as string;
    }

    if (search) {
      where.AND = where.AND || [];
      where.AND.push({
        OR: [
          { firstName: { contains: search as string, mode: 'insensitive' } },
          { lastName: { contains: search as string, mode: 'insensitive' } },
          { email: { contains: search as string, mode: 'insensitive' } },
          { phone: { contains: search as string, mode: 'insensitive' } },
        ]
      });
    }

    if (source && source !== 'all') {
      where.source = source as string;
    }

    if (interestedCourse && interestedCourse !== 'all') {
      where.interestedCourse = interestedCourse as string;
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
            select: { id: true, firstName: true, lastName: true, email: true, role: true },
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
          select: { id: true, firstName: true, lastName: true, email: true, role: true },
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

    // Access control
    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN) {
      if (req.user?.role === UserRole.TELECALLER) {
        if (lead.assignedToId !== req.user.id) {
          return errorResponse(res, 'Access denied', 403);
        }
      } else if (req.user?.branchId && lead.branchId !== req.user.branchId) {
        return errorResponse(res, 'Access denied', 403);
      }
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

    const leadBranchId = branchId || req.user.branchId;
    let finalAssignedToId = assignedToId;

    // Round-robin assignment if no specific telecaller assigned
    if (!finalAssignedToId) {
      const telecallers = await prisma.user.findMany({
        where: {
          role: UserRole.TELECALLER,
          isActive: true,
          assignedBranches: {
            some: { id: leadBranchId }
          }
        },
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

    // Create a follow-up task
    if (finalAssignedToId) {
      await prisma.followUp.create({
        data: {
          leadId: lead.id,
          telecallerId: finalAssignedToId,
          scheduledDate: followUpDate ? parseDateString(followUpDate)! : new Date(),
          notes: notes || (followUpDate ? 'Scheduled during lead creation' : 'Initial follow-up required'),
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

    // Access control
    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN) {
      if (req.user?.role === UserRole.TELECALLER) {
        if (existingLead.assignedToId !== req.user.id) {
          return errorResponse(res, 'Access denied', 403);
        }
      } else if (req.user?.branchId && existingLead.branchId !== req.user.branchId) {
        return errorResponse(res, 'Access denied', 403);
      }
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
          scheduledDate: parseDateString(followUpDate)!,
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

    // Access control
    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN) {
      if (req.user?.role === UserRole.TELECALLER) {
        if (existingLead.assignedToId !== req.user.id) {
          return errorResponse(res, 'Access denied', 403);
        }
      } else if (req.user?.branchId && existingLead.branchId !== req.user.branchId) {
        return errorResponse(res, 'Access denied', 403);
      }
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

    // Access control
    if (req.user?.role !== UserRole.CEO && req.user?.role !== UserRole.ADMIN) {
      if (req.user?.role === UserRole.TELECALLER) {
        if (lead.assignedToId !== req.user.id) {
          return errorResponse(res, 'Access denied', 403);
        }
      } else if (req.user?.branchId && lead.branchId !== req.user.branchId) {
        return errorResponse(res, 'Access denied', 403);
      }
    }

    if (lead.status === LeadStatus.CONVERTED) {
      return errorResponse(res, 'Lead already converted', 400);
    }

    // Generate admission number
    const year = new Date().getFullYear().toString().slice(-2);
    const effectiveBranchId = lead.branchId || req.user?.branchId || '';
    const count = await prisma.admission.count({
      where: { branchId: effectiveBranchId || undefined },
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
      branchId,
      location,
    } = req.body;

    // Find requested or default branch (first one) and default user (CEO)
    const [branch, defaultUser] = await Promise.all([
      branchId ? prisma.branch.findUnique({ where: { id: branchId } }) : prisma.branch.findFirst(),
      prisma.user.findFirst({ where: { role: UserRole.CEO } }),
    ]);

    if (!branch) {
      return errorResponse(res, 'Branch not found', 404);
    }
    console.log('createPublicLead: defaultUser', defaultUser?.id);

    if (!branch || !defaultUser) {
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
        branchId: branch.id,
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
          nextFollowUpDate: parseDateString(nextFollowUpDate),
        }
      });

      // 1.5 Update Lead status if provided
      const leadStatus = req.body.status;
      if (leadStatus) {
        const oldLead = await tx.lead.findUnique({ where: { id: leadId } });
        if (oldLead && oldLead.status !== leadStatus) {
          await tx.lead.update({
            where: { id: leadId },
            data: { status: leadStatus }
          });

          // Log status history
          await tx.leadStatusHistory.create({
            data: {
              leadId,
              oldStatus: oldLead.status,
              newStatus: leadStatus,
              changedById: req.user!.id!,
              notes: notes || `Status updated during call log: ${callStatus}`,
            }
          });
        }
      }

      // 2. Mark older PENDING and OVERDUE follow-ups as COMPLETED 
      // ONLY if a new follow-up is scheduled OR the lead is converted/terminal
      const isTerminalStatus = [
        LeadStatus.CONVERTED,
        LeadStatus.NOT_INTERESTED,
        LeadStatus.LOST
      ].includes(leadStatus as LeadStatus);

      if (nextFollowUpDate || isTerminalStatus) {
        await tx.followUp.updateMany({
          where: {
            leadId,
            status: { in: ['PENDING', 'OVERDUE'] }
          },
          data: { status: 'COMPLETED' }
        });
      }

      // 3. Create the next follow-up if scheduled
      if (nextFollowUpDate) {
        await tx.followUp.create({
          data: {
            leadId,
            telecallerId: req.user!.id!,
            scheduledDate: parseDateString(nextFollowUpDate)!,
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
    // Admins and CEOs see all leads. Telecallers see their assigned leads OR leads in assigned branches. Others see leads from their branch.
    const isGlobalView = userRole === UserRole.ADMIN || userRole === UserRole.CEO;

    let leadFilter: any = {};
    let followUpFilter: any = {};

    if (!isGlobalView) {
      if (userRole === UserRole.TELECALLER) {
        const telecaller = await prisma.user.findUnique({
          where: { id: userId },
          include: { assignedBranches: true }
        });
        const branchIds = telecaller?.assignedBranches.map(b => b.id) || [];

        leadFilter = {
          OR: [
            { assignedToId: userId },
            { branchId: { in: branchIds } }
          ]
        };

        followUpFilter = {
          OR: [
            { telecallerId: userId },
            { lead: { branchId: { in: branchIds } } }
          ]
        };
      } else {
        leadFilter = { branchId: branchId || undefined };
        followUpFilter = { lead: { branchId: branchId || undefined } };
      }
    }

    const { date: queryDate } = req.query;
    const now = queryDate ? new Date(queryDate as string) : new Date();

    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);

    const [stats, upcomingFollowUps, followUpsOverdue] = await Promise.all([
      prisma.lead.groupBy({
        by: ['status'],
        where: leadFilter,
        _count: true
      }),
      prisma.followUp.findMany({
        where: {
          ...followUpFilter,
          scheduledDate: { gte: todayStart },
          status: 'PENDING'
        },
        include: { lead: true },
        orderBy: { scheduledDate: 'asc' }
      }),
      prisma.followUp.findMany({
        where: {
          ...followUpFilter,
          scheduledDate: { lt: todayStart },
          status: 'PENDING'
        },
        include: { lead: true },
        orderBy: { scheduledDate: 'asc' }
      })
    ]);

    return successResponse(res, {
      stats,
      upcomingFollowUps,
      followUpsOverdue
    });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch telecaller dashboard', 500, error);
  }
};

export const getCPTelecallerAnalytics = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const branchId = req.user!.branchId!;
    const telecallers = await prisma.user.findMany({
      where: {
        role: UserRole.TELECALLER,
        assignedBranches: {
          some: { id: branchId }
        }
      },
      include: {
        _count: { select: { leadsAssigned: true, callLogs: true, conversions: true } }
      }
    });

    return successResponse(res, telecallers);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch CP analytics', 500, error);
  }
};

export const getCEOTelecallerAnalytics = async (_req: AuthRequest, res: Response): Promise<Response> => {
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
