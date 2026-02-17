
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MAPPINGS = [
    { fromCode: 'FC-SALEM', fromNamePattern: 'Salem', toCode: 'SLM' },
    { fromCode: 'FC-COIMBATORE', fromNamePattern: 'Coimbatore', toCode: 'CBE' },
    { fromCode: 'FC-ERODE', fromNamePattern: 'Erode', toCode: 'ERD' },
    { fromCode: 'FC-TIRUPPUR', fromNamePattern: 'Tiruppur', toCode: 'TPR' }
];

async function main() {
    console.log('Starting Legacy Branch Migration...');

    for (const map of MAPPINGS) {
        console.log(`\nProcessing mapping: ${map.fromCode} -> ${map.toCode}`);

        // 1. Find Source Branch
        let sourceBranch = await prisma.branch.findFirst({
            where: {
                OR: [
                    { code: map.fromCode },
                    { name: { contains: `Fortune Campus - ${map.fromNamePattern}` } }
                ]
            }
        });

        if (!sourceBranch) {
            console.log(`⚠️ Source branch for ${map.fromCode} not found. Skipping.`);
            continue;
        }

        // 2. Find Target Branch
        const targetBranch = await prisma.branch.findUnique({
            where: { code: map.toCode }
        });

        if (!targetBranch) {
            console.log(`⚠️ Target branch ${map.toCode} not found. Skipping.`);
            continue;
        }

        if (sourceBranch.id === targetBranch.id) {
            console.log(`ℹ️ Source and Target are same (${sourceBranch.name}). Skipping.`);
            continue;
        }

        console.log(`Migrating data from '${sourceBranch.name}' (${sourceBranch.id}) to '${targetBranch.name}' (${targetBranch.id})...`);

        // 3. Migrate Data
        const tables = [
            'user', 'lead', 'admission', 'student', 'trainer', 'course', 'batch',
            'trainerAttendance', 'expense', 'socialMediaEngagement',
            'eventPlan', 'branchReport', 'trainerAward'
        ];

        for (const table of tables) {
            try {
                // @ts-ignore
                const result = await prisma[table].updateMany({
                    where: { branchId: sourceBranch.id },
                    data: { branchId: targetBranch.id }
                });
                console.log(`  - Migrated ${result.count} ${table} records.`);
            } catch (e: any) {
                console.error(`  ❌ Error migrating ${table}: ${e.message}`);
            }
        }

        // 4. Mark source as inactive (optional, but good for clarity)
        await prisma.branch.update({
            where: { id: sourceBranch.id },
            data: {
                isActive: false,
                name: `LEGACY - ${sourceBranch.name}`
            }
        });
        console.log(`  ✅ Deactivated legacy branch: ${sourceBranch.name}`);
    }


    logOutput += '\nMigration Completed.';
    const fs = require('fs');
    fs.writeFileSync('migration_output.txt', logOutput);
    console.log('Output written to migration_output.txt');
}

let logOutput = '';
const originalLog = console.log;
const originalError = console.error;

console.log = (...args: any[]) => {
    logOutput += args.join(' ') + '\n';
    originalLog(...args);
};

console.error = (...args: any[]) => {
    logOutput += '[ERROR] ' + args.join(' ') + '\n';
    originalError(...args);
};

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
