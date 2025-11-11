import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LoginDialog } from "@/components/login-dialog";
import { SessionExpiredDialog } from "@/components/session-expired-dialog";
import { ServiceWorkerRegister } from "@/components/service-worker-register";
import { PWAInstaller } from "@/components/pwa-installer";
import { Toaster } from "sonner";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TLU Extension",
  description: "Tiện ích sinh viên Thủy Lợi",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: "/logo/192.png", sizes: "192x192", type: "image/png" },
      { url: "/logo/512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [
      { url: "/logo/192.png", sizes: "192x192", type: "image/png" },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "TLU Calculator",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="dark" storageKey="tlu-ui-theme">
          <ServiceWorkerRegister />
          {children}
          <LoginDialog />
          <SessionExpiredDialog />
          <PWAInstaller />
          <Toaster 
            position="top-right" 
            toastOptions={{
              style: {
                background: 'var(--background)',
                border: '1px solid var(--border)',
                color: 'var(--foreground)',
              },
              classNames: {
                success: 'border-green-500/50',
                error: 'border-red-500/50',
                info: 'border-blue-500/50',
                warning: 'border-yellow-500/50',
              },
            }}
          />
        </ThemeProvider>
      </body>
    </html>
  );
}
