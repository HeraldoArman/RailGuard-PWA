import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TRPCReactProvider } from "@/trpc/client";
import { Toaster } from "@/components/ui/sonner";
import { NuqsAdapter } from "nuqs/adapters/next";
import { VoiceProvider } from "@/modules/voice/voiceProvider";
import GlobalVoiceHandler from "@/modules/voice/globalVoiceHandler";
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// const geistMono = Geist_Mono({
//   variable: "--font-geist-mono",
//   subsets: ["latin"],
// });

export const metadata: Metadata = {
  title: "RailGuard PWA",
  description: "A Progressive Web App for railway safety",
  generator: "Next.js",
  manifest: "/manifest.json",
  keywords: ["nextjs", "pwa", "railway"],
  authors: [{ name: "Your Name" }],
  icons: [
    { rel: "apple-touch-icon", url: "/icon-128x128.png" },
    { rel: "icon", url: "/icon-128x128.png" },
  ],
};

export const viewport: Viewport = {
  themeColor: "#1976d2",
  colorScheme: "light",
  width: "device-width",
  initialScale: 1,
  minimumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <NuqsAdapter>
      <TRPCReactProvider>
        <html lang="en">
          <head>
            <link rel="manifest" href="/manifest.webmanifest" />

            <meta name="apple-mobile-web-app-capable" content="yes" />
            <meta
              name="apple-mobile-web-app-status-bar-style"
              content="default"
            />
            <meta name="apple-mobile-web-app-title" content="RailGuard" />
            <meta name="mobile-web-app-capable" content="yes" />
          </head>
          <body>
            <Toaster />
            {/* <div className="fixed bottom-4 right-4 z-50"> */}
            {/* <PWAInstallButton /> */}
            {/* </div> */}
            <VoiceProvider>
              <GlobalVoiceHandler />
              {children}
            </VoiceProvider>
          </body>
        </html>
      </TRPCReactProvider>
    </NuqsAdapter>
  );
}
