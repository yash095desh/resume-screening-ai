import { AuthProvider } from '@/lib/auth/auth-context';
import type { Metadata } from 'next';
import { Inter, Sora } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { Toaster } from 'sonner';

// Configure Inter font
const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

// Configure Sora font for headings (landing page)
const sora = Sora({
  subsets: ['latin'],
  variable: '--font-sora',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'RecruitKar - AI-Powered Hiring Platform',
    template: '%s | RecruitKar',
  },
  description: 'Hire better candidates faster with AI. Automate resume screening, LinkedIn sourcing, AI voice interviews, and email outreach. Stop fighting your hiring process.',
  keywords: [
    'AI recruitment',
    'automated hiring',
    'resume screening AI',
    'LinkedIn sourcing',
    'AI voice interviews',
    'recruitment automation',
    'applicant tracking system',
    'talent acquisition',
    'hiring software',
    'RecruitKar',
  ],
  authors: [{ name: 'RecruitKar' }],
  creator: 'RecruitKar',
  publisher: 'RecruitKar',
  metadataBase: new URL('https://resume-screening-ai-git-main-yash095deshs-projects.vercel.app'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://resume-screening-ai-git-main-yash095deshs-projects.vercel.app',
    title: 'RecruitKar - AI-Powered Hiring Platform',
    description: 'Hire better candidates faster with AI. Automate your entire hiring process.',
    siteName: 'RecruitKar',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'RecruitKar - AI-Powered Hiring Platform',
      },
    ],
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
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${sora.variable}`}>
      <body className="font-sans antialiased">
        <AuthProvider>
          {children}
          <Toaster />
          {/* Razorpay Checkout Script - loaded globally for payment flows */}
          <Script
            src="https://checkout.razorpay.com/v1/checkout.js"
            strategy="lazyOnload"
          />
        </AuthProvider>
      </body>
    </html>
  );
}