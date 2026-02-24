import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fix() {
    console.log('--- Fixing Salem Branch Data ---');

    // 1. Find the branch with traling space
    const messyBranch = await prisma.branch.findFirst({
        where: { name: 'Salem ' }
    });

    if (messyBranch) {
        console.log(`Found messy branch: '${messyBranch.name}' (ID: ${messyBranch.id})`);

        // Check if a branch named 'Salem' (no space) already exists
        const cleanBranch = await prisma.branch.findFirst({
            where: { name: 'Salem' }
        });

        if (cleanBranch && cleanBranch.id !== messyBranch.id) {
            console.log(`Clean branch already exists: '${cleanBranch.name}' (ID: ${cleanBranch.id})`);

            // Move everything from messy to clean
            console.log('Moving users and leads to clean branch...');
            await prisma.user.updateMany({
                where: { branchId: messyBranch.id },
                data: { branchId: cleanBranch.id }
            });
            await prisma.lead.updateMany({
                where: { branchId: messyBranch.id },
                data: { branchId: cleanBranch.id }
            });

            // Delete messy branch
            try {
                await prisma.branch.delete({ where: { id: messyBranch.id } });
                console.log('Messy branch deleted.');
            } catch (e) {
                console.log('Could not delete messy branch (likely constraints), renaming instead.');
                await prisma.branch.update({
                    where: { id: messyBranch.id },
                    data: { name: ' Salem (OLD)', code: 'SLM-OLD-' + Date.now() }
                });
            }
        } else {
            // Just rename messy branch
            console.log('Renaming messy branch to clean name...');
            await prisma.branch.update({
                where: { id: messyBranch.id },
                data: { name: 'Salem' }
            });
            console.log('Branch renamed successfully.');
        }
    } else {
        console.log("Messy branch 'Salem ' not found. Checking if correctly named 'Salem' exists.");
        const salem = await prisma.branch.findFirst({ where: { name: 'Salem' } });
        if (salem) {
            console.log(`Found 'Salem' branch (ID: ${salem.id})`);
        } else {
            console.log("No Salem branch found at all.");
        }
    }

    await prisma.$disconnect();
}

fix();
