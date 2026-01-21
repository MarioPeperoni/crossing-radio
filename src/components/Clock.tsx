import useClock from '../hooks/useClock';

import { format } from 'date-fns';
import { twMerge } from 'tailwind-merge';

function Clock() {
  const { date, tick } = useClock();

  return (
    <div className="flex flex-col items-center space-y-2">
      <div className="flex space-x-3 items-end">
        <div className="relative font-bold text-5xl">
          <span>{format(date, 'h')}</span>
          <span className={twMerge(tick && 'opacity-0')}>{':'}</span>
          <span>{format(date, 'mm')}</span>
        </div>
        <span className="text-3xl font-bold">{format(date, 'aa')}</span>
      </div>
      <hr className="h-1 bg-amber-50 w-full rounded-2xl" />
      <div className="flex justify-around w-full gap-4">
        <span className="text-2xl font-bold tracking-[0.010em]">{format(date, 'MMMM d')}</span>
        <div className="relative bg-amber-50 rounded-[18px] px-3 items-center flex">
          <span className="text-xl font-bold mix-blend-difference">{format(date, 'E')}.</span>
        </div>
      </div>
    </div>
  );
}

export default Clock;
