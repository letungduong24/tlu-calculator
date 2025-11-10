import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { LoginDialog } from "@/components/login-dialog";
import { SessionExpiredDialog } from "@/components/session-expired-dialog";
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
  title: "TLU Calculator",
  description: "Tính điểm TLU",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ThemeProvider defaultTheme="dark" storageKey="tlu-ui-theme">
          {children}
          <LoginDialog />
          <SessionExpiredDialog />
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
