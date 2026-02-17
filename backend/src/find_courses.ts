
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const courses = await prisma.course.findMany({
        where: {
            OR: [
                { name: { contains: 'API Test', mode: 'insensitive' } },
                { name: { contains: 'UI & UX', mode: 'insensitive' } }
            ]
        }
    });

    console.log('Found Courses:', courses);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
