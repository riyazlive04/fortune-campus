
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        console.log('Searching for tests...');

        // Search for "Week 2" as seen in screenshot
        const week2Tests = await prisma.test.findMany({
            where: { title: { contains: 'Week 2' } }
        });
        console.log('\n--- Tests with "Week 2" in title ---');
        if (week2Tests.length === 0) console.log('None found.');
        week2Tests.forEach(test => console.log(`ID: ${test.id}, Title: "${test.title}", BatchId: ${test.batchId}, Date: ${test.date}`));

        // Search for "batch one"
        const batchOneTests = await prisma.test.findMany({
            where: { title: { contains: 'batch one', mode: 'insensitive' } }
        });
        console.log('\n--- Tests with "batch one" in title ---');
        if (batchOneTests.length === 0) console.log('None found.');
        batchOneTests.forEach(test => console.log(`ID: ${test.id}, Title: "${test.title}", BatchId: ${test.batchId}, Date: ${test.date}`));

        // List all tests just in case
        const allTests = await prisma.test.findMany({ take: 20 });
        console.log('\n--- All Tests (first 20) ---');
        allTests.forEach(test => console.log(`ID: ${test.id}, Title: "${test.title}", BatchId: ${test.batchId}, Date: ${test.date}`));

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
