const axios = require('axios');

async function verify() {
    try {
        console.log('Attempting login to backend at http://localhost:5000/api/auth/login...');
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'ceo@fortunecampus.com',
            password: 'Admin@123'
        });

        if (response.status === 200 && response.data.token) {
            console.log('Login successful! Token received.');
            console.log('User Role:', response.data.user.role);
        } else {
            console.log('Login failed. Response:', response.status, response.data);
        }
    } catch (err) {
        if (err.response) {
            console.error('Login failed with status:', err.response.status);
            console.error('Error message:', err.response.data.message);
        } else {
            console.error('Connection error:', err.message);
        }
        process.exit(1);
    }
}

verify();
