'use client';

import { useState, useEffect, useRef } from 'react';
import { Audiowide } from 'next/font/google';
import { useGameTracking } from '@/hooks/useGameTracking';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import Link from 'next/link';

const audiowide = Audiowide({ weight: '400', subsets: ['latin'] });

interface Track {
  song: string;
  artist: string;
  this_week: number;
  last_week: number | null;
  peak_position: number;
  weeks_on_chart: number;
  chartDate?: string;
}

interface ITunesResult {
  previewUrl: string;
  display: string;
  artwork: string | null;
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

// remove trailing “feat./ft./featuring/with/x …”
function stripFeaturing(s: string) {
  return s.replace(
    /(?:\(|\[|-|\u2013|\u2014)?\s*(?:feat\.?|featuring|ft\.?|with|x)\s+.+?(?:\)|\]|$)/gi,
    ""
  ).trim();
}

function tokens(s: string) {
  return normalize(stripFeaturing(s)).split(" ").filter(Boolean);
}

// overlap of target tokens found in candidate (containment, not symmetric)
function containmentScore(targetTokens: string[], candTokens: string[]) {
  const setC = new Set(candTokens);
  let hit = 0;
  for (const t of targetTokens) if (setC.has(t)) hit++;
  return targetTokens.length ? hit / targetTokens.length : 0;
}

// Jaccard (intersection/union) – symmetric
function jaccardScore(aTokens: string[], bTokens: string[]) {
  const a = new Set(aTokens);
  const b = new Set(bTokens);
  let inter = 0;
  for (const t of a) if (b.has(t)) inter++;
  const union = a.size + b.size - inter;
  return union ? inter / union : 0;
}

// Lightweight fuzzy similarity for artist names, returns 0..1
function artistSimilarity(targetArtistRaw: string, candidateArtistRaw: string) {
  const taNorm = normalize(stripFeaturing(targetArtistRaw));
  const caNorm = normalize(stripFeaturing(candidateArtistRaw));

  if (!taNorm || !caNorm) return 0;

  if (taNorm === caNorm) return 1;

  // direct containment (handles “fetty wap featuring monty” vs “fetty wap”)
  if (caNorm.includes(taNorm) || taNorm.includes(caNorm)) return 0.92;

  const ta = tokens(targetArtistRaw);
  const ca = tokens(candidateArtistRaw);

  const contain = containmentScore(ta, ca);   // prioritize: “are all my target words present?”
  const jac = jaccardScore(ta, ca);           // tie-breaker when extras differ

  // small bonus if first tokens match (primary artist match)
  const primaryBoost = (ta[0] && ca[0] && ta[0] === ca[0]) ? 0.08 : 0;

  // blend (weight containment higher than jaccard)
  return Math.max(0, Math.min(1, 0.7 * contain + 0.3 * jac + primaryBoost));
}


function getWeekNumber(date: Date): number {
  const firstDayOfYear = new Date(date.getFullYear(), 0, 1);
  const pastDaysOfYear = (date.getTime() - firstDayOfYear.getTime()) / 86400000;
  return Math.ceil((pastDaysOfYear + firstDayOfYear.getDay() + 1) / 7);
}

async function findITunesPreviewUrl(
  { song, artist }: { song: string; artist: string },
  country = 'US'
): Promise<ITunesResult> {
  const term = encodeURIComponent(`${artist} ${song}`);
  let url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=10&country=${country}`;
  if(artist === 'Local H' && song === 'Eddie Vedder') {
    url = "https://itunes.apple.com/lookup?id=1440923144"
  }
  if(artist === 'The West Coast Rap All-Stars' && song === "We're All In The Same Gang") {
    throw new Error('No previewUrl available in iTunes results');
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0)
    throw new Error('No iTunes results');

  const targetSong = normalize(song);
  const targetArtist = normalize(artist);

  const scored = data.results.map((r: any) => {
    const rSong = normalize(r.trackName || "");
    const rArtist = normalize(r.artistName || "");

    let score = 0;

    // Song matching (keep your exact rule; add a mild fuzzy equality on stripped “(feat …)”)
    const rSongStripped = normalize(stripFeaturing(r.trackName || ""));
    const targetSongStripped = normalize(stripFeaturing(song));
    if (rSong === targetSong) score += 4;
    else if (rSongStripped === targetSongStripped) score += 3;

    // NEW: fuzzy artist score (0..1) scaled to ~7 points (same cap as your exact rule)
    const aSim = artistSimilarity(targetArtist, rArtist);
    score += Math.round(7 * aSim);

    // extras
    if (/clean/i.test(r.trackName)) score += 1;
    if (/live|instrumental|karaoke|remix/i.test(r.trackName)) score -= 2;
    if (r.previewUrl) score += 2;

    // tiny penalty for “Various Artists”
    if (/^various artists$/i.test(r.artistName || "")) score -= 3;

    return { r, score, aSim };
  })
  .sort((a: any, b: any) => b.score - a.score);

  const hit = scored.find((x: any) => x.r.previewUrl);
  if (!hit) throw new Error('No previewUrl available in iTunes results');
  return {
    previewUrl: hit.r.previewUrl,
    display: `${hit.r.trackName} — ${hit.r.artistName}`,
    artwork: hit.r.artworkUrl100?.replace('100x100', '300x300') || null,
  };
}

export default function Home() {
  const [playMode, setPlayMode] = useState<'quick' | 'specific'>('quick');
  const [selectedChart, setSelectedChart] = useState<string>('hot-100');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [validDates, setValidDates] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [gameState, setGameState] = useState<'select' | 'loading' | 'playing'>('select');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [allChartTracks, setAllChartTracks] = useState<Track[]>([]);
  const [usedTracks, setUsedTracks] = useState<Set<string>>(new Set());
  const [currentRound, setCurrentRound] = useState(0);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [options, setOptions] = useState<Track[]>([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState('');
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [gameComplete, setGameComplete] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [roundPoints, setRoundPoints] = useState(0);
  const [currentArtwork, setCurrentArtwork] = useState<string | null>(null);

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const answeredRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track | null>(null);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);

  const { startGameRound, recordGuess, endGameRound } = useGameTracking();
  const { user, loading: authLoading, signInWithGoogle, signOut } = useAuth();

  // Get available decades from years
  const getDecades = (years: number[]): string[] => {
    const decades = new Set<string>();
    years.forEach(year => {
      const decade = Math.floor(year / 10) * 10;
      decades.add(`${decade}s`);
    });
    return Array.from(decades).sort((a, b) => {
      const aNum = parseInt(a);
      const bNum = parseInt(b);
      return bNum - aNum;
    });
  };

  const [availableDecades, setAvailableDecades] = useState<string[]>([]);

  // Fetch valid dates when chart changes
  useEffect(() => {
    async function fetchValidDates() {
      try {
        // Map chart type to database slug
        // Note: These must match exactly what's in the database
        const chartSlugMap: Record<string, string> = {
          'hot-100': 'hot-100',
          'country': 'country-songs',
          'rnb': 'r-and-b-songs',
          'rap': 'rap-song',
          'alternative': 'alternative-airplay',
          'rock': 'hot-mainstream-rock-tracks',
          'latin': 'latin-airplay'
        };

        const chartSlug = chartSlugMap[selectedChart];
        console.log('Fetching data for chart:', selectedChart, 'with slug:', chartSlug);

        // Use RPC function to get date range in a single query
        const { data: rangeData, error: rangeError } = await supabase.rpc('get_chart_date_range', {
          p_chart: chartSlug
        });

        if (rangeError || !rangeData || rangeData.length === 0 || !rangeData[0].min_date || !rangeData[0].max_date) {
          console.error('Error fetching date range from database:', rangeError);

          // Fallback: use the old two-query approach
          const { data: minMaxData, error: minMaxError } = await supabase
            .from('v_chart_entries')
            .select('date')
            .eq('chart', chartSlug)
            .order('date', { ascending: true })
            .limit(1);

          const { data: maxData, error: maxError } = await supabase
            .from('v_chart_entries')
            .select('date')
            .eq('chart', chartSlug)
            .order('date', { ascending: false })
            .limit(1);

          if (minMaxError || maxError || !minMaxData || !maxData || minMaxData.length === 0 || maxData.length === 0) {
            console.error('Fallback also failed:', minMaxError || maxError);
            if (playMode === 'quick') {
              setAvailableDecades([]);
            } else {
              setValidDates([]);
              setYears([]);
            }
            return;
          }

          rangeData[0] = {
            min_date: minMaxData[0].date,
            max_date: maxData[0].date
          };
        }

        const minYear = parseInt(rangeData[0].min_date.split('-')[0]);
        const maxYear = parseInt(rangeData[0].max_date.split('-')[0]);

        console.log(`Date range for ${chartSlug}: ${minYear} - ${maxYear}`);

        // Generate all years in the range
        const allYears = [];
        for (let year = minYear; year <= maxYear; year++) {
          allYears.push(year);
        }

        if (playMode === 'quick') {
          setAvailableDecades(getDecades(allYears));
          setSelectedDecade('all');
        } else {
          setYears(allYears.sort((a, b) => b - a));
        }

        setSelectedYear(null);
        setSelectedWeek(null);
      } catch (err) {
        console.error('Error in fetchValidDates:', err);
        setValidDates([]);
        setYears([]);
        setAvailableDecades([]);
      }
    }

    fetchValidDates();
  }, [selectedChart, playMode]);

  // Update available weeks when year is selected
  useEffect(() => {
    async function fetchWeeksForYear() {
      if (!selectedYear) return;

      try {
        const chartSlugMap: Record<string, string> = {
          'hot-100': 'hot-100',
          'country': 'country-songs',
          'rnb': 'r-and-b-songs',
          'rap': 'rap-song',
          'alternative': 'alternative-airplay',
          'rock': 'hot-mainstream-rock-tracks',
          'latin': 'latin-airplay'
        };

        const chartSlug = chartSlugMap[selectedChart];

        // Use a PostgreSQL query to get distinct dates efficiently
        const { data, error } = await supabase.rpc('get_distinct_dates', {
          p_chart: chartSlug,
          p_year: selectedYear
        });

        if (error) {
          console.error('RPC error fetching weeks for year:', error);
          console.error('Trying fallback method...');

          // Fallback: Use a more efficient approach - group by date on the client side
          // but fetch in batches to get all dates
          const dateSet = new Set<string>();
          let offset = 0;
          const batchSize = 1000;
          let hasMore = true;

          while (hasMore) {
            const { data: batchData, error: batchError } = await supabase
              .from('v_chart_entries')
              .select('date')
              .eq('chart', chartSlug)
              .gte('date', `${selectedYear}-01-01`)
              .lt('date', `${selectedYear + 1}-01-01`)
              .range(offset, offset + batchSize - 1);

            if (batchError) {
              console.error('Error fetching batch:', batchError);
              break;
            }

            if (!batchData || batchData.length === 0) {
              hasMore = false;
              break;
            }

            // Add dates to set
            batchData.forEach((row: any) => {
              if (row.date) {
                dateSet.add(row.date);
              }
            });

            // If we got fewer rows than batch size, we're done
            if (batchData.length < batchSize) {
              hasMore = false;
            } else {
              offset += batchSize;
            }

            // Safety: if we have all 52 weeks, we can stop
            if (dateSet.size >= 52) {
              hasMore = false;
            }
          }

          console.log(`Found ${dateSet.size} unique dates for year ${selectedYear}`);
          const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

          setAvailableWeeks(sortedDates);
          setSelectedWeek(null);
          return;
        }

        // RPC returned distinct dates
        console.log(`RPC returned ${data?.length} distinct dates for ${selectedYear}`);
        const sortedDates = data.map((row: any) => row.date).sort((a: string, b: string) => b.localeCompare(a));
        setAvailableWeeks(sortedDates);
        setSelectedWeek(null);
      } catch (err) {
        console.error('Error in fetchWeeksForYear:', err);
        setAvailableWeeks([]);
      }
    }

    fetchWeeksForYear();
  }, [selectedYear, selectedChart]);

  const startQuickPlay = async () => {
    console.log('startQuickPlay called');
    console.log('selectedDecade:', selectedDecade);
    console.log('selectedChart:', selectedChart);
    console.log('difficulty:', difficulty);

    // Don't need to pick a specific week - we'll query all weeks in the decade
    if (selectedDecade === 'all') {
      await startGameWithDecade(null, null);
    } else {
      const decadeNum = parseInt(selectedDecade);
      await startGameWithDecade(decadeNum, decadeNum + 10);
    }
  };

  const startGame = async () => {
    if (!selectedWeek) return;
    await startGameWithWeek(selectedWeek);
  };

  const startGameWithDecade = async (startYear: number | null, endYear: number | null) => {
    console.log('startGameWithDecade called', { startYear, endYear });
    setGameState('loading');

    const chartNames: Record<string, string> = {
      'hot-100': 'Billboard Hot 100',
      'country': 'Country Songs',
      'rnb': 'R&B/Hip-Hop Songs',
      'rap': 'Rap Songs',
      'alternative': 'Alternative Songs',
      'rock': 'Rock Songs',
      'latin': 'Latin'
    };

    setStatus(`Loading ${chartNames[selectedChart]}...`);

    try {
      // Map chart type to database slug
      const chartSlugMap: Record<string, string> = {
        'hot-100': 'hot-100',
        'country': 'country-songs',
        'rnb': 'r-and-b-songs',
        'rap': 'rap-song',
        'alternative': 'alternative-airplay',
        'rock': 'hot-mainstream-rock-tracks',
        'latin': 'latin-airplay'
      };

      const chartSlug = chartSlugMap[selectedChart];
      console.log('chartSlug:', chartSlug);

      // Use RPC function to get random songs efficiently
      const { data: songs, error } = await supabase.rpc('get_random_songs', {
        p_chart: chartSlug,
        p_difficulty: difficulty,
        p_start_year: startYear,
        p_end_year: endYear,
        p_limit: 200
      });

      console.log('Query result:', { songCount: songs?.length, error });

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!songs || songs.length === 0) {
        throw new Error('No songs found for this selection');
      }

      // Transform Supabase data to match existing Track interface
      const chartData = songs.map((s: any) => ({
        song: s.song,
        artist: s.artist,
        this_week: s.this_week,
        last_week: s.last_week,
        peak_position: s.peak_position,
        weeks_on_chart: s.weeks_on_chart,
        chartDate: s.date,
        new: s.is_new || false
      }));

      // Deduplicate songs by song+artist combination
      const uniqueSongs = new Map<string, Track>();
      chartData.forEach((track: Track) => {
        const key = `${track.song}-${track.artist}`;
        if (!uniqueSongs.has(key)) {
          uniqueSongs.set(key, track);
        }
      });
      const deduplicatedData = Array.from(uniqueSongs.values());
      console.log(`Deduplicated: ${chartData.length} -> ${deduplicatedData.length} unique songs`);

      // Store all tracks for wrong answer pool
      setAllChartTracks(deduplicatedData);

      // Shuffle and pick 10 unique random tracks for the game
      const shuffled = [...deduplicatedData].sort(() => Math.random() - 0.5);
      const gameTracks = shuffled.slice(0, 10);
      console.log('Selected game tracks:', gameTracks.length);
      setTracks(gameTracks);
      setUsedTracks(new Set());
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setGameComplete(false);
      setGameState('playing');

      // Start tracking game round - quick play mode
      await startGameRound(selectedChart, 'quick', {
        difficulty,
        decadeStart: startYear,
      });

      loadRound(gameTracks, 0, deduplicatedData);
    } catch (err) {
      setStatus('Error loading chart data');
      console.error(err);
      setGameState('select');
    }
  };

  const startGameWithWeek = async (weekDate: string) => {
    setGameState('loading');

    const chartNames: Record<string, string> = {
      'hot-100': 'Billboard Hot 100',
      'country': 'Country Songs',
      'rnb': 'R&B/Hip-Hop Songs',
      'rap': 'Rap Songs',
      'alternative': 'Alternative Songs',
      'rock': 'Rock Songs',
      'latin': 'Latin'
    };

    setStatus(`Loading ${chartNames[selectedChart]}...`);

    try {
      // Map chart type to database slug
      const chartSlugMap: Record<string, string> = {
        'hot-100': 'hot-100',
        'country': 'country-songs',
        'rnb': 'r-and-b-songs',
        'rap': 'rap-song',
        'alternative': 'alternative-airplay',
        'rock': 'hot-mainstream-rock-tracks',
        'latin': 'latin-airplay'
      };

      const chartSlug = chartSlugMap[selectedChart];

      // Build query using the view
      const { data: songs, error } = await supabase
        .from('v_chart_entries')
        .select('*')
        .eq('chart', chartSlug)
        .eq('date', weekDate)
        .limit(100);

      if (error) {
        console.error('Supabase error:', error);
        throw error;
      }

      if (!songs || songs.length === 0) {
        throw new Error('No songs found for this selection');
      }

      // Transform Supabase data to match existing Track interface
      const chartData = songs.map((s: any) => ({
        song: s.song,
        artist: s.artist,
        this_week: s.this_week,
        last_week: s.last_week,
        peak_position: s.peak_position,
        weeks_on_chart: s.weeks_on_chart,
        chartDate: s.date,
        new: s.is_new || false
      }));

      // Deduplicate songs by song+artist combination
      const uniqueSongs = new Map<string, Track>();
      chartData.forEach((track: Track) => {
        const key = `${track.song}-${track.artist}`;
        if (!uniqueSongs.has(key)) {
          uniqueSongs.set(key, track);
        }
      });
      const deduplicatedData = Array.from(uniqueSongs.values());
      console.log(`Deduplicated: ${chartData.length} -> ${deduplicatedData.length} unique songs`);

      // Store all tracks for wrong answer pool
      setAllChartTracks(deduplicatedData);

      // Shuffle and pick 10 unique random tracks for the game
      const shuffled = [...deduplicatedData].sort(() => Math.random() - 0.5);
      const gameTracks = shuffled.slice(0, 10);
      console.log('Selected game tracks:', gameTracks.length);
      setTracks(gameTracks);
      setUsedTracks(new Set());
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setGameComplete(false);
      setGameState('playing');

      // Start tracking game round - classic mode
      if (weekDate) {
        const [year, month, day] = weekDate.split('-').map(Number);
        const weekNumber = getWeekNumber(new Date(year, month - 1, day));
        await startGameRound(selectedChart, 'classic', {
          chartYear: year,
          chartWeek: weekNumber,
          selectedWeek: weekDate,
        });
      }

      loadRound(gameTracks, 0, deduplicatedData);
    } catch (err) {
      setStatus('Error loading chart data');
      console.error(err);
      setGameState('select');
    }
  };

  const loadRound = async (allTracks: Track[], roundNum: number, chartPool?: Track[], retryCount = 0) => {
    setLoading(true);
    setAnswered(false);
    answeredRef.current = false;
    setSelectedAnswer(null);
    setTimeLeft(30);
    setRoundPoints(0);
    setStatus('Searching for preview...');

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const currentTrack = allTracks[roundNum];
    currentTrackRef.current = currentTrack;
    const trackKey = `${currentTrack.song}-${currentTrack.artist}`;

    // Check if we've already used this track
    if (usedTracks.has(trackKey)) {
      setStatus('Skipping duplicate track...');
      setTimeout(() => nextRound(), 1000);
      return;
    }

    // Mark track as used
    setUsedTracks(prev => new Set([...prev, trackKey]));

    // Use the full chart (all 100 songs) for wrong answers, not just the 10 selected
    const answerPool = chartPool || allChartTracks;

    // Generate 3 wrong answers from the entire chart (excluding current track)
    const wrongAnswers = answerPool
      .filter(t => {
        const key = `${t.song}-${t.artist}`;
        return key !== trackKey;
      })
      .sort(() => Math.random() - 0.5)
      .slice(0, 3);

    const allOptions = [currentTrack, ...wrongAnswers].sort(() => Math.random() - 0.5);
    setOptions(allOptions);

    try {
      const preview = await findITunesPreviewUrl(currentTrack);
      setCurrentArtwork(preview.artwork);
      if (audioRef.current) {
        audioRef.current.src = preview.previewUrl;
        await audioRef.current.play();
      }
      setStatus('Playing 30-second preview...');
      setLoading(false);

      // Record the start time for accurate scoring
      roundStartTimeRef.current = Date.now();

      // Start countdown timer
      timerRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            if (timerRef.current) clearInterval(timerRef.current);
            // Auto-skip if time runs out
            setTimeout(() => {
              if (!answeredRef.current && currentTrackRef.current) {
                setAnswered(true);
                answeredRef.current = true;
                setSelectedAnswer(null);
                setRoundPoints(0);
                setStatus(`⏱ Time's up! It was "${currentTrackRef.current.song}" by ${currentTrackRef.current.artist}`);
                if (audioRef.current) audioRef.current.pause();
              }
            }, 100);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      // If preview fails, try a backup song from the remaining pool
      if (retryCount < 3) {
        setStatus('Could not find preview. Trying another song...');

        // Find a backup track that hasn't been used yet
        const availableBackups = answerPool.filter(t => {
          const key = `${t.song}-${t.artist}`;
          return !usedTracks.has(key) && key !== trackKey;
        });

        if (availableBackups.length > 0) {
          // Pick a random backup
          const backupTrack = availableBackups[Math.floor(Math.random() * availableBackups.length)];

          // Replace the current track with the backup in the game tracks array
          const newTracks = [...allTracks];
          newTracks[roundNum] = backupTrack;
          setTracks(newTracks);

          // Unmark the failed track
          setUsedTracks(prev => {
            const newSet = new Set(prev);
            newSet.delete(trackKey);
            return newSet;
          });

          // Retry with the backup track
          setTimeout(() => {
            loadRound(newTracks, roundNum, chartPool, retryCount + 1);
          }, 500);
          return;
        }
      }

      // If all retries failed or no backups available, skip this round
      setStatus('Could not find preview. Skipping...');
      setTimeout(() => nextRound(), 2000);
    }
  };

  const handleAnswer = async (track: Track) => {
    if (answered) return;

    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setAnswered(true);
    answeredRef.current = true;
    const correctTrack = tracks[currentRound];
    setSelectedAnswer(options.indexOf(track));

    // Calculate base points (1-100 based on time)
    const timeElapsedMs = Date.now() - roundStartTimeRef.current;
    const timeElapsedSec = timeElapsedMs / 1000;
    const cappedTime = Math.min(timeElapsedSec, 30);
    const basePoints = track === correctTrack ? Math.max(1, Math.round(100 - (cappedTime / 30) * 99)) : 0;

    // Apply difficulty multiplier (only for Quick Play mode)
    let difficultyMultiplier = 1.0;
    if (playMode === 'quick') {
      if (difficulty === 'easy') {
        difficultyMultiplier = 1.0;
      } else if (difficulty === 'medium') {
        difficultyMultiplier = 1.5;
      } else if (difficulty === 'hard') {
        difficultyMultiplier = 2.5;
      }
    }

    const points = Math.round(basePoints * difficultyMultiplier);

    if (track === correctTrack) {
      setRoundPoints(points);
      setScore(score + points);
      setCorrectCount(correctCount + 1);
      if (playMode === 'quick' && difficultyMultiplier > 1) {
        setStatus(`✓ Correct! +${points} points (${cappedTime.toFixed(1)}s) [${difficultyMultiplier}x ${difficulty}]`);
      } else {
        setStatus(`✓ Correct! +${points} points (${cappedTime.toFixed(1)}s)`);
      }
    } else {
      setRoundPoints(0);
      setStatus(`✗ Wrong! It was "${correctTrack.song}" by ${correctTrack.artist}`);
    }

    // Record guess in Supabase
    await recordGuess(currentRound, correctTrack, track, options, timeElapsedMs, points);

    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const nextRound = async () => {
    // Clear timer when moving to next round
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    if (currentRound + 1 < tracks.length) {
      setCurrentRound(currentRound + 1);
      loadRound(tracks, currentRound + 1);
    } else {
      setGameComplete(true);
      setStatus(`Game Over! Final Score: ${score}`);

      // End game tracking
      await endGameRound(score, correctCount, tracks.length);
    }
  };

  const resetGame = () => {
    // Clear timer on reset
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setGameState('select');
    setSelectedYear(null);
    setSelectedWeek(null);
    setCurrentRound(0);
    setScore(0);
    setCorrectCount(0);
    setUsedTracks(new Set());
    setGameComplete(false);
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
    }
  };

  const handleTitleClick = () => {
    // If in the middle of a game, confirm before resetting
    if (gameState === 'playing' && !gameComplete) {
      if (confirm('Are you sure you want to quit this game and return to the home screen?')) {
        resetGame();
      }
    } else {
      resetGame();
    }
  };

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, []);

  // Keyboard shortcuts for selecting answers and navigating
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || loading) {
        return;
      }

      // Enter key to proceed to next round after answering
      if (e.key === 'Enter' && answered && !gameComplete) {
        nextRound();
        return;
      }

      // Only handle number keys when options are visible and not already answered
      if (answered || options.length === 0) {
        return;
      }

      const key = e.key;
      const num = parseInt(key);

      // Check if key is 1-4 and corresponds to an option
      if (num >= 1 && num <= options.length) {
        const selectedTrack = options[num - 1];
        handleAnswer(selectedTrack);
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => {
      window.removeEventListener('keydown', handleKeyPress);
    };
  }, [gameState, loading, answered, options, gameComplete]);

  return (
    <div className="min-h-screen p-3 sm:p-6 md:p-8 relative overflow-hidden">
      <audio ref={audioRef} />

      {/* Header with logo and icons */}
      <div className="flex items-center justify-between mb-4 sm:mb-6 relative z-20">
        <h1
          onClick={handleTitleClick}
          className={`${audiowide.className} text-xl sm:text-2xl md:text-3xl font-bold metallic-text cursor-pointer transition-all hover:scale-105`}
          style={{
            textShadow: '0 0 20px rgba(192, 192, 192, 0.8), 0 0 40px rgba(75, 0, 130, 0.6)'
          }}
        >
          🚀 TUNETRIVIA 🎸
        </h1>

        {/* Icons - right side */}
        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          {/* Leaderboard button */}
          <div className="relative group">
            <Link
              href="/leaderboard"
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center transition-all hover:scale-105"
              style={{
                backgroundColor: 'rgba(75, 0, 130, 0.8)',
                color: '#C0C0C0',
                border: '2px solid rgba(192, 192, 192, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
              </svg>
            </Link>
            <div
              className="absolute top-14 right-0 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
              style={{
                backgroundColor: 'rgba(75, 0, 130, 0.95)',
                color: '#C0C0C0',
                border: '1px solid rgba(192, 192, 192, 0.3)',
                backdropFilter: 'blur(10px)',
              }}
            >
              Leaderboard
            </div>
          </div>

          {/* User/Auth button */}
          {authLoading ? (
            <div
              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold animate-pulse"
              style={{
                backgroundColor: 'rgba(75, 0, 130, 0.8)',
                color: '#C0C0C0',
                border: '2px solid rgba(192, 192, 192, 0.5)',
                backdropFilter: 'blur(10px)',
              }}
            >
              ⋯
            </div>
          ) : (
            <div className="relative group">
              <button
                onClick={user ? undefined : signInWithGoogle}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center text-sm font-bold transition-all overflow-hidden hover:scale-105"
                style={{
                  backgroundColor: 'rgba(75, 0, 130, 0.8)',
                  color: '#C0C0C0',
                  border: '2px solid rgba(192, 192, 192, 0.5)',
                  backdropFilter: 'blur(10px)',
                  cursor: user ? 'default' : 'pointer',
                }}
              >
                {user ? (
                  (user.user_metadata?.avatar_url || user.user_metadata?.picture) ? (
                    <Link href="/games" className="w-full h-full flex items-center justify-center">
                      <img
                        src={user.user_metadata?.picture || user.user_metadata?.avatar_url}
                        alt="User avatar"
                        className="w-full h-full object-cover"
                      />
                    </Link>
                  ) : (
                    <Link href="/games" className="w-full h-full flex items-center justify-center">
                      <span>
                        {user.user_metadata?.full_name?.[0]?.toUpperCase() ||
                         user.user_metadata?.name?.[0]?.toUpperCase() ||
                         user.email?.[0]?.toUpperCase() ||
                         '?'}
                      </span>
                    </Link>
                  )
                ) : (
                  <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                )}
              </button>
              {user && (
                <div
                  className="absolute top-14 right-0 px-3 py-2 rounded-lg text-xs font-semibold whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                  style={{
                    backgroundColor: 'rgba(75, 0, 130, 0.95)',
                    color: '#C0C0C0',
                    border: '1px solid rgba(192, 192, 192, 0.3)',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  View my games
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Constellation lines */}
      <div className="constellation-line" style={{ top: '20%', left: '10%', width: '30%', transform: 'rotate(45deg)' }} />
      <div className="constellation-line" style={{ top: '60%', right: '15%', width: '25%', transform: 'rotate(-30deg)' }} />
      <div className="constellation-line" style={{ bottom: '30%', left: '25%', width: '40%', transform: 'rotate(15deg)' }} />

      <div className="max-w-5xl mx-auto relative z-10">

        {gameState === 'select' && (
          <div className="holographic-card rounded-3xl p-8 sm:p-10 md:p-12 relative" style={{
            background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(255, 0, 0, 0.2) 100%)',
          }}>
            <h2 className={`${audiowide.className} text-3xl sm:text-4xl font-bold text-center mb-6 text-silver-400`} style={{
              color: '#C0C0C0',
              textShadow: '0 0 20px rgba(192, 192, 192, 0.8)'
            }}>
              LAUNCH SEQUENCE
            </h2>

            {/* Mode Toggle */}
            <div className="flex gap-2 mb-8 justify-center">
              <button
                onClick={() => setPlayMode('quick')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105`}
                style={{
                  backgroundColor: playMode === 'quick' ? 'rgba(75, 0, 130, 0.8)' : 'rgba(75, 0, 130, 0.3)',
                  color: '#C0C0C0',
                  border: playMode === 'quick' ? '2px solid #C0C0C0' : '2px solid rgba(192, 192, 192, 0.3)',
                  boxShadow: playMode === 'quick' ? '0 0 15px rgba(192, 192, 192, 0.3)' : 'none',
                }}
              >
                ⚡ QUICK PLAY
              </button>
              <button
                onClick={() => setPlayMode('specific')}
                className={`px-6 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105`}
                style={{
                  backgroundColor: playMode === 'specific' ? 'rgba(75, 0, 130, 0.8)' : 'rgba(75, 0, 130, 0.3)',
                  color: '#C0C0C0',
                  border: playMode === 'specific' ? '2px solid #C0C0C0' : '2px solid rgba(192, 192, 192, 0.3)',
                  boxShadow: playMode === 'specific' ? '0 0 15px rgba(192, 192, 192, 0.3)' : 'none',
                }}
              >
                🎯 SPECIFIC CHART
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="block font-bold text-xl mb-3 text-silver-300" style={{ color: '#C0C0C0' }}>⚡ GENRE</label>

                {/* Mobile: dropdown */}
                <select
                  value={selectedChart}
                  onChange={(e) => setSelectedChart(e.target.value)}
                  className="md:hidden w-full p-4 rounded-xl border-2 font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-red-500 rocket-button"
                  style={{
                    backgroundColor: 'rgba(75, 0, 130, 0.6)',
                    color: '#C0C0C0',
                    borderColor: '#C0C0C0'
                  }}
                >
                  <option value="hot-100" style={{ backgroundColor: '#000' }}>🔥 Pop</option>
                  <option value="rock" style={{ backgroundColor: '#000' }}>🎧 ROCK</option>
                  <option value="country" style={{ backgroundColor: '#000' }}>🤠 COUNTRY</option>
                  <option value="rnb" style={{ backgroundColor: '#000' }}>🎤 R&B/HIP-HOP</option>
                  <option value="rap" style={{ backgroundColor: '#000' }}>🎙️ RAP</option>
                  <option value="alternative" style={{ backgroundColor: '#000' }}>🎸 ALTERNATIVE</option>
                  <option value="latin" style={{ backgroundColor: '#000' }}>💃 LATIN</option>
                </select>

                {/* Desktop: grid of buttons */}
                <div className="hidden md:flex md:flex-wrap gap-2">
                  {[
                    { id: 'hot-100', emoji: '🔥', name: 'POP' },
                    { id: 'rock', emoji: '🎧', name: 'ROCK' },
                    { id: 'country', emoji: '🤠', name: 'COUNTRY' },
                    { id: 'rnb', emoji: '🎤', name: 'R&B' },
                    { id: 'rap', emoji: '🎙️', name: 'RAP' },
                    { id: 'alternative', emoji: '🎸', name: 'ALT' },
                    { id: 'latin', emoji: '💃', name: 'LATIN' },
                  ].map((chart) => (
                    <button
                      key={chart.id}
                      onClick={() => setSelectedChart(chart.id)}
                      className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg border-2 font-bold transition-all hover:scale-105 flex flex-col items-center justify-center gap-0.5"
                      style={{
                        backgroundColor: selectedChart === chart.id ? 'rgba(75, 0, 130, 0.8)' : 'rgba(75, 0, 130, 0.4)',
                        color: '#C0C0C0',
                        borderColor: selectedChart === chart.id ? '#C0C0C0' : 'rgba(192, 192, 192, 0.5)',
                        boxShadow: selectedChart === chart.id ? '0 0 20px rgba(192, 192, 192, 0.4)' : 'none',
                      }}
                    >
                      <span className="text-3xl lg:text-4xl">{chart.emoji}</span>
                      <span className="text-[9px] lg:text-[10px] text-center leading-tight px-1">{chart.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Quick Play Mode */}
              {playMode === 'quick' && (
                <>
                  <div>
                    <label className="block font-bold text-xl mb-3 text-silver-300" style={{ color: '#C0C0C0' }}>🎚️ DIFFICULTY</label>
                    <div className="flex items-center gap-4">
                      {['easy', 'medium', 'hard'].map((level) => (
                        <button
                          key={level}
                          onClick={() => setDifficulty(level as 'easy' | 'medium' | 'hard')}
                          className="flex-1 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105"
                          style={{
                            backgroundColor: difficulty === level ? 'rgba(75, 0, 130, 0.8)' : 'rgba(75, 0, 130, 0.4)',
                            color: '#C0C0C0',
                            borderWidth: '2px',
                            borderStyle: 'solid',
                            borderColor: difficulty === level ? '#C0C0C0' : 'rgba(192, 192, 192, 0.5)',
                            boxShadow: difficulty === level ? '0 0 15px rgba(192, 192, 192, 0.3)' : 'none',
                          }}
                        >
                          {level.toUpperCase()}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block font-bold text-xl mb-3 text-silver-300" style={{ color: '#C0C0C0' }}>📅 DECADE</label>

                    {/* Mobile: dropdown */}
                    <select
                      value={selectedDecade}
                      onChange={(e) => setSelectedDecade(e.target.value)}
                      className="md:hidden w-full p-4 rounded-xl border-2 font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-red-500 rocket-button"
                      style={{
                        backgroundColor: 'rgba(75, 0, 130, 0.6)',
                        color: '#C0C0C0',
                        borderColor: '#C0C0C0'
                      }}
                    >
                      <option value="all" style={{ backgroundColor: '#000' }}>ALL DECADES</option>
                      {availableDecades.map(decade => (
                        <option key={decade} value={decade.replace('s', '')} style={{ backgroundColor: '#000' }}>
                          {decade}
                        </option>
                      ))}
                    </select>

                    {/* Desktop: grid of buttons */}
                    <div className="hidden md:flex md:flex-wrap gap-2">
                      <button
                        onClick={() => setSelectedDecade('all')}
                        className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg border-2 font-bold transition-all hover:scale-105 flex flex-col items-center justify-center gap-0.5"
                        style={{
                          backgroundColor: selectedDecade === 'all' ? 'rgba(75, 0, 130, 0.8)' : 'rgba(75, 0, 130, 0.4)',
                          color: '#C0C0C0',
                          borderColor: selectedDecade === 'all' ? '#C0C0C0' : 'rgba(192, 192, 192, 0.5)',
                          boxShadow: selectedDecade === 'all' ? '0 0 20px rgba(192, 192, 192, 0.4)' : 'none',
                        }}
                      >
                        <span className="text-3xl lg:text-4xl">🌍</span>
                        <span className="text-[9px] lg:text-[10px] text-center leading-tight px-1">ALL</span>
                      </button>
                      {availableDecades.map((decade) => {
                        const decadeNum = decade.replace('s', '');
                        const shortDecade = decadeNum.slice(-2);
                        return (
                          <button
                            key={decade}
                            onClick={() => setSelectedDecade(decadeNum)}
                            className="w-20 h-20 lg:w-24 lg:h-24 rounded-lg border-2 font-bold transition-all hover:scale-105 flex flex-col items-center justify-center gap-0.5"
                            style={{
                              backgroundColor: selectedDecade === decadeNum ? 'rgba(75, 0, 130, 0.8)' : 'rgba(75, 0, 130, 0.4)',
                              color: '#C0C0C0',
                              borderColor: selectedDecade === decadeNum ? '#C0C0C0' : 'rgba(192, 192, 192, 0.5)',
                              boxShadow: selectedDecade === decadeNum ? '0 0 20px rgba(192, 192, 192, 0.4)' : 'none',
                            }}
                          >
                            <span className="text-3xl lg:text-4xl font-bold">'{shortDecade}</span>
                            <span className="text-[9px] lg:text-[10px] text-center leading-tight px-1">{decade}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      if (!user) {
                        console.log('No user, showing auth overlay');
                        setShowAuthOverlay(true);
                      } else {
                        console.log('User exists, starting quick play');
                        startQuickPlay();
                      }
                    }}
                    className={`${audiowide.className} w-full py-5 rounded-2xl text-3xl font-bold rocket-button relative overflow-hidden`}
                    style={{
                      background: 'linear-gradient(135deg, #4B0082 0%, #FF0000 100%)',
                      color: '#C0C0C0',
                      border: '3px solid #C0C0C0',
                      boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)'
                    }}
                  >
                    🚀 START!
                  </button>
                </>
              )}

              {/* Specific Chart Mode */}
              {playMode === 'specific' && (
                <>
                  <div>
                    <label className="block font-bold text-xl mb-3 text-silver-300" style={{ color: '#C0C0C0' }}>📅 YEAR</label>
                    <select
                      value={selectedYear || ''}
                      onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                      className="w-full p-4 rounded-xl border-2 font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-red-500 rocket-button"
                      style={{
                        backgroundColor: 'rgba(75, 0, 130, 0.6)',
                        color: '#C0C0C0',
                        borderColor: '#C0C0C0'
                      }}
                    >
                      <option value="" style={{ backgroundColor: '#000' }}>SELECT YEAR...</option>
                      {years.map(year => (
                        <option key={year} value={year} style={{ backgroundColor: '#000' }}>
                          {year}
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedYear && (
                    <div>
                      <label className="block font-bold text-xl mb-3 text-silver-300" style={{ color: '#C0C0C0' }}>🗓️ WEEK</label>
                      <select
                        value={selectedWeek || ''}
                        onChange={(e) => setSelectedWeek(e.target.value)}
                        className="w-full p-4 rounded-xl border-2 font-semibold text-lg focus:outline-none focus:ring-4 focus:ring-red-500 rocket-button"
                        style={{
                          backgroundColor: 'rgba(75, 0, 130, 0.6)',
                          color: '#C0C0C0',
                          borderColor: '#C0C0C0'
                        }}
                      >
                        <option value="" style={{ backgroundColor: '#000' }}>SELECT WEEK...</option>
                        {availableWeeks.map(week => (
                          <option key={week} value={week} style={{ backgroundColor: '#000' }}>
                            {week}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

                  {selectedWeek && (
                    <button
                      onClick={() => {
                        if (!user) {
                          setShowAuthOverlay(true);
                        } else {
                          startGame();
                        }
                      }}
                      className={`${audiowide.className} w-full py-5 rounded-2xl text-3xl font-bold rocket-button relative overflow-hidden`}
                      style={{
                        background: 'linear-gradient(135deg, #4B0082 0%, #FF0000 100%)',
                        color: '#C0C0C0',
                        border: '3px solid #C0C0C0',
                        boxShadow: '0 0 30px rgba(255, 0, 0, 0.6)'
                      }}
                    >
                      🚀 START!
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        )}

        {gameState === 'loading' && (
          <div className="holographic-card rounded-3xl p-12 text-center" style={{
            background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(255, 0, 0, 0.2) 100%)',
          }}>
            <div className={`${audiowide.className} text-3xl font-bold mb-6`} style={{
              color: '#C0C0C0',
              textShadow: '0 0 20px rgba(192, 192, 192, 0.8)'
            }}>
              {status}
            </div>
            <div className="text-8xl animate-spin inline-block">🌌</div>
            <div className="mt-6 text-silver-400 font-bold text-xl" style={{ color: '#C0C0C0' }}>
              Warp speed engaged...
            </div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="holographic-card rounded-3xl p-3 sm:p-6 md:p-8" style={{
            background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.5) 0%, rgba(255, 0, 0, 0.3) 100%)',
          }}>
            {selectedWeek && (
              <div className="text-center mb-1 sm:mb-2">
                <div className="font-bold text-xs tracking-widest" style={{
                  color: '#C0C0C0',
                  textShadow: '0 0 10px rgba(192, 192, 192, 0.5)'
                }}>
                  📡 TRANSMISSION: {new Date(selectedWeek).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-2 sm:mb-4 font-bold text-base sm:text-xl" style={{ color: '#C0C0C0' }}>
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-lg sm:text-2xl">🎯</span>
                <span>ROUND {currentRound + 1}/{tracks.length}</span>
                {playMode === 'quick' && (
                  <span className="text-xs sm:text-sm px-2 py-1 rounded ml-1 sm:ml-2" style={{
                    background: difficulty === 'hard' ? 'linear-gradient(135deg, #FF0000 0%, #FF6B00 100%)' :
                               difficulty === 'medium' ? 'linear-gradient(135deg, #FFD700 0%, #FFA500 100%)' :
                               'linear-gradient(135deg, #00FF00 0%, #00AA00 100%)',
                    color: difficulty === 'easy' ? '#000' : '#FFF',
                    boxShadow: difficulty === 'hard' ? '0 0 10px rgba(255, 0, 0, 0.5)' :
                               difficulty === 'medium' ? '0 0 10px rgba(255, 215, 0, 0.5)' :
                               '0 0 10px rgba(0, 255, 0, 0.5)',
                  }}>
                    {difficulty === 'hard' ? '2.5x' : difficulty === 'medium' ? '1.5x' : '1x'}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-1 sm:gap-2 text-lg sm:text-2xl">
                <span className="animate-pulse">⭐</span>
                <span>{score}</span>
              </div>
            </div>

            {!loading && !answered && (
              <div className="mb-2 sm:mb-4 text-center relative">
                <div className={`${audiowide.className} text-4xl sm:text-6xl font-bold mb-1 sm:mb-2 ${
                  timeLeft <= 5 ? 'animate-pulse' : ''
                }`} style={{
                  color: timeLeft <= 5 ? '#FF0000' : '#C0C0C0',
                  textShadow: timeLeft <= 5 ? '0 0 30px rgba(255, 0, 0, 0.8)' : '0 0 20px rgba(192, 192, 192, 0.8)'
                }}>
                  {timeLeft}
                </div>
                <div className="w-full rounded-full h-2 sm:h-4 overflow-hidden border-2 relative" style={{
                  borderColor: '#C0C0C0',
                  backgroundColor: 'rgba(0, 0, 0, 0.5)'
                }}>
                  <div
                    className="h-full transition-all duration-1000 relative"
                    style={{
                      width: `${(timeLeft / 30) * 100}%`,
                      background: timeLeft <= 5
                        ? 'linear-gradient(90deg, #FF0000 0%, #FF6B00 100%)'
                        : 'linear-gradient(90deg, #4B0082 0%, #C0C0C0 100%)',
                      boxShadow: timeLeft <= 5 ? '0 0 20px rgba(255, 0, 0, 0.8)' : '0 0 10px rgba(192, 192, 192, 0.5)'
                    }}
                  />
                </div>
              </div>
            )}

            <div className="mb-2 sm:mb-3 text-center">
              <div className="font-bold text-xs sm:text-sm" style={{
                color: '#C0C0C0',
                textShadow: '0 0 10px rgba(192, 192, 192, 0.5)'
              }}>{status}</div>
              {loading && (
                <div className="text-xs mt-1 animate-pulse" style={{ color: '#C0C0C0' }}>Establishing signal... 📡</div>
              )}
            </div>

            {!loading && !gameComplete && (
              <div className="space-y-2 sm:space-y-3 mb-2 sm:mb-4">
                <h3 className={`${audiowide.className} text-lg sm:text-2xl font-bold text-center mb-2 sm:mb-3`} style={{
                  color: '#C0C0C0',
                  textShadow: '0 0 20px rgba(192, 192, 192, 0.8)'
                }}>
                  Who performed this track?
                </h3>
                {options.map((track, idx) => {
                  const isCorrect = track === tracks[currentRound];
                  const isSelected = idx === selectedAnswer;

                  let bgGradient = 'linear-gradient(135deg, rgba(75, 0, 130, 0.6) 0%, rgba(0, 0, 0, 0.6) 100%)';
                  let textColor = '#C0C0C0';
                  let borderColor = '#C0C0C0';
                  let additionalClass = 'rocket-button';
                  let boxShadow = '0 0 15px rgba(192, 192, 192, 0.3)';

                  if (answered) {
                    if (isCorrect) {
                      bgGradient = 'linear-gradient(135deg, #00FF00 0%, #00AA00 100%)';
                      textColor = '#000';
                      borderColor = '#00FF00';
                      additionalClass = 'correct-burst';
                      boxShadow = '0 0 30px rgba(0, 255, 0, 0.8)';
                    } else if (isSelected) {
                      bgGradient = 'linear-gradient(135deg, #FF0000 0%, #AA0000 100%)';
                      textColor = '#FFF';
                      borderColor = '#FF0000';
                      boxShadow = '0 0 30px rgba(255, 0, 0, 0.8)';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(track)}
                      disabled={answered}
                      className={`w-full p-3 sm:p-5 rounded-2xl text-left transition-all border-3 relative overflow-hidden ${additionalClass} ${
                        answered ? 'cursor-default' : 'cursor-pointer'
                      }`}
                      style={{
                        background: bgGradient,
                        color: textColor,
                        border: `3px solid ${borderColor}`,
                        boxShadow: boxShadow
                      }}
                    >
                      <div className="flex items-center gap-2 sm:gap-4 relative z-10">
                        <div className="flex-shrink-0 w-10 h-10 sm:w-12 sm:h-12 rounded-full border-3 flex items-center justify-center font-bold text-lg sm:text-xl" style={{
                          background: 'linear-gradient(135deg, #FF0000 0%, #4B0082 100%)',
                          color: '#C0C0C0',
                          border: '2px solid #C0C0C0',
                          boxShadow: '0 0 10px rgba(192, 192, 192, 0.5)'
                        }}>
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-bold text-base sm:text-lg truncate">{track.song}</div>
                          <div className="text-xs sm:text-sm opacity-80 truncate">{track.artist}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {answered && !gameComplete && (
              <>
                <div className="holographic-card rounded-2xl p-4 sm:p-5 md:p-6 mb-4 sm:mb-5 md:mb-6" style={{
                  background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)',
                }}>
                  <div className="flex flex-col sm:flex-row gap-4 sm:gap-5 md:gap-6 items-start">
                    {currentArtwork && (
                      <img
                        src={currentArtwork}
                        alt="Album artwork"
                        className="w-24 h-24 sm:w-28 sm:h-28 md:w-36 md:h-36 rounded-xl shadow-lg flex-shrink-0 mx-auto sm:mx-0"
                        style={{
                          border: '3px solid #C0C0C0',
                          boxShadow: '0 0 20px rgba(192, 192, 192, 0.5)'
                        }}
                      />
                    )}
                    <div className="flex-1 w-full">
                      <h3 className="metallic-text text-xl sm:text-2xl md:text-3xl font-bold mb-2" style={{
                        fontFamily: 'Audiowide, sans-serif',
                      }}>
                        {tracks[currentRound].song}
                      </h3>
                      <p className="text-lg sm:text-xl md:text-2xl mb-3 sm:mb-4" style={{
                        color: '#C0C0C0',
                      }}>
                        {tracks[currentRound].artist}
                      </p>
                      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                        {playMode === 'quick' && tracks[currentRound].chartDate && (
                          <div className="col-span-2">
                            <div className="text-xs sm:text-sm uppercase tracking-wider mb-1" style={{ color: '#C0C0C0' }}>Chart Week</div>
                            <div className="text-base sm:text-lg md:text-xl font-bold" style={{ color: '#C0C0C0' }}>
                              {new Date(tracks[currentRound].chartDate).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </div>
                          </div>
                        )}
                        <div>
                          <div className="text-xs sm:text-sm uppercase tracking-wider mb-1" style={{ color: '#C0C0C0' }}>Chart Position</div>
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold flex items-center gap-2 metallic-text">
                            #{tracks[currentRound].this_week}
                            {tracks[currentRound].last_week !== null && (
                              <span className="text-base sm:text-lg md:text-xl">
                                {tracks[currentRound].this_week < tracks[currentRound].last_week! ? (
                                  <span style={{ color: '#00FF00' }}>▲ {tracks[currentRound].last_week! - tracks[currentRound].this_week}</span>
                                ) : tracks[currentRound].this_week > tracks[currentRound].last_week! ? (
                                  <span style={{ color: '#FF0000' }}>▼ {tracks[currentRound].this_week - tracks[currentRound].last_week!}</span>
                                ) : (
                                  <span style={{ color: '#C0C0C0' }}>—</span>
                                )}
                              </span>
                            )}
                            {tracks[currentRound].last_week === null && (
                              <span className="text-xs sm:text-sm px-2 py-1 rounded" style={{
                                background: 'linear-gradient(135deg, #FF0000 0%, #FF6B00 100%)',
                                color: '#FFF',
                                boxShadow: '0 0 10px rgba(255, 0, 0, 0.5)'
                              }}>NEW</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm uppercase tracking-wider mb-1" style={{ color: '#C0C0C0' }}>Peak Position</div>
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold metallic-text">#{tracks[currentRound].peak_position}</div>
                        </div>
                        <div>
                          <div className="text-xs sm:text-sm uppercase tracking-wider mb-1" style={{ color: '#C0C0C0' }}>Weeks on Chart</div>
                          <div className="text-xl sm:text-2xl md:text-3xl font-bold metallic-text">
                            {tracks[currentRound].weeks_on_chart} {tracks[currentRound].weeks_on_chart === 1 ? 'wk' : 'wks'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={nextRound}
                  className="w-full py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold transition-all rocket-button border-3"
                  style={{
                    background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.8) 0%, rgba(255, 0, 0, 0.8) 100%)',
                    color: '#C0C0C0',
                    border: '3px solid #C0C0C0',
                    boxShadow: '0 0 20px rgba(192, 192, 192, 0.4)',
                    fontFamily: 'Audiowide, sans-serif',
                  }}
                >
                  NEXT ROUND →
                </button>
              </>
            )}

            {gameComplete && (
              <div className="text-center space-y-5 sm:space-y-6">
                <div className="holographic-card rounded-3xl p-6 sm:p-8 md:p-10" style={{
                  background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.4) 0%, rgba(0, 0, 0, 0.4) 100%)',
                }}>
                  <div className="metallic-text text-4xl sm:text-5xl md:text-6xl font-bold mb-4" style={{
                    fontFamily: 'Audiowide, sans-serif',
                  }}>
                    MISSION COMPLETE
                  </div>
                  <div className="text-3xl sm:text-4xl md:text-5xl font-bold mb-3" style={{
                    color: '#C0C0C0',
                  }}>
                    {correctCount} out of {tracks.length} Correct
                  </div>
                  <div className="text-2xl sm:text-3xl md:text-4xl mb-5" style={{
                    background: 'linear-gradient(135deg, #FF0000 0%, #FF6B00 100%)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    fontWeight: 'bold',
                  }}>
                    {score} points
                  </div>
                  <div className="text-xl sm:text-2xl md:text-3xl" style={{
                    color: '#C0C0C0',
                    fontWeight: '600',
                  }}>
                    {correctCount === tracks.length && "Perfect! You're a music expert!"}
                    {correctCount >= tracks.length * 0.7 && correctCount < tracks.length && "Great job!"}
                    {correctCount >= tracks.length * 0.5 && correctCount < tracks.length * 0.7 && "Not bad!"}
                    {correctCount < tracks.length * 0.5 && "Keep practicing!"}
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                  <button
                    onClick={resetGame}
                    className="flex-1 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold transition-all rocket-button border-3"
                    style={{
                      background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.8) 0%, rgba(255, 0, 0, 0.8) 100%)',
                      color: '#C0C0C0',
                      border: '3px solid #C0C0C0',
                      boxShadow: '0 0 20px rgba(192, 192, 192, 0.4)',
                      fontFamily: 'Audiowide, sans-serif',
                    }}
                  >
                    🚀 PLAY AGAIN
                  </button>
                  <Link
                    href="/leaderboard"
                    className="flex-1 px-8 sm:px-10 py-4 sm:py-5 rounded-2xl text-lg sm:text-xl font-bold transition-all rocket-button border-3 flex items-center justify-center"
                    style={{
                      background: 'linear-gradient(135deg, rgba(255, 215, 0, 0.8) 0%, rgba(255, 140, 0, 0.8) 100%)',
                      color: '#000',
                      border: '3px solid #FFD700',
                      boxShadow: '0 0 20px rgba(255, 215, 0, 0.4)',
                      fontFamily: 'Audiowide, sans-serif',
                    }}
                  >
                    🏆 VIEW LEADERBOARD
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer - only show when not in game complete state */}
        {!gameComplete && (
          <footer className="mt-12 pb-6 text-center">
            <Link
              href="/leaderboard"
              className="inline-block px-4 py-2 rounded-lg text-sm font-semibold transition-all hover:scale-105"
              style={{
                backgroundColor: 'rgba(75, 0, 130, 0.3)',
                color: '#C0C0C0',
                border: '1px solid rgba(192, 192, 192, 0.2)',
                backdropFilter: 'blur(10px)',
              }}
            >
              🏆 View Leaderboard
            </Link>
          </footer>
        )}
      </div>

      {/* Auth Overlay */}
      {showAuthOverlay && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.85)',
            backdropFilter: 'blur(10px)',
          }}
        >
          <div
            className="relative max-w-md w-full rounded-2xl p-6 sm:p-8"
            style={{
              background: 'linear-gradient(135deg, rgba(75, 0, 130, 0.95) 0%, rgba(0, 0, 0, 0.95) 100%)',
              border: '2px solid rgba(192, 192, 192, 0.3)',
              boxShadow: '0 0 60px rgba(75, 0, 130, 0.8)',
            }}
          >
            {/* Close button */}
            <button
              onClick={() => setShowAuthOverlay(false)}
              className="absolute top-3 right-3 text-xl transition-all hover:scale-110"
              style={{ color: '#C0C0C0' }}
            >
              ×
            </button>

            <h2
              className={`${audiowide.className} text-xl sm:text-2xl font-bold text-center mb-4 metallic-text`}
              style={{
                textShadow: '0 0 20px rgba(192, 192, 192, 0.8)',
              }}
            >
              🎵 Level Up Your Music Game
            </h2>

            <p className="text-center mb-6 text-sm sm:text-base" style={{ color: '#C0C0C0', lineHeight: '1.5' }}>
              Keep your progress safe, compete on the leaderboard, and track your stats—all for free
            </p>

            <div className="space-y-4 mb-6">
              <div className="flex items-start gap-3">
                <span className="text-xl">💾</span>
                <div>
                  <h3 className="font-bold mb-0.5 text-sm" style={{ color: '#C0C0C0' }}>Save Your Progress</h3>
                  <p className="text-xs" style={{ color: 'rgba(192, 192, 192, 0.7)' }}>Never lose your scores or stats</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">🏆</span>
                <div>
                  <h3 className="font-bold mb-0.5 text-sm" style={{ color: '#C0C0C0' }}>Compete on Leaderboard</h3>
                  <p className="text-xs" style={{ color: 'rgba(192, 192, 192, 0.7)' }}>See how you rank against others</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <span className="text-xl">📊</span>
                <div>
                  <h3 className="font-bold mb-0.5 text-sm" style={{ color: '#C0C0C0' }}>Track Your Stats</h3>
                  <p className="text-xs" style={{ color: 'rgba(192, 192, 192, 0.7)' }}>Review your game history anytime</p>
                </div>
              </div>
            </div>

            <button
              onClick={signInWithGoogle}
              className={`${audiowide.className} w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:scale-105 mb-3`}
              style={{
                background: 'linear-gradient(135deg, #4B0082 0%, #FF0000 100%)',
                color: '#C0C0C0',
                border: '2px solid #C0C0C0',
                boxShadow: '0 0 20px rgba(255, 0, 0, 0.4)',
              }}
            >
              Continue with Google
            </button>

            <button
              onClick={() => {
                console.log('Continue without signing in clicked, playMode:', playMode);
                setShowAuthOverlay(false);
                if (playMode === 'quick') {
                  startQuickPlay();
                } else {
                  startGame();
                }
              }}
              className={`${audiowide.className} w-full py-3 sm:py-4 rounded-xl font-bold text-base sm:text-lg transition-all hover:scale-105`}
              style={{
                background: 'transparent',
                color: 'rgba(192, 192, 192, 0.7)',
                border: '2px solid rgba(192, 192, 192, 0.3)',
              }}
            >
              Continue without signing in
            </button>

            <p className="text-center text-xs mt-4" style={{ color: 'rgba(192, 192, 192, 0.5)' }}>
              By signing up, you agree to save your game data
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
