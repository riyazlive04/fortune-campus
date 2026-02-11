
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
    console.log('--- Resilient Full Seeding Started ---');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Get Branches
    const branches = await prisma.branch.findMany({
        where: { name: { in: ['Salem', 'Erode', 'Coimbatore', 'Trichy'] } }
    });

    if (branches.length === 0) {
        console.error('No target branches found.');
        return;
    }

    // 2. Get an Admin or CEO User
    let admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
    if (!admin) {
        console.log('No ADMIN found, trying CEO...');
        admin = await prisma.user.findFirst({ where: { role: 'CEO' } });
    }

    if (!admin) {
        console.error('No Admin or CEO user found to assign records to.');
        // Create one if needed or just return? 
        // Let's create a temp admin if totally empty
        console.log('Creating temp admin...');
        admin = await prisma.user.create({
            data: {
                email: `admin.temp.${Date.now()}@example.com`,
                password: hashedPassword,
                firstName: 'System',
                lastName: 'Admin',
                role: 'ADMIN'
            }
        });
    }

    // Cleaning strategy: Try to clean but don't stop if it fails
    const models: any = [
        'whatsappLog', 'attendance', 'portfolio', 'placement', 'company',
        'studentGrowthReport', 'studentFeedback', 'student', 'admission',
        'lead', 'courseTrainer', 'trainerAward', 'trainer', 'course',
        'expense', 'socialMediaEngagement', 'eventPlan'
    ];

    console.log('Cleaning existing records (best effort)...');
    for (const model of models) {
        try { await (prisma as any)[model].deleteMany({}); } catch (e) { }
    }

    // 3. Courses Base Data
    const coursesBase = [
        { name: 'Full Stack Web Development', code: 'FSWD', duration: 6, fees: 45000 },
        { name: 'Python Data Science', code: 'PDS', duration: 4, fees: 35000 },
        { name: 'UI/UX Design', code: 'UIUX', duration: 3, fees: 25000 },
        { name: 'Digital Marketing', code: 'DM', duration: 3, fees: 20000 },
    ];

    // 4. Seeding Loop
    for (const branch of branches) {
        try {
            console.log(`\nSeeding ${branch.name} (${branch.code})...`);

            // Create branch-unique courses
            const branchCourses = [];
            for (const c of coursesBase) {
                const uniqueCode = `${c.code}-${branch.code}-${Date.now()}-${Math.floor(Math.random() * 100)}`;
                const course = await prisma.course.create({
                    data: {
                        name: c.name,
                        code: uniqueCode,
                        duration: c.duration,
                        fees: c.fees,
                        branchId: branch.id
                    }
                });
                branchCourses.push(course);
            }

            // Trainers
            for (let i = 1; i <= 2; i++) {
                const email = `trainer${i}.${branch.code.toLowerCase()}.${Date.now()}@fortune.com`;
                const user = await prisma.user.create({
                    data: {
                        email,
                        password: hashedPassword,
                        firstName: branch.name,
                        lastName: `Trainer ${i}`,
                        role: 'TRAINER',
                        branchId: branch.id
                    }
                });
                await prisma.trainer.create({
                    data: {
                        userId: user.id,
                        employeeId: `EMP-${branch.code}-${i}-${Date.now()}`,
                        branchId: branch.id,
                        specialization: branchCourses[0].name
                    }
                });
            }

            // Leads & Admissions
            for (let i = 1; i <= 10; i++) {
                const isAdmission = i <= 5;
                const targetCourse = branchCourses[i % branchCourses.length];

                const lead = await prisma.lead.create({
                    data: {
                        firstName: `Lead`,
                        lastName: `${branch.code}-${i}`,
                        email: `lead${i}.${branch.code.toLowerCase()}.${Date.now()}@example.com`,
                        phone: `99000${branch.code.slice(-2)}${i}`,
                        source: 'WALK_IN',
                        status: isAdmission ? 'ENROLLED' : 'FOLLOW_UP',
                        branchId: branch.id,
                        createdById: admin.id,
                        interestedCourse: targetCourse.name
                    }
                });

                if (isAdmission) {
                    const admission = await prisma.admission.create({
                        data: {
                            admissionNumber: `ADM-${branch.code}-${i}-${Date.now()}`,
                            firstName: `Student`,
                            lastName: `${branch.code}-${i}`,
                            email: `stud${i}.${branch.code.toLowerCase()}.${Date.now()}@example.com`,
                            phone: `88000${branch.code.slice(-2)}${i}`,
                            courseId: targetCourse.id,
                            feeAmount: targetCourse.fees,
                            feePaid: 20000,
                            feeBalance: targetCourse.fees - 20000,
                            status: 'VERIFIED',
                            branchId: branch.id,
                            leadId: lead.id,
                            softwareFinishedAt: new Date() // Added field to prevent errors
                        }
                    });

                    const sUser = await prisma.user.create({
                        data: {
                            email: admission.email!,
                            password: hashedPassword,
                            firstName: admission.firstName,
                            lastName: admission.lastName,
                            role: 'STUDENT',
                            branchId: branch.id
                        }
                    });

                    await prisma.student.create({
                        data: {
                            userId: sUser.id,
                            admissionId: admission.id,
                            enrollmentNumber: `ENR-${branch.code}-${i}-${Date.now()}`,
                            branchId: branch.id,
                            courseId: targetCourse.id,
                        }
                    });
                }
            }

            // Expenses & Social Media
            await prisma.expense.create({
                data: {
                    amount: 5000,
                    category: 'MARKETING',
                    description: 'Local ads',
                    branchId: branch.id,
                    date: new Date()
                }
            });

            await prisma.socialMediaEngagement.create({
                data: {
                    platform: 'INSTAGRAM',
                    likes: 120,
                    leadsGenerated: 4,
                    branchId: branch.id,
                    date: new Date()
                }
            });
            console.log(`Verified ${branch.name} seeded.`);
        } catch (err: any) {
            console.error(`Error seeding ${branch.name}:`, err.message);
        }
    }

    console.log('--- Seeding Completed ---');
}

main()
    .catch((e) => {
        console.error('SEEDING FAILED:', e);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
