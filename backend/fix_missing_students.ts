
import { prisma } from './src/config/database';

async function fixMissingStudents() {
    console.log('Finding students with missing profiles...');
    const users = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
            studentProfile: true
        }
    });

    const missing = users.filter(u => !u.studentProfile);
    console.log(`Found ${missing.length} students with missing profiles.`);

    for (const user of missing) {
        console.log(`Processing ${user.email}...`);

        // Find admission by email
        const admission = await prisma.admission.findFirst({
            where: { email: user.email } // Assuming email match
        });

        if (!admission) {
            console.log(`  No admission found for ${user.email}. Skipping.`);
            continue;
        }

        console.log(`  Found admission: ${admission.admissionNumber} (${admission.id})`);

        // We need a courseId. If user has no courseId (it's not on User model in schema, wait. User has no courseId. Student has courseId.)
        // Admission has courseId.
        if (!admission.courseId) {
            console.log(`  Admission has no courseId. Skipping.`);
            continue;
        }

        // Check if student record already exists for this admission (shouldn't, based on Student count 0)
        // But Student.admissionId is unique.

        try {
            const enrollmentNumber = `STU-RESTORED-${Date.now().toString().slice(-6)}-${Math.floor(Math.random() * 1000)}`;

            const newStudent = await prisma.student.create({
                data: {
                    userId: user.id,
                    admissionId: admission.id,
                    enrollmentNumber: enrollmentNumber,
                    branchId: user.branchId || admission.branchId, // Use user branch or admission branch
                    courseId: admission.courseId,
                    isActive: true,
                    currentSemester: 1
                }
            });
            console.log(`  Restored Student record: ${newStudent.id}`);
        } catch (error) {
            console.error(`  Failed to restore student for ${user.email}:`, error);
        }
    }
}

fixMissingStudents()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
