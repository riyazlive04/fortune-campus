const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function test() {
    try {
        const cp = await prisma.user.findFirst({ where: { role: 'CHANNEL_PARTNER' } });
        const student = await prisma.student.findFirst({
            where: { branchId: cp.branchId }
        });

        if (!student) {
            console.log("No student found");
            return;
        }
        console.log("Found student", student.id, student.branchId);

        const feePaymentRequest = await prisma.feePaymentRequest.create({
            data: {
                studentId: student.id,
                admissionId: student.admissionId,
                amount: 500,
                paymentMode: 'CASH',
                transactionId: null,
                requestedById: cp.id,
                branchId: student.branchId,
                status: 'PENDING'
            }
        });
        console.log("Success:", feePaymentRequest);
    } catch (e) {
        console.error("Prisma Error:", e);
    } finally {
        prisma.$disconnect();
    }
}

test();
