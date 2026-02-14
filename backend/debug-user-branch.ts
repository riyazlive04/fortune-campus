
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkUser() {
    try {
        const user = await prisma.user.findFirst({
            where: {
                role: 'CHANNEL_PARTNER'
            },
            include: {
                branch: true
            }
        });

        console.log('User found:', user);

        if (user) {
            console.log('Branch ID:', user.branchId);
            if (!user.branchId) {
                console.log('WARNING: User has no branch ID!');

                // Let's try to assign a branch if one exists
                const branch = await prisma.branch.findFirst();
                if (branch) {
                    console.log(`Assigning branch ${branch.name} (${branch.id}) to user...`);
                    await prisma.user.update({
                        where: { id: user.id },
                        data: { branchId: branch.id }
                    });
                    console.log('User updated with branch ID.');
                } else {
                    console.log('No branches found to assign!');
                }
            }
        } else {
            console.log('No Channel Partner found.');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkUser();
