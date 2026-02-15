
import { PrismaClient } from '@prisma/client';
import fs from 'fs';

const prisma = new PrismaClient();

async function main() {
    try {
        const week2Tests = await prisma.test.findMany({
            where: { title: { contains: 'Week 2' } }
        });

        if (week2Tests.length > 0) {
            const id = week2Tests[0].id;
            console.log(`Found Week 2 Test ID: ${id}`);
            fs.writeFileSync('test_to_delete_id.txt', id);
        } else {
            console.log('No "Week 2" test found.');

            // Fallback: Check for "week 2" case insensitive
            const week2TestsCi = await prisma.test.findMany({
                where: { title: { contains: 'week 2', mode: 'insensitive' } }
            });
            if (week2TestsCi.length > 0) {
                const id = week2TestsCi[0].id;
                console.log(`Found "week 2" (CI) Test ID: ${id}`);
                fs.writeFileSync('test_to_delete_id.txt', id);
            } else {
                // Fallback 2: Check for "batch one"
                const batchOne = await prisma.test.findMany({
                    where: { title: { contains: 'batch one', mode: 'insensitive' } }
                });
                if (batchOne.length > 0) {
                    const id = batchOne[0].id;
                    console.log(`Found "batch one" Test ID: ${id}`);
                    fs.writeFileSync('test_to_delete_id.txt', id);
                }
            }
        }

    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

main();
