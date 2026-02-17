
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Searching for users named Vimal...');

    const users = await prisma.user.findMany({
        where: {
            OR: [
                { firstName: { contains: 'Vimal', mode: 'insensitive' } },
                { lastName: { contains: 'Vimal', mode: 'insensitive' } },
                { email: { contains: 'vimal', mode: 'insensitive' } }
            ]
        },
        include: { branch: true }
    });


    const output = users.map(u =>
        `ID: ${u.id}\nName: ${u.firstName} ${u.lastName}\nEmail: ${u.email}\nRole: ${u.role}\nBranch: ${u.branch ? `${u.branch.name} (${u.branch.code})` : 'None'}`
    ).join('\n---\n');

    const fs = require('fs');
    fs.writeFileSync('vimal_output.txt', `Found ${users.length} users:\n${output}`);
    console.log('Output written to vimal_output.txt');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
