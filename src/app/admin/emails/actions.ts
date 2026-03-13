'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import nodemailer from 'nodemailer';
import { processTemplate } from '@/utils/template-processor';

export async function updateEmailTemplate(id: string, data: { 
    subject: string; 
    html_body: string;
    description?: string;
    is_active?: boolean;
}) {
    const supabase = await createClient();

    // Verify superadmin status
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin') {
        return { success: false, error: 'Unauthorized. Only superadmins can edit global templates.' };
    }

    const updateData: any = {
        subject: data.subject,
        html_body: data.html_body,
        updated_at: new Date().toISOString()
    };

    if (data.description !== undefined) updateData.description = data.description;
    if (data.is_active !== undefined) updateData.is_active = data.is_active;

    const { error } = await supabase
        .from('email_templates')
        .update(updateData)
        .eq('id', id);

    if (error) {
        console.error('Error updating template:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/emails');
    revalidatePath(`/admin/emails/${id}`);
    return { success: true };
}

export async function toggleTemplateActive(id: string, isActive: boolean) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'Not authenticated' };

    const { data: profile } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();

    if (profile?.role !== 'superadmin') {
        return { success: false, error: 'Unauthorized' };
    }

    const { error } = await supabase
        .from('email_templates')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        return { success: false, error: error.message };
    }

    revalidatePath('/admin/emails');
    return { success: true };
}

export async function sendTemplateTestEmail(templateId: string, testRecipient: string) {
    const supabase = await createClient();

    // Verify superadmin
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
        // Get Template
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (templateError || !template) {
            return { success: false, error: 'Template niet gevonden' };
        }

        // Get SMTP Settings
        const { data: smtp } = await supabase
            .from('smtp_settings')
            .select('*')
            .eq('id', 1)
            .single();

        if (!smtp || !smtp.host) {
            return { success: false, error: 'SMTP instellingen zijn niet geconfigureerd' };
        }

        // Test variables
        const previewData = {
            agent_name: 'Test Agent',
            lead_name: 'Test Lead',
            office_name: 'VoiceRealty Test Office',
            property_address: 'Keizersgracht 123, Amsterdam',
            appointment_date: 'Maandag 20 Maart',
            appointment_time: '14:30',
            status: 'IN BEHANDELING',
            message: 'Dit is een testbericht.',
            link: 'https://voicerealty.ai',
            titel: 'Test Melding'
        };

        const subject = processTemplate(template.subject, previewData);
        const html = processTemplate(template.html_body, previewData);

        const transporter = nodemailer.createTransport({
            host: smtp.host,
            port: smtp.port,
            secure: smtp.secure,
            auth: {
                user: smtp.user,
                pass: smtp.pass,
            },
        });

        await transporter.sendMail({
            from: `"${smtp.from_name}" <${smtp.from_email}>`,
            to: testRecipient,
            subject: `[TEST] ${subject}`,
            html: html,
        });

        return { success: true };
    } catch (error: any) {
        console.error('Template test send error:', error);
        return { success: false, error: error.message };
    }
}
