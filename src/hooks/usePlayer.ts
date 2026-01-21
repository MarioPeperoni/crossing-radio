import React from 'react';

import useClock from './useClock';

function usePlayer() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { date } = useClock();
  const currentHourRef = React.useRef<number | null>(null);
  const playerAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const startAudioRef = React.useRef<HTMLAudioElement | null>(null);
  const loopAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const calculateOffset = React.useCallback(() => {
    // Calculate seconds from the start of the current hour
    return date.getMinutes() * 60 + date.getSeconds();
  }, [date]);

  const preloadAudio = React.useCallback((hour: number) => {
    const startAudio = new Audio(`/songs/nl/${hour}_start.mp3`);
    const loopAudio = new Audio(`/songs/nl/${hour}_loop.mp3`);

    startAudio.preload = 'auto';
    loopAudio.preload = 'auto';

    startAudioRef.current = startAudio;
    loopAudioRef.current = loopAudio;
  }, []);

  const playLoop = React.useCallback((hour: number, offset: number = 0) => {
    const loopAudio = new Audio(`/songs/nl/${hour}_loop.mp3`);
    playerAudioRef.current = loopAudio;
    loopAudio.volume = 0.5;
    loopAudio.loop = true;

    loopAudio.addEventListener('loadedmetadata', () => {
      loopAudio.currentTime = offset % loopAudio.duration;
    });

    loopAudio.play().then(() => setIsPlaying(true));
  }, []);

  const loadSong = React.useCallback(
    (hour: number, offset: number = 0) => {
      // Stop playing current audio
      if (playerAudioRef.current) {
        playerAudioRef.current.pause();
        playerAudioRef.current.remove();
      }

      const startAudio = new Audio(`/songs/nl/${hour}_start.mp3`);

      startAudio.addEventListener('error', () => {
        // If start audio doesn't exist, play loop directly
        playLoop(hour, offset);
      });

      startAudio.addEventListener('loadedmetadata', () => {
        const startDuration = startAudio.duration;

        // Check if offset is not past start audio
        if (offset >= startDuration) {
          playLoop(hour, offset - startDuration);
        } else {
          // Play start audio befor loop
          playerAudioRef.current = startAudio;
          startAudio.volume = 0.5;
          startAudio.currentTime = offset;

          startAudio.addEventListener('ended', () => {
            playLoop(hour, 0);
          });

          startAudio.play().then(() => setIsPlaying(true));
        }
      });
    },
    [playLoop],
  );

  const stopPlayer = React.useCallback(() => {
    if (playerAudioRef.current) {
      playerAudioRef.current.pause();
      playerAudioRef.current = null;
    }
    setIsPlaying(false);
  }, []);

  const startPlayer = React.useCallback(() => {
    currentHourRef.current = date.getHours();
    const offset = calculateOffset();

    loadSong(currentHourRef.current, offset);
    preloadAudio((currentHourRef.current + 1) % 24);

    return () => {
      if (playerAudioRef.current) {
        playerAudioRef.current.pause();
        playerAudioRef.current = null;
      }
    };
  }, [date, loadSong, preloadAudio, calculateOffset]);

  React.useEffect(() => {
    if (currentHourRef.current !== null && currentHourRef.current !== date.getHours()) {
      loadSong(date.getHours(), 0);
      currentHourRef.current = date.getHours();
      preloadAudio((date.getHours() + 1) % 24);
    }
  }, [date, loadSong, preloadAudio]);

  return { startPlayer, stopPlayer, isPlaying };
}

export default usePlayer;
