'use server'

import { createAdminClient } from '@/utils/supabase/server'

export interface LeadData {
    name: string;
    address: string;
    property_id: string;
    user_id: string;
    message?: string;
    wensen?: string;
    budget?: string;
    score?: number;
    is_hot?: boolean;
    image?: string;
}

export async function createLead(leadData: LeadData) {
    const supabase = await createAdminClient()

    // Default image if none provided
    const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(leadData.name)}&background=0df2a2&color=050505&bold=true`

    const { property_id, ...insertData } = leadData;

    const { data, error } = await supabase
        .from('leads')
        .insert({
            ...insertData,
            image: leadData.image || defaultImage,
            status: 'new',
            message: leadData.message || `Lead via Voice AI op woning: ${property_id}`,
            created_at: new Date().toISOString()
        })
        .select()
        .single()

    if (error) {
        console.error('Error creating lead:', error)
        throw error
    }

    return data
}

export async function saveChatMessage(leadId: string, sender: 'ai' | 'lead', message: string) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('lead_chat_messages')
        .insert({
            lead_id: leadId,
            sender,
            message,
            time: new Date().toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' }),
            created_at: new Date().toISOString()
        })

    if (error) {
        console.error('Error saving chat message:', error)
        throw error
    }
}

export async function updateLeadScore(leadId: string, score: number, isHot: boolean) {
    const supabase = await createAdminClient()

    const { error } = await supabase
        .from('leads')
        .update({ score, is_hot: isHot })
        .eq('id', leadId)

    if (error) {
        console.error('Error updating lead score:', error)
        throw error
    }
}
