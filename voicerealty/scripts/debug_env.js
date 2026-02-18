const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
    const buffer = fs.readFileSync(envPath);
    console.log('First 20 bytes:', buffer.slice(0, 20));
    console.log('Hex:', buffer.slice(0, 20).toString('hex'));
} catch (e) {
    console.error('Error:', e);
}
