import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Evlilik İlanları – AI Instagram Reels Otomasyon Platformu',
  description: 'Günde 5 özgün Instagram Reels videosu üreten, planlayan ve yayınlayan AI otomasyon platformu.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr" className="dark">
      <body className="bg-zinc-950 text-zinc-100 antialiased min-h-screen selection:bg-rose-500/30 selection:text-rose-200">
        {children}
      </body>
    </html>
  );
}
