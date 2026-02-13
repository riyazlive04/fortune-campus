import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function testFetch(trainerEmail: string) {
    try {
        console.log(`\n--- Testing fetch for ${trainerEmail} ---`);
        const user = await prisma.user.findUnique({
            where: { email: trainerEmail },
            select: { id: true, email: true, role: true, branchId: true }
        });

        if (!user) {
            console.log(`User ${trainerEmail} not found!`);
            return;
        }

        console.log(`User Found: Role=${user.role}, BranchId=${user.branchId}`);

        const where: any = {};
        if (user.role !== 'CEO') {
            where.branchId = user.branchId;
        }

        console.log('Query Where:', JSON.stringify(where));

        const [students, total] = await Promise.all([
            prisma.student.findMany({
                where,
                include: {
                    user: {
                        select: { id: true, email: true, firstName: true }
                    }
                }
            }),
            prisma.student.count({ where }),
        ]);

        console.log(`Total Students Found: ${total}`);
        students.forEach(s => {
            console.log(`- ${s.user.firstName} (${s.user.email}) BranchId: ${s.branchId}`);
        });

    } catch (error) {
        console.error('Error during test fetch:', error);
    }
}

async function main() {
    await testFetch('trainer1_salem@gmail.com');
    await testFetch('trainer2_cbe@gmail.com');
    await testFetch('trainer3_erode@gmail.com');
    await testFetch('trainer4_tiruppur@gmail.com');
    await prisma.$disconnect();
}

main();
