
const API_URL = 'http://localhost:5000/api';

async function testReports() {
    console.log('🚀 Starting Report API Tests...');

    try {
        // 1. Login
        console.log('🔑 Logging in...');
        const loginRes = await fetch(`${API_URL}/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email: 'ceo@fortunecampus.com', password: 'Admin@123' }),
        });

        const loginData = await loginRes.json();
        if (!loginRes.ok) throw new Error(`Login failed: ${JSON.stringify(loginData)}`);
        console.log('✅ Login successful');

        const token = loginData.data.token;
        const headers = { 'Authorization': `Bearer ${token}` };

        // 2. Get Branches
        console.log('🌿 Fetching Branches...');
        const branchesRes = await fetch(`${API_URL}/branches`, { headers });
        const branchesData = await branchesRes.json();
        if (!branchesRes.ok) throw new Error(`Get Branches failed: ${JSON.stringify(branchesData)}`);
        console.log(`✅ Branches fetched: ${branchesData.data.length} branches found`);

        const branchId = branchesData.data[0]?.id;
        if (!branchId) console.warn('⚠️ No branches found to test branch report');

        // 3. Test Branch Report
        if (branchId) {
            console.log(`📊 Testing Branch Report for ${branchId}...`);
            const brRes = await fetch(`${API_URL}/reports/branch?branchId=${branchId}`, { headers });
            const brData = await brRes.json();
            if (!brRes.ok) {
                console.error('❌ Branch Report Failed:', JSON.stringify(brData, null, 2));
            } else {
                console.log('✅ Branch Report Success');
            }
        }

        // 4. Test Trainer Report
        console.log('👨‍🏫 Testing Trainer Report...');
        const trRes = await fetch(`${API_URL}/reports/trainer`, { headers });
        const trData = await trRes.json();
        if (!trRes.ok) {
            console.error('❌ Trainer Report Failed:', JSON.stringify(trData, null, 2));
        } else {
            console.log('✅ Trainer Report Success');
        }

        // 5. Test Admissions Report
        console.log('🎓 Testing Admissions Report...');
        const adRes = await fetch(`${API_URL}/reports/admissions`, { headers });
        const adData = await adRes.json();
        if (!adRes.ok) {
            console.error('❌ Admissions Report Failed:', JSON.stringify(adData, null, 2));
        } else {
            console.log('✅ Admissions Report Success');
        }

        // 6. Test Placements Report
        console.log('💼 Testing Placements Report...');
        const plRes = await fetch(`${API_URL}/reports/placements`, { headers });
        const plData = await plRes.json();
        if (!plRes.ok) {
            console.error('❌ Placements Report Failed:', JSON.stringify(plData, null, 2));
        } else {
            console.log('✅ Placements Report Success');
        }

        // 7. Test Revenue Report
        console.log('💰 Testing Revenue Report...');
        const revRes = await fetch(`${API_URL}/reports/revenue`, { headers });
        const revData = await revRes.json();
        if (!revRes.ok) {
            console.error('❌ Revenue Report Failed:', JSON.stringify(revData, null, 2));
        } else {
            console.log('✅ Revenue Report Success');
        }

    } catch (error) {
        console.error('🚨 Test Suite Failed:', error);
    }
}

testReports();
