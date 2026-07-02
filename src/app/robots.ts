import { MetadataRoute } from 'next'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/dashboard', '/admin', '/api/', '/auth/', '/proposal/', '/status/'],
      },
    ],
    sitemap: 'https://kursskifte.dk/sitemap.xml',
  }
}
