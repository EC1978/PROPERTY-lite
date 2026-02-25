'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type NotificationType = 'new_lead' | 'new_review' | 'system_updates';

export interface NotificationPreference {
    type: NotificationType;
    pushEnabled: boolean;
    emailEnabled: boolean;
}

const DEFAULT_PREFERENCES: NotificationPreference[] = [
    { type: 'new_lead', pushEnabled: true, emailEnabled: true },
    { type: 'new_review', pushEnabled: true, emailEnabled: true },
    { type: 'system_updates', pushEnabled: true, emailEnabled: true },
];

export async function getNotificationPreferences(): Promise<{ preferences: NotificationPreference[], error: string | null }> {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { preferences: DEFAULT_PREFERENCES, error: 'User not authenticated' };
    }

    const { data: dbPreferences, error: dbError } = await supabase
        .from('user_notification_preferences')
        .select('type, push_enabled, email_enabled')
        .eq('user_id', userData.user.id);

    if (dbError) {
        console.error('Error fetching user notification preferences', dbError);
        return { preferences: DEFAULT_PREFERENCES, error: 'Failed to fetch notification preferences' };
    }

    // Map database output to our interface, falling back to defaults for any missing types
    const mappedPreferences = DEFAULT_PREFERENCES.map(defaultPref => {
        const dbPref = dbPreferences?.find(p => p.type === defaultPref.type);
        if (dbPref) {
            return {
                type: defaultPref.type,
                pushEnabled: dbPref.push_enabled,
                emailEnabled: dbPref.email_enabled
            };
        }
        return defaultPref;
    });

    return { preferences: mappedPreferences, error: null };
}

export async function toggleNotificationPreference(
    type: NotificationType,
    channel: 'pushEnabled' | 'emailEnabled',
    currentStatus: boolean
) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return { success: false, error: 'Not authenticated' };

    const newStatus = !currentStatus;

    // First, fetch existing record for this type if it exists so we can update just one field
    // without resetting the other to default
    const { data: existingPref } = await supabase
        .from('user_notification_preferences')
        .select('push_enabled, email_enabled')
        .eq('user_id', userData.user.id)
        .eq('type', type)
        .single();

    const push_enabled = channel === 'pushEnabled' ? newStatus : (existingPref?.push_enabled ?? true);
    const email_enabled = channel === 'emailEnabled' ? newStatus : (existingPref?.email_enabled ?? true);

    const { error } = await supabase
        .from('user_notification_preferences')
        .upsert({
            user_id: userData.user.id,
            type: type,
            push_enabled,
            email_enabled,
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_id,type' });

    if (error) {
        console.error('Error toggling notification preference:', error);
        return { success: false, error: error.message };
    }

    revalidatePath('/settings/notifications');
    return { success: true, newStatus };
}
