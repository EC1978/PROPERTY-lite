'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type IntegrationStatus = 'Verbonden' | 'Niet gekoppeld';

export interface Integration {
    provider: 'google' | 'microsoft' | 'realworks';
    status: IntegrationStatus;
    connectedAt?: string;
}

export async function getUserIntegrations(): Promise<{ integrations: Integration[], error: string | null }> {
    const supabase = await createClient();

    const { data: userData, error: userError } = await supabase.auth.getUser();

    if (userError || !userData?.user) {
        return { integrations: [], error: 'User not authenticated' };
    }

    const { data: activeIntegrations, error } = await supabase
        .from('user_integrations')
        .select('provider, created_at')
        .eq('user_id', userData.user.id);

    if (error) {
        console.error('Error fetching user integrations', error);
        return { integrations: [], error: 'Failed to fetch integrations' };
    }

    const providers: ('google' | 'microsoft' | 'realworks')[] = ['google', 'microsoft', 'realworks'];

    const integrations: Integration[] = providers.map((provider) => {
        const active = activeIntegrations?.find((int: any) => int.provider === provider);
        return {
            provider,
            status: active ? 'Verbonden' : 'Niet gekoppeld',
            connectedAt: active ? active.created_at : undefined,
        };
    });

    return { integrations, error: null };
}

// Temporary action to mock linking for Phase 5 frontend only
export async function toggleIntegrationConnection(provider: string, currentStatus: IntegrationStatus) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return { success: false, error: 'Not authenticated' };

    if (currentStatus === 'Verbonden') {
        const { error } = await supabase
            .from('user_integrations')
            .delete()
            .match({ user_id: userData.user.id, provider });

        if (error) return { success: false, error: error.message };
    } else {
        // Need a dummy token to test the connection State
        const { error } = await supabase
            .from('user_integrations')
            .insert({
                user_id: userData.user.id,
                provider,
                access_token: 'dummy_token_' + Date.now()
            });

        if (error) return { success: false, error: error.message };
    }

    revalidatePath('/settings/integrations');
    return { success: true };
}

export async function saveRealworksToken(token: string) {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();

    if (!userData?.user) return { success: false, error: 'Not authenticated' };

    const { error } = await supabase
        .from('user_integrations')
        .upsert({
            user_id: userData.user.id,
            provider: 'realworks',
            access_token: token,
        }, { onConflict: 'user_id,provider' });

    if (error) return { success: false, error: error.message };

    revalidatePath('/settings/integrations');
    return { success: true };
}
