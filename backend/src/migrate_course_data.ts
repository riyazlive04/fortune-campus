
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    // 1. Find Courses
    const oldCourse = await prisma.course.findFirst({
        where: { name: { contains: 'API Test', mode: 'insensitive' } }
    });

    const newCourse = await prisma.course.findFirst({
        where: { name: { contains: 'UI & UX', mode: 'insensitive' } }
    });

    if (!oldCourse || !newCourse) {
        console.error('Could not find courses.');
        console.log('Old:', oldCourse);
        console.log('New:', newCourse);
        return;
    }

    console.log(`Migrating from ${oldCourse.name} (${oldCourse.id}) to ${newCourse.name} (${newCourse.id})`);

    await prisma.$transaction(async (tx) => {
        // 2. Move Students
        const updatedStudents = await tx.student.updateMany({
            where: { courseId: oldCourse.id },
            data: {
                courseId: newCourse.id,
                batchId: null // Clear batch as it won't be valid
            }
        });
        console.log(`Updated ${updatedStudents.count} students.`);

        // 3. Move Admissions
        const updatedAdmissions = await tx.admission.updateMany({
            where: { courseId: oldCourse.id },
            data: { courseId: newCourse.id }
        });
        console.log(`Updated ${updatedAdmissions.count} admissions.`);

        // 4. Move Trainers
        const oldTrainers = await tx.courseTrainer.findMany({
            where: { courseId: oldCourse.id }
        });

        for (const ot of oldTrainers) {
            // Check if already in new course
            const exists = await tx.courseTrainer.findUnique({
                where: {
                    courseId_trainerId: {
                        courseId: newCourse.id,
                        trainerId: ot.trainerId
                    }
                }
            });

            if (!exists) {
                await tx.courseTrainer.create({
                    data: {
                        courseId: newCourse.id,
                        trainerId: ot.trainerId,
                        assignedAt: ot.assignedAt,
                        isActive: ot.isActive
                    }
                });
                console.log(`Assigned trainer ${ot.trainerId} to new course.`);
            }
        }

        // 5. Move Attendance
        const updatedAttendance = await tx.attendance.updateMany({
            where: { courseId: oldCourse.id },
            data: {
                courseId: newCourse.id,
                batchId: null
            }
        });
        console.log(`Updated ${updatedAttendance.count} attendance records.`);

        // 6. Move Student Growth Reports
        const updatedGrowth = await tx.studentGrowthReport.updateMany({
            where: { courseId: oldCourse.id },
            data: { courseId: newCourse.id }
        });
        console.log(`Updated ${updatedGrowth.count} growth reports.`);

        // 7. Move Portfolio Tasks (to preserve submissions)
        // PortfolioTask -> Course
        const updatedTasks = await tx.portfolioTask.updateMany({
            where: { courseId: oldCourse.id },
            data: { courseId: newCourse.id }
        });
        console.log(`Updated ${updatedTasks.count} portfolio tasks.`);

        // 8. Delete Batches (now safe as students/attendance are unlinked form batch)
        const deletedBatches = await tx.batch.deleteMany({
            where: { courseId: oldCourse.id }
        });
        console.log(`Deleted ${deletedBatches.count} batches.`);

        // 9. Delete Course
        await tx.course.delete({
            where: { id: oldCourse.id }
        });
        console.log('Deleted old course.');
    });
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
