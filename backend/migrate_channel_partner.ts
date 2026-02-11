import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateChannelPartner() {
    console.log('Starting migration: BRANCH_HEAD → CHANNEL_PARTNER');

    try {
        // Update all users with BRANCH_HEAD role to CHANNEL_PARTNER
        const result = await prisma.user.updateMany({
            where: {
                role: 'BRANCH_HEAD'
            },
            data: {
                role: 'CHANNEL_PARTNER'
            }
        });

        console.log(`✓ Updated ${result.count} users from BRANCH_HEAD to CHANNEL_PARTNER`);

        console.log('\nMigration completed successfully!');
    } catch (error) {
        console.error('Error during migration:', error);
        throw error;
    } finally {
        await prisma.$disconnect();
    }
}

migrateChannelPartner();
