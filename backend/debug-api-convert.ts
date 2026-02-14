
import axios from 'axios';
import { PrismaClient } from '@prisma/client';

const API_URL = 'http://localhost:5000/api';
const prisma = new PrismaClient();

async function debugApiConvert() {
    try {
        // 1. Get a valid token (Login as Channel Partner)
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'pranesh_salem@fortunecampus.com',
            password: 'password123'
        });
        const token = loginRes.data.data.token;
        console.log('Login successful.');

        // 2. Create a fresh lead to convert (to ensure we have one)
        console.log('2. Creating a test lead directly in DB...');
        // We need to know the branch ID of the logged in user to make sure the lead is visible
        // We can get it from login response or just query DB
        const user = await prisma.user.findUnique({ where: { email: 'pranesh_salem@fortunecampus.com' } });
        if (!user || !user.branchId) {
            console.error('User or Branch ID missing for test user.');
            return;
        }

        const lead = await prisma.lead.create({
            data: {
                firstName: 'Test',
                lastName: 'Conversion',
                email: 'test.convert@example.com',
                phone: '1234567890',
                branchId: user.branchId,
                createdById: user.id,
                status: 'NEW',
                source: 'DEBUG_SCRIPT'
            }
        });
        console.log(`Created test lead: ${lead.id}`);

        // 3. Call the Convert API
        console.log('3. Calling Convert API...');
        const convertRes = await axios.post(
            `${API_URL}/branch-dashboard/lead/convert`,
            { leadId: lead.id },
            { headers: { Authorization: `Bearer ${token}` } }
        );

        console.log('API Response Status:', convertRes.status);
        console.log('API Response Data:', JSON.stringify(convertRes.data, null, 2));

        // 4. Verify in DB
        const updatedLead = await prisma.lead.findUnique({ where: { id: lead.id } });
        console.log('Final DB Status:', updatedLead?.status);

    } catch (error: any) {
        console.error('ERROR:', error.message);
        if (error.response) {
            console.error('API Error Response:', JSON.stringify(error.response.data, null, 2));
        }
    } finally {
        await prisma.$disconnect();
    }
}

debugApiConvert();
