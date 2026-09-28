import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Providers, PwaRegister } from "@/components/providers";
import "./globals.css";

const sans = Geist({ subsets: ["latin"], variable: "--font-geist" });

export const metadata: Metadata = {
  title: { default: "Eventra", template: "%s · Eventra" },
  description: "One profile. Every event. One campus. Eventra is the student event ecosystem for clubs, committees, and departments.",
  applicationName: "Eventra",
  manifest: "/manifest.webmanifest",
  appleWebApp: { capable: true, title: "Eventra", statusBarStyle: "default" },
  icons: {
    icon: [{ url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" }],
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#121316",
  width: "device-width",
  initialScale: 1,
};

export const dynamic = "force-dynamic";

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${sans.variable} h-full antialiased`}>
      <body className="min-h-full">
        <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-full focus:bg-white focus:px-4 focus:py-2">
          Skip to content
        </a>
        <Providers>{children}</Providers>
        <PwaRegister />
      </body>
    </html>
  );
}
