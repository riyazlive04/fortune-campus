const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const courses = await prisma.course.findMany({
        include: {
            _count: {
                select: {
                    students: true,
                    admissions: true
                }
            },
            trainers: true
        }
    });
    console.log("--- COURSES ---");
    console.log(JSON.stringify(courses, null, 2));

    const students = await prisma.student.findMany({
        where: { isActive: true },
        select: {
            id: true,
            courseId: true,
            user: { select: { firstName: true, lastName: true } },
            course: { select: { name: true, syllabus: true } }
        },
        take: 10
    });
    console.log("\n--- STUDENTS ---");
    console.log(JSON.stringify(students, null, 2));
    process.exit(0);
}
check();
