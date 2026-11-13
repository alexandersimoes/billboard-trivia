import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/seo';

export const dynamic = 'force-static';
export default function robots(): MetadataRoute.Robots {
  return { rules: [{ userAgent: '*', allow: '/', disallow: '/account/' }, { userAgent: ['GPTBot', 'ClaudeBot', 'CCBot', 'Bytespider', 'Amazonbot', 'PetalBot', 'SemrushBot', 'AhrefsBot', 'MJ12bot', 'DotBot'], disallow: '/' }], sitemap: [`${SITE_URL}/sitemap.xml`, `${SITE_URL}/explore-sitemap.xml`] };
}
