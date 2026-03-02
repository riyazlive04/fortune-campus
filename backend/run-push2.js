const { execSync } = require('child_process');
const fs = require('fs');

try {
    console.log("Starting prisma db push...");
    // Using dotenv explicitly to rule out PowerShell environment bleeding
    require('dotenv').config();
    const output = execSync('npx prisma db push --accept-data-loss', { encoding: 'utf8' });
    console.log("SUCCESS:");
    console.log(output);
    fs.writeFileSync('push_success.txt', output);
} catch (error) {
    console.error("FAILED:");
    console.log(error.stdout);
    console.log(error.stderr);
    fs.writeFileSync('push_error.txt', error.stdout + '\n' + error.stderr);
}
