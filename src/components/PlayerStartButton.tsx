import usePlayer from '../hooks/usePlayer';

import { FaPause, FaPlay } from 'react-icons/fa6';

function PlayerStartButton() {
  const player = usePlayer();

  const handleClick = () => {
    if (player.isPlaying) {
      player.stopPlayer();
    } else {
      player.startPlayer();
    }
  };

  return (
    <button
      onClick={handleClick}
      className="bg-[#F7F8E6] text-[#8A7B66] hover:text-[#08B69F] transition hover:cursor-pointer p-4 rounded-3xl"
    >
      {player.isPlaying ? <FaPause size={32} /> : <FaPlay size={32} />}
    </button>
  );
}

export default PlayerStartButton;
