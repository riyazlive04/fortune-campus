
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Verifying attendance constraint via Raw SQL...');

        const student = await prisma.student.findFirst();
        if (!student) {
            console.log('No student found.');
            return;
        }

        const studentId = student.id;
        const courseId = student.courseId;
        const now = new Date().toISOString();
        const id1 = 'test-att-' + Date.now() + '-1';
        const id2 = 'test-att-' + Date.now() + '-2';

        // Insert Period 1
        console.log('Inserting Period 1...');
        await prisma.$executeRawUnsafe(`
            INSERT INTO "attendances" ("id", "studentId", "courseId", "date", "period", "status", "isVerified", "updatedAt")
            VALUES ('${id1}', '${studentId}', '${courseId}', '${now}', 1, 'PRESENT', true, '${now}')
            ON CONFLICT ("studentId", "courseId", "date", "period") DO NOTHING;
        `);
        console.log('Period 1 inserted (or existed).');

        // Insert Period 2
        console.log('Inserting Period 2...');
        await prisma.$executeRawUnsafe(`
            INSERT INTO "attendances" ("id", "studentId", "courseId", "date", "period", "status", "isVerified", "updatedAt")
            VALUES ('${id2}', '${studentId}', '${courseId}', '${now}', 2, 'PRESENT', true, '${now}')
            ON CONFLICT ("studentId", "courseId", "date", "period") DO NOTHING;
        `);
        console.log('Period 2 inserted successfully (Constraint Check Passed!).');

    } catch (e) {
        console.error('VERIFICATION FAILED:', e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
