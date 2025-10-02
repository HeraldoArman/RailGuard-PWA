"use client";
import React from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Train, AlertTriangle, CheckCircle2 } from "lucide-react";
import Link from "next/link";

export const DashboardTrain = () => {
  const trpc = useTRPC();
  const { data } = useSuspenseQuery(
    trpc.krl.getGerbongSummaryByUser.queryOptions()
  );

  // Flatten semua gerbong
  const gerbongAll = data.flatMap((k) =>
    k.gerbong.map((g) => ({
      krlId: k.krlId,
      krlName: k.krlName,
      ...g,
    }))
  );

  const cards = gerbongAll.map((g) => {
    const normal = g.totalKasus === 0;
    const resolved = g.totalKasus > 0 && g.totalKasus === (g.selesai ?? 0);
    const problematic = !normal && !resolved;

    const statusLabel = normal
      ? "Normal"
      : problematic
        ? "Bermasalah"
        : "Diselesaikan";

    const chipClass = normal
      ? "bg-emerald-100 text-emerald-700 border-emerald-200"
      : problematic
        ? "bg-rose-100 text-rose-700 border-rose-200"
        : "bg-blue-100 text-blue-700 border-blue-200";

    return {
      id: g.id,
      name: g.name,
      krlName: g.krlName,
      statusLabel,
      chipClass,
      stats: `Kasus: ${g.totalKasus} | Belum ${g.belum} | Proses ${g.proses} | Selesai ${g.selesai}`,
      statusKepadatan: g.statusKepadatan,
    };
  });

  // ...existing code...
  return (
    <div className="space-y-3">
      <h3 className="text-lg my-4 font-semibold tracking-tight">
        Status Gerbong ({cards.length})
      </h3>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {cards.map((c) => (
          <Link
            key={c.id}
            href={`/dashboard/gerbong/${c.id}`}
            className="group"
          >
            <Card className="border transition-all duration-150 hover:shadow-md hover:-translate-y-0.5">
              <CardContent className="px-3 flex flex-col gap-2 min-h-0">
                <div className="flex items-start justify-between">
                  <div className="font-medium truncate">{c.name}</div>
                  <span
                    className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${c.chipClass}`}
                  >
                    {c.statusLabel}
                  </span>
                </div>
                <div className="text-[11px] leading-tight opacity-75">
                  {c.stats}
                </div>
                <div className="mt-auto text-[10px] opacity-60">
                  KRL: {c.krlName}
                </div>
                <div className="mt-auto text-[10px] opacity-60">
                  Kepadatan: {c.statusKepadatan}{" "}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
};
