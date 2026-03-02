const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const ceos = await prisma.user.findMany({
        where: { role: 'CEO' },
        select: { email: true }
    });
    console.log('CEOS:', JSON.stringify(ceos));
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
