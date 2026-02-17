
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

async function testCreateStudent() {
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

        // Get a valid course
        const course = await prisma.course.findFirst();
        if (!course) {
            console.log('No courses found');
            return;
        }
        console.log(`Using course: ${course.name} (${course.id})`);

        // Get a valid branch
        const branch = await prisma.branch.findFirst();
        if (!branch) {
            console.log('No branches found');
            return;
        }
        console.log(`Using branch: ${branch.name} (${branch.id})`);

        // Create a fake student
        const timestamp = Date.now();
        const studentData = {
            firstName: `TestStu${timestamp}`,
            lastName: 'User',
            email: `teststu${timestamp}@example.com`,
            phone: '9876543210',
            role: 'STUDENT',
            branchId: branch.id, // Explicitly using a valid branch
            courseId: course.id
        };

        console.log('Creating student...');
        const response = await fetch('http://localhost:5000/api/users', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(studentData)
        });

        const data = await response.json();
        console.log('Create Response Status:', response.status);
        console.log('Create Response Body:', JSON.stringify(data, null, 2));

        if (response.ok) {
            // Check Database
            const createdUser = await prisma.user.findUnique({
                where: { email: studentData.email },
                include: { studentProfile: { include: { course: true, admission: true } } }
            });

            if (createdUser) {
                console.log('Database Result:');
                console.log('User Role:', createdUser.role);
                console.log('Has Student Profile:', !!createdUser.studentProfile);
                console.log('Student Profile Data:', JSON.stringify(createdUser.studentProfile, null, 2));
            } else {
                console.log('User not found in DB after creation!');
            }
        } else {
            console.error('Failed to create student:', data.message);
        }

    } catch (error) {
        console.error('Test error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

testCreateStudent();
