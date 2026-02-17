
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
dotenv.config();

const prisma = new PrismaClient();

async function diagnose() {
    try {
        console.log("--- Salem Branch Diagnosis ---");
        const salem = await prisma.branch.findUnique({
            where: { code: 'FC-SALEM' }
        });

        if (!salem) {
            console.log("Branch 'FC-SALEM' not found.");
            return;
        }

        console.log(`Branch ID: ${salem.id}`);

        const leads = await prisma.lead.count({ where: { branchId: salem.id } });
        const admissions = await prisma.admission.count({ where: { branchId: salem.id } });
        const students = await prisma.student.count({ where: { branchId: salem.id, isActive: true } });
        const trainers = await prisma.trainer.count({ where: { branchId: salem.id } });
        const trainerAttendance = await (prisma as any).trainerAttendance.findFirst({ where: { branchId: salem.id } });

        console.log(`STATS:LEADS=${leads}`);
        console.log(`STATS:ADMISSIONS=${admissions}`);
        console.log(`STATS:STUDENTS=${students}`);
        console.log(`STATS:TRAINERS=${trainers}`);
        console.log(`STATS:TATTENDANCE_DATE=${trainerAttendance?.date?.toISOString()}`);
        console.log(`STATS:TATTENDANCE_BRANCH=${trainerAttendance?.branchId}`);

        const vimal = await prisma.user.findFirst({
            where: { firstName: 'Vimal' }
        });
        if (vimal) {
            console.log(`VIMAL:ID=${vimal.id}`);
            console.log(`VIMAL:BRANCH=${vimal.branchId}`);
            console.log(`VIMAL:ROLE=${vimal.role}`);
        } else {
            console.log("VIMAL:NOT_FOUND");
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

diagnose();
