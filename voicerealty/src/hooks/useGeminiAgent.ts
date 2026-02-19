
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseVoiceAgentProps {
    propertyId: string;
}

export function useGeminiAgent({ propertyId }: UseVoiceAgentProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const wsRef = useRef<WebSocket | null>(null);
    const audioContextRef = useRef<AudioContext | null>(0);
    const processorRef = useRef<ScriptProcessorNode | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const nextPlayTime = useRef<number>(0);

    const fetchContext = async () => {
        try {
            const response = await fetch("/api/voice/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId }),
            });
            const data = await response.json();
            return data.systemPrompt || "Je bent een makelaar.";
        } catch (e) {
            return "Je bent een AI makelaar van deze woning.";
        }
    };

    const stopSession = useCallback(() => {
        console.log("🛑 Sessie beëindigen");
        if (wsRef.current) wsRef.current.close();
        if (processorRef.current) processorRef.current.disconnect();
        if (audioContextRef.current && (audioContextRef.current as any) instanceof AudioContext) {
            (audioContextRef.current as any).close();
        }
        if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());

        wsRef.current = null;
        audioContextRef.current = null;
        processorRef.current = null;
        streamRef.current = null;

        setIsConnected(false);
        setIsConnecting(false);
        setIsSpeaking(false);
    }, []);

    const startSession = useCallback(async () => {
        try {
            setError(null);
            setIsConnecting(true);

            // 1. Audio direct opstarten
            const AudioContextClass = (window as any).AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;

            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const systemPrompt = await fetchContext();

            const source = audioCtx.createMediaStreamSource(stream);
            const processor = audioCtx.createScriptProcessor(4096, 1, 1);
            processorRef.current = processor;
            source.connect(processor);
            processor.connect(audioCtx.destination);
            if (audioCtx.state === 'suspended') await audioCtx.resume();

            // 2. WebSocket
            const API_KEY = "AIzaSyCDfcaimT86z7ERhLwXwbDEptOFGjRSB0c";
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = () => {
                console.log("💎 Verbonden met Gemini!");
                setIsConnected(true);
                setIsConnecting(false);

                ws.send(JSON.stringify({
                    setup: {
                        model: "models/gemini-2.0-flash",
                        generation_config: {
                            response_modalities: ["AUDIO"],
                            speech_config: {
                                voice_config: { prebuilt_voice_config: { voice_name: "Aoide" } }
                            }
                        },
                        system_instruction: { parts: [{ text: systemPrompt }] }
                    }
                }));

                // Direct groeten
                ws.send(JSON.stringify({
                    client_content: {
                        turns: [{ parts: [{ text: "Hallo! Stel jezelf direct voor als AI makelaar." }] }],
                        turn_complete: true
                    }
                }));
            };

            ws.onmessage = async (event) => {
                const data = JSON.parse(event.data);

                // Check voor server-fouten
                if (data.serverContent?.error) {
                    console.error("Gemini Server Error:", data.serverContent.error);
                    setError("AI Fout: " + data.serverContent.error.message);
                    return;
                }

                const audioPart = data.serverContent?.modelTurn?.parts?.[0]?.inlineData;
                if (audioPart) {
                    const audioData = Uint8Array.from(atob(audioPart.data), c => c.charCodeAt(0));
                    const float32Data = new Float32Array(audioData.length / 2);
                    const view = new DataView(audioData.buffer);
                    for (let i = 0; i < float32Data.length; i++) {
                        float32Data[i] = view.getInt16(i * 2, true) / 32768;
                    }
                    playOutputAudio(float32Data);
                    setIsSpeaking(true);
                }
                if (data.serverContent?.turnComplete) setIsSpeaking(false);
            };

            ws.onerror = (e) => {
                console.error("WS Fout:", e);
                setError("Verbinding verbroken.");
                stopSession();
            };

            ws.onclose = (e) => {
                console.log("WS Gesloten:", e.code, e.reason);
                stopSession();
            };

            processor.onaudioprocess = (e) => {
                if (ws.readyState === WebSocket.OPEN) {
                    const inputData = e.inputBuffer.getChannelData(0);
                    const pcm16 = new Int16Array(inputData.length);
                    for (let i = 0; i < inputData.length; i++) {
                        pcm16[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
                    }
                    const base64 = btoa(String.fromCharCode(...new Uint8Array(pcm16.buffer)));
                    ws.send(JSON.stringify({
                        realtime_input: {
                            media_chunks: [{ mime_type: "audio/pcm", data: base64 }]
                        }
                    }));
                }
            };

        } catch (err: any) {
            console.error("Fataal:", err);
            setError(err.message);
            stopSession();
        }
    }, [propertyId, stopSession]);

    const playOutputAudio = (data: Float32Array) => {
        const ctx = audioContextRef.current as any;
        if (!ctx) return;
        const buffer = ctx.createBuffer(1, data.length, 24000);
        buffer.getChannelData(0).set(data);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        const startTime = Math.max(ctx.currentTime, nextPlayTime.current);
        source.start(startTime);
        nextPlayTime.current = startTime + buffer.duration;
    };

    return { startSession, stopSession, isConnected, isConnecting, isSpeaking, error };
}
