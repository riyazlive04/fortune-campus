const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkAdmissionConstraints() {
    try {
        const admission = await prisma.admission.findFirst({
            where: { admissionNumber: 'ADM-SLM-744098' },
            include: { student: true }
        });

        if (!admission) {
            console.log("Admission not found by number ADM-SLM-744098");
            return;
        }

        console.log("Trying to delete admission ID:", admission.id);
        console.log("Has student?", !!admission.student);

        if (admission.student) {
            console.log("Cannot delete because student exists:", admission.student.id);
        } else {
            await prisma.admission.delete({ where: { id: admission.id } });
            console.log("Deleted successfully");
        }

    } catch (err) {
        console.error("Error:", err.message);
    } finally {
        await prisma.$disconnect();
    }
}

checkAdmissionConstraints();
