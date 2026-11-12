import type { Metadata } from 'next';
import type { ChartConfig } from './charts';
import { genrePath } from './trivia-links';

export const SITE_URL = 'https://trivia.rocks';

export function triviaMetadata(chart?: ChartConfig): Metadata {
  const title = chart ? `${chart.name} Music Trivia — Guess the Song | TuneTrivia` : 'TuneTrivia — Free Music Trivia & Guess the Song Game';
  const description = chart
    ? `Play free ${chart.name} music trivia with songs from ${chart.label}. Guess the song from a short clip, choose your difficulty, or revisit a chart week. No account required.`
    : 'Can you name that tune? Play free music trivia across 11 Billboard and Spotify charts. Guess songs from short clips, explore decades of hits, and share a quiz with friends.';
  const url = chart ? genrePath(chart) : '/';
  const images = [{ url: '/social/trivia.jpg', width: 1200, height: 630, alt: 'TuneTrivia — Name that tune. 11 charts. Decades of hits.' }];
  return {
    title, description, alternates: { canonical: url },
    openGraph: { type: 'website', siteName: 'TuneTrivia', locale: 'en_US', title, description, url, images },
    twitter: { card: 'summary_large_image', title, description, images },
  };
}
