const { Client } = require('pg');

async function testConnection() {
    const url = "postgres://postgres.azuvlfkcicwvovollwfk:FortuneInnovativesVasu123@aws-0-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";
    const client = new Client({ connectionString: url });

    try {
        await client.connect();
        console.log("SUCCESS_5432_POOLER");
        await client.end();
    } catch (err) {
        console.error("FAIL_5432_POOLER:", err.message);
    }
}
testConnection();
