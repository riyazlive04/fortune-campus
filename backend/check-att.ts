import fs from 'fs';
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
    const att = await prisma.attendance.findMany();
    fs.writeFileSync('check-att.json', JSON.stringify(att, null, 2), 'utf-8');
    console.log("Done", att.length);
}

main().finally(() => prisma.$disconnect());
