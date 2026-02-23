import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

/**
 * One-time seed endpoint for populating leads data.
 * POST /api/seed-leads
 * 
 * Uses the current user's auth session to insert leads owned by them.
 * Safe to run multiple times — it checks for existing data first.
 */
export async function POST() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if leads already exist for this user
    const { data: existingLeads } = await supabase
        .from('leads')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)

    if (existingLeads && existingLeads.length > 0) {
        return NextResponse.json({ message: 'Leads already seeded', count: existingLeads.length })
    }

    // Seed leads
    const leads = [
        {
            name: 'Jasper de Vries',
            address: 'Grachtengracht 12, Amsterdam',
            status: 'new',
            score: 92,
            is_hot: true,
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDQpkG0hRxPqZw9uxp_LyIGDl5McEP-eTTidOPKVxFpqrG_ztlFQBI5jcInN0mdYNJP_jkRwA1DTJeLqjsBWBhKp_cuR82GVrIUHiTkwFCXWBX_SPQnSUL2BCe4hLaaUkSUvIMdEqkDq-neaGuX8LxmVySaF9MWW-Yo4S_m8kB7mvMfVDrVDbfr-pA2A51srt0ZqlZGergSSawv_QNTdn8OlQ_P3uArkhbONLxEPkVg8RcxEBbvKKdAB6f6s5do0tZWc0YiJKwX-f4',
            wensen: 'Zoekt 3-kamer app. in Centrum.',
            budget: '€1.2M',
            user_id: user.id,
        },
        {
            name: 'Sophie Bakker',
            address: 'Keizersgracht 45, Amsterdam',
            status: 'contacted',
            score: 78,
            is_hot: false,
            message: '"Wil morgen de tuin bekijken..."',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD5HF1g9nxGEAbsn7J22vFAnxk-fyc4vTe_5rYF4q6wjZ84cinKRIfx_7OMdkve3bNe-mCfIeantpJ4g4OohM5y-W8qhpeBSmuAScpcseZ9OKQad_xJASQeNgMJn93KRNvlM1MuxT22ghQNkb4AOkV4-dxahRUs0anIxCM9Cq5izWTqGUaapDfvHJsXyTqiDkKgMTHGOzOBPno7NaKU_Y00NF7SpC6qozRfu979RX_CLMxjxNUqQ1rl-5DJEjq3eqDU9o-WU1lhRZg',
            wensen: 'Tuin of ruim balkon...',
            budget: '€850k',
            user_id: user.id,
        },
        {
            name: 'Mark van den Berg',
            address: 'Singel 102, Utrecht',
            status: 'negotiation',
            score: 88,
            is_hot: false,
            message: 'Hypotheek check ok',
            image: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUv33lMK3D9K5-nSsP-gmaidl7PTiXvv_NvTGwr_zyIjw1IhAv4m17HZwF7ptl_GcOkQloBc6lcSOvxxub2cvEEC31_s1dSHSjqcGFVfehq-GFrv9hZnnLdWWVF7z26IYTdwozHpeIkenFDgFwSuw_dxfL-Fh7eusYMwG2cyTsbq70xrPh0ByLS1hzHlH3Jewu2dfee3C3Y06Cq3K3ONPa3P47VBNYVVU2vTaEeihVd8vZ-u7SHcu5-JUGi-AUyQ_vUwORxIw2PfU',
            wensen: 'Kindvriendelijke buurt, basisschool in de buurt.',
            budget: '€650k',
            user_id: user.id,
        },
    ]

    const { data: insertedLeads, error: insertError } = await supabase
        .from('leads')
        .insert(leads)
        .select('id, name')

    if (insertError) {
        return NextResponse.json({ error: insertError.message }, { status: 500 })
    }

    // Seed chat messages
    const chatData: Record<string, { sender: string; message: string; time: string }[]> = {
        'Jasper de Vries': [
            { sender: 'ai', message: 'Hallo Jasper, dit is VoiceRealty AI. Ik zag dat je naar de woning aan de Grachtengracht keek. Ben je nog steeds geïnteresseerd?', time: '10:42' },
            { sender: 'lead', message: 'Ja, precies. Ik wil eigenlijk binnen twee maanden verhuizen, dus ik probeer zo snel mogelijk bezichtigingen te plannen.', time: '10:43' },
            { sender: 'ai', message: 'Dat is een mooi tijdpad. Meteen een bezichtiging inplannen?', time: '10:43' },
        ],
        'Sophie Bakker': [
            { sender: 'ai', message: 'Hi Sophie, heb je de brochure ontvangen?', time: '09:00' },
            { sender: 'lead', message: 'Ja klopt. Wil morgen de tuin bekijken...', time: '09:12' },
        ],
        'Mark van den Berg': [
            { sender: 'ai', message: 'Heb je nog vragen over de woning in Utrecht?', time: '13:00' },
            { sender: 'lead', message: 'Ja, is er een garage bij inbegrepen?', time: '13:10' },
        ],
    }

    let totalMessages = 0
    for (const lead of insertedLeads || []) {
        const messages = chatData[lead.name]
        if (messages) {
            const chatRows = messages.map(m => ({
                lead_id: lead.id,
                sender: m.sender,
                message: m.message,
                time: m.time,
            }))

            const { error: chatError } = await supabase
                .from('lead_chat_messages')
                .insert(chatRows)

            if (chatError) {
                console.error(`Error inserting chat for ${lead.name}:`, chatError.message)
            } else {
                totalMessages += messages.length
            }
        }
    }

    return NextResponse.json({
        success: true,
        leads: insertedLeads?.length || 0,
        messages: totalMessages,
    })
}
