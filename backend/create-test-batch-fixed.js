
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // Find the trainer (assuming Trainer 1 is the one logged in)
        // We know from debug-final.js that trainers exist. Let's find one.
        const trainers = await prisma.trainer.findMany({
            include: { user: true, branch: true }
        });

        const trainer = trainers.find(t => t.user.firstName === 'Trainer' && t.user.lastName === '1') || trainers[0];

        if (!trainer) {
            console.log('No trainer found.');
            return;
        }

        console.log(`Using Trainer: ${trainer.user.firstName} ${trainer.user.lastName} (${trainer.id})`);
        console.log(`Branch: ${trainer.branch.name} (${trainer.branchId})`);

        const branchId = trainer.branchId;
        const trainerId = trainer.id;

        // Find a course to link to
        const course = await prisma.course.findFirst();
        if (!course) {
            // Create a dummy course if none exists
            console.log('No course found. Creating dummy course...');
            const newCourse = await prisma.course.create({
                data: {
                    name: 'Full Stack Development',
                    code: 'FS-DEV-001',
                    duration: 6,
                    fees: 50000,
                    branchId: branchId
                }
            });
            console.log('Created course:', newCourse);
            return main(); // Recursively call main to use the new course
        }

        // Create a batch for this trainer and branch
        const batch = await prisma.batch.create({
            data: {
                name: 'Test Batch 1',
                code: 'BATCH-TEST-' + Date.now(), // Unique code to avoid conflicts
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
