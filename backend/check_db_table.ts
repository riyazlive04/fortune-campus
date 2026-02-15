
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Checking BranchReport table...");
        try {
            const count = await (prisma as any).branchReport.count();
            console.log(`BranchReport table exists. Row count: ${count}`);

            const reports = await (prisma as any).branchReport.findMany();
            console.log("Reports:", reports);
        } catch (e: any) {
            console.error("Error querying BranchReport:", e.message);
        }
    } catch (e) {
        console.error("Main error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
