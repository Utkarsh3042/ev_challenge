import type { Metadata, Viewport } from 'next';
import { Inter, Noto_Sans_Devanagari, Noto_Sans_Kannada } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin', 'latin-ext'],
  variable: '--font-inter',
  display: 'swap',
});
const notoDevanagari = Noto_Sans_Devanagari({
  subsets: ['devanagari'],
  variable: '--font-devanagari',
  display: 'swap',
});
const notoKannada = Noto_Sans_Kannada({
  subsets: ['kannada'],
  variable: '--font-kannada',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'Road Warrior',
    template: '%s | Road Warrior',
  },
  description:
    "India's delivery riders, going electric — together. Take the 2-minute survey, earn points, and refer your friends.",
  applicationName: 'Road Warrior',
  manifest: '/manifest.json',
  appleWebApp: {
    title: 'Road Warrior',
    statusBarStyle: 'default',
  },
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: '/icons/icon-192.png',
    apple: '/icons/icon-192.png',
  },
  openGraph: {
    title: 'Road Warrior',
    description: "India's delivery riders, going electric — together.",
    type: 'website',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  themeColor: '#FF6B1A',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${notoDevanagari.variable} ${notoKannada.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-canvas text-secondary-900 antialiased">
        {children}
      </body>
    </html>
  );
}
