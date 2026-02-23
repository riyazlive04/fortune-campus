import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    let telecaller = await prisma.user.findFirst({
        where: { role: 'TELECALLER' as any }
    });

    if (!telecaller) {
        console.log("No TELECALLER found. Creating one...");
        const branch = await prisma.branch.findFirst();
        if (!branch) {
            console.log("No branch found to assign to new telecaller.");
            return;
        }
        const hashedPassword = await bcrypt.hash('password123', 10);
        telecaller = await prisma.user.create({
            data: {
                email: 'telecaller1@fortune.com',
                password: hashedPassword,
                firstName: 'Test',
                lastName: 'Telecaller',
                role: 'TELECALLER' as any,
                branchId: branch.id
            }
        });
        console.log("Created new telecaller.");
    }

    console.log("--- Telecaller Credentials ---");
    console.log(`Email: ${telecaller.email}`);
    console.log(`Password: password123 (Assuming default if seeded by script, otherwise you might need to reset it)`);
    console.log(`Role: ${telecaller.role}`);
    console.log("------------------------------");
}

main().catch(console.error).finally(() => prisma.$disconnect());
