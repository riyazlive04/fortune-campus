
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Get a student
        const student = await prisma.student.findFirst({
            include: { user: true }
        });
        if (!student) {
            console.log('No student found');
            return;
        }

        console.log(`Testing attendance for: ${student.user.firstName}`);
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // 2. Mark Period 1
        console.log('Marking Period 1...');
        await prisma.attendance.upsert({
            where: {
                studentId_courseId_date_period: {
                    studentId: student.id,
                    courseId: student.courseId,
                    date: today,
                    period: 1
                }
            },
            update: { status: 'PRESENT' },
            create: {
                studentId: student.id,
                courseId: student.courseId,
                date: today,
                period: 1, // <--- Key
                status: 'PRESENT',
                isVerified: true
            }
        });
        console.log('Period 1 marked.');

        // 3. Mark Period 2
        console.log('Marking Period 2...');
        await prisma.attendance.upsert({
            where: {
                studentId_courseId_date_period: {
                    studentId: student.id,
                    courseId: student.courseId,
                    date: today,
                    period: 2
                }
            },
            update: { status: 'PRESENT' },
            create: {
                studentId: student.id,
                courseId: student.courseId,
                date: today,
                period: 2, // <--- Key
                status: 'PRESENT',
                isVerified: true
            }
        });
        console.log('Period 2 marked automatically (Success!).');

    } catch (e) {
        console.error('ERROR:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
