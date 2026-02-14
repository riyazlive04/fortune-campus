
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findUser() {
    try {
        const user = await prisma.user.findFirst({
            where: { role: 'CHANNEL_PARTNER' }
        });
        if (user) {
            console.log('User Email:', user.email);
            console.log('User Role:', user.role);
        } else {
            console.log('No Channel Partner found.');
        }
    } catch (error) {
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

findUser();
