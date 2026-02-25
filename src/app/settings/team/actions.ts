'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';

export type TeamRole = 'Beheerder' | 'Makelaar';
export type TeamStatus = 'Pending' | 'Active';

export interface TeamMember {
    id: string;
    broker_id: string;
    email: string;
    role: TeamRole;
    status: TeamStatus;
    created_at: string;
    updated_at: string;
}

export async function getTeamMembers() {
    try {
        const supabase = await createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return { error: 'Niet geautoriseerd.' };
        }

        const { data, error } = await supabase
            .from('team_members')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching team members:', error);
            return { error: 'Fout bij ophalen teamleden.' };
        }

        return { members: data as TeamMember[] };
    } catch (err: any) {
        console.error('Unexpected error fetching team members:', err);
        return { error: 'Onverwachte fout opgetreden.' };
    }
}

export async function inviteTeamMember(formData: FormData) {
    try {
        const email = formData.get('email') as string;
        const role = formData.get('role') as TeamRole;

        if (!email || !role) {
            return { success: false, error: 'E-mailadres en rol zijn verplicht.' };
        }

        const supabase = await createClient();
        const { data: userData, error: userError } = await supabase.auth.getUser();

        if (userError || !userData?.user) {
            return { success: false, error: 'Niet geautoriseerd.' };
        }

        const { error } = await supabase
            .from('team_members')
            .insert({
                broker_id: userData.user.id,
                email,
                role,
                status: 'Pending'
            });

        if (error) {
            if (error.code === '23505') { // Unique constraint violation
                return { success: false, error: 'Dit lid is al uitgenodigd of bestaat al in uw team.' };
            }
            console.error('Error inserting team member:', error);
            return { success: false, error: 'Fout bij uitnodigen teamlid.' };
        }

        revalidatePath('/settings/team');
        return { success: true };
    } catch (err: any) {
        console.error('Unexpected error inviting team member:', err);
        return { success: false, error: 'Onverwachte fout opgetreden.' };
    }
}

export async function deleteTeamMember(id: string) {
    try {
        const supabase = await createClient();
        const { error } = await supabase
            .from('team_members')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting team member:', error);
            return { success: false, error: 'Fout bij verwijderen teamlid.' };
        }

        revalidatePath('/settings/team');
        return { success: true };
    } catch (err: any) {
        console.error('Unexpected error deleting team member:', err);
        return { success: false, error: 'Onverwachte fout opgetreden.' };
    }
}
