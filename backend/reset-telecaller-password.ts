import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    const email = 'telecaller1@fortune.com';
    let user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        console.log(`Found user ${user.email}, resetting password...`);
        const hashedPassword = await bcrypt.hash('password123', 10);
        await prisma.user.update({
            where: { email },
            data: { password: hashedPassword }
        });
        console.log("Password reset successfully to 'password123'.");
    } else {
        console.log("User not found!");
    }
}
main().catch(console.error).finally(() => prisma.$disconnect());
