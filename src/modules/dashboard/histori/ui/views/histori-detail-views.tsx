"use client";

import Link from "next/link";
import { ArrowLeft, Eye, Calendar, User, MapPin } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useParams } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";

export const HistoriDetailViews = () => {
  const params = useParams();
  const historiId = params.historiId as string;
  const trpc = useTRPC();

  // Fetch case data
  const { data: kasus } = useSuspenseQuery(
    trpc.kasus.getOne.queryOptions({ id: historiId })
  );

  const formatTime = (date: Date | string) => {
    return new Date(date).toLocaleString("id-ID", {
      dateStyle: "medium",
      timeStyle: "medium",
    });
  };

  const getStatusColor = (status: string) => {
    const colorMap: Record<string, string> = {
      belum_ditangani: "bg-rose-100 text-rose-700 border-rose-200",
      proses: "bg-amber-100 text-amber-700 border-amber-200",
      selesai: "bg-emerald-100 text-emerald-700 border-emerald-200",
    };
    return colorMap[status] || "bg-gray-100 text-gray-700 border-gray-200";
  };

  const getCaseTypeColor = (caseType: string) => {
    const colorMap: Record<string, string> = {
      pelecehan: "bg-red-100 text-red-700",
      prioritas: "bg-purple-100 text-purple-700", 
      pencopetan: "bg-orange-100 text-orange-700",
      keamanan: "bg-blue-100 text-blue-700",
      keributan: "bg-yellow-100 text-yellow-700",
      darurat: "bg-red-100 text-red-700",
      kepadatan: "bg-cyan-100 text-cyan-700",
      lainnya: "bg-gray-100 text-gray-700",
    };
    return colorMap[caseType] || "bg-gray-100 text-gray-700";
  };

  return (
    <div className="min-h-screen bg-background pb-24">


      {/* Main Content */}
      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Case Header */}
        <Card className="bg-card border-border p-4">
          <div className="flex items-start justify-between gap-3 mb-4">
            <div className="flex-1">
              <h2 className="text-lg font-bold text-foreground mb-2">
                {kasus.name}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge 
                  className={`${getStatusColor(kasus.status)} border`}
                >
                  {kasus.status?.replace("_", " ").toUpperCase()}
                </Badge>
                <Badge 
                  className={getCaseTypeColor(kasus.caseType || "lainnya")}
                >
                  {kasus.caseType?.replace("_", " ").toUpperCase()}
                </Badge>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-3 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Reported: {formatTime(kasus.reportedAt)}</span>
            </div>
            {kasus.acknowledgedAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <Eye className="h-4 w-4" />
                <span>Acknowledged: {formatTime(kasus.acknowledgedAt)}</span>
              </div>
            )}
            {kasus.resolvedAt && (
              <div className="flex items-center gap-2 text-muted-foreground">
                <User className="h-4 w-4" />
                <span>Resolved: {formatTime(kasus.resolvedAt)}</span>
              </div>
            )}
          </div>
        </Card>

        {/* Case Description */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-3">
            Description
          </h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {kasus.description}
          </p>
        </Card>

               {/* Location & Occupancy Info */}
               <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Location & Occupancy
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">KRL</span>
              <span className="text-sm font-medium text-foreground">
                {kasus.krlName}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Gerbong</span>
              <span className="text-sm font-medium text-foreground">
                {kasus.gerbongName}
              </span>
            </div>
            {kasus.occupancyLabel && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Occupancy Level</span>
                <span className="text-sm font-medium text-foreground capitalize">
                  {kasus.occupancyLabel}
                  {kasus.occupancyValue && ` (${kasus.occupancyValue}%)`}
                </span>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Source</span>
              <span className="text-sm font-medium text-foreground uppercase">
                {kasus.source}
              </span>
            </div>
          </div>
        </Card>

        {/* Handler Info */}
        {kasus.handlerId && (
          <Card className="bg-card border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Handler Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium text-foreground">
                  {kasus.handlerName || "-"}
                </span>
              </div>


            </div>
          </Card>
        )}
        {/* Images */}
        {kasus.images && kasus.images.length > 0 && (
          <Card className="bg-card border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-4">
              Evidence
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {kasus.images.map((imageUrl, index) => (
                <div 
                  key={index}
                  className="aspect-video bg-secondary/30 relative flex items-center justify-center rounded-lg overflow-hidden"
                >
                  <div className="absolute inset-0 backdrop-blur-sm bg-secondary/50" />
                  <div className="relative z-10 text-center">
                    <Eye className="w-8 h-8 text-muted-foreground mx-auto mb-1" />
                    <p className="text-xs text-muted-foreground">
                      Image {index + 1}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Resolution Notes */}
        {kasus.resolutionNotes && (
          <Card className="bg-card border-border p-4">
            <h3 className="text-sm font-semibold text-foreground mb-3">
              Resolution Notes
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {kasus.resolutionNotes}
            </p>
          </Card>
        )}



        {/* Timestamps */}
        <Card className="bg-card border-border p-4">
          <h3 className="text-sm font-semibold text-foreground mb-4">
            Timeline
          </h3>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created:</span>
              <span className="font-medium">{formatTime(kasus.createdAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Last Updated:</span>
              <span className="font-medium">{formatTime(kasus.updatedAt)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Reported:</span>
              <span className="font-medium">{formatTime(kasus.reportedAt)}</span>
            </div>
            {kasus.acknowledgedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Acknowledged:</span>
                <span className="font-medium">{formatTime(kasus.acknowledgedAt)}</span>
              </div>
            )}
            {kasus.arrivedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Officer Arrived:</span>
                <span className="font-medium">{formatTime(kasus.arrivedAt)}</span>
              </div>
            )}
            {kasus.resolvedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Resolved:</span>
                <span className="font-medium">{formatTime(kasus.resolvedAt)}</span>
              </div>
            )}
          </div>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border">
        <div className="max-w-2xl mx-auto px-4 py-2">
          <div className="grid grid-cols-3 gap-2">
            <Link
              href="/dashboard"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Monitor
            </Link>
            <Link
              href="/dashboard/histori"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-primary bg-primary/10 font-medium"
              aria-current="page"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              History
            </Link>
            <Link
              href="/settings"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-muted-foreground hover:text-foreground hover:bg-muted/50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
};