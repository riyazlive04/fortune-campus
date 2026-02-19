import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('🚀 Seeding Faculty Performance Data...');

    const trainers = await prisma.trainer.findMany();
    const students = await prisma.student.findMany();
    const courses = await prisma.course.findMany();

    if (trainers.length === 0 || students.length === 0 || courses.length === 0) {
        console.error('❌ Missing trainers, students, or courses. Please run seed_full_data.ts first.');
        return;
    }

    const now = new Date();

    // Create about 5-10 reports for each trainer
    for (const trainer of trainers) {
        console.log(`📝 Seeding reports for trainer: ${trainer.id}`);

        const reportCount = 5 + Math.floor(Math.random() * 10);

        for (let i = 0; i < reportCount; i++) {
            const student = students[Math.floor(Math.random() * students.length)];
            const course = courses[Math.floor(Math.random() * courses.length)];

            await prisma.studentGrowthReport.create({
                data: {
                    trainerId: trainer.id,
                    studentId: student.id,
                    courseId: course.id,
                    qualityTeaching: 7 + Math.floor(Math.random() * 4), // 7 to 10
                    doubtClearance: 6 + Math.floor(Math.random() * 5), // 6 to 10
                    testScore: 60 + Math.random() * 40,
                    portfolioFollowUp: Math.random() > 0.3,
                    classFollowUp: Math.random() > 0.2,
                    reportDate: now, // Current month
                }
            });
        }
    }

    console.log('✅ Faculty Performance Data seeded successfully!');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
