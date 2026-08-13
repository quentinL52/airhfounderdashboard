import { MetadataRoute } from 'next'
import { env } from '@/lib/env'
 
export default function robots(): MetadataRoute.Robots {
  const appUrl = env.NEXT_PUBLIC_APP_URL

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/_next/', '/auth/', '/notify/'],
    },
    sitemap: `${appUrl}/sitemap.xml`,
  }
}
