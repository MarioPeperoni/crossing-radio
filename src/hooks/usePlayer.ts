import React from 'react';

import useGlobalTime from './useGlobalTime';
import useMediaSession from './useMediaSession';

import getAssetPath from '../utils/getAssetPath';
import calculateOffset from '../utils/calcOffset';

import type { PreloadedBuffer } from '../types/audio';

function usePlayer() {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const date = useGlobalTime();
  const mediaSession = useMediaSession();
  const currentHourRef = React.useRef<number | null>(null);

  const audioContextRef = React.useRef<AudioContext | null>(null);
  const gainNodeRef = React.useRef<GainNode | null>(null);
  const sourceNodeRef = React.useRef<AudioBufferSourceNode | null>(null);

  const audioElementRef = React.useRef<HTMLAudioElement | null>(null);

  const preloadedBufferRef = React.useRef<Map<number, PreloadedBuffer>>(new Map());

  const initAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
      gainNodeRef.current = audioContextRef.current.createGain();
      gainNodeRef.current.gain.value = 0.25;

      const destinationNode = audioContextRef.current.createMediaStreamDestination();
      gainNodeRef.current.connect(audioContextRef.current.destination);

      // Create audio element for playback
      audioElementRef.current = new Audio();
      audioElementRef.current.srcObject = destinationNode.stream;
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

  async function preloadAudio(hour: number) {
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
  }

  function playBuffer(buffer: AudioBuffer, offset: number, onEnd?: () => void) {
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
  }

  function stopCurrentSource() {
    if (sourceNodeRef.current) {
      sourceNodeRef.current.stop();
      sourceNodeRef.current.disconnect();
      sourceNodeRef.current.onended = null;
      sourceNodeRef.current = null;
      setIsPlaying(false);
      audioElementRef.current?.pause();
    }
    mediaSession.pause();
  }

  function playHourAudio(hour: number) {
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

    mediaSession.createMediaSession(startPlayer, stopCurrentSource);
    mediaSession.refreshSongTitle();
  }

  function startPlayer() {
    audioElementRef.current?.play();
    currentHourRef.current = date.getHours();

    playHourAudio(currentHourRef.current);
    preloadAudio((currentHourRef.current + 1) % 24);
  }

  React.useEffect(() => {
    if (currentHourRef.current !== null && currentHourRef.current !== date.getHours()) {
      playHourAudio(date.getHours());
      currentHourRef.current = date.getHours();
      preloadAudio((date.getHours() + 1) % 24);
    }
  }, [date]);

  // Preload current hour audio only once on mount
  React.useEffect(() => {
    initAudioContext();
    preloadAudio(date.getHours());
  }, []);

  return { startPlayer, stopPlayer: stopCurrentSource, isPlaying };
}

export default usePlayer;
