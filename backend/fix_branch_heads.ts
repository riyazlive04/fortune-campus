
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Fixing Branch Heads ---');

    const branchHeads = await prisma.user.findMany({
        where: { role: 'BRANCH_HEAD' },
        include: { branch: true }
    });

    const branches = await prisma.branch.findMany();

    for (const user of branchHeads) {
        if (user.branchId) {
            console.log(`User ${user.firstName} ${user.lastName} is already linked to ${user.branch?.name}`);
            continue;
        }

        console.log(`User ${user.firstName} ${user.lastName} (${user.email}) has NO branch.`);

        // Try to match by name
        const match = branches.find(b =>
            user.firstName.includes(b.name) ||
            user.lastName.includes(b.name) ||
            user.email.includes(b.name.toLowerCase())
        );

        if (match) {
            console.log(`  -> Linking to branch: ${match.name} (${match.code})`);
            await prisma.user.update({
                where: { id: user.id },
                data: { branchId: match.id }
            });
            console.log('  -> FIXED.');
        } else {
            console.log('  -> Could not find matching branch.');
        }
    }
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect());
