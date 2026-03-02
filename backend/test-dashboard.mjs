import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function test() {
    try {
        console.log('Testing branch _count query...');
        const branches = await prisma.branch.findMany({
            where: { isActive: true },
            include: {
                _count: { select: { leads: true, admissions: true, students: true, trainers: true } }
            }
        });
        console.log('Branch query OK:', JSON.stringify(branches.slice(0, 1)));
    } catch (e) {
        console.error('Branch query FAILED:', e.message);
    }

    try {
        console.log('\nTesting admission groupBy courseId...');
        const courseDistribution = await prisma.admission.groupBy({
            by: ['courseId'],
            _count: true,
        });
        console.log('groupBy OK:', courseDistribution);
    } catch (e) {
        console.error('groupBy FAILED:', e.message);
    }

    try {
        console.log('\nTesting admission.count...');
        const count = await prisma.admission.count();
        console.log('Count OK:', count);
    } catch (e) {
        console.error('Admission.count FAILED:', e.message);
    }

    try {
        console.log('\nTesting placement count...');
        const count = await prisma.placement.count();
        console.log('Placement count OK:', count);
    } catch (e) {
        console.error('Placement count FAILED:', e.message);
    }

    await prisma.$disconnect();
}

test().catch(console.error);
