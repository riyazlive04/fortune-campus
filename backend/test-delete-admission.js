const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function testDelete() {
    try {
        const records = await prisma.admission.findMany({ take: 1 });
        if (records.length === 0) {
            console.log("No admissions found to delete test");
            return;
        }
        const id = records[0].id;
        console.log("Attempting to delete admission ID:", id);
        await prisma.admission.delete({ where: { id } });
        console.log("Success");
    } catch (err) {
        console.error("Prisma Error Details:");
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

testDelete();
