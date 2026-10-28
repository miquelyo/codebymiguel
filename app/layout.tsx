import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/components/AuthProvider";
import PwaRegister from "@/app/components/PwaRegister";
import { Toaster } from "react-hot-toast";
import type { Viewport } from "next";

export const metadata: Metadata = {
  metadataBase: new URL('https://codebymiguel.com'),
  title: {
    default: "CodebyMiguel — Modern Personal Workspace",
    template: "%s | CodebyMiguel",
  },
  description: "Dashboard workspace modern — kelola notes, agenda, absensi AI, agen cerdas, dan gaya hidup sehat.",
  applicationName: "CodebyMiguel",
  authors: [{ name: "Miguel Yosafat" }],
  keywords: ["CodebyMiguel", "Workspace", "Dashboard", "Notes", "Agenda", "Habit Tracker", "AI Tracker"],
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CodebyMiguel",
    statusBarStyle: "default",
  },
  openGraph: {
    type: "website",
    locale: "id_ID",
    url: "https://codebymiguel.com",
    title: "CodebyMiguel — Modern Personal Workspace",
    description: "Dashboard workspace modern — kelola notes, agenda, absensi AI, agen cerdas, dan gaya hidup sehat.",
    siteName: "CodebyMiguel",
  },
  twitter: {
    card: "summary_large_image",
    title: "CodebyMiguel — Modern Personal Workspace",
    description: "Dashboard workspace modern terpadu.",
  },
  icons: {
    apple: [
      { url: '/apple-touch-icon.png?v=3', sizes: '180x180', type: 'image/png' },
    ],
    icon: [
      { url: '/favicon.ico?v=3', sizes: '32x32', type: 'image/x-icon' },
      { url: '/icon-192.png?v=3', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png?v=3', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#ffffff",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="antialiased" suppressHydrationWarning>
      <head>
        {/* Google Fonts preconnect & non-blocking stylesheet for optimal mobile Lighthouse FCP */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Space+Grotesk:wght@400;500;600;700;800&family=JetBrains+Mono:wght@400;500;600&display=swap"
        />

        {/* iOS PWA meta */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png?v=3" />
        <link rel="apple-touch-icon-precomposed" href="/apple-touch-icon-precomposed.png?v=3" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png?v=3" />
        <link rel="apple-touch-icon" sizes="152x152" href="/apple-touch-icon.png?v=3" />
        <link rel="apple-touch-icon" sizes="120x120" href="/apple-touch-icon.png?v=3" />
        <link rel="shortcut icon" href="/favicon.ico?v=3" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-screen bg-background text-foreground font-sans">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 3500,
            style: {
              background: 'var(--card)',
              color: 'var(--foreground)',
              border: '1px solid var(--border-color)',
              borderRadius: '16px',
              padding: '12px 18px',
              fontSize: '13px',
              fontWeight: 500,
              boxShadow: '0 20px 40px -10px rgba(0, 0, 0, 0.25)',
              backdropFilter: 'blur(16px)',
            },
          }}
        />
        <PwaRegister />
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
