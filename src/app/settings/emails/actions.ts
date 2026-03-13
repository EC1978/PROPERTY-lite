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

    // Fetch the user's profile to get team_id and role
    const { data: profile } = await supabase
        .from('users')
        .select('team_id, role')
        .eq('id', userData.user.id)
        .single();

    if (!profile?.team_id) {
        // Fallback for users without a team (unlikely in this context, but safe)
        return { settings: [], error: 'Geen kantoor gekoppeld aan uw account.' };
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

    // 2. Fetch the TEAM specific preferences
    const { data: preferences, error: prefError } = await supabase
        .from('team_email_preferences')
        .select('template_id, is_enabled')
        .eq('team_id', profile.team_id);

    if (prefError) {
        console.error('Error fetching team email preferences', prefError);
        return { settings: [], error: 'Failed to fetch email preferences' };
    }

    // 3. Merge them
    const settings: EmailSetting[] = templates.map((template: any) => {
        const pref = preferences?.find((p: any) => p.template_id === template.id);

        // If no preference exists, we assume it is enabled by default
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

    // Fetch the user's profile to get team_id and role
    const { data: profile } = await supabase
        .from('users')
        .select('team_id, role')
        .eq('id', userData.user.id)
        .single();

    if (!profile?.team_id) {
        return { success: false, error: 'Geen kantoor gekoppeld.' };
    }

    // Only Admins or Superadmins should be able to toggle
    const isAdmin = profile.role === 'Beheerder' || profile.role === 'owner' || profile.role === 'superadmin';
    if (!isAdmin) {
        return { success: false, error: 'U heeft geen rechten om deze kantoorinstellingen te wijzigen.' };
    }

    const newStatus = !currentStatus;

    // Upsert the preference for the TEAM
    const { error } = await supabase
        .from('team_email_preferences')
        .upsert({
            team_id: profile.team_id,
            template_id: templateId,
            is_enabled: newStatus,
            updated_at: new Date().toISOString()
        }, { onConflict: 'team_id,template_id' });

    if (error) {
        console.error('Error toggling team email preference:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/emails');
    return { success: true, newStatus };
}
