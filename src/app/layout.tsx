import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AppShell } from '@/components/layout';

const siteUrl = 'https://satx-nightlife.vercel.app';

export const metadata: Metadata = {
  title: {
    default: 'SATX Nightlife Power Rankings',
    template: '%s | SATX Nightlife',
  },
  description:
    'Research-backed nightlife rankings for San Antonio, Boerne & New Braunfels. Real ratings from locals, no bias. Find the best bars, breweries, and cocktail lounges.',
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
    'Southtown',
    'Stone Oak',
    'power rankings',
    'happy hour',
    'cocktails',
    'dive bars',
    'speakeasy',
    'rooftop bars',
    'Texas Hill Country',
  ],
  manifest: '/manifest.json',
  applicationName: 'SATX Nightlife',
  authors: [{ name: 'SATX Nightlife' }],
  creator: 'SATX Nightlife',
  publisher: 'SATX Nightlife',
  formatDetection: {
    telephone: true,
    address: true,
  },
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: '/',
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'SATX Nightlife',
  },
  openGraph: {
    title: 'SATX Nightlife Power Rankings',
    description: 'Research-backed nightlife rankings for San Antonio, Boerne & New Braunfels. Real ratings from locals, no bias.',
    url: siteUrl,
    siteName: 'SATX Nightlife',
    images: [
      {
        url: '/images/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'SATX Nightlife Power Rankings - San Antonio Bar Guide',
        type: 'image/jpeg',
      },
    ],
    locale: 'en_US',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SATX Nightlife Power Rankings',
    description: 'Research-backed nightlife rankings for San Antonio, Boerne & New Braunfels. Real ratings from locals, no bias.',
    images: ['/images/og-image.jpg'],
    creator: '@satxnightlife',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  category: 'lifestyle',
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
