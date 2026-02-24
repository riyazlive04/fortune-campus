
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function simulate() {
    const userId = '7b869af6-c041-45a7-8381-7260ebb70bd4'; // Telecaller 2
    const leadId = '1065827b-5dc8-46f1-82d5-b0507236b894';

    const lead = await prisma.lead.findUnique({ where: { id: leadId } });
    if (!lead) {
        console.log('Lead not found');
        return;
    }

    const nextFollowUpDate = '2026-02-24'; // TODAY

    console.log(`Simulating logCall for lead: ${lead.firstName} ${lead.lastName}`);
    console.log(`Date: ${nextFollowUpDate}`);

    const result = await prisma.$transaction(async (tx) => {
        // 1. Log call
        const callLog = await tx.callLog.create({
            data: {
                leadId: lead.id,
                telecallerId: userId,
                callStatus: 'Connected',
                notes: 'Simulation test',
                nextFollowUpDate: new Date(nextFollowUpDate),
            }
        });

        // 2. Mark older PENDING and OVERDUE follow-ups as COMPLETED
        await tx.followUp.updateMany({
            where: {
                leadId: lead.id,
                telecallerId: userId,
                status: { in: ['PENDING', 'OVERDUE'] }
            },
            data: { status: 'COMPLETED' }
        });

        // 3. Create the next follow-up
        const followUp = await tx.followUp.create({
            data: {
                leadId: lead.id,
                telecallerId: userId,
                scheduledDate: new Date(nextFollowUpDate),
                type: 'CALL',
                notes: 'Simulation test',
            }
        });

        return { callLog, followUp };
    });

    console.log(`Created FollowUp: ${result.followUp.id}, Date: ${result.followUp.scheduledDate.toISOString()}`);

    // Now check if it shows up in Today's Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    console.log(`Querying range: ${today.toISOString()} to ${tomorrow.toISOString()}`);

    const count = await prisma.followUp.count({
        where: {
            telecallerId: userId,
            scheduledDate: { gte: today, lt: tomorrow },
            status: 'PENDING'
        }
    });

    console.log(`\nToday's Tasks Count (Backend Logic): ${count}`);
}

simulate().catch(console.error).finally(() => prisma.$disconnect());
