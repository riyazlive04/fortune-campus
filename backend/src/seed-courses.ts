
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
    { name: "Full Stack Development", code: "FSD", fees: 50000, duration: 6 },
    { name: "Data Science & AI", code: "DSAI", fees: 60000, duration: 6 },
    { name: "UI/UX Design", code: "UIUX", fees: 40000, duration: 4 },
    { name: "DevOps Engineering", code: "DEVOPS", fees: 55000, duration: 5 },
    { name: "Digital Marketing", code: "DM", fees: 35000, duration: 3 },
];

async function main() {
    console.log(' checking courses...');
    const count = await prisma.course.count();

    if (count === 0) {
        console.log('No courses found. Seeding default courses...');

        // Get a default branch ID (e.g., Salem)
        const branch = await prisma.branch.findFirst();
        if (!branch) {
            console.error('No branches found. Please seed branches first.');
            return;
        }

        for (const course of courses) {
            await prisma.course.create({
                data: {
                    ...course,
                    branchId: branch.id,
                }
            });
            console.log(`Created course: ${course.name}`);
        }
    } else {
        console.log(`Found ${count} courses. skipping seeding.`);
    }
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
