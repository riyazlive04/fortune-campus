
import { prisma } from './src/config/database';

async function migrate() {
    try {
        console.log('Creating table...');
        // Create table
        await prisma.$executeRawUnsafe(`
            CREATE TABLE IF NOT EXISTS "student_batches" (
                "id" TEXT NOT NULL,
                "studentId" TEXT NOT NULL,
                "batchId" TEXT NOT NULL,
                "enrolledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
                "isActive" BOOLEAN NOT NULL DEFAULT true,
                CONSTRAINT "student_batches_pkey" PRIMARY KEY ("id")
            );
        `);

        console.log('Creating unique index...');
        try {
            await prisma.$executeRawUnsafe(`
                CREATE UNIQUE INDEX "student_batches_studentId_batchId_key" ON "student_batches"("studentId", "batchId");
            `);
        } catch (e) {
            console.log('Index might already exist, skipping...');
        }

        console.log('Inserting Student 1 enrollment (UI/UX)...');
        // Student 1 ID from previously verified data
        const studentId = '80628706-b7bd-4643-80e8-db675dcaf88c';
        const batch1Id = '85b2c172-0385-4820-a1da-0133c547f273'; // UI/UX
        const batch2Id = '01dcf958-6f9f-4bf5-bf65-ed3ca2940d95'; // Video Editing

        await prisma.$executeRawUnsafe(`
            INSERT INTO "student_batches" (id, "studentId", "batchId") 
            VALUES ($1, $2, $3) 
            ON CONFLICT DO NOTHING
        `, 'enroll-1', studentId, batch1Id);

        console.log('Inserting Student 1 enrollment (Video Editing)...');
        await prisma.$executeRawUnsafe(`
            INSERT INTO "student_batches" (id, "studentId", "batchId") 
            VALUES ($1, $2, $3) 
            ON CONFLICT DO NOTHING
        `, 'enroll-2', studentId, batch2Id);

        console.log('Migration and data recovery complete.');
    } catch (err) {
        console.error('MIGRATION_ERROR:', err);
    } finally {
        await prisma.$disconnect();
    }
}

migrate();

