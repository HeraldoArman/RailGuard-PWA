"use client";
import React from "react";
import DashboardAnalytics from "./dashboard-analytics";
import { DashboardTrain } from "./dashboard-train";
import { useEffect } from "react";
export const DashboardViews = () => {
    useEffect(() => {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          console.log("Mic OK ✅", stream);
        })
        .catch((err) => {
          console.error("Mic ERROR ❌", err);
        });
    }, []);
  return (
    <div className="bg-background">
      <DashboardAnalytics />
      <DashboardTrain />
    </div>
  );
};
