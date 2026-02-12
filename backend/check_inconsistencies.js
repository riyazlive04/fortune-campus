
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkInconsistencies() {
    console.log("🔍 Checking for Student-Branch inconsistencies...");

    // 1. Users with role 'STUDENT' but no Student record
    const studentsWithoutProfile = await prisma.user.findMany({
        where: {
            role: 'STUDENT',
            studentProfile: { is: null }
        },
        select: { id: true, email: true, branchId: true }
    });

    console.log(`\n❌ Users with role 'STUDENT' but no Student profile: ${studentsWithoutProfile.length}`);
    studentsWithoutProfile.forEach(u => console.log(`- ${u.email} (User Branch: ${u.branchId})`));

    // 2. Students whose User branchId does not match Student branchId
    const mismatchedBranches = await prisma.student.findMany({
        include: {
            user: {
                select: { branchId: true, email: true }
            }
        }
    });

    const mismatches = mismatchedBranches.filter(s => s.branchId !== s.user.branchId);

    console.log(`\n❌ Students with mismatched branchIds (User vs Student record): ${mismatches.length}`);
    mismatches.forEach(s => {
        console.log(`- ${s.user.email}: User Branch [${s.user.branchId}] vs Student Branch [${s.branchId}]`);
    });

    // 3. Students whose admission branchId does not match Student branchId
    const admissionMismatches = await prisma.student.findMany({
        include: {
            admission: {
                select: { branchId: true }
            },
            user: { select: { email: true } }
        }
    });

    const admMismatches = admissionMismatches.filter(s => s.branchId !== s.admission.branchId);
    console.log(`\n❌ Students with admission branch mismatches: ${admMismatches.length}`);
    admMismatches.forEach(s => {
        console.log(`- ${s.user.email}: Student Branch [${s.branchId}] vs Admission Branch [${s.admission.branchId}]`);
    });

    await prisma.$disconnect();
}

checkInconsistencies();
