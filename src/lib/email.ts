import { Resend } from 'resend';

// NOTE: This will require a valid Resend API key in the .env.local file:
// RESEND_API_KEY=re_...
const resend = new Resend(process.env.RESEND_API_KEY || 'dummy_key');

interface SendEmailParams {
    to: string;
    subject: string;
    html: string;
    text?: string;
    from?: string;
}

export async function sendEmail({ to, subject, html, text, from = 'onboarding@resend.dev' }: SendEmailParams) {
    if (!process.env.RESEND_API_KEY) {
        console.log('No RESEND_API_KEY found. Mocking email send:');
        console.log(`To: ${to}\nSubject: ${subject}\nBody: ${text || html}`);
        return { success: true, dummy: true };
    }

    try {
        const data = await resend.emails.send({
            from,
            to,
            subject,
            html,
            text,
        });

        return { success: true, data };
    } catch (error: any) {
        console.error('Failed to send email:', error);
        return { success: false, error: error.message };
    }
}
