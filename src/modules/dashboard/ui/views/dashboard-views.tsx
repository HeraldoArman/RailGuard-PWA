"use client";
import React, { useEffect, useRef } from "react";
import DashboardAnalytics from "./dashboard-analytics";
import { DashboardTrain } from "./dashboard-train";
import { useVoice } from "@/modules/voice/voiceProvider";
import { useLatestKasus } from "@/hooks/use-latest-kasus";

export const DashboardViews = () => {
  const { startListening, stopListening, setActiveKasusId } = useVoice();
  const { data: kasusData } = useLatestKasus();

  // Pastikan mic hanya start sekali selama komponen hidup
  const startedOnceRef = useRef(false);

  useEffect(() => {
    if (startedOnceRef.current) return;

    startedOnceRef.current = true;
    (async () => {
      try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        startListening("id-ID");
        console.log("🎙️ mic started (dashboard)");
      } catch (e) {
        console.error("Mic ERROR ❌", e);
      }
    })();

    // Stop mic saat unmount Saja
    return () => {
      try { stopListening(); } catch {}
    };
    // ⚠️ sengaja kosong biar cuma jalan sekali saat mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sinkronkan kasus terbaru -> activeKasusId (hindari set berulang)
  const lastKasusIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!kasusData?.length) return;
    const latestId = kasusData[0].id;
    if (lastKasusIdRef.current !== latestId) {
      lastKasusIdRef.current = latestId;
      setActiveKasusId(latestId);
      console.log("🔗 activeKasusId set (dashboard):", latestId);
    }
  }, [kasusData, setActiveKasusId]);

  return (
    <div className="bg-background">
      <DashboardAnalytics />
      <DashboardTrain />
    </div>
  );
};
