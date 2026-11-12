export interface ChartTrack {
  song: string;
  artist: string;
  this_week: number;
  last_week: number | null;
  peak_position: number;
  weeks_on_chart: number;
  chartDate?: string;
}

export type RevealedPositions = Record<number, 'right' | 'wrong'>;
