'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getUserNotifications() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, data: [] };

    const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .in('type', ['in-app', 'both'])
        .order('created_at', { ascending: false })
        .limit(20);

    if (error) {
        console.error('Error fetching notifications:', error);
        return { success: false, data: [], error: error.message };
    }

    return { success: true, data };
}

export async function markNotificationAsRead(notificationId: string) {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase
        .from('notifications')
        .update({ 
            status: 'read',
            read_at: new Date().toISOString()
        })
        .eq('id', notificationId)
        .eq('user_id', user.id);

    if (error) {
        console.error('Error marking notification read:', error);
        return { success: false };
    }

    revalidatePath('/dashboard');
    return { success: true };
}

export async function markAllNotificationsAsRead() {
    const supabase = await createClient();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false };

    const { error } = await supabase
        .from('notifications')
        .update({ 
            status: 'read',
            read_at: new Date().toISOString()
        })
        .eq('status', 'unread')
        .eq('user_id', user.id);

    if (error) {
        console.error('Error marking all notifications read:', error);
        return { success: false };
    }

    revalidatePath('/dashboard');
    return { success: true };
}
