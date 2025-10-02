"use client";
import React from "react";
import DashboardAnalytics from "./dashboard-analytics";
import { DashboardTrain } from "./dashboard-train";
export const DashboardViews = () => {
  return (
    <div className="bg-background">
      <DashboardAnalytics />
      <DashboardTrain />
    </div>
  );
};
