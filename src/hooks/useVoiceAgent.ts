
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

    const fetchSessionDetails = async () => {
        const response = await fetch("/api/voice/session", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ propertyId }),
        });

        if (!response.ok) {
            console.warn("Backend session error, using partial data");
        }

        // Always try to parse JSON, even if error (for system prompt)
        return await response.json().catch(() => ({ systemPrompt: "You are a helpful assistant." }));
    };

    const stopSession = useCallback(() => {
        console.log("🛑 Stopping Gemini Session");
        if (wsRef.current) {
            wsRef.current.close();
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
            audioContextRef.current.close();
            audioContextRef.current = null;
        }

        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
        audioQueueRef.current = [];
        isPlayingRef.current = false;
        nextStartTimeRef.current = 0;
    }, []);

    const playNextChunk = () => {
        if (audioQueueRef.current.length === 0 || !audioContextRef.current) {
            isPlayingRef.current = false;
            setIsSpeaking(false);
            return;
        }

        isPlayingRef.current = true;
        setIsSpeaking(true);

        const float32Data = audioQueueRef.current.shift()!;
        const buffer = audioContextRef.current.createBuffer(1, float32Data.length, 24000); // Gemini sends 24kHz
        buffer.copyToChannel(new Float32Array(float32Data.buffer as ArrayBuffer), 0);

        const source = audioContextRef.current.createBufferSource();
        source.buffer = buffer;
        source.connect(audioContextRef.current.destination);

        const currentTime = audioContextRef.current.currentTime;
        // Schedule slightly in future to prevent gaps, or immediately if fell behind
        const startTime = Math.max(currentTime, nextStartTimeRef.current);

        source.start(startTime);
        nextStartTimeRef.current = startTime + buffer.duration;

        source.onended = () => {
            playNextChunk();
        };
    };

    const handleAudioData = (base64Audio: string) => {
        if (!audioContextRef.current) return;

        // Base64 to ArrayBuffer
        const binaryString = window.atob(base64Audio);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }

        // PCM16 to Float32
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
        try {
            setError(null);

            // 1. Get System Prompt from Backend
            console.log("📥 Fetching System Prompt...");
            const sessionData = await fetchSessionDetails();
            const systemPrompt = sessionData.systemPrompt || "You are a helpful AI assistant.";
            console.log("✅ System Prompt Received");

            // 2. Setup Audio Context
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            const audioCtx = new AudioContextClass({ sampleRate: 16000 });
            audioContextRef.current = audioCtx;
            console.log("🔊 AudioContext Created:", audioCtx.state);

            // 3. Connect to Gemini
            const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_AI_API_KEY || process.env.NEXT_PUBLIC_GOOGLE_API_KEY;
            if (!API_KEY) throw new Error("Google API Key missing in environment");

            // CHANGED: Use v1beta AND gemini-2.5-flash-native-audio-latest
            const url = `wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1beta.GenerativeService.BidiGenerateContent?key=${API_KEY}`;
            console.log("🔗 Connecting to Gemini WebSocket (v1beta)...");
            const ws = new WebSocket(url);
            wsRef.current = ws;

            ws.onopen = async () => {
                console.log("✅ Gemini WebSocket Connected");
                setIsConnected(true);
                setIsListening(true);

                if (audioCtx.state === 'suspended') {
                    console.log("🔊 Resuming Audio Context");
                    await audioCtx.resume();
                }

                // Send Setup Message
                const setupMsg = {
                    setup: {
                        model: "models/gemini-2.5-flash-native-audio-latest",
                        generationConfig: {
                            responseModalities: ["AUDIO"]
                        }
                    }
                };
                console.log("📤 Sending Setup:", setupMsg);
                ws.send(JSON.stringify(setupMsg));

                // Send Initial Prompt
                const initMsg = {
                    clientContent: {
                        turns: [{
                            role: "user",
                            parts: [{ text: systemPrompt + " Introduce yourself briefly." }]
                        }],
                        turnComplete: true
                    }
                };
                console.log("📤 Sending Initial Prompt");
                ws.send(JSON.stringify(initMsg));

                // Setup Microphone
                try {
                    console.log("🎤 Requesting Microphone Access...");
                    const stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            sampleRate: 16000,
                            channelCount: 1,
                            echoCancellation: true
                        }
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

                        if (ws.readyState === WebSocket.OPEN) {
                            ws.send(JSON.stringify({
                                realtimeInput: {
                                    mediaChunks: [{
                                        mimeType: "audio/pcm",
                                        data: b64
                                    }]
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

                if (data.serverContent) {
                    if (data.serverContent.modelTurn) {
                        const parts = data.serverContent.modelTurn.parts;
                        for (const part of parts) {
                            if (part.inlineData && part.inlineData.mimeType.startsWith('audio')) {
                                console.log("🌊 Audio Chunk Received");
                                handleAudioData(part.inlineData.data);
                            }
                        }
                    }
                    if (data.serverContent.turnComplete) {
                        console.log("✅ Turn Complete");
                    }
                }
            };

            ws.onerror = (e) => {
                console.error("❌ Gemini Socket Error Details:", e);
                setError("Verbinding verbroken (Check Console)");
            };

            ws.onclose = (e) => {
                console.log("Gemini Socket Closed:", e.code, e.reason);
                if (e.code !== 1000) {
                    setError(`Verbinding gesloten (${e.code}): ${e.reason || 'Check API Key/Model'}`);
                }
                stopSession();
            };

        } catch (err: any) {
            console.error("Start Session Error:", err);
            setError(err.message || "Kon geen verbinding maken");
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
