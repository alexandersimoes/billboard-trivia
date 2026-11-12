import type { MetadataRoute } from 'next';
import { CHARTS } from '@/lib/charts';
import { SITE_URL } from '@/lib/seo';
import { genrePath } from '@/lib/trivia-links';

export const dynamic = 'force-static';
export default function sitemap(): MetadataRoute.Sitemap {
  return ['/', ...CHARTS.map(genrePath)].map(path => ({ url: `${SITE_URL}${path}` }));
}
