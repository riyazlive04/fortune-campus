import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const students = await prisma.student.findMany();
    for (const s of students) {
        if (!s.courseId) continue;

        // Check if attendance already exists for Feb 23
        const exists = await prisma.attendance.findFirst({
            where: { studentId: s.id, date: new Date('2026-02-23T10:00:00.000Z') }
        });

        if (!exists) {
            await prisma.attendance.create({
                data: {
                    studentId: s.id,
                    courseId: s.courseId,
                    date: new Date('2026-02-23T10:00:00.000Z'),
                    status: 'PRESENT',
                    period: 1,
                    isVerified: true
                }
            });
        }
    }
    console.log('Marked present for ' + students.length + ' students for 23 Feb 2026.');
}

main().finally(() => prisma.$disconnect());
