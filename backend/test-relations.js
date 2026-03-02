const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function addTestTelecaller() {
    try {
        const branches = await prisma.branch.findMany({ take: 2 });
        if (branches.length < 2) {
            console.log('Need at least 2 branches to test multi-branch assignment');
            return;
        }

        const testT = await prisma.user.create({
            data: {
                email: 'multiteam@fortune.com',
                password: 'hash', // fake
                firstName: 'MultiBranch',
                lastName: 'Telecaller',
                role: 'TELECALLER',
                assignedBranches: {
                    connect: branches.map(b => ({ id: b.id }))
                }
            },
            include: {
                assignedBranches: true
            }
        });

        console.log('Created Telecaller with multiple branches:', testT.email);
        console.log('Assigned Branches:', testT.assignedBranches.map(b => b.name));

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await prisma.$disconnect();
    }
}

addTestTelecaller();
