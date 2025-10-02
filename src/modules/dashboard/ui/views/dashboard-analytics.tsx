"use client";

import { Card, CardContent } from "@/components/ui/card";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Train, AlertTriangle, CheckCircle2 } from "lucide-react";
export default function DashboardAnalytics() {
  const trpc = useTRPC();

  const { data: allGerbong } = useSuspenseQuery(
    trpc.gerbong.getMany.queryOptions({ page: 1, pageSize: 10 })
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
  const cards = [
    {
      title: "Gerbong Normal",
      subtitle: "Tanpa kasus",
      value: normalCount,
      icon: Train,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
      hoverColor: "group-hover:text-emerald-700",
      hoverBg: "group-hover:bg-emerald-100",
    },
    {
      title: "Gerbong Bermasalah",
      subtitle: "Kasus aktif",
      value: problematicCount,
      icon: AlertTriangle,
      color: "text-rose-600",
      bgColor: "bg-rose-50",
      hoverColor: "group-hover:text-rose-700",
      hoverBg: "group-hover:bg-rose-100",
    },
    {
      title: "Gerbong Diselesaikan",
      subtitle: "Semua kasus selesai",
      value: resolvedCount,
      icon: CheckCircle2,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      hoverColor: "group-hover:text-blue-700",
      hoverBg: "group-hover:bg-blue-100",
    },
  ];


  return (
    <div className="grid grid-cols-3 gap-2 md:grid-cols-3 xl:grid-cols-5 md:gap-6">
      {cards.map((card, i) => {
        const Icon = card.icon;
        return (
          <Card
            key={i}
            className="group relative overflow-hidden border-0 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
          >
            <CardContent className="flex flex-col justify-between py-1 px-3 h-full">
              <div className="flex items-center justify-between w-full mb-2">
                <div className="text-2xl md:text-4xl font-bold tracking-tight">
                  {card.value}
                </div>
                <div
                  className={`${card.bgColor} ${card.color} ${card.hoverBg} ${card.hoverColor} p-2 rounded-xl transition-all duration-300 group-hover:scale-110 group-hover:rotate-3`}
                >
                  <Icon className="w-7 h-7 md:w-9 md:h-9" />
                </div>
              </div>
              <div className="flex flex-col items-start mt-1">
                <p className="text-xs md:text-sm font-medium text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
                  {card.title}
                </p>

              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
