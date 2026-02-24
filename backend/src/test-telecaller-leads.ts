import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api'; // Assuming backend port is 5000

async function testApi() {
    console.log('--- Testing /leads API for Telecaller ---');

    // Note: I don't have a valid token here, so I'll just check the DB directly
    // to see if the leads are really there for the branch ID.
    // Wait, I already did that with salem-audit-v2.ts.

    // Let's do a more surgical check of the User table to ensure branchId is exactly correct
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const user = await prisma.user.findFirst({
        where: { firstName: 'Telecaller 2' },
        include: { branch: true }
    });

    console.log('User:', {
        id: user?.id,
        name: user?.firstName,
        branchId: user?.branchId,
        branchName: user?.branch?.name
    });

    const leads = await prisma.lead.findMany({
        where: { branchId: user?.branchId },
        select: { id: true, firstName: true, status: true }
    });

    console.log(`Leads in branch (${user?.branchId}):`, leads);

    await prisma.$disconnect();
}

testApi();
