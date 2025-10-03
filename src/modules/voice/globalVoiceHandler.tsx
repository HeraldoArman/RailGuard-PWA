"use client";

import { useEffect } from "react";
import { api } from "@/trpc/client";
import { useVoice } from "./voiceProvider";

export default function GlobalVoiceHandler() {
  const { speak } = useVoice();

  // Subscribe ke event kasus dari backend
  const kasusEvents = api.voice.onKasusEvent.useSubscription(undefined, {
    onData(event) {
      if (event.type === "kasus_event") {
        event.data.forEach((k) => {
          speak(
            `Kasus baru di gerbong ${k.gerbongId}. Jenis kasus ${k.caseType}. Deskripsi: ${k.name}`
          );
        });
      }
    },
    onError(err) {
      console.error("Voice subscription error:", err);
    },
  });

  // Opsional: feedback saat mount
  useEffect(() => {
    speak("Sistem voice notification aktif.");
  }, []);

  return null;
}
