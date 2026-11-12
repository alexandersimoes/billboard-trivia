import { notFound } from 'next/navigation';
import TriviaGame from '@/components/TriviaGame';
import { CHARTS, chartByGenre } from '@/lib/charts';
import { triviaMetadata } from '@/lib/seo';

export const dynamicParams = false;
export function generateStaticParams() {
  return CHARTS.map(chart => ({ genre: chart.genre }));
}

export async function generateMetadata({ params }: { params: Promise<{ genre: string }> }) {
  const chart = chartByGenre((await params).genre);
  if (!chart) notFound();
  return triviaMetadata(chart);
}

export default async function GenrePage({ params }: { params: Promise<{ genre: string }> }) {
  const chart = chartByGenre((await params).genre);
  if (!chart) notFound();
  return <TriviaGame initialChart={chart.id} />;
}
