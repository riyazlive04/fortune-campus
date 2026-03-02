const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testUpdate() {
    const telecallers = await prisma.user.findMany({ where: { role: 'TELECALLER' }, take: 1 });
    if (telecallers.length === 0) {
        console.log('No telecaller found');
        return prisma.$disconnect();
    }
    const user = telecallers[0];
    console.log('Updating telecaller:', user.id, user.email);

    const branches = await prisma.branch.findMany({ take: 2 });
    const assignedBranchIds = branches.map(b => b.id);
    console.log('Assigning branches:', assignedBranchIds);

    try {
        const res = await prisma.user.update({
            where: { id: user.id },
            data: {
                assignedBranches: {
                    set: [],
                    connect: assignedBranchIds.map(id => ({ id }))
                }
            }
        });
        console.log('Update success!', res.id);
    } catch (err) {
        console.error('Update failed:', err);
    } finally {
        await prisma.$disconnect();
    }
}
testUpdate();
