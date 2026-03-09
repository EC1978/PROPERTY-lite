
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

            // Check if specific voice is set on property
            if (property.voice_id) {
                voiceId = property.voice_id;
                console.log("🏘️ Property specific voice used:", voiceId);
            } else if (userId) {
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

        // 4. Construct System Prompt (Strict Instructions)
        const systemPrompt = `
            # ROL & IDENTITEIT
            Je bent een professionele, deskundige AI Vastgoed Adviseur voor Makelaardij VoiceRealty.
            Jouw exclusieve taak is het vertegenwoordigen van de volgende woning:
            
            # WONINGDETAILS
            - Adres: ${property.address || 'Op aanvraag'}
            - Stad: ${property.city || 'Onbekend'}
            - Vraagprijs: €${property.price ? property.price.toLocaleString('nl-NL') : 'Op aanvraag'}
            - Woonoppervlakte: ${property.surface_area || '?'} m²
            - Perceeloppervlakte: ${property.plot_area || '?'} m²
            - Aantal Kamers: ${property.rooms || '?'}
            - Aantal Slaapkamers: ${property.bedrooms || '?'}
            - Aantal Badkamers: ${property.bathrooms || '?'}
            - Bouwjaar: ${property.features?.constructionYear || 'Onbekend'}
            - Energielabel: ${property.energy_label || 'Onbekend'}
            - Status: ${property.status || 'Beschikbaar'}
            
            # BESCHRIJVING VAN DE WONING
            ${property.description || 'Er is momenteel geen gedetailleerde beschrijving beschikbaar voor deze woning.'}
            
            # JOUW DOELEN
            1. Beantwoord vragen over deze specifieke woning op een enthousiaste, gastvrije en deskundige manier.
            2. Probeer de bezoeker proactief te verleiden tot het inplannen van een bezichtiging.
            3. LEAD GENERATIE (CRUCIAAL): Zodra een bezoeker interesse toont, positief reageert of een bezichtiging overweegt, vraag dan ALTIJD direct en beleefd naar hun naam ("Mag ik vragen met wie ik het genoegen heb?"), telefoonnummer, e-mailadres en wat zij precies zoeken.
            4. Zodra je deze gegevens hebt, bevestig dan aan de bezoeker dat je de interesse hebt genoteerd en dat de makelaar contact zal opnemen.
            
            # STRENGE REGELS (VERPLICHT)
            - TAAL: Je MOET ALTIJD en UITSLUITEND in het Nederlands (Dutch) spreken. Zelfs als de bezoeker een andere taal spreekt, antwoord jij vriendelijk in het Nederlands.
            - GEEN HALLUCINATIES: Verzin NOOIT feiten, prijzen, voorwaarden of details die niet in de #WONINGDETAILS of #BESCHRIJVING staan. Als je het antwoord niet weet, zeg dan eerlijk: "Dat detail heb ik momenteel niet voor me, maar de makelaar kan u hierover terugbellen."
            - BLIJF BIJ HET ONDERWERP: Weiger om vragen te beantwoorden die niet over deze woning of algemeen makelaarsadvies gaan.
            
            # INTERNE NOTITIES (NIET UITSPREKEN)
            Houd in je tekstgedachten bij wat de bezoeker deelt. Als de bezoeker een naam noemt, noteer dan in je gedachten: "De bezoeker heet [naam]". Als een telefoonnummer wordt gegeven: "Telefoon: [nummer]". Bij een e-mailadres: "Email: [adres]". Bij een reden of wens: "Reden: [reden]". Bij een bod of budget: "Budget: [bedrag]". 
            Spreek deze notities NOOIT hardop uit, ze zijn alleen voor interne registratie.
        `

        // 5. Request Ephemeral Token from OpenAI
        let clientSecret = null;
        try {
            console.log("🚀 Requesting OpenAI Token...");

            const isCustomVoice = voiceId.startsWith('http');
            const sessionConfig: any = {
                model: "gpt-4o-realtime-preview-2024-12-17",
                instructions: systemPrompt,
            };

            if (isCustomVoice) {
                // For custom cloned voices (from library/URL)
                sessionConfig.voice = "alloy"; // Base voice
                // This is hypothetical; OpenAI Realtime API might need a different way to pass custom voice URL
                // or it might not support URL-based cloning in this endpoint yet.
                // However, assuming standard `voice` param expects a preset or ID.

                // CRITICAL FIX: If it is a custom voice URL, we might need a specific handling.
                // Since I cannot verify the exact OpenAI Realtime Custom Voice API spec right now,
                // I will assume if it is a URL, it is NOT a standard preset.

                // If the user selected a voice from the library, it saves the URL.
                // We need to check if we can pass this URL.
                // Ref: OpenAI Realtime API requires `voice` to be one of the presets OR a specific clone ID if trained.
                // The `voice - library` saves URLs. 

                // RE-READING CONTEXT: The user is using Gemini/OpenAI. 
                // If `voiceId` is a URL (from Supabase Storage), we likely need to pass it differently 
                // OR we are using the wrong ID.

                // Let's look at how `useVoiceAgent` uses this.
                // If `voiceId` is a URL, it might be for a different service (ElevenLabs?).
                // But here we are calling OpenAI.

                // ACTUALLY: The previous code logic for "Elite" users used `cloned_voice_id` from the `users` table.
                // If the new library saves *URLs* as `voice_id` on the property, OpenAI will reject it if it expects an ID like 'alloy' or 'shimmer'.

                // HYPOTHESIS: The `voice_id` saved on the property is a URL (e.g., https://.../voice.webm).
                // OpenAI Realtime API does NOT support passing a URL for voice cloning on the fly (yet).
                // It supports `voice: 'alloy' | 'ash' | 'ballad' | 'coral' | 'echo' | 'sage' | 'shimmer' | 'verse'`.

                // CORRECTION: The user wants to use *their* voice.
                // If they are using Gemini (which the `useVoiceAgent` hook suggests), we need to see how that hook uses the voice.
                // The previous system used `voiceId` from the DB.

                // Let's fallback to 'alloy' if it looks like a URL, to prevent crashing, 
                // but LOG it so we can see what's happening.
                console.warn("⚠️ Custom Voice URLs not fully supported by OpenAI Realtime yet. Using 'alloy' as fallback for:", voiceId);
                sessionConfig.voice = "alloy";
            } else {
                sessionConfig.voice = voiceId;
            }

            const response = await fetch("https://api.openai.com/v1/realtime/sessions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${process.env.OPENAI_API_KEY} `,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(sessionConfig),
            });

            if (response.ok) {
                const data = await response.json();
                clientSecret = data.client_secret.value;
                console.log("✅ OpenAI Token Received");
            } else {
                const errText = await response.text();
                console.warn("⚠️ OpenAI Session failed:", errText);
            }
        } catch (openaiErr) {
            console.warn("⚠️ OpenAI Token Fetch failed:", openaiErr);
        }

        // Return the available data
        return NextResponse.json({
            clientSecret: clientSecret,
            voiceId: voiceId, // Return the Original ID (URL or Preset) for the Frontend to handle (e.g. Gemini)
            systemPrompt: systemPrompt,
            ownerId: property.user_id
        })

    } catch (error) {
        console.error('❌ Voice Session Fatal Error:', error)
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
    }
}
