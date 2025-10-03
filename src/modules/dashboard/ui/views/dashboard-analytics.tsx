"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Train, AlertTriangle, CheckCircle2, Shield, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function DashboardAnalytics() {
  const trpc = useTRPC();

  const { data: allGerbong } = useSuspenseQuery(
    trpc.gerbong.getManyByUser.queryOptions({ page: 1, pageSize: 100 })
  );
  
  const items = allGerbong.items ?? [];
  const normalCount = items.filter(g => (g.totalKasus ?? 0) === 0).length;
  const problematicCount = items.filter(
    g => (g.belum ?? 0) > 0 || (g.proses ?? 0) > 0
  ).length;
  const resolvedCount = items.filter(
    g =>
      (g.totalKasus ?? 0) > 0 &&
      (g.totalKasus ?? 0) === (g.selesai ?? 0)
  ).length;

  const totalGerbong = items.length;
  const totalKasus = items.reduce((sum, g) => sum + Number(g.totalKasus ?? 0), 0);

  const cards = [
    {
      title: "Gerbong Normal",
      subtitle: "Tanpa kasus aktif",
      value: normalCount,
      icon: CheckCircle2,
      color: "text-emerald-600",
      bgColor: "bg-emerald-100",
    },
    {
      title: "Gerbong Bermasalah",
      subtitle: "Memerlukan perhatian",
      value: problematicCount,
      icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-100",
    },
    {
      title: "Kasus Diselesaikan",
      subtitle: "Sudah ditangani",
      value: resolvedCount,
      icon: Train,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
  ];

  return (
    <div className="bg-background pb-2">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center gap-3">
          <Link
            href="/"
            className="inline-flex items-center justify-center h-9 w-9 rounded-md hover:bg-muted transition-colors"
            aria-label="Back"
          >
            <BarChart3 className="h-5 w-5" />
          </Link>
          <h1 className="text-lg font-semibold tracking-tight">Analytics Dashboard</h1>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Overview Stats */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Overview Statistics
          </h2>
          
          <Card className="bg-card border-border p-4 mb-4">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-foreground">{totalGerbong}</div>
                <p className="text-xs text-muted-foreground">Total Gerbong</p>
              </div>
              <div>
                <div className="text-2xl font-bold text-foreground">{totalKasus}</div>
                <p className="text-xs text-muted-foreground">Total Kasus</p>
              </div>
            </div>
          </Card>
        </section>

        {/* Status Breakdown */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Status Breakdown
          </h2>
          
          <Card className="bg-card border-border divide-y">
            {cards.map((card, i) => {
              const Icon = card.icon;
              return (
                <div key={i} className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`${card.bgColor} p-2 rounded-lg`}>
                      <Icon className={`w-5 h-5 ${card.color}`} />
                    </div>
                    <div>
                      <p className="font-medium text-foregroun  d">{card.title}</p>
                      <p className="text-xs text-muted-foreground">{card.subtitle}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-xl font-bold text-foreground">{card.value}</div>
                    <div className="text-xs text-muted-foreground">
                      {totalGerbong > 0 ? `${Math.round((card.value / totalGerbong) * 100)}%` : '0%'}
                    </div>
                  </div>
                </div>
              );
            })}
          </Card>
        </section>



        {/* Quick Actions */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Quick Actions
          </h2>
          
          <Card className="bg-card border-border divide-y">

            <Link href="/dashboard/histori" className="p-4 flex items-center justify-between hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-primary" />
                <span className="font-medium text-foreground">View History</span>
              </div>
              <div className="text-xs text-muted-foreground">→</div>
            </Link>
          </Card>
        </section>
      </main>

      {/* Bottom Navigation */}
      {/* <nav className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <Shield className="w-5 h-5" />
              Monitor
            </Link>
            <Link
              href="/histori"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <svg
                className="w-5 h-5"
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
              History
            </Link>
            <Link
              href="/analytics"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-primary bg-primary/10 font-medium"
              aria-current="page"
            >
              <BarChart3 className="w-5 h-5" />
              Analytics
            </Link>
          </div>
        </div>
      </nav> */}
    </div>
  );
}