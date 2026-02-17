
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Fixing Vimal Branch Assignment...');

    // 1. Get Erode Branch
    const erodeBranch = await prisma.branch.findUnique({
        where: { code: 'ERD' }
    });

    if (!erodeBranch) {
        throw new Error('Erode branch not found!');
    }

    console.log(`Found Erode branch: ${erodeBranch.name} (${erodeBranch.id})`);

    // 2. Update the "Vimal Fortune" user (the one logged in)
    // ID from finding script: 94e9a968-b909-4df4-a30f-9f6150e13846
    // Or search by email: vimal_tiruppur@fortunecampus.com

    // We will update by ID to be precise
    const targetUserId = '94e9a968-b909-4df4-a30f-9f6150e13846';

    const updatedUser = await prisma.user.update({
        where: { id: targetUserId },
        data: {
            branchId: erodeBranch.id,
            // Optional: Update name or email if requested, but only branch was raised.
            // keeping other fields same.
        },
        include: { branch: true }
    });

    console.log(`✅ Updated user ${updatedUser.firstName} ${updatedUser.lastName}`);
    console.log(`Now assigned to: ${updatedUser.branch?.name} (${updatedUser.branch?.code})`);

    console.log('Fix completed.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
