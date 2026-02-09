
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const branches = [
        { name: 'Salem', code: 'SLM' },
        { name: 'Coimbatore', code: 'CBE' },
        { name: 'Trichy', code: 'TRY' },
        { name: 'Erode', code: 'ERD' },
    ];

    console.log('Seeding branches...');

    for (const branch of branches) {
        const existing = await prisma.branch.findUnique({
            where: { code: branch.code }
        });

        if (!existing) {
            await prisma.branch.create({
                data: {
                    name: branch.name,
                    code: branch.code,
                    isActive: true
                }
            });
            console.log(`✅ Created branch: ${branch.name}`);
        } else {
            console.log(`ℹ️ Branch already exists: ${branch.name}`);
        }
    }

    console.log('Seeding completed.');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
