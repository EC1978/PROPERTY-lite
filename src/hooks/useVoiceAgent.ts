
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseVoiceAgentProps {
    propertyId: string;
}

export function useVoiceAgent({ propertyId }: UseVoiceAgentProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const mediaStreamRef = useRef<MediaStream | null>(null);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
    const audioQueueRef = useRef<Float32Array[]>([]);
    const isPlayingRef = useRef(false);
    const nextStartTimeRef = useRef(0);
    const leadIdRef = useRef<string | null>(null);
    const ownerIdRef = useRef<string | null>(null);
    const rawTextRef = useRef<string[]>([]);
    const isToolExecutingRef = useRef<boolean>(false);
    const isStoppingRef = useRef<boolean>(false); // Prevent double-stop race condition
    const userTranscriptRef = useRef<string[]>([]); // Track what user said (from audio input events)

    const fetchSessionDetails = async () => {
        const response = await fetch("/api/voice/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId }),
        });

        if (!response.ok) {
            console.warn("Backend session error, using partial data");
        }

        return await response.json().catch(() => ({ systemPrompt: "You are a helpful assistant." }));
    };

    const stopSession = useCallback(async () => {
        // CRITICAL: Prevent double-execution from ws.onclose calling stopSession again
        if (isStoppingRef.current) {
            console.log("⏸️ stopSession already in progress, skipping duplicate call");
            return;
        }
        isStoppingRef.current = true;
        console.log("🛑 Stopping Gemini Session");

        // Snapshot refs BEFORE any async work (they might get cleared by re-renders)
        const leadId = leadIdRef.current;
        const rawTexts = [...rawTextRef.current];

        console.log("📊 stopSession diagnostics:", {
            leadId,
            rawTextChunks: rawTexts.length,
            firstChunk: rawTexts[0]?.substring(0, 100) || '(empty)',
            lastChunk: rawTexts[rawTexts.length - 1]?.substring(0, 100) || '(empty)'
        });

        // POST-SESSION EXTRACTION
        if (leadId && rawTexts.length > 0) {
            const allRawText = rawTexts.join('\n');
            console.log("🧠 Raw text collected for extraction. Size:", allRawText.length, "chunks:", rawTexts.length);
            console.log("🧠 First 500 chars:", allRawText.substring(0, 500));

            try {
                const extractRes = await fetch('/api/voice/extract-lead', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ rawText: allRawText, propertyId })
                });
                const extracted = await extractRes.json();
                console.log("✅ Extracted lead data:", JSON.stringify(extracted));

                if (!extracted.error) {
                    const updateRes = await fetch('/api/voice/capture-lead', {
                        method: 'PATCH',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            leadId: leadId,
                            name: extracted.name || undefined,
                            phone: extracted.phone || undefined,
                            email: extracted.email || undefined,
                            reason: extracted.reason || undefined,
                            budget: extracted.budget || undefined,
                            transcript: extracted.transcript || undefined,
                            score: extracted.score || undefined
                        })
                    });
                    const updateResult = await updateRes.json();
                    console.log("✅ Lead PATCH result:", JSON.stringify(updateResult));
                } else {
                    console.error("❌ Extraction returned error:", extracted.error, extracted.details);
                }
            } catch (err) {
                console.error("❌ Post-session extraction failed:", err);
            }
        } else {
            console.warn("⚠️ No extraction possible. leadId:", leadId, "rawText chunks:", rawTexts.length);
            console.warn("⚠️ This means transcription events were NEVER received from Gemini.");
            console.warn("⚠️ Check if the model supports inputAudioTranscription/outputAudioTranscription.");
        }

        // Close WebSocket
        if (wsRef.current) {
            try { wsRef.current.close(); } catch (e) { /* ignore */ }
            wsRef.current = null;
        }

        // Stop Microphone
        if (mediaStreamRef.current) {
            mediaStreamRef.current.getTracks().forEach(track => track.stop());
            mediaStreamRef.current = null;
        }
        if (processorRef.current) {
            processorRef.current.disconnect();
            processorRef.current = null;
        }
        if (sourceRef.current) {
            sourceRef.current.disconnect();
            sourceRef.current = null;
        }
        if (audioContextRef.current) {
            try { audioContextRef.current.close(); } catch (e) { /* ignore */ }
            audioContextRef.current = null;
        }

        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        nextStartTimeRef.current = 0;
        rawTextRef.current = [];
        userTranscriptRef.current = [];
        leadIdRef.current = null;
        isStoppingRef.current = false; // Ready for next session
    }, [propertyId]);

    const playNextChunk = () => {
        if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);

        const float32Data = audioQueueRef.current.shift()!;
        const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000);
        buffer.copyToChannel(new Float32Array(float32Data.buffer as ArrayBuffer), 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        const startTime = Math.max(currentTime, nextStartTimeRef.current);

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            playNextChunk();
        };
    };

    const handleAudioData = (base64Audio: string) => {
        if (!audioContextRef.current) return;

        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        const int16Data = new Int16Array(bytes.buffer);
        const float32Data = new Float32Array(int16Data.length);
        for (let i = 0; i < int16Data.length; i++) {
            float32Data[i] = int16Data[i] / 32768.0;
        }

        audioQueueRef.current.push(float32Data);
        if (!isPlayingRef.current) {
            playNextChunk();
        }
    };

    const startSession = useCallback(async () => {
        console.log("🚀 Starting Gemini Session...");
        isStoppingRef.current = false; // Reset stop guard for new session
        try {
            setError(null);

            console.log("📥 Fetching System Prompt...");
            const sessionData = await fetchSessionDetails();
            const systemPrompt = sessionData.systemPrompt || "You are a helpful AI assistant.";
            ownerIdRef.current = sessionData.ownerId;
            console.log("✅ System Prompt Received");

            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
            if (!API_KEY) throw new Error("Google API Key missing in environment");

            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
            console.log("🔗 Connecting to Gemini WebSocket...");
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log("✅ Gemini WebSocket Connected");
                setIsConnected(true);
                setIsListening(true);

                if (audioCtx.state === 'suspended') {
                    await audioCtx.resume();
                }

                // AUTO-CREATE LEAD on session start
                if (!leadIdRef.current) {
                    console.log("📝 Auto-creating lead...");
                    try {
                        const res = await fetch('/api/voice/capture-lead', {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                name: 'Voice AI Bezoeker',
                                wensen: 'Gesprek via Voice AI gestart',
                                budget: 'Onbekend',
                                propertyId,
                                userId: ownerIdRef.current || '',
                                address: 'Bezoeker van woningpagina'
                            })
                        });
                        const result = await res.json();
                        if (result.success) {
                            leadIdRef.current = result.leadId;
                            console.log("✅ Lead created with ID:", result.leadId);
                        } else {
                            console.error("❌ Lead creation failed:", result.error);
                        }
                    } catch (err) {
                        console.error("❌ Lead creation fetch failed:", err);
                    }
                }

                // Setup: AUDIO-only + enable transcription for both input and output
                // IMPORTANT: Use gemini-2.0-flash-live-001 which reliably supports transcription.
                // The native-audio model may NOT send transcription events.
                const setupMsg = {
                    setup: {
                        model: "models/gemini-2.0-flash-live-001",
                        generationConfig: {
                            responseModalities: ["AUDIO"]
                        },
                        inputAudioTranscription: {},
                        outputAudioTranscription: {},
                        tools: []
                    }
                };
                console.log("📤 Sending Setup (AUDIO + transcription enabled, model: gemini-2.0-flash-live-001)");
                ws.send(JSON.stringify(setupMsg));

                // Send the system prompt
                const initMsg = {
                    clientContent: {
                        turns: [{
                            role: "user",
                            parts: [{ text: "Je bent zojuist geactiveerd. Lees de volgende SYSTEEM REGELS strikt en volg ze altijd op. Hierna zal de bezoeker spreken.\n\n" + systemPrompt }]
                        }],
                        turnComplete: true
                    }
                };
                console.log("📤 Sending Initial Prompt");
                ws.send(JSON.stringify(initMsg));

                // Setup Microphone
                try {
                    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
                        throw new Error('Microfoon niet beschikbaar. Gebruik localhost of HTTPS.');
                    }

                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: { sampleRate: 16000, channelCount: 1, echoCancellation: true }
                    });
                    mediaStreamRef.current = stream;
                    console.log("🎤 Microphone Active");

                    const source = audioCtx.createMediaStreamSource(stream);
                    sourceRef.current = source;

                    const processor = audioCtx.createScriptProcessor(512, 1, 1);
                    processorRef.current = processor;

                    processor.onaudioprocess = (e) => {
                        const inputData = e.inputBuffer.getChannelData(0);
                        const pcm16 = new Int16Array(inputData.length);
                        for (let i = 0; i < inputData.length; i++) {
                            let s = Math.max(-1, Math.min(1, inputData[i]));
                            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
                        }

                        let binary = '';
                        const bytes = new Uint8Array(pcm16.buffer);
                        for (let i = 0; i < bytes.byteLength; i++) {
                            binary += String.fromCharCode(bytes[i]);
                        }
                        const b64 = window.btoa(binary);

                        if (ws.readyState === WebSocket.OPEN && !isToolExecutingRef.current) {
                            ws.send(JSON.stringify({
                                realtimeInput: {
                                    mediaChunks: [{ mimeType: "audio/pcm", data: b64 }]
                                }
                            }));
                        }
                    };

                    source.connect(processor);
                    processor.connect(audioCtx.destination);

                } catch (micErr) {
                    console.error("Mic Error:", micErr);
                    setError("Microfoon toegang geweigerd: " + micErr);
                }
            };

            ws.onmessage = async (event) => {
                let data;
                if (event.data instanceof Blob) {
                    data = JSON.parse(await event.data.text());
                } else {
                    data = JSON.parse(event.data);
                }

                // DEBUG: Log ALL top-level keys in every single message
                const topKeys = Object.keys(data);
                console.log("📦 WS Message keys:", topKeys.join(', '));

                // Intercept tool calls
                if (data.toolCall) {
                    isToolExecutingRef.current = true;
                    console.log("🛠️ Tool call intercepted");
                    try {
                        ws.send(JSON.stringify({
                            toolResponse: {
                                functionResponses: data.toolCall.functionCalls.map((fc: any) => ({
                                    id: fc.id,
                                    name: fc.name,
                                    response: { success: true }
                                }))
                            }
                        }));
                    } catch (e) { /* ignore */ }
                    setTimeout(() => isToolExecutingRef.current = false, 500);
                    return;
                }

                if (data.serverContent) {
                    const sc = data.serverContent;

                    // DEBUG: log all keys inside serverContent
                    console.log("📦 serverContent keys:", Object.keys(sc).join(', '));

                    if (sc.modelTurn) {
                        const parts = sc.modelTurn.parts;
                        for (const part of parts) {
                            if (part.inlineData && part.inlineData.mimeType.startsWith('audio')) {
                                handleAudioData(part.inlineData.data);
                            }
                            if (part.functionCall) {
                                isToolExecutingRef.current = true;
                                try {
                                    ws.send(JSON.stringify({
                                        toolResponse: {
                                            functionResponses: [{
                                                id: part.functionCall.id || part.functionCall.name,
                                                name: part.functionCall.name,
                                                response: { success: true }
                                            }]
                                        }
                                    }));
                                } catch (e) { /* ignore */ }
                                setTimeout(() => isToolExecutingRef.current = false, 500);
                            }
                            // COLLECT ALL TEXT — this is the model's text output
                            if (part.text) {
                                const txt = part.text.trim();
                                if (txt.length > 0) {
                                    console.log("📝 [modelTurn] Text part received:", txt.substring(0, 200));
                                    rawTextRef.current.push(txt);
                                }
                            }
                        }
                    }
                    if (sc.turnComplete) {
                        console.log("✅ Turn Complete. Raw text chunks so far:", rawTextRef.current.length);
                    }
                    // Capture user's speech transcription (inside serverContent)
                    if (sc.inputTranscription) {
                        const userText = sc.inputTranscription.text;
                        if (userText) {
                            console.log("👤 [serverContent] User said:", userText);
                            rawTextRef.current.push(`[BEZOEKER ZEGT]: ${userText}`);
                        }
                    }
                    if (sc.outputTranscription) {
                        const aiText = sc.outputTranscription.text;
                        if (aiText) {
                            console.log("🤖 [serverContent] AI said:", aiText);
                            rawTextRef.current.push(`[AI ZEGT]: ${aiText}`);
                        }
                    }
                }

                // Also handle transcription events at top level (some API versions send it here)
                if (data.inputTranscription) {
                    const userText = data.inputTranscription.text;
                    if (userText) {
                        console.log("👤 [TOP] User said:", userText);
                        rawTextRef.current.push(`[BEZOEKER ZEGT]: ${userText}`);
                    }
                }
                if (data.outputTranscription) {
                    const aiText = data.outputTranscription.text;
                    if (aiText) {
                        console.log("🤖 [TOP] AI said:", aiText);
                        rawTextRef.current.push(`[AI ZEGT]: ${aiText}`);
                    }
                }
            };

            ws.onerror = (e) => {
                console.error("❌ Gemini Socket Error:", e);
                setError("Verbinding verbroken (Check Console)");
            };

            ws.onclose = (e) => {
                console.log("Gemini Socket Closed:", e.code, e.reason);
                if (e.code !== 1000) {
                    setError(`Verbinding gesloten (${e.code}): ${e.reason || 'Check API Key/Model'}`);
                }
                // stopSession handles the race condition guard internally
                stopSession();
            };

        } catch (err: any) {
            console.error("Start Session Error:", err);
            setError(err.message || "Kon geen verbinding maken");
            isStoppingRef.current = false;
            stopSession();
        }
    }, [propertyId, stopSession]);

    return {
        startSession,
        stopSession,
        isConnected,
        isListening,
        isSpeaking,
        error
    };
}
