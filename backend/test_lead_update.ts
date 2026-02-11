
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Testing Lead Update ---');

    // 1. Find a lead
    const lead = await prisma.lead.findFirst();
    if (!lead) {
        console.log('No lead found to test.');
        return;
    }
    console.log('Original Lead:', { id: lead.id, branchId: lead.branchId, interestedCourse: lead.interestedCourse });

    // 2. Find another branch
    const otherBranch = await prisma.branch.findFirst({
        where: { id: { not: lead.branchId } }
    });

    if (!otherBranch) {
        console.log('No other branch found to test transfer.');
    }

    const newCourse = "Test Course Updated " + Date.now();
    const newBranchId = otherBranch ? otherBranch.id : lead.branchId;

    // 3. Update the lead (simulating controller logic)
    const updatedLead = await prisma.lead.update({
        where: { id: lead.id },
        data: {
            interestedCourse: newCourse,
            branchId: newBranchId
        }
    });

    console.log('Updated Lead:', { id: updatedLead.id, branchId: updatedLead.branchId, interestedCourse: updatedLead.interestedCourse });

    if (updatedLead.interestedCourse === newCourse && updatedLead.branchId === newBranchId) {
        console.log('SUCCESS: Lead updated successfully.');
    } else {
        console.log('FAILURE: Lead did not update correctly.');
    }

    // Revert changes
    await prisma.lead.update({
        where: { id: lead.id },
        data: {
            interestedCourse: lead.interestedCourse,
            branchId: lead.branchId
        }
    });
    console.log('Reverted changes.');
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
