
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const users = await prisma.user.findMany({
        select: { email: true, role: true, firstName: true }
    });
    console.log('--- ALL USERS ---');
    users.forEach(u => {
        console.log(`${u.email} | ${u.role} | ${u.firstName}`);
    });
    console.log('-----------------');
    await prisma.$disconnect();
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
