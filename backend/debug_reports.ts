
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log("Finding trainers...");
        const trainers = await prisma.trainer.findMany({
            include: { user: true }
        });
        console.log(`Found ${trainers.length} trainers.`);

        for (const trainer of trainers) {
            const userName = trainer.user ? `${trainer.user.firstName} ${trainer.user.lastName}` : "Unknown User";
            const userEmail = trainer.user ? trainer.user.email : "No Email";

            console.log(`\nTrainer ID: ${trainer.id}`);
            console.log(`User: ${userName} (${userEmail})`);
            console.log(`Branch ID: ${trainer.branchId}`);

            if (trainer.branchId) {
                try {
                    const reports = await (prisma as any).branchReport.findMany({
                        where: { branchId: trainer.branchId }
                    });
                    console.log(`Reports for branch ${trainer.branchId}: ${reports.length}`);
                    reports.forEach((r: any) => console.log(` - ${r.title}`));
                } catch (err: any) {
                    console.log(`Error fetching reports for branch: ${err.message}`);
                }
            } else {
                console.log("No branch ID assigned.");
            }
        }

        console.log("\n--- check all reports ---");
        try {
            const allReports = await (prisma as any).branchReport.findMany();
            console.log(`Total reports in DB: ${allReports.length}`);
            allReports.forEach((r: any) => console.log(`Report [${r.title}] BranchID: ${r.branchId}`));
        } catch (e: any) {
            console.log("Error fetching all reports:", e.message);
        }

    } catch (e) {
        console.error("Main error:", e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
