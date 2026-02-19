
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'

export async function POST(request: Request) {
    console.log("🎤 Voice Session Request Started");
    try {
        const body = await request.json();
        const { propertyId } = body;
        console.log("📦 Request Body:", body);

        const supabase = await createClient()

        // 1. Fetch Property Details
        console.log("🔍 Fetching property:", propertyId);
        const { data: property, error: propError } = await supabase
            .from('properties')
            .select('*') // No join, just property data
            .eq('id', propertyId)
            .single()

        if (propError) {
            console.error("❌ Property Fetch Error:", propError);
            return NextResponse.json({ error: 'Property fetch error: ' + propError.message }, { status: 500 });
        }
        if (!property) {
            console.error("❌ Property not found");
            return NextResponse.json({ error: 'Property not found' }, { status: 404 })
        }
        console.log("✅ Property found:", property.id);

        // 2. Fetch User Subscription & Profile (Optional / Graceful Fallback)
        let voiceId = 'alloy';

        try {
            const userId = property.user_id;
            if (userId) {
                console.log("👤 Fetching agent details for:", userId);
                const [subResult, userResult] = await Promise.all([
                    supabase.from('subscriptions').select('plan').eq('user_id', userId).eq('status', 'active').single(),
                    supabase.from('users').select('cloned_voice_id').eq('id', userId).single()
                ]);

                const isElite = subResult.data?.plan === 'Elite';
                if (isElite && userResult.data?.cloned_voice_id) {
                    voiceId = userResult.data.cloned_voice_id;
                    console.log("🌟 Elite Voice Activated:", voiceId);
                } else {
                    console.log("ℹ️ Using standard voice (Standard Plan or No Clone)");
                }
            } else {
                console.log("⚠️ No user_id on property, using default voice");
            }
        } catch (err) {
            console.error("⚠️ Failed to fetch agent details (RLS?), defaulting to alloy:", err);
            // Non-blocking error, proceed with default voice
        }

        console.log("🗣️ Final Voice ID:", voiceId);

        // 4. Construct System Prompt
        const systemPrompt = `
            You are an AI Real Estate Agent for the property located at ${property.address}.
            
            Property Details:
            - Price: €${property.price}
            - Size: ${property.surface_area} m²
            - Description: ${property.description}
            - City: ${property.city || 'Unknown'}
            
            Your goal is to answer questions about this specific property and encourage the user to schedule a viewing.
            Be professional, helpful, and concise. Speak Dutch.
        `

        // 5. Request Ephemeral Token from OpenAI (Optional if using Gemini)
        let clientSecret = null;
        try {
            console.log("🚀 Requesting OpenAI Token...");
            const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "gpt-4o-realtime-preview-2024-12-17",
                    voice: voiceId,
                    instructions: systemPrompt,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                clientSecret = data.client_secret.value;
                console.log("✅ OpenAI Token Received");
            } else {
                const errText = await response.text();
                console.warn("⚠️ OpenAI Session failed (using Gemini fallback if available):", errText);
            }
        } catch (openaiErr) {
            console.warn("⚠️ OpenAI Token Fetch failed:", openaiErr);
        }

        // Return the available data
        return NextResponse.json({
            clientSecret: clientSecret,
            voiceId: voiceId,
            systemPrompt: systemPrompt
        })

    } catch (error) {
        console.error('❌ Voice Session Fatal Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
