import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Sidebar from '@/components/layout/Sidebar'
import MobileNav from '@/components/layout/MobileNav'
import MobileMenu from '@/components/layout/MobileMenu'
import LeadsBoard from '@/components/leads/LeadsBoard'
import type { Lead } from '@/components/leads/LeadsBoard'

export default async function LeadsPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
        redirect('/login')
    }

    // Fetch leads for the current user
    const { data: leadsData, error: leadsError } = await supabase
        .from('leads')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

    // Fetch chat messages for all leads
    let leads: Lead[] = []

    if (leadsData && leadsData.length > 0) {
        const leadIds = leadsData.map(l => l.id)

        const { data: messagesData } = await supabase
            .from('lead_chat_messages')
            .select('*')
            .in('lead_id', leadIds)
            .order('created_at', { ascending: true })

        // Map messages to leads
        const messagesByLead: Record<string, { sender: 'ai' | 'lead'; message: string; time: string }[]> = {}
        for (const msg of messagesData || []) {
            if (!messagesByLead[msg.lead_id]) {
                messagesByLead[msg.lead_id] = []
            }
            messagesByLead[msg.lead_id].push({
                sender: msg.sender as 'ai' | 'lead',
                message: msg.message,
                time: msg.time,
            })
        }

        leads = leadsData.map(lead => ({
            id: lead.id,
            name: lead.name,
            address: lead.address,
            status: lead.status as Lead['status'],
            score: lead.score,
            is_hot: lead.is_hot,
            created_at: lead.created_at,
            message: lead.message,
            image: lead.image,
            wensen: lead.wensen,
            budget: lead.budget,
            chatHistory: messagesByLead[lead.id] || [],
        }))
    }

    return (
        <div className="flex min-h-screen bg-[#F8F9FB] dark:bg-[#050505] text-slate-800 dark:text-slate-100 font-sans relative">

            {/* Custom Stitch Ambient Glow (Background) */}
            <div className="fixed top-0 left-0 w-full h-full pointer-events-none z-0 overflow-hidden">
                <div className="absolute -top-24 -left-24 w-96 h-96 bg-[#0df2a2]/10 rounded-full blur-[120px]"></div>
                <div className="absolute top-1/2 -right-24 w-64 h-64 bg-[#0df2a2]/5 rounded-full blur-[100px]"></div>
            </div>

            <Sidebar userEmail={user.email} />

            {/* --- MOBILE HEADER --- */}
            <div className="md:hidden fixed top-0 left-0 right-0 z-40 bg-white/80 dark:bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-gray-200 dark:border-white/5 px-6 py-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <MobileMenu userEmail={user.email || undefined} />
                    <span className="font-bold text-lg tracking-tight">Leads Inbox</span>
                </div>
                <div className="w-8 h-8 rounded-full border border-[#0df2a2]/30 flex items-center justify-center p-0.5">
                    <div className="w-full h-full rounded-full bg-gradient-to-tr from-emerald-400 to-[#0df2a2] flex items-center justify-center text-[#050505] font-bold text-xs">
                        {user.email?.charAt(0).toUpperCase()}
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="flex-1 md:ml-72 p-4 pt-24 md:p-10 md:pt-10 pb-32 md:pb-10 max-w-2xl mx-auto space-y-6 relative z-10 w-full">

                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 tracking-tight">
                            Team Inbox
                        </h1>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                            Beheer inkomende leads en AI chats.
                        </p>
                    </div>
                </div>

                <LeadsBoard leads={leads} />

            </main>

            <MobileNav />
        </div>
    )
}
