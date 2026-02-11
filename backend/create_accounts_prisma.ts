import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const branchAccounts = [
    { email: 'cbe.fortuneinnovatives@gmail.com', branchName: 'Coimbatore' },
    { email: 'trichy.fortuneinnovatives@gmail.com', branchName: 'Trichy' },
    { email: 'salem.fortuneinnovatives@gmail.com', branchName: 'Salem' },
    { email: 'erode.fortuneinnovatives@gmail.com', branchName: 'Erode' }
];

const PASSWORD = 'Branch@123';

async function main() {
    try {
        console.log('Fetching branches...');
        let allBranches = await prisma.branch.findMany();

        const branchData = [
            { name: 'Coimbatore', code: 'FC-CBE' },
            { name: 'Trichy', code: 'FC-TRY' },
            { name: 'Salem', code: 'FC-SLM' },
            { name: 'Erode', code: 'FC-ERD' }
        ];

        // Ensure branches exist
        for (const bData of branchData) {
            let branch = allBranches.find(b => b.name.toLowerCase().includes(bData.name.toLowerCase()));
            if (!branch) {
                console.log(`Creating missing branch: ${bData.name}`);
                branch = await prisma.branch.create({
                    data: {
                        name: bData.name,
                        code: bData.code,
                        isActive: true
                    }
                });
                allBranches.push(branch);
            }
        }

        const hashedPassword = await bcrypt.hash(PASSWORD, 10);

        for (const account of branchAccounts) {
            console.log(`\nProcessing ${account.email} for ${account.branchName}...`);

            const branch = allBranches.find(b =>
                b.name.toLowerCase().includes(account.branchName.toLowerCase()) ||
                account.branchName.toLowerCase().includes(b.name.toLowerCase())
            );

            if (!branch) {
                console.warn(`❌ No branch found for ${account.branchName}`);
                continue;
            }

            console.log(`✅ Matched with branch: ${branch.name} (ID: ${branch.id})`);

            const user = await prisma.user.upsert({
                where: { email: account.email },
                update: {
                    password: hashedPassword,
                    role: 'BRANCH_HEAD',
                    branchId: branch.id,
                    isActive: true,
                    firstName: branch.name,
                    lastName: 'Branch Head'
                },
                create: {
                    email: account.email,
                    password: hashedPassword,
                    role: 'BRANCH_HEAD',
                    branchId: branch.id,
                    firstName: branch.name,
                    lastName: 'Branch Head',
                    isActive: true
                }
            });

            console.log(`Successfully created/updated account for ${user.email}`);
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
