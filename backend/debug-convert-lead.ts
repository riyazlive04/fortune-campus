
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function debugConvertLead() {
    try {
        console.log('1. Finding a NEW lead...');
        const lead = await prisma.lead.findFirst({
            where: { status: 'NEW' }
        });

        if (!lead) {
            console.log('No NEW lead found.');
            return;
        }

        console.log(`Found lead: ${lead.id} (${lead.firstName} ${lead.lastName})`);
        console.log('Current Status:', lead.status);

        console.log('2. Attempting to update status to CONVERTED...');
        const updatedLead = await prisma.lead.update({
            where: { id: lead.id },
            data: { status: 'CONVERTED' }
        });

        console.log('Update successful!');
        console.log('New Status:', updatedLead.status);

        // Revert for testing purposes (optional)
        // await prisma.lead.update({ where: { id: lead.id }, data: { status: 'NEW' } });

    } catch (error: any) {
        console.error('ERROR:', error);
        console.error('Error Message:', error.message);
    } finally {
        await prisma.$disconnect();
    }
}

debugConvertLead();
