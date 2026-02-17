
import { prisma } from './src/config/database';

async function fixMissingTrainers() {
    console.log('Finding trainers with missing profiles...');
    const users = await prisma.user.findMany({
        where: { role: 'TRAINER' },
        include: {
            trainerProfile: true
        }
    });

    const missing = users.filter(u => !u.trainerProfile);
    console.log(`Found ${missing.length} trainers with missing profiles.`);

    for (const user of missing) {
        console.log(`Processing ${user.email}...`);

        try {
            const timestamp = Date.now().toString().slice(-6);
            const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
            const employeeId = `TR-RESTORED-${timestamp}${random}`;

            const newTrainer = await prisma.trainer.create({
                data: {
                    userId: user.id,
                    employeeId: employeeId,
                    branchId: user.branchId, // Use user branch
                    specialization: 'Restored Trainer',
                    experience: 1,
                    qualification: 'Restored',
                    isActive: true
                }
            });
            console.log(`  Restored Trainer record: ${newTrainer.id}`);
        } catch (error) {
            console.error(`  Failed to restore trainer for ${user.email}:`, error);
        }
    }
}

fixMissingTrainers()
    .catch(console.error)
    .finally(async () => {
        await prisma.$disconnect();
    });
