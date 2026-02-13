import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Web3Provider } from '@/providers/Web3Provider';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { AppModals } from '@/components/AppModals';
import { OnboardingLauncher } from '@/components/OnboardingLauncher';
import { Toaster } from 'sonner';

export const metadata: Metadata = {
  title: 'BLASTOFF - Fair Launchpad on Base',
  description: 'Fair launches on Base—no presales. Tokens go straight to Uniswap & Aerodrome.',
  other: {
    'mobile-web-app-capable': 'yes',
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
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="relative min-h-screen bg-blastoff-bg font-body text-blastoff-text antialiased">
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              color: '#f0f0f0',
              fontFamily: 'var(--font-body)',
            },
            className: 'blastoff-toast',
          }}
          icons={{
            success: (
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ),
            error: (
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ),
            loading: (
              <svg className="h-5 w-5 animate-spin text-blastoff-orange" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
            ),
            info: (
              <svg className="h-5 w-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            warning: (
              <svg className="h-5 w-5 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            ),
          }}
        />
        {/* Space starfield background */}
        <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
          {/* Deep space gradient */}
          <div 
            className="absolute inset-0"
            style={{
              background: 'radial-gradient(ellipse at bottom, #1a0f05 0%, #0a0a0a 50%, #050505 100%)',
            }}
          />
          {/* Stars layer 1 - small distant stars */}
          <div className="stars-small absolute inset-0" />
          {/* Stars layer 2 - medium stars */}
          <div className="stars-medium absolute inset-0" />
          {/* Stars layer 3 - large bright stars with twinkle */}
          <div className="stars-large absolute inset-0" />
          {/* Subtle nebula glow */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{
              background: 'radial-gradient(ellipse at 20% 80%, rgba(255, 107, 0, 0.15) 0%, transparent 50%), radial-gradient(ellipse at 80% 20%, rgba(255, 140, 50, 0.1) 0%, transparent 40%)',
            }}
          />
          {/* Shooting stars */}
          <div className="shooting-star shooting-star-1" />
          <div className="shooting-star shooting-star-2" />
          <div className="shooting-star shooting-star-3" />
          {/* Twinkling stars */}
          <div className="twinkle-star twinkle-star-1" />
          <div className="twinkle-star twinkle-star-2" />
          <div className="twinkle-star twinkle-star-3" />
          <div className="twinkle-star twinkle-star-4" />
          <div className="twinkle-star twinkle-star-5" />
          <div className="twinkle-star twinkle-star-6" />
          <div className="twinkle-star twinkle-star-7" />
          <div className="twinkle-star twinkle-star-8" />
          {/* Floating cosmic dust particles */}
          <div className="cosmic-dust absolute inset-0" />
          {/* Distant galaxy/star cluster accent */}
          <div 
            className="absolute opacity-20"
            style={{
              width: '300px',
              height: '300px',
              top: '15%',
              right: '10%',
              background: 'radial-gradient(circle, rgba(255, 140, 50, 0.3) 0%, rgba(255, 107, 0, 0.1) 30%, transparent 70%)',
              filter: 'blur(40px)',
            }}
          />
          <div 
            className="absolute opacity-15"
            style={{
              width: '200px',
              height: '200px',
              bottom: '20%',
              left: '5%',
              background: 'radial-gradient(circle, rgba(255, 180, 100, 0.3) 0%, rgba(255, 120, 50, 0.1) 40%, transparent 70%)',
              filter: 'blur(30px)',
            }}
          />
        </div>

        <div className="relative z-10">
          <Web3Provider>
            <OnboardingLauncher />
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
