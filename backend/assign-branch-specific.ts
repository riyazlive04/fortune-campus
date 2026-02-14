
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function assignBranch() {
    try {
        const email = 'pranesh_salem@fortunecampus.com';

        // Find a branch to assign
        const branch = await prisma.branch.findFirst();
        if (!branch) {
            console.log('No branches found!');
            return;
        }

        console.log(`Assigning branch ${branch.name} (${branch.id}) to ${email}...`);

        const user = await prisma.user.update({
            where: { email },
            data: { branchId: branch.id },
            include: { branch: true }
        });

        console.log('User Updated:', user.email);
        console.log('New Branch ID:', user.branchId);

    } catch (error) {
        console.error('Error assigning branch:', error);
    } finally {
        await prisma.$disconnect();
    }
}

assignBranch();
