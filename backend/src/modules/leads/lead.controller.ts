import { UserRole, LeadStatus } from '../../types/enums';;
import { Response, Request } from 'express';
;
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

    const lead = await prisma.lead.create({
      data: {
        firstName,
        lastName,
        email,
        phone,
        source,
        interestedCourse,
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
        branchId: branchId || req.user.branchId!,
        createdById: req.user.id,
        assignedToId: assignedToId || req.user.id,
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
      },
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
        notes,
        followUpDate: followUpDate ? new Date(followUpDate) : undefined,
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
          convertedToAdmissionId: admission.id,
        },
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

