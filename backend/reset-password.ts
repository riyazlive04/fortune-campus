
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function resetPassword() {
    try {
        const email = 'pranesh_salem@fortunecampus.com';
        const newPassword = 'password123';
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        const user = await prisma.user.update({
            where: { email },
            data: { password: hashedPassword },
            include: { branch: true }
        });

        console.log('Password reset successful for:', user.email);
        console.log('Current Branch ID:', user.branchId);
        console.log('Branch Name:', user.branch?.name);

    } catch (error) {
        console.error('Error resetting password:', error);
    } finally {
        await prisma.$disconnect();
    }
}

resetPassword();
