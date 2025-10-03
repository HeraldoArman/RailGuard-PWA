"use client";

import Link from "next/link";
import { ChevronLast, Eye, Send } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useParams, useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { useState, useRef, useEffect } from "react";

export default function DetailViews() {
  const params = useParams();
  const router = useRouter();
  const gerbongId = params.gerbongID as string;
  const trpc = useTRPC();
  const [isLoading, setIsLoading] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  // Fetch gerbong data
  const { data: gerbong } = useSuspenseQuery(
    trpc.gerbong.getOne.queryOptions({ id: gerbongId })
  );

  // Fetch kasus for this gerbong
  const { data: kasusData } = useSuspenseQuery(
    trpc.kasus.getManyByGerbong.queryOptions({
      gerbongId,
      page: 1,
      pageSize: 10,
    })
  );

  const latestKasus = kasusData.items[0];
  const hasActiveCase = gerbong.belum > 0 || gerbong.proses > 0;

  // Determine gerbong status
  const getGerbongStatus = () => {
    const total = gerbong.totalKasus ?? 0;
    if (total === 0) return "tak ada masalah";
    if ((gerbong.belum ?? 0) > 0) return "pending";
    if ((gerbong.proses ?? 0) > 0) return "on progress";
    // if there are cases and all are selesai
    return "completed";
  };

  const gerbongStatus = getGerbongStatus();

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "short",
      timeStyle: "medium",
    });
  };

  const getConfidenceLevel = (caseType: string) => {
    const confidenceMap: Record<string, { level: string; variant: string }> = {
      pelecehan: { level: "87% High", variant: "bg-red-100 text-red-700" },
      kepadatan: {
        level: "92% High",
        variant: "bg-orange-100 text-orange-700",
      },
      prioritas: { level: "95% Critical", variant: "bg-red-100 text-red-700" },
      default: {
        level: "75% Medium",
        variant: "bg-yellow-100 text-yellow-700",
      },
    };
    return confidenceMap[caseType] || confidenceMap.default;
  };

  const confidence = latestKasus
    ? getConfidenceLevel(latestKasus.caseType || "default")
    : getConfidenceLevel("default");

  // Handle take button click
  const handleTake = async () => {
    if (!latestKasus || latestKasus.status === "selesai" || isLoading) return;

    setIsLoading(true);
    try {
      const response = await fetch("/api/kasus/take", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          kasusId: latestKasus.id,
        }),
      });

      const result = await response.json();

      if (response.ok && result.success) {
        // Navigate to history detail page
        router.push(`/dashboard/histori/${latestKasus.id}`);
      } else {
        console.error("Failed to take kasus:", result.error);
        // You might want to show a toast notification here
      }
    } catch (error) {
      console.error("Error taking kasus:", error);
      // You might want to show a toast notification here
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    const refreshImage = () => {
      if (imgRef.current) {
        imgRef.current.src = `${process.env.AI_URL}/snapshot/replay?t=${Date.now()}`;
      }
    };

    const interval = setInterval(refreshImage, 1000); // refresh every second

    return () => clearInterval(interval);
  }, []);
  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Main Content */}
      <header className="max-w-2xl mx-auto px-4 pt-8 pb-2">
        <h1 className="text-2xl font-bold text-foreground mb-1">
          {gerbong.name}
        </h1>
        <p className="text-base text-muted-foreground">{gerbong.krlName}</p>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        {/* Alert Header */}
        {hasActiveCase && (
          <Card className="bg-destructive/10 border-destructive/30 p-4 mb-6">
            <div className="flex items-start gap-3">
              <div className="bg-destructive/20 p-2 rounded-lg">
                <svg
                  className="w-6 h-6 text-destructive"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <h2 className="text-lg font-bold text-destructive mb-1">
                  {latestKasus?.name || "Suspicious Activity Detected"}
                </h2>
                <p className="text-sm text-foreground/80">
                  {gerbong.name} • {gerbong.krlName} •{" "}
                  {latestKasus ? formatTime(latestKasus.reportedAt) : "Now"}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* Blurred Snapshot */}
        <Card className="bg-card border-border overflow-hidden mb-6">
          <div className="aspect-video bg-secondary/30 relative">
            <img
              ref={imgRef}
              id="replay"
              src="https://e570cf82f732.ngrok-free.app/snapshot/replay"
              alt="Live camera feed"
              className="w-full h-full object-cover"
              onError={(e) => {
                // Fallback if image fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
                const parent = target.parentElement;
                if (parent && !parent.querySelector(".fallback")) {
                  const fallback = document.createElement("div");
                  fallback.className =
                    "fallback absolute inset-0 backdrop-blur-3xl bg-secondary/50 flex items-center justify-center";
                  fallback.innerHTML = `
                    <div class="text-center">
                      <svg class="w-12 h-12 text-muted-foreground mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                      </svg>
                      <p class="text-sm text-muted-foreground">Camera feed unavailable</p>
                    </div>
                  `;
                  parent.appendChild(fallback);
                }
              }}
              onLoad={(e) => {
                // Show image and hide fallback when it loads successfully
                const target = e.target as HTMLImageElement;
                target.style.display = "block";
                const parent = target.parentElement;
                const fallback = parent?.querySelector(".fallback");
                if (fallback) {
                  fallback.remove();
                }
              }}
            />
          </div>
        </Card>

        {/* Detection Details */}
        <Card className="bg-card border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Detection Analysis
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Confidence Level
              </span>
              <Badge className={confidence.variant}>{confidence.level}</Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Case Type</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {latestKasus?.caseType?.replace("_", " ") || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {latestKasus?.status?.replace("_", " ") || "Unknown"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">
                Gerbong Status
              </span>
              <span className="text-sm font-medium text-foreground capitalize">
                {gerbongStatus}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Occupancy</span>
              <span className="text-sm font-medium text-foreground capitalize">
                {latestKasus?.occupancyLabel ||
                  gerbong.statusKepadatan ||
                  "Unknown"}
                {latestKasus?.occupancyValue &&
                  ` (${latestKasus.occupancyValue}%)`}
              </span>
            </div>
          </div>
        </Card>

        {/* Case Description */}
        {latestKasus?.description && (
          <Card className="bg-card border-border p-4 mb-6">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Case Description
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {latestKasus.description}
            </p>
          </Card>
        )}

        {/* Statistics */}
        <Card className="bg-card border-border p-4 mb-6">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Current Statistics
          </h3>
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-bold text-rose-600">
                {gerbong.belum}
              </div>
              <div className="text-xs text-muted-foreground">Pending</div>
            </div>
            <div>
              <div className="text-lg font-bold text-amber-600">
                {gerbong.proses}
              </div>
              <div className="text-xs text-muted-foreground">In Progress</div>
            </div>
            <div>
              <div className="text-lg font-bold text-emerald-600">
                {gerbong.selesai}
              </div>
              <div className="text-xs text-muted-foreground">Resolved</div>
            </div>
          </div>
        </Card>

        <Card className=" border-border p-3 mb-6 text-xs flex flex-wrap gap-4">
          <div>
            <span className="font-semibold text-foreground">
              Max Human Count:
            </span>{" "}
            <span className="text-muted-foreground">
              {latestKasus?.maxHumanCount ?? "-"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Confidence Score:
            </span>{" "}
            <span className="text-muted-foreground">
              {latestKasus?.confidenceScore ?? "-"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Total Inference (s):
            </span>{" "}
            <span className="text-muted-foreground">
              {latestKasus?.totalInferenceSecont ?? "-"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">
              Avg Inference (ms):
            </span>{" "}
            <span className="text-muted-foreground">
              {latestKasus?.averageInferenceMs ?? "-"}
            </span>
          </div>
          <div>
            <span className="font-semibold text-foreground">Avg FPS:</span>{" "}
            <span className="text-muted-foreground">
              {latestKasus?.averageFps ?? "-"}
            </span>
          </div>
        </Card>

        <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-4">
          <div className="max-w-2xl mx-auto">
            <Button
              onClick={handleTake}
              disabled={
                !latestKasus || latestKasus.status === "selesai" || isLoading
              }
              className="w-full flex items-center gap-2 bg-primary hover:bg-destructive/90 text-destructive-foreground"
            >
              <Send className="w-4 h-4" />
              {isLoading ? "Processing..." : "Take"}
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
