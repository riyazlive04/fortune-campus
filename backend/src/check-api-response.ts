
// Note: This script runs in the backend context but tries to simulate an API call
// Since I don't have the token, I'll simulate the response object the controller sends.

async function checkResponse() {
    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const salemId = '1e736840-e93c-4259-8fd7-c24c28b14413';
    const leads = await prisma.lead.findMany({
        where: { branchId: salemId },
        include: {
            branch: { select: { id: true, name: true, code: true } },
            createdBy: { select: { id: true, firstName: true } }
        }
    });

    const responseBody = {
        success: true,
        data: {
            leads: leads,
            total: leads.length,
            page: 1,
            totalPages: 1
        }
    };

    console.log('--- API Response Simulation ---');
    console.log('Success:', responseBody.success);
    console.log('Leads count:', responseBody.data.leads.length);
    if (responseBody.data.leads.length > 0) {
        console.log('Sample Lead Status:', responseBody.data.leads[0].status);
        console.log('Sample Lead Branch:', responseBody.data.leads[0].branchId);
    }

    await prisma.$disconnect();
}

checkResponse();
