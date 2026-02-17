
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testFetchLists() {
    const email = 'ceo@fortunecampus.com';
    const password = 'Admin@123';
    const secret = 'eca6122a-fae4-41ac-afb9-091412f36582'; // From .env

    try {
        console.log(`Logging in as: ${email}`);
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.log('CEO User not found');
            return;
        }

        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            console.log('Invalid password');
            return;
        }

        const token = jwt.sign(
            { userId: user.id, role: user.role, branchId: user.branchId },
            secret,
            { expiresIn: '1h' }
        );

        console.log('Token generated');

        // Fetch Students
        console.log('Fetching Students...');
        const studentResponse = await fetch('http://localhost:5000/api/students?page=1&limit=10', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const studentData = await studentResponse.json();
        console.log('Students Response:', JSON.stringify(studentData, null, 2));

        // Fetch Trainers
        console.log('Fetching Trainers...');
        const trainerResponse = await fetch('http://localhost:5000/api/trainers?page=1&limit=10', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            }
        });
        const trainerData = await trainerResponse.json();
        console.log('Trainers Response:', JSON.stringify(trainerData, null, 2));


    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testFetchLists();
