import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmissions() {
    try {
        const admissions = await prisma.admission.findMany({
            include: {
                branch: true,
                course: true,
            }
        });
        console.log('Total Admissions:', admissions.length);
        console.log('Admissions:', JSON.stringify(admissions, null, 2));
    } catch (error) {
        console.error('Error fetching admissions:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmissions();
