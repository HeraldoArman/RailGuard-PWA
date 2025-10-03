"use client";
import React, { useMemo, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import Link from "next/link";

const statusColor: Record<string, string> = {
  belum_ditangani: "bg-rose-100 text-rose-700 ring-1 ring-rose-200",
  proses: "bg-amber-100 text-amber-700 ring-1 ring-amber-200",
  selesai: "bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200",
};

function StatusBadge({ value }: { value: string }) {
  const cls =
    statusColor[value as keyof typeof statusColor] ??
    "bg-gray-100 text-gray-700 ring-1 ring-gray-200";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap ${cls}`}
    >
      {value.replaceAll("_", " ")}
    </span>
  );
}

export const DashboardHistory = () => {
  const trpc = useTRPC();
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const { data } = useSuspenseQuery(
    trpc.kasus.getMany.queryOptions({ page, pageSize })
  );

  const items = data.items ?? [];
  const totalPages = data.totalPages ?? 1;

  const totalLabel = useMemo(
    () => new Intl.NumberFormat("id-ID").format(data.total ?? 0),
    [data.total]
  );

  const fmtTime = (iso?: string | null) =>
    iso
      ? new Date(iso).toLocaleString("id-ID", {
          dateStyle: "short",
          timeStyle: "short",
        })
      : "-";

  return (
    <div className="space-y-4 p-4">
      <div className="flex items-end justify-between gap-2">
        <h3 className="text-xl font-semibold tracking-tight">
          Histori Kasus{" "}
          <span className="text-sm font-medium text-muted-foreground">
            ({totalLabel})
          </span>
        </h3>
      </div>

      <Card className="border">
        <CardContent className="p-0">
          {/* Mobile: list cards */}
          <ul className="divide-y md:hidden">
            {items.length === 0 && (
              <li className="py-2 text-center text-muted-foreground text-sm">
                Tidak ada histori kasus
              </li>
            )}

            {items.map((k) => (
              <li key={k.id} className="px-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="text-sm font-medium leading-tight line-clamp-2">
                      {k.name}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground line-clamp-2">
                      {k.description || "-"}
                    </div>
                  </div>
                  <StatusBadge value={k.status} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Waktu
                    </div>
                    <div className="font-medium">{fmtTime(k.reportedAt)}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Occupancy
                    </div>
                    <div className="font-medium">
                      {k.occupancyLabel
                        ? `${k.occupancyLabel}${
                            k.occupancyValue != null
                              ? ` (${k.occupancyValue})`
                              : ""
                          }`
                        : "-"}
                    </div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-[11px] text-muted-foreground">
                      Gerbong
                    </div>
                    <div className="font-medium">{k.gerbongName ?? "-"}</div>
                  </div>
                  <div className="rounded-md bg-muted/40 p-2">
                    <div className="text-[11px] text-muted-foreground">KRL</div>
                    <div className="font-medium">{k.krlName ?? "-"}</div>
                  </div>
                </div>

                <div className="mt-3 flex justify-end">
                  <Link
                    href={`/dashboard/histori/${k.id}`}
                    className="text-xs font-medium text-primary underline-offset-2 hover:underline"
                    aria-label={`Lihat detail gerbong ${k.gerbongName ?? ""}`}
                  >
                    Detail
                  </Link>
                </div>
              </li>
            ))}
          </ul>

          {/* Desktop: responsive table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/60 text-xs uppercase tracking-wide text-muted-foreground sticky top-0 z-10">
                <tr className="[&_th]:px-3 [&_th]:py-2 text-left">
                  <th className="w-[160px]">Waktu</th>
                  <th className="min-w-[240px]">Kasus</th>
                  <th className="w-[140px]">Status</th>
                  <th className="w-[120px]">Gerbong</th>
                  <th className="w-[140px]">KRL</th>
                  <th className="w-[160px]">Occupancy</th>
                  <th className="w-[90px]">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {items.length === 0 && (
                  <tr>
                    <td
                      colSpan={7}
                      className="py-8 text-center text-muted-foreground text-sm"
                    >
                      Tidak ada histori kasus
                    </td>
                  </tr>
                )}
                {items.map((k) => (
                  <tr
                    key={k.id}
                    className="hover:bg-muted/40 transition-colors"
                  >
                    <td className="px-3 py-2 whitespace-nowrap">
                      {fmtTime(k.reportedAt)}
                    </td>
                    <td className="px-3 py-2">
                      <div className="font-medium">{k.name}</div>
                      <div className="text-xs text-muted-foreground line-clamp-1">
                        {k.description}
                      </div>
                    </td>
                    <td className="px-3 py-2">
                      <StatusBadge value={k.status} />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {k.gerbongName ?? "-"}
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap">
                      {k.krlName ?? "-"}
                    </td>
                    <td className="px-3 py-2 text-xs">
                      {k.occupancyLabel
                        ? `${k.occupancyLabel}${
                            k.occupancyValue != null
                              ? ` (${k.occupancyValue})`
                              : ""
                          }`
                        : "-"}
                    </td>
                    <td className="px-3 py-2">
                      <Link
                        href={`/dashboard/histori/${k.id}`}
                        className="text-xs text-primary hover:underline underline-offset-2"
                      >
                        Detail
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-between sm:items-center px-3 py-2 border-t bg-muted/30 text-xs">
              <span className="text-muted-foreground">
                Menampilkan {items.length} dari {totalLabel} kasus (Hal. {page} /{" "}
                {totalPages})
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setPage(1)}
                  disabled={page === 1}
                  className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition"
                  aria-label="Halaman pertama"
                >
                  «
                </button>
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition"
                  aria-label="Sebelumnya"
                >
                  Prev
                </button>
                <span className="px-2 py-1 tabular-nums">
                  {page} / {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition"
                  aria-label="Berikutnya"
                >
                  Next
                </button>
                <button
                  onClick={() => setPage(totalPages)}
                  disabled={page === totalPages}
                  className="px-2 py-1 rounded border disabled:opacity-40 hover:bg-muted transition"
                  aria-label="Halaman terakhir"
                >
                  »
                </button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardHistory;
