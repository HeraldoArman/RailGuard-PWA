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
  const activeKasusIdRef = useRef<string | null>(null);
  useEffect(() => {
    activeKasusIdRef.current = activeKasusId;
  }, [activeKasusId]);
  // === TTS (react-speech-kit) + pengelolaan voices ===
  const { speak: tts } = useSpeechSynthesis();
  const [voicesReady, setVoicesReady] = useState(false);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  useEffect(() => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;
  
    if (!SpeechRecognition) {
      console.error("Browser tidak support SpeechRecognition API");
    } else {
      console.log("SpeechRecognition API tersedia ✅");
    }
  }, []);
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

  const handleVoiceInput = async (kasusId: string, newStatus: "proses" | "selesai") => {
    try {
      const response = await fetch('/api/voice/handle-input', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kasusId, status: newStatus }),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        console.log("✅ Status updated:", result.data);
        if (result.data.message) {
          console.log("📢 Server says:", result.data.message);
          speak(result.data.message, "id-ID");
        }
      } else {
        console.error("❌ Update failed:", result.error);
        speak("Maaf, update status gagal", "id-ID");
      }
    } catch (err) {
      console.error("Voice update error:", err);
      speak("Terjadi kesalahan sistem", "id-ID");
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
          0: { transcript: string };
        }>
      );
    
      for (let i = event.resultIndex; i < resultsArray.length; i++) {
        const r = resultsArray[i];
        if (r.isFinal) finalTranscript += r[0].transcript;
        else interimTranscript += r[0].transcript;
      }
    
      const current = (finalTranscript || interimTranscript).trim();
      setTranscript(current);
      console.log("🎤 Transcript:", current);
    
      if (finalTranscript.trim()) {
        const command = finalTranscript.toLowerCase().trim().replace(/\s+/g, " ");
        const currentKasusId = activeKasusIdRef.current;
        console.log("🛑 Final command (normalized):", JSON.stringify(command));
        console.log("🎯 activeKasusIdRef:", currentKasusId);

        if (command.includes("siap laksanakan") || command === "siap") {
          if (currentKasusId) {
            console.log("trigger siap laksanakan");
            handleVoiceInput(currentKasusId, "proses");
          } else {
            speak("Tidak ada kasus aktif yang dipilih");
          }
        } else if (command.includes("selesai")) {
          if (currentKasusId) {
            console.log("trigger selesai");
            handleVoiceInput(currentKasusId, "selesai");
          } else {
            speak("Tidak ada kasus aktif yang dipilih");
          }
        }
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