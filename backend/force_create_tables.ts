import { prisma } from './src/config/database';

async function forceCreateTables() {
    try {
        console.log('Force creating missing tables...');

        // Create follow_ups table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "follow_ups" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "telecallerId" TEXT NOT NULL,
        "scheduledDate" TIMESTAMP(3) NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "type" TEXT,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,

        CONSTRAINT "follow_ups_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log('Table follow_ups created or already exists.');

        // Add foreign keys and indexes for follow_ups
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "follow_ups_leadId_idx" ON "follow_ups"("leadId");').catch(() => { });
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "follow_ups_telecallerId_idx" ON "follow_ups"("telecallerId");').catch(() => { });
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "follow_ups_scheduledDate_idx" ON "follow_ups"("scheduledDate");').catch(() => { });
        await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS "follow_ups_status_idx" ON "follow_ups"("status");').catch(() => { });

        // Create call_logs table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "call_logs" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "telecallerId" TEXT NOT NULL,
        "callDate" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "callStatus" TEXT NOT NULL,
        "notes" TEXT,
        "nextFollowUpDate" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "call_logs_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log('Table call_logs created or already exists.');

        // Create lead_status_history table
        await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "lead_status_history" (
        "id" TEXT NOT NULL,
        "leadId" TEXT NOT NULL,
        "oldStatus" TEXT,
        "newStatus" TEXT NOT NULL,
        "changedById" TEXT NOT NULL,
        "notes" TEXT,
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

        CONSTRAINT "lead_status_history_pkey" PRIMARY KEY ("id")
      );
    `);
        console.log('Table lead_status_history created or already exists.');

        console.log('All tables created successfully!');
    } catch (error: any) {
        console.error('Failed to create tables:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

forceCreateTables();
