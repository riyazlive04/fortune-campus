
import { prisma } from './src/config/database';
import * as fs from 'fs';

async function inspect() {
    const users = await prisma.user.findMany({
        include: {
            trainerProfile: true,
            studentProfile: true,
        },
    });

    const students = await prisma.student.findMany({
        include: { user: true }
    });

    const trainers = await prisma.trainer.findMany({
        include: { user: true }
    });

    const result = {
        users: users.map(u => ({
            name: `${u.firstName} ${u.lastName}`,
            role: u.role,
            hasTrainerProfile: !!u.trainerProfile,
            hasStudentProfile: !!u.studentProfile
        })),
        totalStudents: students.length,
        totalTrainers: trainers.length,
        studentDetails: students.map(s => ({ id: s.id, enrollment: s.enrollmentNumber, name: `${s.user.firstName} ${s.user.lastName}` })),
        trainerDetails: trainers.map(t => ({ id: t.id, employeeId: t.employeeId, name: `${t.user.firstName} ${t.user.lastName}` }))
    };

    fs.writeFileSync('inspect_result.json', JSON.stringify(result, null, 2));
    console.log('Results written to inspect_result.json');
}

inspect().catch(console.error);
