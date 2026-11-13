// Preserve credited identities; never guess how a band's name should be split.
export function artistSlug(name: string) {
  let hash = 2166136261;
  for (const char of name.normalize('NFC')) { hash ^= char.codePointAt(0)!; hash = Math.imul(hash, 16777619); }
  return `${name.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'artist'}-${(hash >>> 0).toString(36)}`;
}
export const artistHref = (name: string) => `/explore/artists/${artistSlug(name)}/`;
export const chartHref = (genre: string, week?: string) => `/explore/charts/${genre}/${week ? `${week}/` : ''}`;
