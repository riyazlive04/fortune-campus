
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const branches = await prisma.branch.findMany();
    console.log(`BRANCHES (${branches.length})`);
    branches.forEach(b => console.log(`${b.id}|${b.name}`));

    const courses = await prisma.course.findMany();
    console.log(`COURSES (${courses.length})`);
    courses.forEach(c => console.log(`${c.id}|${c.name}|${c.branchId}`));
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
