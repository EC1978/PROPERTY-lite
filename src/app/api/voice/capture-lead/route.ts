import { NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'

function createSupabase() {
    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
            cookies: {
                getAll() { return [] },
                setAll() { /* ignore */ },
            },
        }
    )
}

// POST: Create a new lead when voice session starts
export async function POST(request: Request) {
    try {
        const body = await request.json()
        const { name, wensen, budget, propertyId, userId, address } = body

        console.log("📥 Lead Create API:", { name, propertyId, userId })

        const supabase = createSupabase()

        const defaultImage = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Anoniem')}&background=0df2a2&color=050505&bold=true`

        const insertPayload: Record<string, any> = {
            name: name || 'Anonieme bezoeker',
            address: address || 'Bezoeker van woningpagina',
            status: 'new',
            score: 0,
            is_hot: false,
            image: defaultImage,
            message: `Lead via Voice AI op woning: ${propertyId || 'onbekend'}`,
            created_at: new Date().toISOString(),
        }

        if (wensen) insertPayload.wensen = wensen
        if (budget) insertPayload.budget = budget
        if (userId && userId.length > 10) {
            insertPayload.user_id = userId
        }

        console.log("📝 Inserting lead:", insertPayload)

        const { data, error } = await supabase
            .from('leads')
            .insert(insertPayload)
            .select()
            .single()

        if (error) {
            console.error('❌ Lead insert error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        console.log('✅ Lead created:', data.id)
        return NextResponse.json({ success: true, leadId: data.id })

    } catch (err: any) {
        console.error('❌ Lead Create fatal error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

// PATCH: Update lead with extracted conversation data
export async function PATCH(request: Request) {
    try {
        const body = await request.json()
        const { leadId, name, phone, email, reason, budget, transcript, score } = body

        console.log("📥 Lead Update API:", { leadId, name, phone, email, score })

        if (!leadId) {
            return NextResponse.json({ success: false, error: 'leadId required' }, { status: 400 })
        }

        const supabase = createSupabase()

        const updatePayload: Record<string, any> = {}

        // Update name if provided and not placeholder
        if (name && name !== 'Voice AI Bezoeker') {
            updatePayload.name = name
            updatePayload.image = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=0df2a2&color=050505&bold=true`
        }

        // Build rich wensen field with all contact details
        const wensenParts: string[] = []
        if (phone) wensenParts.push(`📞 Telefoon: ${phone}`)
        if (email) wensenParts.push(`📧 Email: ${email}`)
        if (reason) wensenParts.push(`💬 Reden: ${reason}`)
        if (budget) wensenParts.push(`💰 Budget: ${budget}`)

        if (wensenParts.length > 0) {
            updatePayload.wensen = wensenParts.join('\n')
        }

        // Store transcript in message field
        if (transcript) {
            updatePayload.message = transcript
        }

        // Update score and hot status
        if (score !== undefined && score !== null) {
            const numScore = Math.min(100, Math.max(0, parseInt(score) || 0))
            updatePayload.score = numScore
            updatePayload.is_hot = numScore >= 60
        }

        if (Object.keys(updatePayload).length === 0) {
            return NextResponse.json({ success: true, message: 'No updates' })
        }

        console.log("📝 Updating lead:", updatePayload)

        const { error } = await supabase
            .from('leads')
            .update(updatePayload)
            .eq('id', leadId)

        if (error) {
            console.error('❌ Lead update error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        console.log('✅ Lead updated:', leadId)
        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('❌ Lead Update fatal error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

// DELETE: Remove a lead
export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url)
        const leadId = searchParams.get('id')

        if (!leadId) {
            return NextResponse.json({ success: false, error: 'Lead ID required' }, { status: 400 })
        }

        console.log("🗑️ Deleting lead:", leadId)

        const supabase = createSupabase()

        // First delete related chat messages
        await supabase.from('lead_chat_messages').delete().eq('lead_id', leadId)

        // Then delete the lead itself
        const { error } = await supabase.from('leads').delete().eq('id', leadId)

        if (error) {
            console.error('❌ Lead delete error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        console.log('✅ Lead deleted:', leadId)
        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('❌ Lead Delete fatal error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}

// PUT: Update lead status
export async function PUT(request: Request) {
    try {
        const body = await request.json()
        const { leadId, status } = body

        if (!leadId || !status) {
            return NextResponse.json({ success: false, error: 'leadId and status required' }, { status: 400 })
        }

        const validStatuses = ['new', 'contacted', 'negotiation', 'closed']
        if (!validStatuses.includes(status)) {
            return NextResponse.json({ success: false, error: 'Invalid status' }, { status: 400 })
        }

        console.log("🔄 Updating lead status:", { leadId, status })

        const supabase = createSupabase()

        const { error } = await supabase
            .from('leads')
            .update({ status })
            .eq('id', leadId)

        if (error) {
            console.error('❌ Status update error:', error)
            return NextResponse.json({ success: false, error: error.message }, { status: 500 })
        }

        console.log('✅ Status updated:', leadId, '→', status)
        return NextResponse.json({ success: true })

    } catch (err: any) {
        console.error('❌ Status Update fatal error:', err)
        return NextResponse.json({ success: false, error: err.message }, { status: 500 })
    }
}
