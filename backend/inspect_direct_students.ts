
import { prisma } from './src/config/database';
import * as fs from 'fs';

async function inspect() {
    console.log('Querying User table...');
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            studentProfile: true,
        },
    });

    console.log('Querying Student table...');
    const students = await prisma.student.findMany({
        include: {
            user: true
        }
    });

    console.log('Querying Admission table...');
    const admissions = await prisma.admission.findMany();

    const result = {
        usersCount: users.length,
        studentsCount: students.length,
        admissionsCount: admissions.length,
        usersWithProfile: users.map(u => ({
            email: u.email,
            hasProfile: !!u.studentProfile,
            profileId: u.studentProfile?.id
        })),
        students: students.map(s => ({
            id: s.id,
            userId: s.userId,
            email: s.user?.email,
            enrollment: s.enrollmentNumber
        })),
        admissions: admissions.map(a => ({
            id: a.id,
            email: a.email,
            status: a.status
        }))
    };

    fs.writeFileSync('inspect_direct_students.json', JSON.stringify(result, null, 2));
    console.log('Results written to inspect_direct_students.json');
}

inspect().catch(console.error);
