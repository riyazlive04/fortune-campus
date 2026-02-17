
import { PrismaClient, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const USERS_TO_SETUP = [
    {
        firstName: 'Vasudevan',
        lastName: 'CEO',
        email: 'vasudevan.ceo@fortuneinnovatives.com',
        role: 'CEO', // Using string directly if enum issue, but let's try to find enum or use string. Schema says string. Enums.ts says "CEO".
        branchCode: null, // CEO might not populate branchId or global
        phone: '9999999999'
    },
    {
        firstName: 'Pranesh',
        lastName: 'Coimbatore',
        email: 'pranesh.cbe@fortuneinnovatives.com',
        role: 'CHANNEL_PARTNER',
        branchCode: 'CBE',
        branchName: 'Coimbatore',
        phone: '9876543210'
    },
    {
        firstName: 'Vimal',
        lastName: 'Erode',
        email: 'vimal.erd@fortuneinnovatives.com',
        role: 'CHANNEL_PARTNER',
        branchCode: 'ERD',
        branchName: 'Erode',
        phone: '9876543211'
    },
    {
        firstName: 'Vishnu',
        lastName: 'Tiruppur',
        email: 'vishnu.tpr@fortuneinnovatives.com',
        role: 'CHANNEL_PARTNER',
        branchCode: 'TPR',
        branchName: 'Tiruppur',
        phone: '9876543212'
    },
    {
        firstName: 'Sanjay',
        lastName: 'Sanjay',
        email: 'sanjay.snj@fortuneinnovatives.com',
        role: 'CHANNEL_PARTNER',
        branchCode: 'SNJ', // Assuming "Sanjay" branch means a branch named Sanjay? Or adds to Salem? User said "Sanjay - Sanjay", implies Branch Name - Person Name mapping or vice versa? 
        // Request: "Sanjay - Sanjay" likely means Branch: Sanjay, User: Sanjay.
        branchName: 'Sanjay',
        phone: '9876543213'
    }
];

// Ensure valid UserRole if using TS enum, but db has String. 
// We will simply cast or use string.

async function main() {
    console.log('Starting Final Assignment Setup...');

    const hashedPassword = await bcrypt.hash('Fortune@123', 10);

    for (const userSetup of USERS_TO_SETUP) {
        let branchId = null;

        // 1. Upsert Branch if needed
        if (userSetup.branchCode) {
            console.log(`Processing Branch: ${userSetup.branchName} (${userSetup.branchCode})`);
            const branch = await prisma.branch.upsert({
                where: { code: userSetup.branchCode },
                update: {
                    name: userSetup.branchName,
                    isActive: true
                },
                create: {
                    name: userSetup.branchName,
                    code: userSetup.branchCode,
                    isActive: true
                }
            });
            branchId = branch.id;
            console.log(`   -> Branch ID: ${branchId}`);
        } else {
            console.log(`Processing User: ${userSetup.firstName} (No Branch)`);
        }

        // 2. Upsert User
        console.log(`   -> Upserting User: ${userSetup.email}`);

        await prisma.user.upsert({
            where: { email: userSetup.email },
            update: {
                firstName: userSetup.firstName,
                lastName: userSetup.lastName,
                role: userSetup.role,
                branchId: branchId, // Can be null
                password: hashedPassword, // Reset password to default
                isActive: true
            },
            create: {
                email: userSetup.email,
                firstName: userSetup.firstName,
                lastName: userSetup.lastName,
                role: userSetup.role,
                branchId: branchId,
                password: hashedPassword,
                isActive: true,
                phone: userSetup.phone
            }
        });
        console.log(`   -> User ${userSetup.firstName} assigned correctly.`);
    }

    // Special check for 'Code: SLM' to ensure it exists if not covered above (it wasn't in list but good to preserve)
    // The user didn't explicitly ask to "fix" Salem user, but implicit since they listed partners. 
    // Wait, the user listed: 
    // 1. CEO - Vasudevan
    // 2. four channel partners: Pranesh-CBE, Sanjay-Sanjay, Vimal-Erode, Vishnu-Tiruppur.
    // So I only touch these.

    console.log('Final Assignment Setup Completed Successfully.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
