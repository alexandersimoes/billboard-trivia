import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Music Trivia Leaderboard | TuneTrivia',
  description: 'Discover TuneTrivia’s top players and best games. Compare weekly scores, filter by genre and difficulty, and find your personal rank.',
  alternates: { canonical: '/leaderboard/' },
};

export default function LeaderboardLayout({ children }: { children: React.ReactNode }) {
  return children;
}
