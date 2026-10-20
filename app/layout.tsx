import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/app/components/AuthProvider";
import PwaRegister from "@/app/components/PwaRegister";
import { Toaster } from "react-hot-toast";
import type { Viewport } from "next";

export const metadata: Metadata = {
  title: "CodebyMiguel",
  description: "Dashboard workspace modern — kelola notes, agenda, absensi, dan AI tracker.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "CodebyMiguel",
    statusBarStyle: "black-translucent",
  },
  icons: {
    apple: [
      { url: '/apple-touch-icon.png', sizes: '180x180', type: 'image/png' },
    ],
    icon: [
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#111827" },
    { media: "(prefers-color-scheme: dark)", color: "#111827" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="id" className="antialiased" suppressHydrationWarning>
      <head>
        {/* iOS PWA */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="CodebyMiguel" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        {/* Splash screens iOS (optional fallback) */}
        <meta name="mobile-web-app-capable" content="yes" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                const saved = localStorage.getItem('theme');
                if (saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
                  document.documentElement.classList.add('dark');
                } else {
                  document.documentElement.classList.remove('dark');
                }
              } catch (_) {}
            `,
          }}
        />
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
