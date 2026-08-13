import { Toaster } from "@/components/ui/toaster";
import { StoreSync } from '@/components/store-sync';
import { CookieBanner } from '@/components/cookie-banner';
import { Analytics } from '@vercel/analytics/next';
import { env } from '@/lib/env';
import "./globals.css";
import type { Metadata } from 'next';
import { IBM_Plex_Mono, IBM_Plex_Sans } from 'next/font/google';
import { NextIntlClientProvider } from 'next-intl';
import { getLocale, getMessages, getTranslations } from 'next-intl/server';

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-mono',
});

const ibmPlexSans = IBM_Plex_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-sans',
});

import { ThemeProvider } from '@/components/theme-provider';
import { JsonLd } from '@/components/seo/JsonLd';



export async function generateMetadata() {
  const t = await getTranslations('seo');
  const locale = await getLocale();
  const appUrl = env.NEXT_PUBLIC_APP_URL;
  
  return {
    metadataBase: new URL(appUrl),
    title: {
      template: '%s | Helmdash',
      default: t('title'),
    },
    description: t('description'),
    alternates: {
      canonical: appUrl,
      languages: {
        'en': `${appUrl}/en`,
        'fr': `${appUrl}/fr`,
      },
    },
    openGraph: {
      title: t('title'),
      description: t('description'),
      url: appUrl,
      siteName: 'Helmdash',
      images: [
        {
          url: '/icon.png',
          width: 800,
          height: 600,
          alt: 'Helmdash logo',
        },
      ],
      locale: locale === 'fr' ? 'fr_FR' : 'en_US',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: t('title'),
      description: t('description'),
      creator: '@helmdashapp',
      images: ['/icon.png'],
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const locale = await getLocale();
  const messages = await getMessages();

  const appUrl = env.NEXT_PUBLIC_APP_URL;
  
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Helmdash',
    url: appUrl,
    logo: `${appUrl}/icon.png`,
    sameAs: [
      'https://www.linkedin.com/company/helmdashapp',
      'https://twitter.com/helmdashapp'
    ],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Helmdash',
    url: appUrl,
  };

  const softwareApplicationSchema = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: 'Helmdash',
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url: appUrl,
    offers: {
      '@type': 'Offer',
      price: '15.00',
      priceCurrency: 'EUR'
    }
  };

  return (
    <html lang={locale} suppressHydrationWarning>
      <head />
      <body className={`${ibmPlexMono.variable} ${ibmPlexSans.variable} font-sans antialiased`}>
        <JsonLd data={organizationSchema} />
        <JsonLd data={websiteSchema} />
        <JsonLd data={softwareApplicationSchema} />
        <NextIntlClientProvider messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="dark"
            enableSystem={false}
            disableTransitionOnChange
          >
            <StoreSync />
            {children}
            <CookieBanner />
            <Toaster />
            <Analytics />
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
