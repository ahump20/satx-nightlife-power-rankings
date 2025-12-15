import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout';

export const metadata: Metadata = {
  title: 'SATX Nightlife Power Rankings',
  description:
    'Research-backed nightlife rankings for San Antonio, Boerne & New Braunfels. Real ratings from locals, no bias.',
  keywords: [
    'San Antonio',
    'nightlife',
    'bars',
    'breweries',
    'Boerne',
    'New Braunfels',
    'Gruene Hall',
    'River Walk',
    'Pearl District',
    'power rankings',
    'happy hour',
    'cocktails',
  ],
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SATX Nightlife',
  },
  openGraph: {
    title: 'SATX Nightlife Power Rankings',
    description: 'Research-backed nightlife rankings for San Antonio, Boerne & New Braunfels',
    type: 'website',
    locale: 'en_US',
    siteName: 'SATX Nightlife',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SATX Nightlife Power Rankings',
    description: 'Research-backed nightlife rankings for San Antonio, Boerne & New Braunfels',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  themeColor: '#0a0a0a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
