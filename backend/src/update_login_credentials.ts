
import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS = [
    {
        email: 'pranesh_cbe@fortunecampus.com',
        firstName: 'Pranesh',
        lastName: 'CBE',
        branchCode: 'CBE',
        role: 'CHANNEL_PARTNER'
    },
    {
        email: 'vimal_erode@fortunecampus.com',
        firstName: 'Vimal',
        lastName: 'Erode',
        branchCode: 'ERD',
        role: 'CHANNEL_PARTNER'
    },
    {
        email: 'sanjay_salem@fortunecampus.com',
        firstName: 'Sanjay',
        lastName: 'Salem',
        branchCode: 'SLM',
        role: 'CHANNEL_PARTNER'
    },
    {
        email: 'vishnu_tiruppur@fortunecampus.com',
        firstName: 'Vishnu',
        lastName: 'Tiruppur',
        branchCode: 'TPR',
        role: 'CHANNEL_PARTNER'
    }
];

async function main() {
    console.log('Updating User Credentials...');
    const hashedPassword = await bcrypt.hash('Fortune@123', 10);

    for (const u of USERS) {
        // Find or create branch first to be safe (though they should exist)
        // We assume branches exist from previous steps, but let's find them to get ID.
        // If SLM doesn't exist, we must create it? It should exist.

        let branch = await prisma.branch.findUnique({ where: { code: u.branchCode } });

        if (!branch) {
            console.log(`Branch ${u.branchCode} not found, creating...`);
            branch = await prisma.branch.create({
                data: {
                    name: u.lastName + ' Branch', // Fallback name
                    code: u.branchCode,
                    isActive: true
                }
            });
        }

        console.log(`Upserting ${u.email} -> ${branch.name} (${branch.code})`);

        await prisma.user.upsert({
            where: { email: u.email },
            update: {
                password: hashedPassword,
                branchId: branch.id,
                role: u.role,
                isActive: true
            },
            create: {
                email: u.email,
                password: hashedPassword,
                firstName: u.firstName,
                lastName: u.lastName,
                role: u.role,
                branchId: branch.id,
                isActive: true,
                phone: '9999999999'
            }
        });
    }

    console.log('All users updated successfully.');
    console.log('Password for all users is: Fortune@123');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
