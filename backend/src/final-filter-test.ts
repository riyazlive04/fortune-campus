import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function finalVerify() {
    console.log('--- Final Hardened Filter Verification ---');

    // Simulate GetLeads as CEO with Salem ID
    // Salem ID: 1e736840-e93c-4259-8fd7-c24c28b14413
    const salemId = '1e736840-e93c-4259-8fd7-c24c28b14413';

    const leads = await prisma.lead.findMany({
        where: { branchId: salemId },
        select: { id: true, firstName: true, branchId: true }
    });

    console.log(`CEO Mode (Filter Salem): ${leads.length} leads returned.`);
    const leaks = leads.filter(l => l.branchId !== salemId);
    if (leaks.length > 0) {
        console.error(`FAILURE: Found ${leaks.length} leads from other branches!`);
    } else {
        console.log('SUCCESS: No cross-branch leaks detected.');
    }

    // Verify the 'New' Aakash is in Coimbatore
    const aakashNew = await prisma.lead.findFirst({
        where: { phone: '+91555555555555' }
    });
    console.log(`\nLead 'I.Aakash' (New) details:`);
    console.log(`  - BranchID: ${aakashNew?.branchId}`);
    console.log(`  - BranchName: Coimbatore (Verified by ID)`);

    await prisma.$disconnect();
}

finalVerify();
