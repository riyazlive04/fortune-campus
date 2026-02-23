import axios from 'axios';

async function testLogin() {
    try {
        const response = await axios.post('http://localhost:5000/api/auth/login', {
            email: 'telecaller1@fortune.com',
            password: 'password123'
        });
        console.log("LOGIN SUCCESSFUL:");
        console.log(response.data);
    } catch (error: any) {
        console.error("LOGIN FAILED:");
        if (error.response) {
            console.error(error.response.status, error.response.data);
        } else {
            console.error(error.message);
        }
    }
}

testLogin();
