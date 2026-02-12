
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Creating Minimal Student Data ---');

    // 1. Get Student 3 user
    const user = await prisma.user.findFirst({
        where: {
            OR: [
                { firstName: { contains: 'Student 3', mode: 'insensitive' } },
                { email: { contains: 'student3', mode: 'insensitive' } },
                { role: 'STUDENT' }
            ]
        }
    });

    if (!user) {
        console.error('No student user found.');
        return;
    }

    // 2. Get existing Branch and Course
    const branch = await prisma.branch.findFirst();
    const course = await prisma.course.findFirst();

    if (!branch || !course) {
        console.error('Core data (Branch or Course) missing.');
        return;
    }

    // 3. Create or Get Batch
    let batch = await prisma.batch.findFirst({
        where: { courseId: course.id, branchId: branch.id }
    });

    if (!batch) {
        batch = await prisma.batch.create({
            data: {
                name: 'Standard Batch',
                code: 'BCH-' + Math.floor(Math.random() * 1000),
                courseId: course.id,
                branchId: branch.id,
                startTime: '10:00 AM',
                endTime: '01:00 PM',
                isActive: true
            }
        });
    }

    // 4. Create Admission
    let admission = await prisma.admission.findFirst({
        where: { email: user.email }
    });

    if (!admission) {
        admission = await prisma.admission.create({
            data: {
                admissionNumber: 'ADM-' + Math.floor(Math.random() * 10000),
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                phone: user.phone || '0000000000',
                courseId: course.id,
                branchId: branch.id,
                admissionDate: new Date(),
                feeAmount: course.fees || 45000,
                feePaid: 30000,
                feeBalance: 15000,
                status: 'APPROVED'
            }
        });
    }

    // 5. Create Student Profile
    const existingStudent = await prisma.student.findUnique({
        where: { userId: user.id }
    });

    if (!existingStudent) {
        await prisma.student.create({
            data: {
                userId: user.id,
                admissionId: admission.id,
                enrollmentNumber: 'ST-' + Math.floor(Math.random() * 10000),
                branchId: branch.id,
                courseId: course.id,
                batchId: batch.id,
                currentSemester: 1,
                isActive: true,
                placementEligible: true,
                certificateLocked: false
            }
        });
        console.log(`Minimal student profile created!`);
    } else {
        console.log(`Student profile already exists.`);
    }

    console.log('--- Done! ---');
}

main()
    .catch((e) => {
        console.error('Error:', e.message);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
