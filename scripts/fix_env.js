const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');

try {
    const buffer = fs.readFileSync(envPath);
    const content = buffer.toString('utf16le');

    // Simple check: if the decoded content implies legitimate keys
    if (content.includes('NEXT_PUBLIC_SUPABASE_URL')) {
        fs.writeFileSync(envPath, content, 'utf8');
        console.log('Successfully converted .env.local from UTF-16LE to UTF-8.');
    } else {
        console.log('Content did not decrypt to expected keys, skipping write.');
        console.log('Decoded start:', content.substring(0, 50));
    }
} catch (e) {
    console.error('Error fixing env file:', e);
}
