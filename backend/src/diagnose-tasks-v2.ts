
import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
const prisma = new PrismaClient();

async function diagnose() {
    const userId = '7b869af6-c041-45a7-8381-7260ebb70bd4';

    const callLogs = await prisma.callLog.findMany({
        where: { telecallerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const followUps = await prisma.followUp.findMany({
        where: { telecallerId: userId },
        orderBy: { createdAt: 'desc' },
        take: 10
    });

    const data = {
        callLogs: callLogs.map(c => ({
            id: c.id,
            dateInLog: c.nextFollowUpDate?.toISOString(),
            createdAt: c.createdAt.toISOString()
        })),
        followUps: followUps.map(f => ({
            id: f.id,
            scheduledDate: f.scheduledDate.toISOString(),
            status: f.status,
            createdAt: f.createdAt.toISOString()
        }))
    };

    fs.writeFileSync('diagnose-output-v2.json', JSON.stringify(data, null, 2));
}

diagnose().catch(console.error).finally(() => prisma.$disconnect());
