
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkCounts() {
    try {
        console.log('Checking Database Counts...');

        const leads = await prisma.lead.count();
        const admissions = await prisma.admission.count();
        const students = await prisma.user.count({ where: { role: 'STUDENT' } });
        const trainers = await prisma.trainer.count();
        const placements = await prisma.placement.count();

        // Check specific conditions used in dashboard
        const activeStudents = await prisma.user.count({ where: { role: 'STUDENT', isActive: true } });
        const activeTrainers = await prisma.trainer.count({ where: { isActive: true } });

        const ceo = await prisma.user.findFirst({ where: { role: 'CEO' } });
        console.log('--- CEO EMAIL ---');
        console.log(ceo?.email);

        console.log('--- RAW COUNTS ---');
        console.log(`Total Leads: ${leads}`);
        console.log(`Total Admissions: ${admissions}`);
        console.log(`Total Students (All): ${students}`);
        console.log(`Total Trainers: ${trainers}`);
        console.log(`Total Placements: ${placements}`);

        console.log('--- DASHBOARD CONDITION COUNTS ---');
        console.log(`Active Students: ${activeStudents}`);
        console.log(`Active Trainers: ${activeTrainers}`);

    } catch (error) {
        console.error('Error checking counts:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkCounts();
