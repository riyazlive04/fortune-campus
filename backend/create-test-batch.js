
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        const trainer = await prisma.user.findFirst({
            where: { firstName: 'Trainer', lastName: '1' },
            include: { trainer: { include: { branch: true } } }
        });

        if (!trainer || !trainer.trainer) {
            console.log('Trainer 1 not found.');
            return;
        }

        const trainerId = trainer.trainer.id;
        const branchId = trainer.trainer.branchId;

        // Find a course to link to
        const course = await prisma.course.findFirst();
        if (!course) {
            console.log('No course found. Create a course first.');
            return;
        }

        // Create a batch for this trainer and branch
        const batch = await prisma.batch.create({
            data: {
                name: 'Test Batch 1',
                code: 'BATCH-TEST-001',
                branchId: branchId,
                courseId: course.id,
                trainerId: trainerId,
                startTime: '10:00 AM',
                endTime: '12:00 PM',
                isActive: true
            }
        });
        console.log('Created batch:', batch);

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
