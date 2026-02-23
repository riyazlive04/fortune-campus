const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    const courses = await prisma.course.findMany({ select: { id: true, name: true, branchId: true } });
    console.log("Courses:", JSON.stringify(courses, null, 2));
    process.exit(0);
}
check();
