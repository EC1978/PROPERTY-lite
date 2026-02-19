import OpenAI from 'openai';
import fs from 'fs';
import path from 'path';

// Load .env.local manually
const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, 'utf8');
    envConfig.split('\n').forEach(line => {
        const [key, value] = line.split('=');
        if (key && value) {
            process.env[key.trim()] = value.trim();
        }
    });
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

async function main() {
    try {
        console.log('Testing OpenAI API...');
        const completion = await openai.chat.completions.create({
            model: "gpt-4o",
            messages: [{ role: "user", content: "Hello" }],
        });
        console.log('Success:', completion.choices[0].message.content);
    } catch (error) {
        console.error('Error:', error);
    }
}

main();
