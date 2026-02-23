const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function fix() {
    const courses = await prisma.course.findMany({ select: { id: true } });
    const students = await prisma.student.findMany({ select: { id: true, admissionId: true } });
    const trainers = await prisma.trainer.findMany({ select: { id: true } });

    if (courses.length === 0) return process.exit(0);

    // Distribute students
    for (let i = 0; i < students.length; i++) {
        const course = courses[i % courses.length];

        // Update student
        await prisma.student.update({
            where: { id: students[i].id },
            data: { courseId: course.id }
        });

        // Update their admission record to match
        await prisma.admission.update({
            where: { id: students[i].admissionId },
            data: { courseId: course.id }
        });
    }

    // Distribute trainers (Clear existing first, then assign 1 to each course)
    await prisma.courseTrainer.deleteMany({});

    for (let i = 0; i < trainers.length; i++) {
        const course = courses[i % courses.length];
        await prisma.courseTrainer.create({
            data: {
                courseId: course.id,
                trainerId: trainers[i].id
            }
        });
    }

    console.log("Database associations successfully redistributed.");
    process.exit(0);
}
fix();
