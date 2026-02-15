
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Creating branch_reports table manually...");

        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "branch_reports" (
        "id" TEXT NOT NULL,
        "title" TEXT NOT NULL,
        "description" TEXT,
        "fileUrl" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "branchId" TEXT NOT NULL,
        "uploadedById" TEXT NOT NULL,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
    
        CONSTRAINT "branch_reports_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log("Table created.");

        // Add foreign keys if they don't exist (this is trickier in raw sql to check existence, 
        // but try/catch might work if they already exist)

        try {
            await prisma.$executeRawUnsafe(`
          ALTER TABLE "branch_reports" ADD CONSTRAINT "branch_reports_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches"("id") ON DELETE CASCADE ON UPDATE CASCADE;
        `);
            console.log("FK branchId created.");
        } catch (e: any) {
            console.log("FK branchId might already exist or error: " + e.message);
        }

        try {
            await prisma.$executeRawUnsafe(`
          ALTER TABLE "branch_reports" ADD CONSTRAINT "branch_reports_uploadedById_fkey" FOREIGN KEY ("uploadedById") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
        `);
            console.log("FK uploadedById created.");
        } catch (e: any) {
            console.log("FK uploadedById might already exist or error: " + e.message);
        }

        console.log("Manual migration complete.");

    } catch (e) {
        console.error("Main error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
