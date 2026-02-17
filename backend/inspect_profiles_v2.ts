
import { prisma } from './src/config/database';
import * as fs from 'fs';

async function inspect() {
    const users = await prisma.user.findMany({
        include: {
            trainerProfile: true,
            studentProfile: true,
            branch: true,
        },
    });

    const result = {
        users: users.map(u => ({
            name: `${u.firstName} ${u.lastName}`,
            role: u.role,
            branch: u.branch?.name,
            branchId: u.branchId,
            hasTrainerProfile: !!u.trainerProfile,
            hasStudentProfile: !!u.studentProfile
        }))
    };

    fs.writeFileSync('inspect_result_v2.json', JSON.stringify(result, null, 2));
    console.log('Results written to inspect_result_v2.json');
}

inspect().catch(console.error);
