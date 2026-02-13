import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';

const prisma = new PrismaClient();

async function testFetch(trainerEmail: string) {
    const user = await prisma.user.findUnique({
        where: { email: trainerEmail },
        select: { id: true, email: true, role: true, branchId: true }
    });

    if (!user) return { email: trainerEmail, error: 'User not found' };

    const where: any = {};
    if (user.role !== 'CEO') {
        where.branchId = user.branchId;
    }

    const [students, total] = await Promise.all([
        prisma.student.findMany({
            where,
            include: {
                user: { select: { id: true, email: true, firstName: true } }
            }
        }),
        prisma.student.count({ where }),
    ]);

    return {
        email: trainerEmail,
        role: user.role,
        branchId: user.branchId,
        studentsFound: total,
        students: students.map(s => ({
            name: s.user.firstName,
            email: s.user.email,
            branchId: s.branchId
        }))
    };
}

async function main() {
    const results = [
        await testFetch('trainer1_salem@gmail.com'),
        await testFetch('trainer2_cbe@gmail.com'),
        await testFetch('trainer3_erode@gmail.com'),
        await testFetch('trainer4_tiruppur@gmail.com'),
    ];
    fs.writeFileSync('fetch-debug.json', JSON.stringify(results, null, 2));
    await prisma.$disconnect();
}

main();
