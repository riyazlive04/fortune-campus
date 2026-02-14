
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testAdmissions() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'pranesh_salem@fortunecampus.com',
            password: 'password123'
        });

        const token = loginRes.data.data.token;
        console.log('Login successful.');

        console.log('2. Fetching Admissions Stats...');
        const res = await axios.get(`${API_URL}/branch-dashboard/admissions`, {
            headers: { Authorization: `Bearer ${token}` }
        });

        console.log('Admissions Data:', JSON.stringify(res.data.data, null, 2));

        console.log('3. Fetching User Data from Login Response...');
        console.log('User Object:', JSON.stringify(loginRes.data.data.user, null, 2));

    } catch (error: any) {
        console.error('Error:', error.message);
        if (error.response) {
            console.error('Data:', error.response.data);
        }
    }
}

testAdmissions();
