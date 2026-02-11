
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Fetching branches...');
        const branches = await prisma.branch.findMany();
        console.log('Branches:', branches);

        if (branches.length === 0) {
            console.error('No branches found!');
            return;
        }

        const branchId = branches[0].id;
        console.log('Using Branch ID:', branchId);

        console.log('Fetching existing courses...');
        const courses = await prisma.course.findMany();
        console.log('Courses:', courses.map(c => ({ name: c.name, code: c.code })));

        console.log('Attempting to create course...');
        const newCourse = await prisma.course.create({
            data: {
                name: "Video Edit Test",
                code: "VE-TEST-001", // Using a likely unique code
                description: "Test Description",
                duration: 6,
                fees: 50000,
                branchId: branchId,
                syllabus: "Test Syllabus",
                prerequisites: "Test Pre-req"
            }
        });
        console.log('Course created successfully:', newCourse);

        // Clean up
        await prisma.course.delete({ where: { id: newCourse.id } });
        console.log('Cleaned up test course.');

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
