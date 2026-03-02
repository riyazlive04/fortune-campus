const { execSync } = require('child_process');

try {
    console.log("Starting prisma db push with session pooler...");
    // Session pooler: Port 5432 on the pooler domain, with pgbouncer=true removed, and sslmode=require
    const sessionUrl = "postgres://postgres.azuvlfkcicwvovollwfk:FortuneInnovativesVasu123@aws-1-ap-southeast-1.pooler.supabase.com:5432/postgres?sslmode=require";

    const env = { ...process.env, DATABASE_URL: sessionUrl };
    const output = execSync('npx prisma db push --accept-data-loss', { env, encoding: 'utf8' });

    console.log("SUCCESS:");
    console.log(output);
} catch (error) {
    console.error("FAILED:");
    console.log(error.stdout);
    console.log(error.stderr);
}
