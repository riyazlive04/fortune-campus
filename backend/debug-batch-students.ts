
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    try {
        // 1. Get the batch 'Test Batch 1'
        const batch = await prisma.batch.findFirst({
            where: { name: 'Test Batch 1' }
        });

        if (!batch) {
            console.log('Batch not found');
            return;
        }

        console.log(`Testing fetch for Batch ID: ${batch.id}`);

        // 2. Run the query from the controller
        const students = await prisma.student.findMany({
            where: { batchId: batch.id, isActive: true },
            include: {
                user: { select: { firstName: true, lastName: true, email: true } },
                // Include today's attendance if exists
                attendances: {
                    where: {
                        date: {
                            gte: new Date(new Date().setHours(0, 0, 0, 0)),
                            lt: new Date(new Date().setHours(23, 59, 59, 999))
                        }
                    },
                    take: 1
                },
                admission: {
                    select: {
                        feeAmount: true,
                        feeBalance: true
                    }
                }
            }
        });

        console.log(`Successfully fetched ${students.length} students.`);
        console.log(JSON.stringify(students, null, 2));

    } catch (e) {
        console.error('ERROR OCCURRED:');
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}
main();
