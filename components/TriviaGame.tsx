'use client';

import ArtistSuggestions from '@/components/ArtistSuggestions';
import { artistHref, chartHref } from '@/lib/explore-links';

import { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { useGameTracking } from '@/hooks/useGameTracking';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabaseClient';
import GameResults from '@/components/GameResults';
import ChartWheel, { type ChartSpin } from '@/components/ChartWheel';
import ChartReveal from '@/components/ChartReveal';
import type { ChartTrack as Track, RevealedPositions } from '@/lib/tracks';
import SiteHeader from '@/components/SiteHeader';
import { CHARTS, DEFAULT_THEME, chartById } from '@/lib/charts';
import { genrePath, readSettings, triviaHref } from '@/lib/trivia-links';

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
  country = 'US',
  signal?: AbortSignal,
): Promise<ITunesResult> {
  const term = encodeURIComponent(`${artist} ${song}`);
  let url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=10&country=${country}`;
  if(artist === 'Local H' && song === 'Eddie Vedder') {
    url = "https://itunes.apple.com/lookup?id=1440923144"
  }
  if(artist === 'The West Coast Rap All-Stars' && song === "We're All In The Same Gang") {
    throw new Error('No previewUrl available in iTunes results');
  }
  const res = await fetch(url, { signal });
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

export default function TriviaGame({ initialChart = 'hot-100' }: { initialChart?: string }) {
  const [playMode, setPlayMode] = useState<'quick' | 'specific'>('quick');
  const selectedChart = initialChart;
  const [settingsReady, setSettingsReady] = useState(false);
  const [shareMessage, setShareMessage] = useState('');
  const [manualShareUrl, setManualShareUrl] = useState('');
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium');
  const [selectedDecade, setSelectedDecade] = useState<string>('all');
  const [validDates, setValidDates] = useState<string[]>([]);
  const [years, setYears] = useState<number[]>([]);
  const [selectedYear, setSelectedYear] = useState<number | null>(null);
  const [availableWeeks, setAvailableWeeks] = useState<string[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [latestWeek, setLatestWeek] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [timeMode, setTimeMode] = useState<'all' | 'era' | 'year' | 'week'>('all');
  const [pendingStart, setPendingStart] = useState<'quick' | 'latest' | null>(null);
  const defaultWeekRequestedRef = useRef(false);
  const [gameState, setGameState] = useState<'select' | 'loading' | 'playing'>('select');
  const [tracks, setTracks] = useState<Track[]>([]);
  const [allChartTracks, setAllChartTracks] = useState<Track[]>([]);
  const [weekChartTracks, setWeekChartTracks] = useState<Track[]>([]);
  const [chartSpin, setChartSpin] = useState<ChartSpin | null>(null);
  const usedTracksRef = useRef<Set<string>>(new Set());
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
  const [lastRoundId, setLastRoundId] = useState<string | null>(null);
  const [savingResult, setSavingResult] = useState(false);
  const [audioBlocked, setAudioBlocked] = useState(false);
  const pendingStartRef = useRef<(() => void) | null>(null);
  const [results, setResults] = useState<Record<number, 'right' | 'wrong'>>({});

  const audioRef = useRef<HTMLAudioElement>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const roundStartTimeRef = useRef<number>(0);
  const answeredRef = useRef<boolean>(false);
  const currentTrackRef = useRef<Track | null>(null);
  const roundRunRef = useRef(0);
  const roundAbortRef = useRef<AbortController | null>(null);
  const retryTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinCompletionRef = useRef<{ id: number; resolve: () => void } | null>(null);
  const nextRoundRef = useRef<(() => Promise<void>) | null>(null);

  const cancelRound = () => {
    roundRunRef.current++;
    roundAbortRef.current?.abort();
    spinCompletionRef.current?.resolve();
    spinCompletionRef.current = null;
    if (timerRef.current) clearInterval(timerRef.current);
    if (retryTimerRef.current) clearTimeout(retryTimerRef.current);
    pendingStartRef.current = null;
    audioRef.current?.pause();
  };

  const finishChartSpin = useCallback((id: number) => {
    if (spinCompletionRef.current?.id !== id) return;
    spinCompletionRef.current.resolve();
    spinCompletionRef.current = null;
  }, []);

  const { startGameRound, recordGuess, endGameRound } = useGameTracking();
  const { user, loading: authLoading, isNewUser, newUserProfile, signInWithGoogle, signOut, dismissNewUserModal } = useAuth();
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [welcomeDisplayName, setWelcomeDisplayName] = useState('');
  const [savingWelcome, setSavingWelcome] = useState(false);

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

  useEffect(() => {
    const restore = () => {
      defaultWeekRequestedRef.current = false;
      const settings = readSettings(window.location.search, chartById(initialChart));
      setPlayMode(settings.mode);
      setDifficulty(settings.difficulty);
      setSelectedDecade(settings.decade);
      setSelectedYear(settings.year);
      setSelectedWeek(settings.week);
      // A shared link with custom settings opens the advanced controls so they're visible.
      setTimeMode(settings.mode === 'specific' ? 'week' : settings.year ? 'year' : settings.decade !== 'all' ? 'era' : 'all');
      setShowAdvanced(settings.mode === 'specific' || settings.difficulty !== 'medium' || settings.decade !== 'all' || settings.year !== null);
      setSettingsReady(true);
    };
    restore();
    window.addEventListener('popstate', restore);
    return () => window.removeEventListener('popstate', restore);
  }, [initialChart]);

  // What the share link and address bar record: only the settings that apply
  // to the chosen way of picking songs.
  const urlSettings = () => ({
    mode: playMode,
    difficulty,
    decade: timeMode === 'era' ? selectedDecade : 'all',
    year: timeMode === 'year' || timeMode === 'week' ? selectedYear : null,
    week: timeMode === 'week' ? selectedWeek : null,
  });

  useEffect(() => {
    if (!settingsReady || gameState !== 'select') return;
    const href = triviaHref(chartById(selectedChart), urlSettings());
    // Keep the general landing page at /; genre links have their own static pages.
    const url = new URL(href, window.location.origin);
    url.pathname = window.location.pathname;
    window.history.replaceState(window.history.state, '', url.pathname + url.search + window.location.hash);
    setShareMessage('');
    setManualShareUrl('');
  }, [settingsReady, selectedChart, playMode, timeMode, difficulty, selectedDecade, selectedYear, selectedWeek, gameState]);

  const shareTrivia = async (copyOnly = false) => {
    const chart = chartById(selectedChart);
    const url = new URL(triviaHref(chart, urlSettings()), window.location.origin).href;
    const text = gameComplete
      ? `I scored ${score} points (${correctCount}/${tracks.length}) on TuneTrivia ${chart.name}. Try these quiz settings!`
      : `Try this ${chart.name} music quiz on TuneTrivia!`;
    try {
      if (!copyOnly && navigator.share) {
        await navigator.share({ title: `${chart.name} Music Trivia`, text, url });
        setShareMessage('Shared!');
      } else if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(gameComplete && !copyOnly ? `${text}\n${url}` : url);
        setShareMessage('Link copied!');
      } else {
        setManualShareUrl(url);
        setShareMessage('Copy the link below.');
      }
    } catch (error) {
      if ((error as DOMException).name !== 'AbortError') {
        setManualShareUrl(url);
        setShareMessage('Copy the link below.');
      }
    }
  };

  // Show welcome modal for new users
  useEffect(() => {
    if (isNewUser && newUserProfile) {
      const name = newUserProfile.display_name || newUserProfile.username || '';
      setWelcomeDisplayName(name);
      setShowWelcomeModal(true);
    }
  }, [isNewUser, newUserProfile]);

  const handleWelcomeSave = async () => {
    if (!user) return;

    const trimmedName = welcomeDisplayName.trim();
    if (!trimmedName) return;

    setSavingWelcome(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ display_name: trimmedName })
        .eq('user_id', user.id);

      if (error) throw error;

      setShowWelcomeModal(false);
      dismissNewUserModal();
    } catch (error) {
      console.error('Error updating display name:', error);
    } finally {
      setSavingWelcome(false);
    }
  };

  const handleWelcomeSkip = () => {
    setShowWelcomeModal(false);
    dismissNewUserModal();
  };

  // Fetch valid dates when chart changes
  useEffect(() => {
    if (!settingsReady) return;
    let cancelled = false;
    async function fetchValidDates() {
      try {

        const chartSlug = chartById(selectedChart).slug;

        // Use RPC function to get date range in a single query
        const { data, error: rangeError } = await supabase.rpc('get_chart_date_range', {
          p_chart: chartSlug
        });
        let rangeData = data;
        if (cancelled) return;

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

          if (cancelled) return;
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

          rangeData = [{
            min_date: minMaxData[0].date,
            max_date: maxData[0].date
          }];
        }

        const minYear = parseInt(rangeData[0].min_date.split('-')[0]);
        const maxYear = parseInt(rangeData[0].max_date.split('-')[0]);


        // Generate all years in the range
        const allYears = [];
        for (let year = minYear; year <= maxYear; year++) {
          allYears.push(year);
        }

        setLatestWeek(rangeData[0].max_date);
        setAvailableDecades(getDecades(allYears));
        {
          setYears([...allYears].sort((a, b) => b - a));
          if (playMode === 'specific' && defaultWeekRequestedRef.current) {
            defaultWeekRequestedRef.current = false;
            setSelectedYear(maxYear);
            setSelectedWeek(rangeData[0].max_date);
          }
        }

      } catch (err) {
        if (cancelled) return;
        console.error('Error in fetchValidDates:', err);
        setValidDates([]);
        setYears([]);
        setAvailableDecades([]);
      }
    }

    fetchValidDates();
    return () => { cancelled = true; };
  }, [selectedChart, playMode, settingsReady]);

  // Update available weeks when year is selected
  useEffect(() => {
    if (!settingsReady) return;
    let cancelled = false;
    async function fetchWeeksForYear() {
      setAvailableWeeks([]);
      if (!selectedYear) return;

      try {

        const chartSlug = chartById(selectedChart).slug;

        // Use a PostgreSQL query to get distinct dates efficiently
        const { data, error } = await supabase.rpc('get_distinct_dates', {
          p_chart: chartSlug,
          p_year: selectedYear
        });
        if (cancelled) return;

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
            if (cancelled) return;

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

          const sortedDates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

          setAvailableWeeks(sortedDates);
          setSelectedWeek(previous => previous && sortedDates.includes(previous) ? previous : null);
          return;
        }

        // RPC returned distinct dates
        const sortedDates = data.map((row: any) => row.date).sort((a: string, b: string) => b.localeCompare(a));
        setAvailableWeeks(sortedDates);
        setSelectedWeek(previous => previous && sortedDates.includes(previous) ? previous : null);
      } catch (err) {
        if (cancelled) return;
        console.error('Error in fetchWeeksForYear:', err);
        setAvailableWeeks([]);
      }
    }

    fetchWeeksForYear();
    return () => { cancelled = true; };
  }, [selectedYear, selectedChart, settingsReady]);

  const startQuickPlay = async () => {

    // Don't need to pick a specific week - we'll query all weeks in the decade
    if (timeMode === 'year' && selectedYear) {
      await startGameWithDecade(selectedYear, selectedYear + 1);
    } else if (timeMode !== 'era' || selectedDecade === 'all') {
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
    cancelRound();
    setLoading(true);
    setWeekChartTracks([]);
    setChartSpin(null);
    setGameState('loading');
    setGameComplete(false);
    setLastRoundId(null);
    setShareMessage('');
    setManualShareUrl('');


    setStatus(`Loading ${chartById(selectedChart).label}...`);

    try {

      const chartSlug = chartById(selectedChart).slug;

      // Use RPC function to get random songs efficiently
      const { data: songs, error } = await supabase.rpc('get_random_songs', {
        p_chart: chartSlug,
        p_difficulty: difficulty,
        p_start_year: startYear,
        p_end_year: endYear,
        p_limit: 200
      });


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

      // Store all tracks for wrong answer pool
      setAllChartTracks(deduplicatedData);

      // Shuffle and pick 10 unique random tracks for the game
      const shuffled = [...deduplicatedData].sort(() => Math.random() - 0.5);
      const gameTracks = shuffled.slice(0, 10);
      setTracks(gameTracks);
      usedTracksRef.current = new Set();
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setResults({});
      setGameComplete(false);
      setGameState('playing');

      // Start tracking game round - quick play mode
      await startGameRound(selectedChart, 'quick', {
        difficulty,
        decadeStart: startYear === null ? null : Math.floor(startYear / 10) * 10,
      });

      loadRound(gameTracks, 0, deduplicatedData);
    } catch (err) {
      setStatus('Error loading chart data');
      console.error(err);
      setGameState('select');
    }
  };

  const startGameWithWeek = async (weekDate: string) => {
    cancelRound();
    setLoading(true);
    setChartSpin(null);
    setGameState('loading');
    setGameComplete(false);
    setLastRoundId(null);
    setShareMessage('');
    setManualShareUrl('');


    setStatus(`Loading ${chartById(selectedChart).label}...`);

    try {

      const chartSlug = chartById(selectedChart).slug;

      // Build query using the view
      const { data: songs, error } = await supabase
        .from('v_chart_entries')
        .select('*')
        .eq('chart', chartSlug)
        .eq('date', weekDate)
        .order('this_week', { ascending: true })
        .limit(1000);

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

      setWeekChartTracks(chartData);

      // Deduplicate songs by song+artist combination
      const uniqueSongs = new Map<string, Track>();
      chartData.forEach((track: Track) => {
        const key = `${track.song}-${track.artist}`;
        if (!uniqueSongs.has(key)) {
          uniqueSongs.set(key, track);
        }
      });
      const deduplicatedData = Array.from(uniqueSongs.values());

      // Store all tracks for wrong answer pool
      setAllChartTracks(deduplicatedData);

      // Shuffle and pick 10 unique random tracks for the game
      const shuffled = [...deduplicatedData].sort(() => Math.random() - 0.5);
      const gameTracks = shuffled.slice(0, 10);
      setTracks(gameTracks);
      usedTracksRef.current = new Set();
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setResults({});
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
    cancelRound();
    const run = roundRunRef.current;
    const controller = new AbortController();
    roundAbortRef.current = controller;
    setChartSpin(null);
    setLoading(true);
    setAnswered(false);
    setAudioBlocked(false);
    pendingStartRef.current = null;
    answeredRef.current = false;
    setSelectedAnswer(null);
    setTimeLeft(difficulty === 'hard' ? 10 : difficulty === 'medium' ? 20 : 30);
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
    if (usedTracksRef.current.has(trackKey)) {
      setStatus('Skipping duplicate track...');
      retryTimerRef.current = setTimeout(() => { if (run === roundRunRef.current) nextRoundRef.current?.(); }, 1000);
      return;
    }

    // Mark track as used
    usedTracksRef.current.add(trackKey);

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
      const preview = await findITunesPreviewUrl(currentTrack, 'US', controller.signal);
      if (run !== roundRunRef.current) return;
      setCurrentArtwork(preview.artwork);
      if (playMode === 'specific') {
        setStatus('The chart is spinning. Your next position is coming up…');
        await new Promise<void>(resolve => {
          spinCompletionRef.current = { id: run, resolve };
          setChartSpin({ id: run, position: currentTrack.this_week });
        });
        if (run !== roundRunRef.current) return;
        // On a phone the wheel and answers stack. Bring the answers into view
        // before playback/countdown so scrolling never costs guessing time.
        if (window.innerWidth < 768) {
          const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          document.querySelector('.week-game-question')?.scrollIntoView({ block: 'start', behavior: reduced ? 'auto' : 'smooth' });
          if (!reduced) await new Promise<void>(resolve => {
            const finish = () => { clearTimeout(timeout); controller.signal.removeEventListener('abort', finish); resolve(); };
            const timeout = setTimeout(finish, 450);
            controller.signal.addEventListener('abort', finish, { once: true });
          });
          if (run !== roundRunRef.current) return;
        }
      }
      // Browsers can refuse to start audio that was not triggered by a tap (common on
      // phones). That is not a missing preview: keep the round and ask for a tap.
      let blocked = false;
      if (audioRef.current) {
        audioRef.current.src = preview.previewUrl;
        try {
          await audioRef.current.play();
          if (run !== roundRunRef.current) return;
        } catch (playErr) {
          if ((playErr as DOMException)?.name === 'NotAllowedError') blocked = true;
          else throw playErr;
        }
      }
      setStatus('Playing 30-second preview...');
      setLoading(false);

      const startCountdown = () => {
        if (run !== roundRunRef.current) return;
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
                  setResults(prev => ({ ...prev, [roundNum]: 'wrong' }));
                  setStatus(`⏱ Time's up! It was "${currentTrackRef.current.song}" by ${currentTrackRef.current.artist}`);
                  if (audioRef.current) audioRef.current.pause();
                }
              }, 100);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);
      };

      if (blocked) {
        pendingStartRef.current = startCountdown;
        setAudioBlocked(true);
      } else {
        startCountdown();
      }
    } catch (err) {
      if (run !== roundRunRef.current) return;
      // If preview fails, try a backup song from the remaining pool
      if (retryCount < 3) {
        setStatus('Could not find preview. Trying another song...');

        // Find a backup track that hasn't been used yet
        const availableBackups = answerPool.filter(t => {
          const key = `${t.song}-${t.artist}`;
          return !usedTracksRef.current.has(key) && key !== trackKey
            && !allTracks.some(track => `${track.song}-${track.artist}` === key);
        });

        if (availableBackups.length > 0) {
          // Pick a random backup
          const backupTrack = availableBackups[Math.floor(Math.random() * availableBackups.length)];

          // Replace the current track with the backup in the game tracks array
          const newTracks = [...allTracks];
          newTracks[roundNum] = backupTrack;
          setTracks(newTracks);

          // Unmark the failed track
          usedTracksRef.current.delete(trackKey);

          // Retry with the backup track
          retryTimerRef.current = setTimeout(() => {
            if (run === roundRunRef.current) loadRound(newTracks, roundNum, chartPool, retryCount + 1);
          }, 500);
          return;
        }
      }

      // If all retries failed or no backups available, skip this round
      setStatus('Could not find preview. Skipping...');
      retryTimerRef.current = setTimeout(() => { if (run === roundRunRef.current) nextRoundRef.current?.(); }, 2000);
    }
  };

  const unblockAudio = async () => {
    try {
      await audioRef.current?.play();
    } catch {
      setStatus('The clip could not start. Tap to try again.');
      return;
    }
    setAudioBlocked(false);
    pendingStartRef.current?.();
    pendingStartRef.current = null;
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
    setResults(prev => ({ ...prev, [currentRound]: track === correctTrack ? 'right' : 'wrong' }));

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
      setSavingResult(true);
      setGameComplete(true);
      setStatus(`Game Over! Final Score: ${score}`);

      // End game tracking
      const completedRoundId = await endGameRound(score, correctCount, tracks.length);
      setLastRoundId(completedRoundId);
      setSavingResult(false);
    }
  };
  nextRoundRef.current = nextRound;

  const resetGame = () => {
    cancelRound();
    setChartSpin(null);
    // Clear timer on reset
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setGameState('select');
    setCurrentRound(0);
    setScore(0);
    setCorrectCount(0);
    setResults({});
    usedTracksRef.current = new Set();
    setGameComplete(false);
    setLastRoundId(null);
    setSavingResult(false);
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

  // Each chart has its own scene: repaint the whole page when the chart changes
  useEffect(() => {
    document.documentElement.dataset.theme = chartById(selectedChart).theme;
    return () => {
      document.documentElement.dataset.theme = DEFAULT_THEME;
    };
  }, [selectedChart]);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      cancelRound();
    };
  }, []);

  // Keyboard shortcuts for selecting answers and navigating
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameState !== 'playing' || loading || audioBlocked) {
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
  }, [gameState, loading, answered, options, gameComplete, audioBlocked]);

  const chart = chartById(selectedChart);
  const maxTime = difficulty === 'hard' ? 10 : difficulty === 'medium' ? 20 : 30;
  const current = tracks[currentRound];
  const isLastRound = currentRound + 1 >= tracks.length;
  const revealedPositions = useMemo(() => {
    const positions: RevealedPositions = {};
    tracks.forEach((track, index) => { if (results[index]) positions[track.this_week] = results[index]; });
    return positions;
  }, [tracks, results]);
  const longDate = (d: string) =>
    new Date(`${d}T12:00:00`).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const requestStart = () => {
    if (playMode === 'quick') startQuickPlay();
    else startGame();
  };
  const chooseTime = (mode: 'all' | 'era' | 'year' | 'week') => {
    if (mode === timeMode) return;
    setTimeMode(mode);
    if (mode === 'week') {
      defaultWeekRequestedRef.current = true;
      setPlayMode('specific');
      return;
    }
    defaultWeekRequestedRef.current = false;
    setPlayMode('quick');
    setSelectedWeek(null);
    if (mode === 'all') setSelectedDecade('all');
    if (mode === 'era' && selectedDecade === 'all' && availableDecades.length) setSelectedDecade(availableDecades[0].replace('s', ''));
    if (mode === 'year' && years.length && !(selectedYear && years.includes(selectedYear))) setSelectedYear(years[0]);
  };
  // One-tap starts: set the mode first, then start once the state has settled.
  const playDefault = () => {
    setPlayMode('quick'); setTimeMode('all'); setDifficulty('medium'); setSelectedDecade('all');
    setPendingStart('quick');
  };
  const playLatest = () => {
    if (!latestWeek) return;
    setPlayMode('specific'); setTimeMode('week');
    setSelectedYear(Number(latestWeek.slice(0, 4)));
    setSelectedWeek(latestWeek);
    setPendingStart('latest');
  };
  useEffect(() => {
    if (!pendingStart || gameState !== 'select') return;
    if (pendingStart === 'quick' && playMode === 'quick' && timeMode === 'all' && difficulty === 'medium' && selectedDecade === 'all') {
      setPendingStart(null);
      startQuickPlay();
    } else if (pendingStart === 'latest' && playMode === 'specific' && timeMode === 'week' && latestWeek && selectedWeek === latestWeek) {
      setPendingStart(null);
      startGameWithWeek(latestWeek);
    }
  });
  const difficulties = [
    { id: 'easy', label: 'Easy', hint: 'Long-running top 10 hits, 30 seconds each' },
    { id: 'medium', label: 'Medium', hint: 'Top 20 songs, 20 seconds each, 1.5× points' },
    { id: 'hard', label: 'Hard', hint: 'Deep cuts that barely charted, 10 seconds each, 2.5× points' },
  ] as const;

  return (
    <div className={`page${gameState === 'select' ? ' page--select' : ''}${gameComplete ? ' page--results' : ''}`}>
      <audio ref={audioRef} />
      <SiteHeader user={user} authLoading={authLoading} onSignIn={signInWithGoogle} onHome={handleTitleClick} />

      {gameState === 'select' && (
        <main id="main-content">
          <div className="landing-intro">
            <div>
              <p className="eyebrow">A little music. A little friendly competition.</p>
              <h1 className="font-display hero-title">{initialChart === 'hot-100' ? 'Name that tune.' : `${chart.name} music trivia.`}</h1>
              <p className="intro-copy"><span className="intro-copy-desktop">Ten songs. A few seconds. How many do you know?<br className="hidden sm:block" /> Pick your soundtrack and put your music memory to the test.</span><span className="intro-copy-mobile">10 songs. Pick a chart. Test your ear.</span></p>
            </div>
            <a href="#quiz-setup" className="intro-link">Find your next favorite quiz <span aria-hidden="true">↘</span></a>
          </div>

          <section className="chart-picker" aria-labelledby="chart-heading">
            <div className="section-heading">
              <h2 id="chart-heading" className="group-title"><span className="step-number">01</span> Choose your soundtrack</h2>
              <span className="muted text-sm">11 charts · decades of hits</span>
            </div>
            <div className="windows">
              {CHARTS.map((c) => (
                <a
                  key={c.id}
                  href={genrePath(c)}
                  data-theme={c.theme}
                  className="window"
                  aria-current={selectedChart === c.id ? 'page' : undefined}
                  style={{ '--card-art': `url('/scenes/${c.genre}/left.webp')` } as React.CSSProperties}
                >
                  <span className="card-art" aria-hidden="true" />
                  {selectedChart === c.id && <span className="card-selected" aria-hidden="true">✓</span>}
                  <span className="name font-display">{c.name}</span>
                  <span className="since">since {c.since.slice(0, 4)}</span>
                </a>
              ))}
            </div>
            <p className="chart-caption">
              <span className="font-semibold">{chart.label}.</span> <span className="muted">{chart.blurb}.</span>
            </p>
          </section>

          <div className="setup-layout">
          <section id="quiz-setup" className="panel p-5 sm:p-8" aria-labelledby="setup-heading">
            <h2 id="setup-heading" className="group-title mb-5"><span className="step-number">02</span> {showAdvanced ? 'Make it your mix' : 'Ready?'}</h2>
            {!showAdvanced && (
              <div className="quick-start">
                <button className="btn btn-primary btn-lg quick-start-btn" disabled={!settingsReady} onClick={playDefault}>
                  <span>Play {chart.name} trivia <span aria-hidden="true">→</span></span>
                  <small>All years · Medium</small>
                </button>
                <button className="btn btn-ghost btn-lg quick-start-btn" disabled={!settingsReady || !latestWeek} onClick={playLatest}>
                  <span>Play the latest week</span>
                  <small>{latestWeek ? `Chart of ${longDate(latestWeek)}` : 'Loading…'}</small>
                </button>
                <button className="cog-link" onClick={() => setShowAdvanced(true)} aria-expanded="false">
                  <span aria-hidden="true">⚙</span> Advanced options
                </button>
                {status.startsWith('Error') && <span role="alert">Couldn’t load that chart. Try another era or chart.</span>}
              </div>
            )}
            {showAdvanced && (<>
            <div className="space-y-6">
              <div>
                <div className="group-title">Songs from</div>
                <div className="seg" role="group" aria-label="Songs from">
                  <button aria-pressed={timeMode === 'all'} onClick={() => chooseTime('all')}>All time</button>
                  <button aria-pressed={timeMode === 'era'} onClick={() => chooseTime('era')}>A decade</button>
                  <button aria-pressed={timeMode === 'year'} onClick={() => chooseTime('year')}>A year</button>
                  <button aria-pressed={timeMode === 'week'} disabled={!settingsReady} onClick={() => chooseTime('week')}>One week</button>
                </div>
                {timeMode === 'era' && (
                  <div className="seg mt-3" role="group" aria-label="Decade">
                    {availableDecades.map((decade) => {
                      const n = decade.replace('s', '');
                      return (
                        <button key={decade} aria-pressed={selectedDecade === n} onClick={() => setSelectedDecade(n)}>{decade}</button>
                      );
                    })}
                  </div>
                )}
                {timeMode === 'year' && (
                  <label className="block mt-3 sm:max-w-xs">
                    <span className="sr-only">Year</span>
                    <select className="field" value={selectedYear || ''} onChange={(e) => setSelectedYear(Number(e.target.value) || null)}>
                      {years.map((year) => <option key={year} value={year}>{year}</option>)}
                    </select>
                  </label>
                )}
                {timeMode === 'week' && (
                  <div className="grid sm:grid-cols-2 gap-3 mt-3 sm:max-w-xl">
                    <label>
                      <span className="sr-only">Year</span>
                      <select className="field" value={selectedYear || ''} onChange={(e) => { defaultWeekRequestedRef.current = false; setSelectedYear(Number(e.target.value) || null); setSelectedWeek(null); }}>
                        <option value="">Choose a year</option>
                        {years.map((year) => <option key={year} value={year}>{year}</option>)}
                      </select>
                    </label>
                    <label>
                      <span className="sr-only">Chart week</span>
                      <select
                        className="field"
                        value={selectedWeek || ''}
                        disabled={!selectedYear || !availableWeeks.length}
                        onChange={(e) => { defaultWeekRequestedRef.current = false; setSelectedWeek(e.target.value || null); }}
                      >
                        <option value="">{selectedYear ? 'Choose a week' : 'Choose a year first'}</option>
                        {selectedWeek && !availableWeeks.includes(selectedWeek) && <option value={selectedWeek}>{longDate(selectedWeek)}</option>}
                        {availableWeeks.map((week) => <option key={week} value={week}>{longDate(week)}</option>)}
                      </select>
                    </label>
                  </div>
                )}
              </div>

              {timeMode !== 'week' ? (
                <div>
                  {(timeMode === 'year' || timeMode === 'era') && <ArtistSuggestions genre={chart.genre} year={timeMode === 'year' ? selectedYear : null} decade={selectedDecade} />}
                  <div className="group-title">Difficulty</div>
                  <div className="seg" role="group" aria-label="Difficulty">
                    {difficulties.map((d) => (
                      <button key={d.id} aria-pressed={difficulty === d.id} onClick={() => setDifficulty(d.id)}>
                        {d.label}
                      </button>
                    ))}
                  </div>
                  <p className="muted text-sm mt-2">{difficulties.find((d) => d.id === difficulty)?.hint}</p>
                </div>
              ) : (
                <p className="muted text-sm">A chart week plays that week’s songs, so there’s no difficulty setting.</p>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <button
                className="btn btn-primary btn-lg"
                disabled={!settingsReady || (timeMode === 'week' && (!selectedWeek || !availableWeeks.includes(selectedWeek))) || (timeMode === 'year' && !selectedYear) || (timeMode === 'era' && selectedDecade === 'all')}
                onClick={requestStart}
              >
                Play {chart.name} trivia <span aria-hidden="true">→</span>
              </button>
              {status.startsWith('Error') && <span role="alert">Couldn’t load that chart. Try another era or chart.</span>}
            </div>
            <button className="cog-link mt-4" onClick={() => setShowAdvanced(false)} aria-expanded="true">
              <span aria-hidden="true">⚙</span> Hide options
            </button>
            </>)}
            <p className="muted text-sm mt-3">Free to play. No sign-up needed. Sound on.</p>
          </section>
          <aside className="quiz-aside">
            <h2 className="font-display text-3xl mb-4">Got a good ear?</h2>
            <ol className="how-to">
              <li><span>1</span><div><strong>Listen to the clip</strong><p>Get 10, 20, or 30 seconds, depending on your difficulty.</p></div></li>
              <li><span>2</span><div><strong>Name the song</strong><p>Choose the right title and artist. Faster guesses earn more points.</p></div></li>
              <li><span>3</span><div><strong>Pass it on</strong><p>Share your quiz settings and see how your friends do.</p></div></li>
            </ol>
            <div className="share-setup">
              <button className="btn btn-ghost" onClick={() => shareTrivia()} disabled={!settingsReady}>Share this quiz</button>
              <button className="text-link" onClick={() => shareTrivia(true)} disabled={!settingsReady}>Copy link</button>
              <p className="muted text-xs mt-3">Same chart and settings. A fresh set of songs each play.</p>
            </div>
          </aside>
          </div>
          <section className="faq" aria-labelledby="faq-title">
            <h2 id="faq-title" className="font-display text-3xl mb-5">Every era has a soundtrack.</h2>
            <p className="muted mb-5">Explore {chart.label} from {chart.since.slice(0, 4)} onward. Play a quick mix or choose a chart week to revisit the songs that defined a moment.</p>
            <details><summary>How does this music trivia game work?</summary><p>Listen to a song preview, then choose its title and artist from the answers. A game has up to ten songs, and faster correct answers earn more points. You can use keys 1–4 to answer and Enter to move to the next song.</p></details>
            <details><summary>Can I play a particular decade or chart week?</summary><p>Yes. In Quick play, choose an era and difficulty. Pick a week lets you choose a year and an available chart date. Share this quiz saves those choices in a link, so friends can try the same selection with a fresh mix of songs.</p></details>
            <details><summary>Do I need an account?</summary><p>You can play for free without an account. Sign in with Google before playing to save your scores, track your games, and join the leaderboard.</p></details>
          </section>
          <footer className="site-footer"><span>TuneTrivia · For the love of the song.</span><span>Chart data: Billboard & Spotify. Audio previews: iTunes.<br />An independent game; not affiliated with these services.</span></footer>
        </main>
      )}

      {gameState === 'loading' && (
        <main id="main-content" className="panel p-10 sm:p-16 max-w-3xl flex flex-col items-center text-center gap-6">
          <div className="pulse-disc" aria-hidden="true" />
          <p className="font-display text-3xl" role="status">{status}</p>
        </main>
      )}

      {gameState === 'playing' && !gameComplete && current && (
        <main id="main-content" className={playMode === 'specific' ? 'week-game' : 'max-w-3xl'}>
          <div className="flex items-center justify-between gap-4 mb-5">
            <div>
              <div className="font-semibold">
                {chart.name}
                {playMode === 'quick' ? `, ${difficulty}` : selectedWeek ? `, week of ${longDate(selectedWeek)}` : ''}
              </div>
              <div className="pips mt-2" aria-label={`Song ${currentRound + 1} of ${tracks.length}`}>
                {tracks.map((_, i) => (
                  <span key={i} className="pip" data-state={results[i] ?? (i === currentRound ? 'current' : 'todo')} />
                ))}
              </div>
            </div>
            <div className="text-right">
              <div className="font-display text-4xl leading-none">{score.toLocaleString()}</div>
              <div className="muted text-sm">points</div>
            </div>
          </div>

          <div className={playMode === 'specific' ? 'week-game-layout' : ''}>
          {playMode === 'specific' && <ChartWheel tracks={weekChartTracks} label={chart.label} week={selectedWeek ? longDate(selectedWeek) : ''} spin={chartSpin} revealed={revealedPositions} onLanded={finishChartSpin} />}
          <div className="week-game-question">
          <div className="panel p-4 sm:p-7">
            {audioBlocked && !loading ? (
              <div className="flex flex-col items-center text-center gap-5 py-10">
                <p className="font-display text-3xl">Ready for song {currentRound + 1}?</p>
                <p className="muted">Your browser needs a tap before it will play sound. The clock starts when you do.</p>
                <button className="btn btn-primary btn-lg" onClick={unblockAudio}>Play the clip</button>
              </div>
            ) : loading ? (
              <div className="flex flex-col items-center text-center gap-5 py-10">
                <div className="pulse-disc" aria-hidden="true" />
                <p className="muted" role="status">{status}</p>
                {playMode === 'specific' && <p className="muted text-sm">The clip and clock start after the wheel lands.</p>}
              </div>
            ) : (
              <>
                <div className="flex items-end justify-between gap-4 mb-3">
                  <h2 className="font-display text-2xl sm:text-4xl leading-tight">
                    {answered ? (roundPoints > 0 ? `Correct, +${roundPoints}` : selectedAnswer === null ? 'Out of time' : 'Not quite') : 'Which song is playing?'}
                  </h2>
                  {!answered && (
                    <div className={`font-display text-4xl sm:text-5xl leading-none ${timeLeft <= 5 ? 'accent' : ''}`} aria-label={`${timeLeft} seconds left`}>
                      {timeLeft}
                    </div>
                  )}
                </div>
                {playMode === 'specific' && !answered && <p className="chart-position-clue">Your chart clue: <strong>No. {current.this_week}</strong> this week</p>}
                {!answered && (
                  <div className="timer-track mb-5">
                    <div className="timer-fill" data-low={timeLeft <= 5} style={{ width: `${(timeLeft / maxTime) * 100}%` }} />
                  </div>
                )}

                <div className="space-y-2.5">
                  {options.map((track, idx) => {
                    const isCorrect = track === current;
                    const state = !answered ? undefined : isCorrect ? 'right' : idx === selectedAnswer ? 'wrong' : 'other';
                    return (
                      <button key={idx} className="option" data-state={state} disabled={answered} onClick={() => handleAnswer(track)}>
                        <span className="key">{idx + 1}</span>
                        <span className="min-w-0">
                          <span className="title block font-semibold truncate">{track.song}</span>
                          <span className="muted block text-sm truncate">{track.artist}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>

                {answered && (
                  <div className="mt-6 pt-6 flex flex-col sm:flex-row gap-5" style={{ borderTop: '1px solid var(--line)' }}>
                    {currentArtwork && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={currentArtwork} alt="" className="w-28 h-28 sm:w-36 sm:h-36 rounded-xl flex-none" />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="font-display text-2xl sm:text-3xl leading-tight">{current.song}</div>
                      <div className="muted text-lg mb-4">{current.artist}</div>
                      <dl className="flex flex-wrap gap-x-8 gap-y-3">
                        <div>
                          <dt className="muted text-sm">Position</dt>
                          <dd className="font-semibold text-lg">
                            #{current.this_week}
                            {current.last_week === null ? (
                              <span className="accent text-sm ml-2">new</span>
                            ) : current.this_week < current.last_week ? (
                              <span className="accent text-sm ml-2">▲ {current.last_week - current.this_week}</span>
                            ) : current.this_week > current.last_week ? (
                              <span className="muted text-sm ml-2">▼ {current.this_week - current.last_week}</span>
                            ) : null}
                          </dd>
                        </div>
                        <div>
                          <dt className="muted text-sm">Peak</dt>
                          <dd className="font-semibold text-lg">#{current.peak_position}</dd>
                        </div>
                        <div>
                          <dt className="muted text-sm">Weeks on chart</dt>
                          <dd className="font-semibold text-lg">{current.weeks_on_chart}</dd>
                        </div>
                        {current.chartDate && (
                          <div>
                            <dt className="muted text-sm">Chart week</dt>
                            <dd className="font-semibold text-lg">{longDate(current.chartDate)}</dd>
                          </div>
                        )}
                      </dl>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>

          {answered && !loading && !audioBlocked && (
            <div className="mt-5 flex flex-wrap items-center gap-4">
              <a className="text-link" href={artistHref(current.artist)} target="_blank" rel="noopener noreferrer">Explore artist ↗<span className="sr-only"> (opens in a new tab)</span></a>
              {current.chartDate && <a className="text-link" href={chartHref(chart.genre, current.chartDate)} target="_blank" rel="noopener noreferrer">View this chart ↗<span className="sr-only"> (opens in a new tab)</span></a>}
              <button className="btn btn-primary btn-lg" onClick={nextRound}>
                {isLastRound ? 'See results' : 'Next song'}
              </button>
              <span className="muted text-sm hidden sm:inline">or press Enter</span>
            </div>
          )}
          {!answered && !loading && !audioBlocked && <p className="muted text-sm mt-4 hidden sm:block">Press 1 to 4 to answer.</p>}
          </div>
          </div>
        </main>
      )}

      {gameState === 'playing' && gameComplete && (
        <GameResults
          chart={chart}
          score={score}
          correct={correctCount}
          total={tracks.length}
          results={results}
          mode={playMode}
          difficulty={difficulty}
          selectionLabel={playMode === 'quick'
            ? `${chart.name} · ${difficulty} · ${selectedDecade === 'all' ? 'all years' : `${selectedDecade}s`}`
            : `${chart.name} · ${selectedWeek ? longDate(selectedWeek) : 'picked week'}`}
          saving={savingResult}
          roundId={lastRoundId}
          signedIn={Boolean(user)}
          onRetry={() => { if (!savingResult) requestStart(); }}
          onChangeSelection={resetGame}
          onShare={() => shareTrivia()}
          chartReveal={playMode === 'specific' && weekChartTracks.length ? <ChartReveal chartUrl={selectedWeek ? chartHref(chart.genre, selectedWeek) : undefined} tracks={weekChartTracks} label={chart.label} week={selectedWeek ? longDate(selectedWeek) : ''} revealed={revealedPositions} /> : undefined}
        />
      )}

      <div className="share-feedback" role="status" aria-live="polite">{shareMessage}</div>
      {manualShareUrl && <label className="block panel p-4 mt-4">Quiz link<input className="field mt-2" aria-label="Quiz link" readOnly value={manualShareUrl} onFocus={event => event.target.select()} /></label>}

      {showWelcomeModal && (
        <div className="backdrop">
          <div className="panel p-6 sm:p-8 w-full max-w-md" role="dialog" aria-modal="true" aria-labelledby="welcome-title">
            <h2 id="welcome-title" className="font-display text-3xl mb-2">Welcome to TuneTrivia</h2>
            <label className="block mb-6">
              <span className="muted block mb-3">Your name on the leaderboard</span>
              <input
                type="text"
                className="field"
                value={welcomeDisplayName}
                onChange={(e) => setWelcomeDisplayName(e.target.value)}
                maxLength={50}
              />
            </label>
            <div className="flex flex-wrap gap-3">
              <button className="btn btn-primary" onClick={handleWelcomeSave} disabled={savingWelcome || !welcomeDisplayName.trim()}>
                {savingWelcome ? 'Saving…' : 'Save name'}
              </button>
              <button className="btn btn-ghost" onClick={handleWelcomeSkip} disabled={savingWelcome}>Change it later</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
