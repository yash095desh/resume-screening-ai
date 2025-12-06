import { ClerkProvider } from '@clerk/nextjs';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { Toaster } from 'sonner';

// Configure Inter font
const inter = Inter({ 
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: {
    default: 'ResumeAI - AI-Powered Resume Screening',
    template: '%s | ResumeAI',
  },
  description: 'Automate your recruitment process with AI. Screen hundreds of resumes in minutes, get ranked candidates with match scores, and reduce hiring time by 70%.',
  keywords: [
    'AI resume screening',
    'ATS system',
    'resume parser',
    'candidate ranking',
    'recruitment automation',
    'AI hiring',
    'applicant tracking system',
    'resume analysis',
    'talent acquisition',
  ],
  authors: [{ name: 'Your Name' }],
  creator: 'Your Name',
  publisher: 'Your Company',
  metadataBase: new URL('https://your-domain.com'), // Change to your domain
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://your-domain.com',
    title: 'ResumeAI - AI-Powered Resume Screening',
    description: 'Automate your recruitment process with AI. Screen hundreds of resumes in minutes.',
    siteName: 'ResumeAI',
    images: [
      {
        url: '/og-image.png', // Create this image (1200x630px)
        width: 1200,
        height: 630,
        alt: 'ResumeAI - AI-Powered Resume Screening',
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
  icons: {
    icon: [
      { url: '/favicon.ico' },
      { url: '/icon.png', type: 'image/png', sizes: '32x32' },
    ],
    apple: [
      { url: '/apple-icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  manifest: '/site.webmanifest',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ClerkProvider>
      <html lang="en" className={inter.variable}>
        <body className="font-sans antialiased">
          {children}
          <Toaster />
        </body>
      </html>
    </ClerkProvider>
  );
}