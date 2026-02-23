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
    console.log(JSON.stringify(courses, null, 2));
    process.exit(0);
}
check();
