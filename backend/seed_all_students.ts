
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Seeding All Student Profiles ---');

    const studentEmails = [
        'student1_salem@gmail.com',
        'student2_erode@gmail.com',
        'student3_cbe@gmail.com',
        'student4_tiruppur@gmail.com',
        'trainer3_erode@gmail.com'
    ];

    const branch = await prisma.branch.findFirst();
    const course = await prisma.course.findFirst();

    if (!branch || !course) {
        console.error('Missing Branch or Course. Please create them first.');
        return;
    }

    let batch = await prisma.batch.findFirst({ where: { courseId: course.id, branchId: branch.id } });
    if (!batch) {
        batch = await prisma.batch.create({
            data: {
                name: 'Main Batch',
                code: 'B-' + Math.floor(Math.random() * 1000),
                courseId: course.id,
                branchId: branch.id,
                startTime: '09:00 AM',
                endTime: '12:00 PM',
                isActive: true
            }
        });
    }

    for (const email of studentEmails) {
        const user = await prisma.user.findUnique({
            where: { email },
            include: { studentProfile: true }
        });

        if (!user) {
            console.log(`User ${email} not found. Skipping.`);
            continue;
        }

        if (user.studentProfile) {
            console.log(`Student ${email} already has a profile.`);
            continue;
        }

        // Create Admission first
        const admission = await prisma.admission.create({
            data: {
                admissionNumber: 'ADM-' + Math.floor(Math.random() * 100000),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone || '0000000000',
                courseId: course.id,
                branchId: branch.id,
                admissionDate: new Date(),
                feeAmount: course.fees || 45000,
                feePaid: 45000,
                feeBalance: 0,
                status: 'APPROVED'
            }
        });

        // Create Student Profile
        await prisma.student.create({
            data: {
                userId: user.id,
                admissionId: admission.id,
                enrollmentNumber: 'ENR-' + Math.floor(Math.random() * 100000),
                branchId: branch.id,
                courseId: course.id,
                batchId: batch.id,
                currentSemester: 1,
                isActive: true,
                placementEligible: true
            }
        });

        console.log(`Created profile for ${email}`);
    }

    console.log('--- Seeding Complete ---');
}

main().catch(err => {
    console.error(err);
    process.exit(1);
}).finally(() => prisma.$disconnect());
