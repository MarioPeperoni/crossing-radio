import { format } from 'date-fns';
import useGlobalTime from './useGlobalTime';

function useMediaSession() {
  const date = useGlobalTime();

  const createMediaSession = (onPlay: () => void, onPause: () => void) => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => {
        onPlay();
      });

      navigator.mediaSession.setActionHandler('pause', () => {
        onPause();
      });

      navigator.mediaSession.playbackState = 'playing';
    }
  };

  const refreshSongTitle = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: `${format(date, 'h')}:00 ${format(date, 'aa')}`,
        artist: 'Animal Crossing New Leaf',
        album: 'Crossing Radio',
      });
    }
  };

  const pause = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'paused';
    }
  };
  const play = () => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = 'playing';
    }
  };

  return { createMediaSession, refreshSongTitle, pause, play };
}

export default useMediaSession;
