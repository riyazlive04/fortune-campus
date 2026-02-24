
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function diagnose() {
    const userId = '7b869af6-c041-45a7-8381-7260ebb70bd4';

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today.getTime() + 86400000);

    const followUps = await prisma.followUp.findMany({
        where: { telecallerId: userId },
        include: { lead: true },
        orderBy: { createdAt: 'desc' },
        take: 50
    });

    const data = {
        userId,
        todayRange: { start: today.toISOString(), end: tomorrow.toISOString() },
        followUps: followUps.map(f => ({
            id: f.id,
            leadName: `${f.lead?.firstName} ${f.lead?.lastName}`,
            leadStatus: f.lead?.status,
            scheduledDate: f.scheduledDate.toISOString(),
            status: f.status,
            createdAt: f.createdAt.toISOString()
        }))
    };

    fs.writeFileSync('diagnose-output.json', JSON.stringify(data, null, 2));
    console.log('Diagnostic output saved to diagnose-output.json');
}

diagnose().catch(console.error).finally(() => prisma.$disconnect());
