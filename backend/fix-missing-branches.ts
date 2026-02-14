
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixMissingBranches() {
    try {
        // 1. Find all partners without a branch
        const partnersWithoutBranch = await prisma.user.findMany({
            where: {
                role: 'CHANNEL_PARTNER',
                branchId: null
            }
        });

        console.log(`Found ${partnersWithoutBranch.length} partners without Branch ID.`);

        if (partnersWithoutBranch.length === 0) {
            console.log("All Channel Partners have a branch. No action needed.");
            return;
        }

        // 2. Find a default branch to assign
        const defaultBranch = await prisma.branch.findFirst();
        if (!defaultBranch) {
            console.error("CRITICAL: No branches found in the database to assign!");
            return;
        }

        console.log(`Using default branch: ${defaultBranch.name} (${defaultBranch.id})`);

        // 3. Update all of them
        for (const partner of partnersWithoutBranch) {
            console.log(`Fixing user: ${partner.email} (${partner.id})...`);
            await prisma.user.update({
                where: { id: partner.id },
                data: { branchId: defaultBranch.id }
            });
            console.log(`✅ Assigned branch to ${partner.email}`);
        }

        console.log("Successfully fixed all missing branch IDs.");

    } catch (error) {
        console.error('Error executing fix:', error);
    } finally {
        await prisma.$disconnect();
    }
}

fixMissingBranches();
