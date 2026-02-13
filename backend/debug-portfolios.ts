import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function checkPortfolios() {
    try {
        const submissions = await prisma.portfolioSubmission.findMany({
            include: {
                student: {
                    include: {
                        user: { select: { firstName: true, lastName: true } },
                        branch: { select: { name: true } }
                    }
                },
                task: true
            }
        });

        console.log("Portfolio Submissions:");
        console.log(JSON.stringify(submissions, null, 2));

        const pendingCount = await prisma.portfolioSubmission.count({
            where: { status: 'PENDING' }
        });
        console.log(`\nTotal Pending Submissions: ${pendingCount}`);

        const students = await prisma.student.findMany({
            include: {
                user: { select: { firstName: true, lastName: true } },
                branch: { select: { name: true } }
            }
        });
        console.log("\nStudents:");
        console.log(JSON.stringify(students, null, 2));

    } catch (error) {
        console.error("Error checking portfolios:", error);
    } finally {
        await prisma.$disconnect();
    }
}

checkPortfolios();
