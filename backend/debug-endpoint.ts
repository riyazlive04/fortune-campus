
import axios from 'axios';

const API_URL = 'http://localhost:5000/api';

async function testEndpoint() {
    try {
        console.log('1. Logging in...');
        const loginRes = await axios.post(`${API_URL}/auth/login`, {
            email: 'pranesh_salem@fortunecampus.com',
            password: 'password123'
        });

        const token = loginRes.data.data.token;
        console.log('Login successful. Token obtained.');

        // Decode token to see payload
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));

        console.log('Token Payload:', JSON.parse(jsonPayload));

        console.log('2. Testing /branch-dashboard/overview...');
        const overviewRes = await axios.get(`${API_URL}/branch-dashboard/overview`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Overview Success:', overviewRes.data.success);
        console.log('Overview Data:', JSON.stringify(overviewRes.data.data, null, 2));

    } catch (error: any) {
        if (error.response) {
            console.error('API Error:', {
                status: error.response.status,
                data: error.response.data
            });
        } else {
            console.error('Request Error:', error.message);
        }
    }
}

testEndpoint();
