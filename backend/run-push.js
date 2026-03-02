const { execSync } = require('child_process');
const dotenv = require('dotenv');
dotenv.config();

try {
    console.log("Using Database URL:", process.env.DATABASE_URL);
    const result = execSync('npx prisma db push --accept-data-loss', {
        env: { ...process.env },
        stdio: 'inherit'
    });
} catch (err) {
    console.error("Failed to push:", err.message);
}
