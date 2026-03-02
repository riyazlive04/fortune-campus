const http = require('http');

const data = JSON.stringify({ email: 'ceo@fortune.com', password: 'Fortune@2024' });

const options = {
    hostname: 'localhost',
    port: 5000,
    path: '/api/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
    }
};

const req = http.request(options, res => {
    let body = '';
    res.on('data', d => body += d);
    res.on('end', () => {
        const parsed = JSON.parse(body);
        console.log('Login status:', res.statusCode);
        const token = parsed.data?.token || parsed.token;
        if (!token) {
            console.log('No token in response:', body.substring(0, 500));
            return;
        }
        console.log('Got token! Now testing dashboard stats...');

        const statsReq = http.request({
            hostname: 'localhost',
            port: 5000,
            path: '/api/dashboard/stats',
            method: 'GET',
            headers: { 'Authorization': `Bearer ${token}` }
        }, sres => {
            let sbody = '';
            sres.on('data', d => sbody += d);
            sres.on('end', () => {
                console.log('Dashboard stats status:', sres.statusCode);
                console.log('Response:', sbody.substring(0, 1000));
            });
        });
        statsReq.on('error', e => console.error('Stats error:', e));
        statsReq.end();
    });
});

req.on('error', e => console.error('Login error:', e));
req.write(data);
req.end();
