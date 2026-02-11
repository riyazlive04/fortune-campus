import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function checkAdmissionStatuses() {
    try {
        const admissions = await prisma.admission.findMany({
            select: {
                id: true,
                admissionNumber: true,
                firstName: true,
                lastName: true,
                status: true,
                createdAt: true,
            }
        });

        console.log('Total Admissions:', admissions.length);
        console.log('\nAdmission Details:');
        admissions.forEach((adm, idx) => {
            console.log(`\n${idx + 1}. ${adm.firstName} ${adm.lastName}`);
            console.log(`   Admission #: ${adm.admissionNumber}`);
            console.log(`   Status: ${adm.status}`);
            console.log(`   Created: ${adm.createdAt}`);
        });

        const statusCounts = await prisma.admission.groupBy({
            by: ['status'],
            _count: true,
        });

        console.log('\n\nStatus Breakdown:');
        statusCounts.forEach(s => {
            console.log(`  ${s.status}: ${s._count}`);
        });
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmissionStatuses();
