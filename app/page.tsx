import TriviaGame from '@/components/TriviaGame';
import { triviaMetadata } from '@/lib/seo';

export const metadata = triviaMetadata();

export default function Home() {
  return <TriviaGame />;
}
