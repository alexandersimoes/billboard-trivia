import chartsJson from './charts.json';

export interface ChartConfig {
  /** Id used in the app UI. */
  id: string;
  /** chart_type.slug in Supabase (and the folder name under public/charts). */
  slug: string;
  source: 'billboard' | 'spotify';
  /** Value stored in game_rounds.genre. */
  genre: string;
  name: string;
  label: string;
  blurb: string;
  since: string;
  /** Key of a [data-theme] palette in app/globals.css. */
  theme: string;
}

export const CHARTS = chartsJson as ChartConfig[];
export const DEFAULT_THEME = 'dusk';

export const chartById = (id: string): ChartConfig => CHARTS.find((c) => c.id === id) ?? CHARTS[0];
export const chartByGenre = (genre: string): ChartConfig | undefined => CHARTS.find((c) => c.genre === genre);

/** Display name for a game_rounds.genre value, including ones from retired charts. */
export function genreName(genre: string): string {
  return chartByGenre(genre)?.name ?? genre.charAt(0).toUpperCase() + genre.slice(1);
}
