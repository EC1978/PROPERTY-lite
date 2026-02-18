
import { useEffect, useRef, useState, useCallback } from 'react';

export interface UseVoiceAgentProps {
    propertyId: string;
}

export function useVoiceAgent({ propertyId }: UseVoiceAgentProps) {
    const [isConnected, setIsConnected] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const pcRef = useRef<RTCPeerConnection | null>(null);
    const dcRef = useRef<RTCDataChannel | null>(null);
    const audioElRef = useRef<HTMLAudioElement | null>(null);

    // Initialize Audio Element
    useEffect(() => {
        const audioEl = document.createElement("audio");
        audioEl.autoplay = true;
        audioEl.controls = false; // Set to true if you want to debug visual controls
        audioEl.style.display = 'none';
        document.body.appendChild(audioEl);
        audioElRef.current = audioEl;

        return () => {
            if (document.body.contains(audioEl)) {
                document.body.removeChild(audioEl);
            }
        };
    }, []);

    const startSession = useCallback(async () => {
        try {
            setError(null);

            // 1. Get Ephemeral Token from our backend
            console.log("🚀 Starting Voice Session...");
            const tokenResponse = await fetch("/api/voice/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ propertyId }), // Sends propertyId to fetch context
            });

            if (!tokenResponse.ok) throw new Error("Failed to get token");
            const data = await tokenResponse.json();
            const EPHEMERAL_KEY = data.clientSecret;
            console.log("🔑 Token received");

            // 2. Initialize Peer Connection
            const pc = new RTCPeerConnection();
            pcRef.current = pc;

            pc.oniceconnectionstatechange = () => console.log("🧊 ICE State:", pc.iceConnectionState);
            pc.onconnectionstatechange = () => console.log("🔗 Connection State:", pc.connectionState);

            // Set up remote audio playback
            pc.ontrack = (e) => {
                console.log("🔊 Audio Track Received");
                if (audioElRef.current) {
                    audioElRef.current.srcObject = e.streams[0];
                    // Ensure it plays
                    audioElRef.current.play().catch(e => console.error("Audio Play Error:", e));
                }
            };

            // Add local microphone track
            const ms = await navigator.mediaDevices.getUserMedia({
                audio: true
            });
            pc.addTrack(ms.getTracks()[0]);

            // Data Channel for events (e.g. listening/speaking state)
            const dc = pc.createDataChannel("oai-events");
            dcRef.current = dc;

            dc.onopen = () => {
                console.log("⚡ Data Channel Open");
                // Trigger initial greeting
                const event = {
                    type: "response.create",
                    response: {
                        modalities: ["text", "audio"],
                        instructions: "Introduce yourself briefly as the agent for this property."
                    }
                };
                dc.send(JSON.stringify(event));
            };

            dc.addEventListener("message", (e) => {
                const event = JSON.parse(e.data);

                // Log specific events to reduce noise, but keep critical ones
                if (event.type === 'response.audio.delta') {
                    // console.log("🔊 Audio Delta received"); // Too noisy?
                    setIsSpeaking(true);
                } else if (event.type === 'response.text.delta') {
                    console.log("📝 Text Delta:", event.delta);
                } else if (event.type === 'response.done') {
                    console.log("✅ Response Done:", event);
                    if (event.response?.status === 'failed') {
                        // Log full details for debugging
                        console.error("❌ Response Failed FULL:", JSON.stringify(event, null, 2));
                    }
                    setIsSpeaking(false);
                } else if (event.type === 'input_audio_buffer.speech_started') {
                    console.log("🎤 Speech Started");
                    setIsListening(true);
                    setIsSpeaking(false);
                } else if (event.type === 'input_audio_buffer.speech_stopped') {
                    console.log("🛑 Speech Stopped");
                    setIsListening(false);
                } else {
                    console.log("📨 Other Event:", event.type);
                }
            });

            // 3. Create Offer & Set Local Description
            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            // 4. Send Offer to OpenAI Realtime API
            const baseUrl = "https://api.openai.com/v1/realtime";
            const model = "gpt-4o-realtime-preview-2024-10-01";

            const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
                method: "POST",
                body: offer.sdp,
                headers: {
                    Authorization: `Bearer ${EPHEMERAL_KEY}`,
                    "Content-Type": "application/sdp"
                },
            });

            const answerSdp = await sdpResponse.text();

            // 5. Set Remote Description
            const answer = {
                type: "answer" as RTCSdpType,
                sdp: answerSdp,
            };
            await pc.setRemoteDescription(answer);

            setIsConnected(true);

        } catch (err: any) {
            console.error("❌ Voice Agent Error:", err);
            setError("Could not connect: " + (err.message || "Unknown error"));
        }
    }, [propertyId]);

    const stopSession = useCallback(() => {
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        setIsConnected(false);
        setIsListening(false);
        setIsSpeaking(false);
    }, []);

    return {
        startSession,
        stopSession,
        isConnected,
        isListening,
        isSpeaking,
        error
    };
}
