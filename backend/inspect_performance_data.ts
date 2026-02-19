import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Inspecting Trainer Data ---');
    const trainers = await prisma.trainer.findMany({
        include: {
            user: {
                select: {
                    firstName: true,
                    lastName: true,
                    email: true
                }
            }
        }
    });
    console.log(`Found ${trainers.length} trainers:`);
    trainers.forEach(t => {
        console.log(`- ID: ${t.id}, Name: ${t.user.firstName} ${t.user.lastName}, Active: ${t.isActive}`);
    });

    console.log('\n--- Inspecting Growth Reports ---');
    const allReports = await prisma.studentGrowthReport.findMany();
    console.log(`Found ${allReports.length} total growth reports in the system.`);

    if (allReports.length > 0) {
        console.log('Sample report dates:');
        allReports.slice(0, 5).forEach(r => {
            console.log(`- Date: ${r.reportDate.toISOString()}, TrainerID: ${r.trainerId}`);
        });
    }

    const now = new Date();
    console.log(`\nCurrent Date: ${now.toISOString()}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
