'use client';

import { useState, useEffect, useRef } from 'react';

interface Track {
  song: string;
  artist: string;
  this_week: number;
  last_week: number | null;
  peak_position: number;
  weeks_on_chart: number;
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

async function findITunesPreviewUrl(
  { song, artist }: { song: string; artist: string },
  country = 'US'
): Promise<ITunesResult> {
  const term = encodeURIComponent(`${artist} ${song}`);
  const url = `https://itunes.apple.com/search?term=${term}&entity=song&limit=10&country=${country}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`iTunes search failed: ${res.status}`);

  const data = await res.json();
  if (!data.results || data.results.length === 0)
    throw new Error('No iTunes results');

  const targetSong = normalize(song);
  const targetArtist = normalize(artist);

  const scored = data.results
    .map((r: any) => {
      const rSong = normalize(r.trackName || '');
      const rArtist = normalize(r.artistName || '');
      let score = 0;
      if (rSong === targetSong) score += 5;
      if (rArtist === targetArtist) score += 5;
      if (/clean/i.test(r.trackName)) score += 1;
      if (/live|instrumental|karaoke|remix/i.test(r.trackName)) score -= 2;
      if (r.previewUrl) score += 2;
      return { r, score };
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

  // Fetch valid dates on mount
  useEffect(() => {
    fetch('https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/valid_dates.json')
      .then(res => res.json())
      .then(dates => {
        setValidDates(dates);
        const uniqueYears = Array.from(new Set(dates.map((d: string) => parseInt(d.split('-')[0]))));
        setYears(uniqueYears.sort((a, b) => b - a));
      });
  }, []);

  // Update available weeks when year is selected
  useEffect(() => {
    if (selectedYear) {
      const weeks = validDates.filter(d => d.startsWith(`${selectedYear}-`));
      setAvailableWeeks(weeks.sort().reverse());
      setSelectedWeek(null);
    }
  }, [selectedYear, validDates]);

  const startGame = async () => {
    if (!selectedWeek) return;

    setGameState('loading');
    setStatus('Loading Billboard Hot 100...');

    try {
      const res = await fetch(
        `https://raw.githubusercontent.com/mhollingshead/billboard-hot-100/main/date/${selectedWeek}.json`
      );
      const response = await res.json();

      // Extract the data array from the response
      const chartData = response.data || response;

      // Store all 100 tracks for wrong answer pool
      setAllChartTracks(chartData);

