'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export interface EmailSetting {
    id: string;          // template id
    name: string;        // Name (e.g., "Welkomstmail")
    subject: string;     // Subject
    isEnabled: boolean;  // User preference
}

export async function getEmailSettings(): Promise<{ settings: EmailSetting[], error: string | null }> {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { settings: [], error: 'User not authenticated' };
    }

    // 1. Fetch all available global templates
    const { data: templates, error: templatesError } = await supabase
        .from('email_templates')
        .select('id, name, subject')
        .order('created_at', { ascending: true });

    if (templatesError) {
        console.error('Error fetching email templates', templatesError);
        return { settings: [], error: 'Failed to fetch email templates' };
    }

    if (!templates) {
        return { settings: [], error: null };
    }

    // 2. Fetch the user's specific preferences
    const { data: preferences, error: prefError } = await supabase
        .from('user_email_preferences')
        .select('template_id, is_enabled')
        .eq('user_id', userData.user.id);

    if (prefError) {
        console.error('Error fetching user email preferences', prefError);
        return { settings: [], error: 'Failed to fetch email preferences' };
    }

    // 3. Merge them
    const settings: EmailSetting[] = templates.map((template: any) => {
        const pref = preferences?.find((p: any) => p.template_id === template.id);

        // If no preference exists, we assume it is enabled by default (as per our DB default)
        const isEnabled = pref ? pref.is_enabled : true;

        return {
            id: template.id,
            name: template.name,
            subject: template.subject,
            isEnabled,
        };
    });

    return { settings, error: null };
}

export async function toggleEmailPreference(templateId: string, currentStatus: boolean) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return { success: false, error: 'Not authenticated' };

    const newStatus = !currentStatus;

    // Upsert the preference for the user
    // The policy ensures they can only insert/update for their own user_id
    const { error } = await supabase
        .from('user_email_preferences')
        .upsert({
            user_id: userData.user.id,
            template_id: templateId,
            is_enabled: newStatus,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,template_id' });

    if (error) {
        console.error('Error toggling email preference:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/emails');
    return { success: true, newStatus };
}
