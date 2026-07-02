import { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const base = 'https://kursskifte.dk'
  return [
    { url: base, lastModified: new Date(), changeFrequency: 'monthly', priority: 1 },
    { url: `${base}/kommuner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.9 },
    { url: `${base}/kontaktpersoner`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/intake`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${base}/metode`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${base}/om-kursskifte`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
    { url: `${base}/kontakt`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.6 },
  ]
}
