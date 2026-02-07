import { Response } from 'express';
import { prisma } from '../../config/database';
import { successResponse, errorResponse, paginationHelper, getPaginationMeta } from '../../utils/response';
import { AuthRequest } from '../../middlewares/auth.middleware';

export const getCompanies = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { page = 1, limit = 10, isActive, search } = req.query;
    
    const { skip, take } = paginationHelper(Number(page), Number(limit));

    const where: any = {};

    if (isActive !== undefined) {
      where.isActive = isActive === 'true';
    }

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { industry: { contains: search as string, mode: 'insensitive' } },
      ];
    }

    const [companies, total] = await Promise.all([
      prisma.company.findMany({
        where,
        skip,
        take,
        include: {
          _count: {
            select: { placements: true },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.company.count({ where }),
    ]);

    const meta = getPaginationMeta(total, Number(page), Number(limit));

    return successResponse(res, { companies, meta });
  } catch (error) {
    return errorResponse(res, 'Failed to fetch companies', 500, error);
  }
};

export const getCompanyById = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        placements: {
          include: {
            student: {
              include: {
                user: {
                  select: { firstName: true, lastName: true },
                },
              },
            },
          },
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });

    if (!company) {
      return errorResponse(res, 'Company not found', 404);
    }

    return successResponse(res, company);
  } catch (error) {
    return errorResponse(res, 'Failed to fetch company', 500, error);
  }
};

export const createCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { name, industry, website, contactPerson, contactEmail, contactPhone, address } = req.body;

    const company = await prisma.company.create({
      data: {
        name,
        industry,
        website,
        contactPerson,
        contactEmail,
        contactPhone,
        address,
      },
    });

    return successResponse(res, company, 'Company created successfully', 201);
  } catch (error) {
    return errorResponse(res, 'Failed to create company', 500, error);
  }
};

export const updateCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;
    const { name, industry, website, contactPerson, contactEmail, contactPhone, address, isActive } = req.body;

    const company = await prisma.company.update({
      where: { id },
      data: {
        name,
        industry,
        website,
        contactPerson,
        contactEmail,
        contactPhone,
        address,
        isActive,
      },
    });

    return successResponse(res, company, 'Company updated successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to update company', 500, error);
  }
};

export const deleteCompany = async (req: AuthRequest, res: Response): Promise<Response> => {
  try {
    const { id } = req.params;

    const company = await prisma.company.findUnique({
      where: { id },
      include: {
        _count: {
          select: { placements: true },
        },
      },
    });

    if (!company) {
      return errorResponse(res, 'Company not found', 404);
    }

    if (company._count.placements > 0) {
      return errorResponse(res, 'Cannot delete company with associated placements', 400);
    }

    await prisma.company.delete({ where: { id } });

    return successResponse(res, null, 'Company deleted successfully');
  } catch (error) {
    return errorResponse(res, 'Failed to delete company', 500, error);
  }
};
