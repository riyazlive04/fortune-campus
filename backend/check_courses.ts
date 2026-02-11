import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCourses() {
    try {
        const courses = await prisma.course.findMany();
        console.log('Courses in DB:', JSON.stringify(courses, null, 2));
    } catch (error) {
        console.error('Error fetching courses:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCourses();
