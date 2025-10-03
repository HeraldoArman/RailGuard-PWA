/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from "react";
import { useSpeechSynthesis } from "react-speech-kit";
import { api } from "@/trpc/client";

// ---------------- Types untuk Web Speech API ----------------
interface CustomSpeechRecognitionEvent extends Event {
  results: {
    [index: number]: {
      [index: number]: { transcript: string; confidence: number };
      isFinal: boolean;
    };
  };
  resultIndex: number;
}

interface CustomSpeechRecognition extends EventTarget {
  continuous: boolean;
  lang: string;
  interimResults: boolean;
  maxAlternatives: number;
  onresult: ((event: CustomSpeechRecognitionEvent) => void) | null;
  onerror: ((event: any) => void) | null;
  onend: (() => void) | null;
  start(): void;
  stop(): void;
  abort(): void;
}

declare global {
  interface Window {
    SpeechRecognition?: new () => CustomSpeechRecognition;
    webkitSpeechRecognition?: new () => CustomSpeechRecognition;
  }
}

// ---------------- Context ----------------
type VoiceContextType = {
  enabled: boolean;
  listening: boolean;
  transcript: string;
  startListening: (lang?: string) => void; // panggil dari gesture user (klik)
  stopListening: () => void;
  speak: (text: string, lang?: string) => void;
  setActiveKasusId: (id: string | null) => void; // biar gak hardcode
  activeKasusId: string | null;
};

const VoiceContext = createContext<VoiceContextType | null>(null);

export function VoiceProvider({ children }: { children: ReactNode }) {
  const [enabled, setEnabled] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [activeKasusId, setActiveKasusId] = useState<string | null>(null);

  // refs
  const recognitionRef = useRef<CustomSpeechRecognition | null>(null);
  const shouldRestartRef = useRef(false); // kontrol auto-restart
  const langRef = useRef("id-ID");

  // === TTS (react-speech-kit) + pengelolaan voices ===
  const { speak: tts } = useSpeechSynthesis();
  const [voicesReady, setVoicesReady] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const loadVoices = () => {
      const v = window.speechSynthesis.getVoices();
      if (v && v.length) {
        setVoices(v);
        setVoicesReady(true);
      }
    };
    loadVoices();
    window.speechSynthesis.addEventListener?.("voiceschanged", loadVoices);
    return () => {
      window.speechSynthesis.removeEventListener?.("voiceschanged", loadVoices);
    };
  }, []);

  const speak = (text: string, lang = "id-ID") => {
    // opsional: hentikan suara sebelumnya agar pesan baru langsung bicara
    try { window.speechSynthesis.cancel(); } catch {}
    const voice = voicesReady
      ? voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.split("-")[0]))
      : undefined;
    tts({ text, voice });
  };

  // === tRPC mutation kirim hasil STT ===
  const voiceMutation = api.voice.handleInput.useMutation({
    onSuccess(data) {
      // opsional: feedback suara
      // speak("Diterima. Status diperbarui.");
      console.log("Voice input processed:", data);
    },
    onError(err) {
      console.error("Voice error:", err);
      // opsional: feedback user
      // speak("Maaf, ada kendala mengirim suara.");
    },
  });

  // === Start/Stop Recognition ===
  const startRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

    // hindari multiple instance
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch {}
      recognitionRef.current = null;
    }

    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.lang = langRef.current;
    rec.interimResults = true;
    rec.maxAlternatives = 1;

    rec.onresult = (event: CustomSpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      const resultsArray = Array.from(
        event.results as unknown as ArrayLike<{
          isFinal: boolean;
          0: { transcript: string; confidence: number };
        }>
      );
      for (let i = event.resultIndex; i < resultsArray.length; i++) {
        const r = resultsArray[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interimTranscript += r[0].transcript;
      }

      const current = (finalTranscript || interimTranscript).trim();
      setTranscript(current);

      if (finalTranscript.trim() && activeKasusId) {
        voiceMutation.mutate({
          kasusId: activeKasusId,
          transcript: finalTranscript.trim(),
        });
      }
    };

    rec.onerror = (e: any) => {
      console.warn("SpeechRecognition error:", e?.error || e);
      // beberapa error umum: "no-speech", "aborted", "not-allowed"
      // biarkan onend menangani auto-restart jika perlu
    };

    rec.onend = () => {
      setListening(false);
      if (shouldRestartRef.current && document.visibilityState === "visible") {
        // jeda sedikit agar tidak tight loop
        setTimeout(() => {
          try { rec.start(); } catch {
            // kalau gagal start lagi (kadang di mobile), buat instance baru
            startRecognition();
          }
        }, 250);
      }
    };

    try {
      rec.start();
      setListening(true);
      recognitionRef.current = rec;
      shouldRestartRef.current = true;
    } catch (err) {
      console.error("Failed to start recognition:", err);
    }
  };

  const stopRecognition = () => {
    shouldRestartRef.current = false;
    try { recognitionRef.current?.stop?.(); } catch {}
    setListening(false);
  };

  // === API publik (dipanggil dari tombol/gesture user) ===
  const startListening = (lang = "id-ID") => {
    langRef.current = lang;
    setEnabled(true);
    startRecognition();
  };
  const stopListening = () => {
    setEnabled(false);
    stopRecognition();
  };

  // === Pause/sambung saat visibility berubah (tab background/foreground) ===
  useEffect(() => {
    const onVis = () => {
      if (!enabled) return;
      if (document.visibilityState === "visible") {
        // lanjut lagi
        startRecognition();
      } else {
        // stop sementara untuk mengurangi error “no-speech/aborted”
        stopRecognition();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
      return () => document.removeEventListener("visibilitychange", onVis);
    }
  }, [enabled]);

  // cleanup saat unmount
  useEffect(() => {
    return () => {
      shouldRestartRef.current = false;
      try { recognitionRef.current?.stop?.(); } catch {}
      try { window.speechSynthesis.cancel(); } catch {}
    };
  }, []);

  return (
    <VoiceContext.Provider
      value={{
        enabled,
        listening,
        transcript,
        startListening, // panggil dari CTA/gesture (wajib untuk izin mic)
        stopListening,
        speak,
        activeKasusId,
        setActiveKasusId,
      }}
    >
      {children}
    </VoiceContext.Provider>
  );
}

export function useVoice() {
  const ctx = useContext(VoiceContext);
  if (!ctx) throw new Error("useVoice must be used within a VoiceProvider");
  return ctx;
}
