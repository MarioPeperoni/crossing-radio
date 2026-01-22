import React from 'react';

import useClock from './useClock';

function usePlayer() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { date } = useClock();
  const currentHourRef = React.useRef<number | null>(null);
  const playerAudioRef = React.useRef<HTMLAudioElement | null>(null);

  const preloadedAudioRef = React.useRef(new Map());

  const calculateOffset = React.useCallback(() => {
    // Calculate seconds from the start of the current hour
    return date.getMinutes() * 60 + date.getSeconds();
  }, [date]);

  const checkAudioExists = async (url: string) => {
    const res = await fetch(url, { method: 'HEAD' });
    const contentType = res.headers.get('content-type');
    return contentType && contentType.startsWith('audio/');
  };

  const preloadAudio = React.useCallback(async (hour: number) => {
    // Check if already preloaded
    if (preloadedAudioRef.current.has(hour)) return;

    const startUrl = `/songs/nl/${hour}_start.mp3`;
    const loopUrl = `/songs/nl/${hour}_loop.mp3`;

    // Check for start audio variant
    const startExists = await checkAudioExists(startUrl);

    const startAudio = startExists ? new Audio(startUrl) : null;
    const loopAudio = new Audio(loopUrl);

    if (startAudio) startAudio.preload = 'auto';
    loopAudio.preload = 'auto';

    preloadedAudioRef.current.set(hour, {
      start: startAudio,
      loop: loopAudio,
    });
  }, []);

  const playLoop = React.useCallback((loopAudio: HTMLAudioElement, offset: number = 0) => {
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
        playerAudioRef.current = null;
      }

      const audioFiles = preloadedAudioRef.current.get(hour);

      if (!audioFiles) {
        throw new Error(`Audio files for hour ${hour} not loaded`);
      }

      if (audioFiles.start === null) {
        playLoop(audioFiles.loop, offset);
      } else {
        const startDuration = audioFiles.start.duration;

        // Check if offset is not past start audio
        if (offset >= startDuration) {
          playLoop(audioFiles.loop, offset - startDuration);
        } else {
          // Play start audio befor loop
          playerAudioRef.current = audioFiles.start;
          audioFiles.start.volume = 0.5;
          audioFiles.start.currentTime = offset;

          audioFiles.start.addEventListener('ended', () => {
            playLoop(audioFiles.loop, 0);
          });

          audioFiles.start.play().then(() => setIsPlaying(true));
        }
      }
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

  // Preload current hour audio only once on mount
  React.useEffect(() => {
    preloadAudio(date.getHours());
  }, []);

  return { startPlayer, stopPlayer, isPlaying };
}

export default usePlayer;
