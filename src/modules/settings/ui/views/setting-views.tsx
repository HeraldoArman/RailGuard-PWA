"use client";

import Link from "next/link";
import { ArrowLeft, Shield, Bell, Vibrate, Volume2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useState } from "react";
import { gerbong } from "@/db/schema";

import {
  CommandResponsiveDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandItem,
} from "@/components/ui/command";
import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import { authClient } from "@/lib/auth-client";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

import { useRouter } from "next/navigation";

export default function SettingsPage() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const [settings, setSettings] = useState({
    status: true,
    sound: true,
  });
  const [krlDialogOpen, setKrlDialogOpen] = useState(false);
  const [selectedKrlId, setSelectedKrlId] = useState<string | null>(null);

  const trpc = useTRPC();
  const { data: krlData } = useSuspenseQuery(
    trpc.krl.getGerbongSummaryByUser.queryOptions()
  );


  if (isPending || !data?.user) {
    return null;
  }

  // Dummy user data (ganti dengan data session / trpc)
  const user = {
    name: data.user.name,
    email: data.user.email,
    role: "Petugas Keamanan",
  };

  const toggleSetting = (key: keyof typeof settings) =>
    setSettings((prev) => ({ ...prev, [key]: !prev[key] }));

  const initials = user.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const selectedKrl = krlData.find((k) => k.krlId === selectedKrlId);

  const handleKrlSelect = (krlId: string) => {
    setSelectedKrlId(krlId);
    setKrlDialogOpen(false);

    console.log("Selected KRL:", krlId);
  };

  return (
    <div className="min-h-screen bg-background pb-24 flex flex-col">
      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-8">
        {/* Notification + User Info */}
        <section>
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Alert & Profile
          </h2>
          <Card className="bg-card border-border divide-y p-0">
            {/* Status / Vibration */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Vibrate className="h-4 w-4 text-primary" />
                  Status Alerts
                </div>
                <p className="text-xs text-muted-foreground">
                  Toggle real-time status notifications
                </p>
              </div>
              <Switch
                checked={settings.status}
                onCheckedChange={() => toggleSetting("status")}
                aria-label="Toggle status alerts"
              />
            </div>

            <div className="p-4 flex items-center gap-1">
              <div className="relative">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                  {initials}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium leading-tight truncate">
                  {user.name}
                </p>
                <p className="text-xs text-muted-foreground truncate">
                  {user.email}
                </p>
                <p className="mt-1 text-[11px] inline-flex items-center gap-1 rounded bg-muted px-2 py-0.5 font-medium">
                  <Shield className="h-3 w-3" />
                  {user.role}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setKrlDialogOpen(true)}
                className="text-xs text-primary hover:underline whitespace-nowrap"
              >
                Select KRL
              </Button>
            </div>

            {/* Current KRL Selection */}
            {selectedKrl && (
              <div className="p-4 bg-muted/30">
                <div className="flex items-center gap-2 text-sm">
                  <Shield className="h-4 w-4 text-primary" />
                  <span className="font-medium">Active KRL:</span>
                  <span className="text-primary font-semibold">
                    {selectedKrl.krlName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    ({selectedKrl.totalGerbong} gerbong)
                  </span>
                </div>
              </div>
            )}

            {/* Voice / Sound Activation */}
            <div className="p-4 flex items-center justify-between gap-4">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2 font-medium text-foreground">
                  <Volume2 className="h-4 w-4 text-primary" />
                  Voice Activation
                </div>
                <p className="text-xs text-muted-foreground">
                  Enable audio cues for urgent events
                </p>
              </div>
              <Switch
                checked={settings.sound}
                onCheckedChange={() => toggleSetting("sound")}
                aria-label="Toggle voice activation"
              />
            </div>
          </Card>
        </section>
      </main>

      {/* KRL Selection Dialog */}
      <CommandResponsiveDialog
        open={krlDialogOpen}
        onOpenChange={setKrlDialogOpen}
        title="Select KRL"
        description="Choose the KRL you want to monitor"
      >
        <CommandInput placeholder="Search KRL..." />
        <CommandList>
          <CommandEmpty>No KRL found.</CommandEmpty>
          {krlData.map((krl) => (
            <CommandItem
              key={krl.krlId}
              onSelect={() => handleKrlSelect(krl.krlId)}
              className="flex items-center justify-between"
            >
              <div className="flex flex-col gap-1">
                <span className="font-medium">{krl.krlName}</span>
                <span className="text-xs text-muted-foreground">
                  {krl.totalGerbong} gerbong • Normal: {krl.normalGerbong} •
                  Bermasalah: {krl.problematicGerbong}
                </span>
              </div>
              {selectedKrlId === krl.krlId && (
                <Shield className="h-4 w-4 text-primary" />
              )}
            </CommandItem>
          ))}
        </CommandList>
      </CommandResponsiveDialog>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 inset-x-0 z-30 bg-card/95 backdrop-blur supports-[backdrop-filter]:bg-card/80 border-t border-border">
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
              href="/history"
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
              href="/settings"
              className="flex flex-col items-center gap-1 px-2 py-1 text-xs rounded-md transition-colors text-primary bg-primary/10 font-medium"
              aria-current="page"
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
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Settings
            </Link>
          </div>
        </div>
      </nav>
    </div>
  );
}
