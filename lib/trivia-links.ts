import type { ChartConfig } from './charts';

export type TriviaSettings = {
  mode: 'quick' | 'specific';
  difficulty: 'easy' | 'medium' | 'hard';
  decade: string;
  year: number | null;
  week: string | null;
};

export const genrePath = (chart: ChartConfig) => `/trivia/${chart.genre}/`;

export function readSettings(search: string, chart: ChartConfig): TriviaSettings {
  const params = new URLSearchParams(search);
  const difficulty = params.get('difficulty');
  const decade = params.get('era') ?? '';
  const rawWeek = params.get('week') ?? '';
  const now = new Date().toISOString().slice(0, 10);
  const week = /^\d{4}-\d{2}-\d{2}$/.test(rawWeek)
    && !Number.isNaN(Date.parse(rawWeek))
    && new Date(rawWeek).toISOString().slice(0, 10) === rawWeek
    && rawWeek >= chart.since && rawWeek <= now ? rawWeek : null;
  const rawYear = Number(params.get('year'));
  const year = week ? Number(week.slice(0, 4)) : Number.isInteger(rawYear)
    && rawYear >= Number(chart.since.slice(0, 4)) && rawYear <= new Date().getFullYear() ? rawYear : null;
  return {
    mode: params.get('mode') === 'specific' || week ? 'specific' : 'quick',
    difficulty: difficulty === 'easy' || difficulty === 'hard' ? difficulty : 'medium',
    decade: /^\d{3}0$/.test(decade) && Number(decade) + 9 >= Number(chart.since.slice(0, 4))
      && Number(decade) <= new Date().getFullYear() ? decade : 'all',
    year,
    week,
  };
}

export function triviaHref(chart: ChartConfig, settings?: TriviaSettings): string {
  const params = new URLSearchParams();
  if (settings) {
    if (settings.difficulty !== 'medium') params.set('difficulty', settings.difficulty);
    if (settings.mode === 'specific') {
      params.set('mode', 'specific');
      if (settings.week) params.set('week', settings.week);
      else if (settings.year) params.set('year', String(settings.year));
    } else if (settings.decade !== 'all') params.set('era', settings.decade);
  }
  return genrePath(chart) + (params.size ? `?${params}` : '');
}

