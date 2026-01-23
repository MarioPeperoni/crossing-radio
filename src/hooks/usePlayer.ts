import React from 'react';

import useClock from './useClock';
import getAssetPath from '../utils/getAssetPath';

import type { PreloadedBuffer } from '../types/audio';

function usePlayer() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const { date } = useClock();
  const currentHourRef = React.useRef<number | null>(null);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);
  const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);

  const preloadedBufferRef = React.useRef<Map<number, PreloadedBuffer>>(new Map());

  const calculateOffset = React.useCallback(() => {
    // Calculate seconds from the start of the current hour
    return date.getMinutes() * 60 + date.getSeconds();
  }, [date]);

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.25;
      gainNodeRef.current.connect(audioContextRef.current.destination);
    }
  };

  const fetchAudioBuffer = React.useCallback(async (url: string) => {
    try {
      const assetPath = getAssetPath(url);
      const res = await fetch(assetPath);
      if (!res.ok) return null;

      const arrayBuffer = await res.arrayBuffer();
      const audioContext = audioContextRef.current;

      if (!audioContext) {
        throw new Error('AudioContext not initialized');
      }

      return await audioContext.decodeAudioData(arrayBuffer);
    } catch {
      return null;
    }
  }, []);

  const preloadAudio = React.useCallback(
    async (hour: number) => {
      // Check if already preloaded
      if (preloadedBufferRef.current.has(hour)) return;

      const [startBuffer, loopBuffer] = await Promise.all([
        fetchAudioBuffer(`songs/nl/${hour}_start.mp3`),
        fetchAudioBuffer(`songs/nl/${hour}_loop.mp3`),
      ]);

      if (!loopBuffer) {
        throw new Error(`Failed to load loop audio for hour ${hour}`);
      }

      preloadedBufferRef.current.set(hour, {
        start: startBuffer,
        loop: loopBuffer,
      });
    },
    [fetchAudioBuffer],
  );

  const playBuffer = React.useCallback(
    (buffer: AudioBuffer, offset: number, onEnd?: () => void) => {
      const audioContext = audioContextRef.current;
      const gainNode = gainNodeRef.current;

      if (!audioContext || !gainNode) {
        throw new Error('AudioContext or GainNode not initialized');
      }

      const source = audioContext.createBufferSource();
      source.buffer = buffer;
      source.loop = !onEnd;
      source.connect(gainNode);

      if (onEnd) {
        source.onended = onEnd;
      }

      source.start(0, offset % buffer.duration);
      sourceNodeRef.current = source;
      setIsPlaying(true);
    },
    [],
  );

  const stopCurrentSource = React.useCallback(() => {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current = null;
      setIsPlaying(false);
    }
  }, []);

  const playHourAudio = React.useCallback(
    (hour: number) => {
      stopCurrentSource();
      const offset = calculateOffset();
      const buffers = preloadedBufferRef.current.get(hour);

      if (!buffers) {
        throw new Error(`Audio buffers for hour ${hour} not loaded`);
      }

      if (buffers.start) {
        const startDuration = buffers.start.duration;
        if (offset >= startDuration) {
          playBuffer(buffers.loop, offset - startDuration);
        } else {
          playBuffer(buffers.start, offset, () => playBuffer(buffers.loop, 0));
        }
      } else {
        playBuffer(buffers.loop, offset);
      }
    },
    [playBuffer, stopCurrentSource, calculateOffset],
  );

  const startPlayer = React.useCallback(() => {
    currentHourRef.current = date.getHours();

    playHourAudio(currentHourRef.current);
    preloadAudio((currentHourRef.current + 1) % 24);
  }, [date, preloadAudio, playHourAudio]);

  React.useEffect(() => {
    if (currentHourRef.current !== null && currentHourRef.current !== date.getHours()) {
      playHourAudio(date.getHours());
      currentHourRef.current = date.getHours();
      preloadAudio((date.getHours() + 1) % 24);
    }
  }, [date, playHourAudio, preloadAudio]);

  // Preload current hour audio only once on mount
  React.useEffect(() => {
    initAudioContext();
    preloadAudio(date.getHours());
  }, []);

  return { startPlayer, stopPlayer: stopCurrentSource, isPlaying };
}

export default usePlayer;
