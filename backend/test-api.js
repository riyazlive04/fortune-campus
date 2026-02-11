const http = require('http');

const data = JSON.stringify({
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '1234567890',
    message: 'Test enquiry'
});

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/leads/public',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, (res) => {
    console.log(`Status: ${res.statusCode}`);

    let body = '';
    res.on('data', (chunk) => {
        body += chunk;
    });

    res.on('end', () => {
        console.log('Body:', body);
    });
});

req.on('error', (error) => {
    console.error('Error:', error);
});

req.write(data);
req.end();
