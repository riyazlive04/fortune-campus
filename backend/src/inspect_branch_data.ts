
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Inspecting Branch Data...');

    // 1. Get all branches
    const branches = await prisma.branch.findMany({
        include: {
            _count: {
                select: {
                    students: true,
                    trainers: true,
                    leads: true,
                    users: true // To see if partners are there
                }
            }
        }
    });


    let output = '\n--- Branch Summary ---\n';
    branches.forEach(b => {
        output += `[${b.code}] ${b.name} (ID: ${b.id})\n`;
        output += `  - Students: ${b._count.students}\n`;
        output += `  - Trainers: ${b._count.trainers}\n`;
        output += `  - Leads: ${b._count.leads}\n`;
        output += `  - Users: ${b._count.users}\n`;
    });

    // 2. Check for data with NULL branchId (if schema allows, though it shouldn't for most)
    // Most relations are required, but let's check.

    console.log('\n--- Checking Unassigned Data (if any) ---');
    // Note: Schema says branchId is String (required) for Student/Trainer, so no nulls.
    // But maybe they are in a branch that was "deleted" or "unknown"?

    // Let's verify the Partner Emails and their Branch IDs
    const partners = await prisma.user.findMany({
        where: {
            email: {
                in: [
                    'pranesh_cbe@fortunecampus.com',
                    'vimal_erode@fortunecampus.com',
                    'sanjay_salem@fortunecampus.com',
                    'vishnu_tiruppur@fortunecampus.com'
                ]
            }
        },
        include: { branch: true }
    });

    output += '\n--- Partner Assignments ---\n';
    partners.forEach(p => {
        output += `${p.email} -> ${p.branch?.name} (${p.branch?.code}) [ID: ${p.branchId}]\n`;
    });

    const fs = require('fs');
    fs.writeFileSync('branch_inspection.txt', output);
    console.log('Output written to branch_inspection.txt');
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
