import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Navigation, Header } from '@/components/Navigation';

export const metadata: Metadata = {
  title: 'SATX Nightlife Power Rankings',
  description:
    'Transparent, data-driven rankings for San Antonio NW & Boerne nightlife venues. Live scores, deals, events, and expert picks.',
  keywords: [
    'San Antonio',
    'nightlife',
    'bars',
    'breweries',
    'Boerne',
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
    description: 'Find the best bars and nightlife in San Antonio NW & Boerne',
    type: 'website',
    locale: 'en_US',
    siteName: 'SATX Nightlife',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SATX Nightlife Power Rankings',
    description: 'Find the best bars and nightlife in San Antonio NW & Boerne',
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
  themeColor: '#1f1f23',
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
      <body className="font-sans antialiased bg-gray-900 text-white">
        <Header />
        {children}
        <Navigation />
      </body>
    </html>
  );
}
