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
  startListening: (lang?: string) => void;
  stopListening: () => void;
  speak: (text: string, lang?: string) => void;
  setActiveKasusId: (id: string | null) => void;
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
  const shouldRestartRef = useRef(false);
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
    try { window.speechSynthesis.cancel(); } catch {}
    const voice = voicesReady
      ? voices.find((v) => v.lang === lang) ?? voices.find((v) => v.lang.startsWith(lang.split("-")[0]))
      : undefined;
    tts({ text, voice });
  };

  // === Voice input handler (mengganti tRPC mutation) ===
  const handleVoiceInput = async (kasusId: string, transcript: string) => {
    try {
      const response = await fetch('/api/voice/handle-input', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          kasusId,
          transcript,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        console.log("Voice input processed:", result.data);
        // Optional: speak feedback
        // speak("Diterima. Status diperbarui.");
      } else {
        console.error('Failed to process voice input:', result.error);
        // Optional: speak error feedback
        // speak("Maaf, ada kendala mengirim suara.");
      }
    } catch (error) {
      console.error('Error processing voice input:', error);
      // Optional: speak error feedback
      // speak("Maaf, ada kendala mengirim suara.");
    }
  };

  // === Start/Stop Recognition ===
  const startRecognition = () => {
    if (typeof window === "undefined") return;

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.error("Speech recognition not supported in this browser.");
      return;
    }

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
        handleVoiceInput(activeKasusId, finalTranscript.trim());
      }
    };

    rec.onerror = (e: any) => {
      console.warn("SpeechRecognition error:", e?.error || e);
    };

    rec.onend = () => {
      setListening(false);
      if (shouldRestartRef.current && document.visibilityState === "visible") {
        setTimeout(() => {
          try { rec.start(); } catch {
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

  const startListening = (lang = "id-ID") => {
    langRef.current = lang;
    setEnabled(true);
    startRecognition();
  };

  const stopListening = () => {
    setEnabled(false);
    stopRecognition();
  };

  useEffect(() => {
    const onVis = () => {
      if (!enabled) return;
      if (document.visibilityState === "visible") {
        startRecognition();
      } else {
        stopRecognition();
      }
    };
    if (typeof document !== "undefined") {
      document.addEventListener("visibilitychange", onVis);
      return () => document.removeEventListener("visibilitychange", onVis);
    }
  }, [enabled]);

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
        startListening,
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