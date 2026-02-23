import { prisma } from './src/config/database';
import { UserRole, LeadStatus, LeadSource } from './src/types/enums';

async function seedTelecallerData() {
    try {
        console.log('Seeding data for Telecaller 2 in Salem...');

        // 1. Ensure Salem branch exists
        let salemBranch = await prisma.branch.findFirst({ where: { name: 'Salem' } });
        if (!salemBranch) {
            console.log('Salem branch not found. Creating it...');
            salemBranch = await prisma.branch.create({
                data: {
                    name: 'Salem',
                    code: 'SLM',
                    address: 'Salem Main Road',
                    isActive: true
                }
            });
        }

        // 2. Ensure Telecaller 2 exists
        let telecaller = await prisma.user.findFirst({
            where: { email: 'telecaller2@fortune.com' }
        });

        if (!telecaller) {
            console.log('Telecaller 2 not found. Creating...');
            telecaller = await prisma.user.create({
                data: {
                    firstName: 'Telecaller',
                    lastName: '2',
                    email: 'telecaller2@fortune.com',
                    password: 'hashed_password_placeholder',
                    role: UserRole.TELECALLER,
                    branchId: salemBranch.id,
                    isActive: true
                }
            });
        }

        const userId = telecaller.id;
        const branchId = salemBranch.id;

        // 3. Create leads (using phone as unique identifier)
        const leadsData = [
            { firstName: 'John', lastName: 'Doe', email: 'john@example.com', phone: '9876543210', source: LeadSource.WALK_IN, status: LeadStatus.NEW, assignedToId: userId, branchId: branchId },
            { firstName: 'Jane', lastName: 'Smith', email: 'jane@example.com', phone: '9876543211', source: LeadSource.WEBSITE, status: LeadStatus.CONTACTED, assignedToId: userId, branchId: branchId },
            { firstName: 'Bob', lastName: 'Wilson', email: 'bob@example.com', phone: '9876543212', source: LeadSource.REFERRAL, status: LeadStatus.INTERESTED, assignedToId: userId, branchId: branchId },
            { firstName: 'Alice', lastName: 'Brown', email: 'alice@example.com', phone: '9876543213', source: LeadSource.SOCIAL_MEDIA, status: LeadStatus.CONVERTED, assignedToId: userId, branchId: branchId },
        ];

        for (const data of leadsData) {
            await (prisma.lead as any).upsert({
                where: { phone: data.phone },
                update: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    source: data.source,
                    status: data.status,
                    assignedToId: data.assignedToId,
                    branchId: data.branchId
                },
                create: {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    email: data.email,
                    phone: data.phone,
                    source: data.source,
                    status: data.status,
                    assignedToId: data.assignedToId,
                    branchId: data.branchId
                }
            });
        }
        console.log('Leads synced.');

        const leads = await prisma.lead.findMany({ where: { assignedToId: userId } });

        // 4. Create follow-ups (Clear old ones first to avoid duplicates)
        await prisma.followUp.deleteMany({ where: { telecallerId: userId } });

        const today = new Date();
        const tomorrow = new Date(today.getTime() + 86400000);
        const yesterday = new Date(today.getTime() - 86400000);

        await (prisma.followUp as any).createMany({
            data: [
                { leadId: leads[0].id, telecallerId: userId, scheduledDate: today, status: 'PENDING', type: 'CALL', notes: 'Discuss course details', updatedAt: new Date() },
                { leadId: leads[1].id, telecallerId: userId, scheduledDate: tomorrow, status: 'PENDING', type: 'CALL', notes: 'Follow up on interest', updatedAt: new Date() },
                { leadId: leads[2].id, telecallerId: userId, scheduledDate: yesterday, status: 'PENDING', type: 'CALL', notes: 'Overdue follow up', updatedAt: new Date() },
            ]
        });

        console.log('Follow-ups created.');
        console.log('Seed success!');
    } catch (error: any) {
        console.error('Seed failed:', error);
    } finally {
        await prisma.$disconnect();
    }
}

seedTelecallerData();
