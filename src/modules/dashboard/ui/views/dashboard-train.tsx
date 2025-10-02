"use client";
import React from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Train, AlertTriangle, CheckCircle2, Shield } from "lucide-react";
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

    type BadgeVariant = "default" | "destructive" | "secondary";
    const badgeVariant: BadgeVariant = normal
      ? "default"
      : problematic
        ? "destructive"
        : "secondary";

    const statusIcon = normal
      ? CheckCircle2
      : problematic
        ? AlertTriangle
        : CheckCircle2;

    return {
      id: g.id,
      name: g.name,
      krlName: g.krlName,
      statusLabel,
      badgeVariant,
      statusIcon,
      stats: {
        total: g.totalKasus,
        belum: g.belum,
        proses: g.proses,
        selesai: g.selesai,
      },
      statusKepadatan: g.statusKepadatan || "unknown",
    };
  });

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-4">
            Status Gerbong
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {cards.map((c) => {
              const StatusIcon = c.statusIcon;
              return (
                <Link
                  key={c.id}
                  href={`/dashboard/gerbong/${c.id}`}
                  className="group"
                >
                  <Card className="bg-card border-border transition-all duration-200 hover:shadow-lg hover:-translate-y-1">
                    <CardContent className="p-4">
                      {/* Header */}
                      <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2">
                          <Train className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium text-foreground group-hover:text-primary transition-colors">
                            {c.name}
                          </span>
                          <Badge variant={c.badgeVariant} className="text-xs">
                            {/* <Badge variant={c.badgeVariant as any} className="text-xs"> */}
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {c.statusLabel}
                          </Badge>
                        </div>
                      </div>

                      {/* Stats */}
                      <div className="space-y-2 mb-4">
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Total:
                            </span>
                            <span className="font-medium">{c.stats.total}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Selesai:
                            </span>
                            <span className="font-medium text-emerald-600">
                              {c.stats.selesai}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Belum:
                            </span>
                            <span className="font-medium text-rose-600">
                              {c.stats.belum}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">
                              Proses:
                            </span>
                            <span className="font-medium text-amber-600">
                              {c.stats.proses}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Footer */}
                      <div className="pt-3 border-t border-border">
                        <div className="flex justify-between items-center text-xs text-muted-foreground">
                          <span>
                            KRL:{" "}
                            <span className="font-medium text-foreground">
                              {c.krlName}
                            </span>
                          </span>
                          <span>
                            <span className="font-medium text-foreground capitalize">
                              {c.statusKepadatan}
                            </span>
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>

          {cards.length === 0 && (
            <Card className="bg-card border-border p-8 text-center">
              <Train className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-foreground mb-2">
                Tidak ada gerbong
              </h3>
              <p className="text-sm text-muted-foreground">
                Belum ada data gerbong yang dapat ditampilkan.
              </p>
            </Card>
          )}
        </section>
      </main>
    </div>
  );
};
