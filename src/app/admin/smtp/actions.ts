'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';

export async function getSmtpSettings() {
    const supabase = await createClient();
    
    // Check permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return null;

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin') return null;

    const { data, error } = await supabase
        .from('smtp_settings')
        .select('*')
        .eq('id', 1)
        .single();
        
    if (error && error.code !== 'PGRST116') { // Ignore not found error
        console.error('Error fetching SMTP settings:', error);
    }
    
    return data;
}

export async function updateSmtpSettings(formData: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from_email: string;
    from_name: string;
}) {
    const supabase = await createClient();

    // Check permission
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single();

    if (profile?.role !== 'superadmin') {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('smtp_settings')
        .upsert({
            id: 1, // Singleton
            ...formData,
            updated_at: new Date().toISOString()
        });

    if (error) {
        console.error('Error updating SMTP settings:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/smtp');
    return { success: true };
}

export async function sendTestEmail(settings: {
    host: string;
    port: number;
    secure: boolean;
    user: string;
    pass: string;
    from_email: string;
    from_name: string;
}, testRecipient: string) {
    const supabase = await createClient();

    // Check permission
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Niet geauthenticeerd' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin') {
        return { success: false, error: 'Geen toegang' };
    }

    try {
        const transporter = nodemailer.createTransport({
            host: settings.host,
            port: settings.port,
            secure: settings.secure,
            auth: {
                user: settings.user,
                pass: settings.pass,
            },
        });

        // First verify connection
        await transporter.verify();

        // Then send email
        await transporter.sendMail({
            from: `"${settings.from_name}" <${settings.from_email}>`,
            to: testRecipient,
            subject: 'Test E-mail - VoiceRealty Systeem',
            text: 'Dit is een test e-mail om je SMTP instellingen te verifiëren.',
            html: `
                <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                    <h2 style="color: #0df2a2;">SMTP Verbinding Gelukt!</h2>
                    <p>Je hebt zojuist succesvol een test e-mail verstuurd vanuit het VoiceRealty dashboard.</p>
                    <p style="color: #666; font-size: 12px; margin-top: 20px;">Ontvanger: ${testRecipient}</p>
                </div>
            `,
        });

        return { success: true };
    } catch (error: any) {
        console.error('SMTP Test Error:', error);
        return { success: false, error: error.message };
    }
}
