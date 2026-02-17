
import { prisma } from './src/config/database';
import * as fs from 'fs';

async function inspect() {
    console.log('Querying Users...');
    const users = await prisma.user.findMany({
        include: {
            studentProfile: true,
            trainerProfile: true
        }
    });

    console.log('Querying Students...');
    const students = await prisma.student.findMany({
        include: { user: true }
    });

    console.log('Querying Trainers...');
    const trainers = await prisma.trainer.findMany({
        include: { user: true }
    });

    console.log('Querying Admissions...');
    const admissions = await prisma.admission.findMany();

    const result = {
        counts: {
            users: users.length,
            students: students.length,
            trainers: trainers.length,
            admissions: admissions.length
        },
        students: users.filter(u => u.role === 'STUDENT').map(u => ({
            email: u.email,
            hasProfile: !!u.studentProfile
        })),
        trainers: users.filter(u => u.role === 'TRAINER').map(u => ({
            email: u.email,
            hasProfile: !!u.trainerProfile
        }))
    };

    fs.writeFileSync('inspect_direct.json', JSON.stringify(result, null, 2));
    console.log('Results written to inspect_direct.json');
}

inspect().catch(console.error).finally(() => prisma.$disconnect());