      // Shuffle and pick 10 unique random tracks for the game
      const shuffled = [...chartData].sort(() => Math.random() - 0.5);
      const gameTracks = shuffled.slice(0, 10);
      setTracks(gameTracks);
      setUsedTracks(new Set());
      setCurrentRound(0);
      setScore(0);
      setCorrectCount(0);
      setGameComplete(false);
      setGameState('playing');
      loadRound(gameTracks, 0, chartData);
    } catch (err) {
      setStatus('Error loading chart data');
      setGameState('select');
    }
  };

  const loadRound = async (allTracks: Track[], roundNum: number, chartPool?: Track[], retryCount = 0) => {
    setLoading(true);
    setAnswered(false);
    setSelectedAnswer(null);
    setTimeLeft(30);
    setRoundPoints(0);
    setStatus('Searching for preview...');

    // Clear any existing timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    const currentTrack = allTracks[roundNum];
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
              if (!answered) {
                setAnswered(true);
                setStatus(`⏱ Time's up! It was "${currentTrack.song}" by ${currentTrack.artist}`);
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

  const handleAnswer = (track: Track) => {
    if (answered) return;

    // Clear the timer
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    setAnswered(true);
    const correctTrack = tracks[currentRound];
    setSelectedAnswer(options.indexOf(track));

    if (track === correctTrack) {
      // Calculate points based on actual time elapsed (faster = more points)
      const timeElapsedMs = Date.now() - roundStartTimeRef.current;
      const timeElapsedSec = timeElapsedMs / 1000;
      // Cap at 30 seconds, calculate points: 0s = 100pts, 30s = 1pt
      const cappedTime = Math.min(timeElapsedSec, 30);
      const points = Math.max(1, Math.round(100 - (cappedTime / 30) * 99));
      setRoundPoints(points);
      setScore(score + points);
      setCorrectCount(correctCount + 1);
      setStatus(`✓ Correct! +${points} points (${cappedTime.toFixed(1)}s)`);
    } else {
      setStatus(`✗ Wrong! It was "${correctTrack.song}" by ${correctTrack.artist}`);
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }
  };

  const nextRound = () => {
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
    <div className="min-h-screen p-3 sm:p-6 md:p-8">
      <audio ref={audioRef} />

      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-white text-center mb-4 sm:mb-6 md:mb-8">
          Billboard Hot 100 Music Trivia
        </h1>

        {gameState === 'select' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
            <h2 className="text-xl sm:text-2xl font-semibold text-white mb-4 sm:mb-6">Select a Chart Week</h2>

            <div className="space-y-4 sm:space-y-6">
              <div>
                <label className="block text-white text-base sm:text-lg mb-2">Year</label>
                <select
                  value={selectedYear || ''}
                  onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                  className="w-full p-2 sm:p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                >
                  <option value="">Select a year...</option>
                  {years.map(year => (
                    <option key={year} value={year} className="bg-gray-800">
                      {year}
                    </option>
                  ))}
                </select>
              </div>

              {selectedYear && (
                <div>
                  <label className="block text-white text-base sm:text-lg mb-2">Week</label>
                  <select
                    value={selectedWeek || ''}
                    onChange={(e) => setSelectedWeek(e.target.value)}
                    className="w-full p-2 sm:p-3 rounded-lg bg-white/20 text-white border border-white/30 focus:outline-none focus:ring-2 focus:ring-purple-400"
                  >
                    <option value="">Select a week...</option>
                    {availableWeeks.map(week => (
                      <option key={week} value={week} className="bg-gray-800">
                        {week}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {selectedWeek && (
                <button
                  onClick={startGame}
                  className="w-full py-3 sm:py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-lg sm:text-xl font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all shadow-lg"
                >
                  Start Game
                </button>
              )}
            </div>
          </div>
        )}

        {gameState === 'loading' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl text-center">
            <div className="text-white text-base sm:text-lg md:text-xl">{status}</div>
          </div>
        )}

        {gameState === 'playing' && (
          <div className="bg-white/10 backdrop-blur-md rounded-xl p-4 sm:p-6 md:p-8 shadow-2xl">
            {selectedWeek && (
              <div className="text-center mb-2 sm:mb-3">
                <div className="text-white/70 text-xs sm:text-sm uppercase tracking-wider">
                  Week of {new Date(selectedWeek).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
              </div>
            )}
            <div className="flex justify-between items-center mb-3 sm:mb-4 md:mb-6">
              <div className="text-white text-base sm:text-lg md:text-xl">
                Round {currentRound + 1} / {tracks.length}
              </div>
              <div className="text-white text-base sm:text-lg md:text-xl font-bold">
                Score: {score}
              </div>
            </div>

            {!loading && !answered && (
              <div className="mb-3 sm:mb-4 md:mb-6 text-center">
                <div className={`text-4xl sm:text-5xl md:text-6xl font-bold mb-2 ${
                  timeLeft <= 5 ? 'text-red-400 animate-pulse' : 'text-white'
                }`}>
                  {timeLeft}s
                </div>
                <div className="w-full bg-white/20 rounded-full h-2 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 ${
                      timeLeft <= 5 ? 'bg-red-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${(timeLeft / 30) * 100}%` }}
                  />
                </div>
              </div>
            )}

            <div className="mb-3 sm:mb-4 md:mb-6 text-center">
              <div className="text-white text-sm sm:text-base md:text-lg mb-1 sm:mb-2">{status}</div>
              {loading && (
                <div className="text-white/70 text-sm">Loading preview...</div>
              )}
            </div>

            {!loading && !gameComplete && (
              <div className="space-y-2 sm:space-y-3 md:space-y-4 mb-4 sm:mb-5 md:mb-6">
                <h3 className="text-white text-lg sm:text-xl md:text-2xl font-semibold text-center mb-2 sm:mb-3 md:mb-4">
                  Who performed this song?
                </h3>
                {options.map((track, idx) => {
                  const isCorrect = track === tracks[currentRound];
                  const isSelected = idx === selectedAnswer;

                  let bgClass = 'bg-white/20 hover:bg-white/30';
                  if (answered) {
                    if (isCorrect) {
                      bgClass = 'bg-green-500/50';
                    } else if (isSelected) {
                      bgClass = 'bg-red-500/50';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(track)}
                      disabled={answered}
                      className={`w-full p-2 sm:p-3 md:p-4 rounded-lg text-white text-left transition-all ${bgClass} ${
                        answered ? 'cursor-default' : 'cursor-pointer'
                      }`}
                    >
                      <div className="flex items-center gap-2 sm:gap-3">
                        <div className="flex-shrink-0 w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 rounded-full bg-white/20 flex items-center justify-center font-bold text-sm sm:text-base">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm sm:text-base truncate">{track.song}</div>
                          <div className="text-white/80 text-xs sm:text-sm truncate">{track.artist}</div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {answered && !gameComplete && (
              <>
                <div className="bg-white/20 rounded-xl p-3 sm:p-4 md:p-6 mb-3 sm:mb-4 md:mb-6">
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 md:gap-6 items-start">
                    {currentArtwork && (
                      <img
                        src={currentArtwork}
                        alt="Album artwork"
                        className="w-20 h-20 sm:w-24 sm:h-24 md:w-32 md:h-32 rounded-lg shadow-lg flex-shrink-0 mx-auto sm:mx-0"
                      />
                    )}
                    <div className="flex-1 w-full">
                      <h3 className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
                        {tracks[currentRound].song}
                      </h3>
                      <p className="text-white/90 text-sm sm:text-base md:text-lg mb-2 sm:mb-3 md:mb-4">
                        {tracks[currentRound].artist}
                      </p>
                      <div className="grid grid-cols-2 gap-2 sm:gap-3 md:gap-4 text-white">
                        <div>
                          <div className="text-white/60 text-xs sm:text-sm">Billboard Position</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold flex items-center gap-1 sm:gap-2">
                            #{tracks[currentRound].this_week}
                            {tracks[currentRound].last_week !== null && (
                              <span className="text-sm sm:text-base md:text-lg">
                                {tracks[currentRound].this_week < tracks[currentRound].last_week! ? (
                                  <span className="text-green-400">▲ {tracks[currentRound].last_week! - tracks[currentRound].this_week}</span>
                                ) : tracks[currentRound].this_week > tracks[currentRound].last_week! ? (
                                  <span className="text-red-400">▼ {tracks[currentRound].this_week - tracks[currentRound].last_week!}</span>
                                ) : (
                                  <span className="text-white/60">—</span>
                                )}
                              </span>
                            )}
                            {tracks[currentRound].last_week === null && (
                              <span className="text-xs sm:text-sm text-yellow-400">NEW</span>
                            )}
                          </div>
                        </div>
                        <div>
                          <div className="text-white/60 text-xs sm:text-sm">Peak Position</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold">#{tracks[currentRound].peak_position}</div>
                        </div>
                        <div>
                          <div className="text-white/60 text-xs sm:text-sm">Weeks on Chart</div>
                          <div className="text-lg sm:text-xl md:text-2xl font-bold">
                            {tracks[currentRound].weeks_on_chart} {tracks[currentRound].weeks_on_chart === 1 ? 'wk' : 'wks'}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <button
                  onClick={nextRound}
                  className="w-full py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base sm:text-lg font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Next Round →
                </button>
              </>
            )}

            {gameComplete && (
              <div className="text-center space-y-3 sm:space-y-4">
                <div className="text-white text-2xl sm:text-3xl font-bold mb-2">
                  {correctCount} out of {tracks.length} Correct
                </div>
                <div className="text-white/80 text-xl sm:text-2xl mb-2 sm:mb-4">
                  {score} points
                </div>
                <div className="text-white/80 text-lg sm:text-xl mb-2 sm:mb-4">
                  {correctCount === tracks.length && "Perfect! You're a music expert!"}
                  {correctCount >= tracks.length * 0.7 && correctCount < tracks.length && "Great job!"}
                  {correctCount >= tracks.length * 0.5 && correctCount < tracks.length * 0.7 && "Not bad!"}
                  {correctCount < tracks.length * 0.5 && "Keep practicing!"}
                </div>
                <button
                  onClick={resetGame}
                  className="px-6 sm:px-8 py-2 sm:py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-base sm:text-lg font-bold rounded-lg hover:from-purple-600 hover:to-pink-600 transition-all"
                >
                  Play Again
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
