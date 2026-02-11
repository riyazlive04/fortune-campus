import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    try {
        const emails = [
            'cbe.fortuneinnovatives@gmail.com',
            'trichy.fortuneinnovatives@gmail.com',
            'salem.fortuneinnovatives@gmail.com',
            'erode.fortuneinnovatives@gmail.com'
        ];

        const users = await prisma.user.findMany({
            where: { email: { in: emails } },
            include: { branch: true }
        });

        console.log(`\nFound ${users.length} users out of ${emails.length} requested.`);

        for (const u of users) {
            const match = await bcrypt.compare('Branch@123', u.password);
            console.log(`User: ${u.email} | Branch: ${u.branch?.name} | Active: ${u.isActive} | PW Match: ${match}`);
        }

    } catch (error) {
        console.error('Verification error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

main();
