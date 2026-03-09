import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
    const l = await prisma.lead.findFirst({ where: { firstName: 'test1' } });
    console.log('L_BR:' + l?.branchId);
    const ts = await prisma.user.findMany({ where: { role: 'TRAINER' } });
    ts.forEach(t => console.log('T_BR:' + t.branchId + ' NAME:' + t.firstName));
}
main().finally(() => prisma.$disconnect());
