const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const res = await prisma.admission.findMany({ take: 1 });
        console.log("Success:", res);
    } catch (err) {
        console.error("Prisma Error Details:");
        console.error(err);
    } finally {
        await prisma.$disconnect();
    }
}

test();
