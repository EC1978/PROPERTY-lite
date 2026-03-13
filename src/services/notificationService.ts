import { createClient } from '@/utils/supabase/server';
import nodemailer from 'nodemailer';
import { processTemplate } from '@/utils/template-processor';

interface SendNotificationParams {
    userId: string;
    category: 'system' | 'lead_update' | 'review' | 'appointment' | 'other';
    type?: 'email' | 'in-app' | 'both' | 'none';
    title?: string;
    message?: string;
    payload?: Record<string, any>;
    templateId?: string;
}

export async function sendNotification({
    userId,
    category,
    type = 'both',
    title: initialTitle = '',
    message: initialMessage = '',
    payload = {},
    templateId,
}: SendNotificationParams) {
    const supabase = await createClient();
    
    let title = initialTitle;
    let message = initialMessage;
    let htmlBody = '';

    // 1. Fetch and process template if templateId is provided
    if (templateId) {
        const { data: template, error: templateError } = await supabase
            .from('email_templates')
            .select('*')
            .eq('id', templateId)
            .single();

        if (templateError || !template) {
            console.error('Error fetching template for notification:', templateId, templateError);
        } else {
            // Process placeholders in template fields
            title = processTemplate(template.subject || initialTitle, payload);
            message = processTemplate(template.text_body || template.html_body?.replace(/<[^>]*>?/gm, '') || initialMessage, payload);
            htmlBody = processTemplate(template.html_body || '', payload);
        }
    } else {
        // Process placeholders in provided title/message even without a template
        title = processTemplate(initialTitle, payload);
        message = processTemplate(initialMessage, payload);
    }

    // 2. Save to in-app database
    let notificationId = null;
    if (type === 'in-app' || type === 'both') {
        const { data, error } = await supabase
            .from('notifications')
            .insert({
                user_id: userId,
                category,
                type,
                title,
                message,
                payload: { ...payload, template_id: templateId }, // Store template reference in payload
                status: 'unread'
            })
            .select('id')
            .single();

        if (error) {
            console.error('Error saving notification:', error);
        } else {
            notificationId = data?.id;
        }
    }

    // 3. Send Email if necessary
    if (type === 'email' || type === 'both') {
        try {
            // Get user's email
            const { data: user } = await supabase
                .from('users')
                .select('email')
                .eq('id', userId)
                .single();

            if (!user?.email) {
                console.warn(`User ${userId} has no email address.`);
                return { success: false, error: 'User has no email address.' };
            }

            // Get SMTP Settings
            const { data: smtp } = await supabase
                .from('smtp_settings')
                .select('*')
                .eq('id', 1)
                .single();

            if (!smtp || !smtp.host) {
                console.warn('❌ SMTP settings not found or incomplete. Cannot send email notification.');
            } else {
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
                    to: user.email,
                    subject: title,
                    text: message,
                    html: htmlBody || `
                        <div style="font-family: sans-serif; padding: 30px; max-width: 600px; margin: 0 auto; background-color: #f9f9f9; border-radius: 12px;">
                            <h2 style="color: #111; margin-bottom: 20px;">${title}</h2>
                            <p style="color: #444; font-size: 15px; line-height: 1.6;">${message}</p>
                            <hr style="border: none; border-top: 1px solid #ddd; margin: 30px 0;" />
                            <p style="color: #999; font-size: 12px; text-align: center;">Dit is een geautomatiseerde e-mail van het VoiceRealty Systeem.</p>
                        </div>
                    `,
                });
                console.log(`✅ Email sent to ${user.email}: ${title}`);
            }
        } catch (error) {
            console.error('❌ Failed to send email notification:', error);
        }
    }

    return { success: true, notificationId };
}
