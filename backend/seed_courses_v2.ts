import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const courses = [
    {
        name: 'Full Stack Web Development',
        code: 'FSWD-001',
        description: 'Master frontend and backend technologies with React, Node.js, and SQL.',
        fees: 45000,
        duration: 6, // months
        isActive: true,
    },
    {
        name: 'Data Science & Machine Learning',
        code: 'DSML-002',
        description: 'Learn Python, Pandas, Scikit-Learn, and TensorFlow for AI/ML applications.',
        fees: 55000,
        duration: 6, // months
        isActive: true,
    },
    {
        name: 'Digital Marketing Specialist',
        code: 'DMS-003',
        description: 'Comprehensive course on SEO, SEM, Social Media, and Email Marketing.',
        fees: 30000,
        duration: 3, // months
        isActive: true,
    },
    {
        name: 'Cyber Security Expert',
        code: 'CSE-004',
        description: 'Learn ethical hacking, network security, and cryptography.',
        fees: 60000,
        duration: 6, // months
        isActive: true,
    },
    {
        name: 'UI/UX Design Masterclass',
        code: 'UIUX-005',
        description: 'Design beautiful interfaces and user experiences with Figma and Adobe XD.',
        fees: 35000,
        duration: 4, // months
        isActive: true,
    },
];

async function main() {
    console.log('Start seeding courses...');

    // Get or Create Branch
    let branch = await prisma.branch.findFirst();
    if (!branch) {
        console.log('No branch found, creating default branch...');
        branch = await prisma.branch.create({
            data: {
                name: 'Main Branch',
                code: 'MAIN-001',
                city: 'Headquarters',
                phone: '1234567890',
                email: 'admin@fortunecampus.com'
            }
        });
    }
    console.log(`Using Branch: ${branch.name} (${branch.id})`);

    for (const course of courses) {
        const existingCourse = await prisma.course.findUnique({
            where: { code: course.code },
        });

        if (!existingCourse) {
            await prisma.course.create({
                data: {
                    ...course,
                    branchId: branch.id
                },
            });
            console.log(`Created course: ${course.name}`);
        } else {
            console.log(`Course already exists: ${course.name}`);
        }
    }

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
