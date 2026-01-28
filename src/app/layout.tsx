import type { Metadata } from 'next';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AppModals } from '@/components/AppModals';

export const metadata: Metadata = {
  title: 'BLASTOFF - Fair Launchpad on Base',
  description: 'Fair launches on Base chain',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-blastoff-bg font-body text-blastoff-text antialiased">
        <div
          className="pointer-events-none fixed inset-0 z-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'linear-gradient(rgba(255,107,0,0.9) 1px, transparent 1px), linear-gradient(90deg, rgba(255,107,0,0.9) 1px, transparent 1px)',
            backgroundSize: '48px 48px',
          }}
        />

        <div className="relative z-10">
          <Web3Provider>
            <Header />
            <main className="min-h-[calc(100vh-4rem)]">{children}</main>
            <Footer />
            <AppModals />
          </Web3Provider>
        </div>
      </body>
    </html>
  );
}
