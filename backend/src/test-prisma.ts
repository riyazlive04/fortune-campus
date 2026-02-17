
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.trainerAttendance.count();
        console.log('TrainerAttendance count:', count);
        console.log('SUCCESS: TrainerAttendance is accessible');
    } catch (err: any) {
        console.error('FAILURE: TrainerAttendance is NOT accessible');
        console.error(err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
