import type { Metadata } from "next";
import "./globals.css";
import { Gloock, Instrument_Sans } from 'next/font/google';
import Scene from '@/components/Scene';
import GoogleAnalytics from '@/components/GoogleAnalytics';
import { SITE_URL } from '@/lib/seo';

const display = Gloock({ subsets: ['latin'], weight: '400', variable: '--font-display' });
const body = Instrument_Sans({ subsets: ['latin'], variable: '--font-body' });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: "TuneTrivia - Music Challenge Game",
  description: "Test your music knowledge! Guess songs from short previews across Pop, Rock, Country, R&B, Rap, Alternative, Dance, Latin, and the Billboard and Spotify streaming charts. Play quick challenges or pick a specific chart week from decades of hits.",
  icons: {
    icon: [
      { url: '/favicon.ico?v=2', sizes: '16x16 32x32 48x48' },
      { url: '/favicon.svg?v=2', type: 'image/svg+xml', sizes: 'any' },
    ],
    apple: [{ url: '/apple-touch-icon.png?v=2', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-theme="dusk" className={`${display.variable} ${body.variable}`}>
      <body className={`${body.className} antialiased`}>
        <a href="#main-content" className="skip-link">Skip to content</a>
        <Scene />
        {children}
        <GoogleAnalytics />
      </body>
    </html>
  );
}
