
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testLogin() {
    const email = 'ceo@fortunecampus.com';
    const password = 'Admin@123';

    try {
        console.log(`Checking user: ${email}`);
        const user = await prisma.user.findUnique({
            where: { email },
            include: {
                branch: {
                    select: {
                        id: true,
                        name: true,
                        code: true,
                    },
                },
            },
        });

        if (!user) {
            console.log('User not found');
            return;
        }

        console.log('User found:', { id: user.id, email: user.email, isActive: user.isActive });

        if (!user.isActive) {
            console.log('User is inactive');
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        console.log('Password valid:', isPasswordValid);

        if (!isPasswordValid) {
            console.log('Invalid password');
            return;
        }

        const secret = 'eca6122a-fae4-41ac-afb9-091412f36582'; // From .env
        const token = jwt.sign(
            {
                userId: user.id,
                role: user.role,
                branchId: user.branchId,
            },
            secret,
            { expiresIn: '7d' }
        );

        console.log('Token generated successfully');

        // Fetch Dashboard Stats
        const response = await fetch('http://localhost:5000/api/dashboard/stats', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            const data = await response.json();
            console.log('Dashboard Stats Response:', JSON.stringify(data, null, 2));
        } else {
            console.error('Failed to fetch dashboard stats:', response.status, response.statusText);
            const text = await response.text();
            console.error('Error body:', text);
        }

    } catch (error) {
        console.error('Login simulation error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testLogin();
