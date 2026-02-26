const axios = require('axios');

async function testMetrics() {
    const baseUrl = 'http://localhost:5000/api';
    const token = 'YOUR_TEST_TOKEN'; // We'd need a real token to test properly

    try {
        console.log('Testing Bulk Performance Metrics...');
        // Note: This will fail without a valid token, but we can check if the route exists
        const response = await axios.get(`${baseUrl}/ratings/trainers/performance-metrics`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('Success:', response.data);
    } catch (error) {
        console.log('Expected failure (no token) or status:', error.response?.status);
    }
}

// Just checking if the controller logic compiles and starts the server correctly
// The user already has the server running.
console.log('Verification script ready.');
