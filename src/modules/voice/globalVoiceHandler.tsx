/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useRef } from "react";
import { useVoice } from "./voiceProvider";

export default function GlobalVoiceHandler() {
  const { speak } = useVoice();
  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    // Initial feedback when component mounts
    // speak("Sistem voice notification aktif.");

    // Setup Server-Sent Events
    eventSourceRef.current = new EventSource('/api/voice/events/stream');

    eventSourceRef.current.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.type === 'kasus_event' && data.data.length > 0) {
          data.data.forEach((k: any) => {
            speak(
              `Kasus baru di gerbong ${k.gerbongName}. Jenis kasus ${k.caseType}. Deskripsi: ${k.name}`
            );
          });
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSourceRef.current.onerror = (error) => {
      console.error('SSE connection error:', error);
    };

    return () => {
      if (eventSourceRef.current) {
        eventSourceRef.current.close();
      }
    };
  }, [speak]);

  return null;
}