import { MetadataRoute } from 'next'
import { env } from '@/lib/env'
 
export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = env.NEXT_PUBLIC_APP_URL

  return [
    {
      url: appUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
      alternates: {
        languages: {
          en: `${appUrl}/en`,
          fr: `${appUrl}/fr`,
        },
      },
    },
    {
      url: `${appUrl}/pricing`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
      alternates: {
        languages: {
          en: `${appUrl}/en/pricing`,
          fr: `${appUrl}/fr/pricing`,
        },
      },
    },
    {
      url: `${appUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
      alternates: {
        languages: {
          en: `${appUrl}/en/contact`,
          fr: `${appUrl}/fr/contact`,
        },
      },
    },
    {
      url: `${appUrl}/legal/privacy`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          en: `${appUrl}/en/legal/privacy`,
          fr: `${appUrl}/fr/legal/privacy`,
        },
      },
    },
    {
      url: `${appUrl}/legal/terms`,
      lastModified: new Date(),
      changeFrequency: 'yearly',
      priority: 0.3,
      alternates: {
        languages: {
          en: `${appUrl}/en/legal/terms`,
          fr: `${appUrl}/fr/legal/terms`,
        },
      },
    },
    {
      url: `${appUrl}/legal/status`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.3,
      alternates: {
        languages: {
          en: `${appUrl}/en/legal/status`,
          fr: `${appUrl}/fr/legal/status`,
        },
      },
    },
  ]
}
