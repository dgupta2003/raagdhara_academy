import React from 'react';
import { Suspense } from 'react';
import Script from 'next/script';
import '../styles/index.css';
import GoogleAnalytics from '@/components/GoogleAnalytics';

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata = {
  title: 'Raagdhara Music Academy | Indian Classical Vocal Training',
  description: 'Learn Hindustani classical vocal music with Vaishnavi Gupta, a Visharad-certified instructor. Personalized online courses for all levels — India and worldwide.',
  icons: {
    icon: [
      { url: '/assets/images/favicon-32x32-1769236763631.png', type: 'image/x-icon' }
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const measurementId = process.env.NEXT_PUBLIC_GOOGLE_ANALYTICS_ID || 'G-EMTEKBCQMV';
  
  return (
    <html lang="en">
      <head>
        {/* Google tag (gtag.js) */}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${measurementId}`}
          strategy="afterInteractive"
        />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', '${measurementId}');
          `}
        </Script>
</head>
      <body>
        <Suspense fallback={null}>
          <GoogleAnalytics />
        </Suspense>
        {children}
</body>
    </html>
  );
}
