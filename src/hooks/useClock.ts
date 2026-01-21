import React from 'react';

const DEBUG_TIME_OVERRIDE: string | null = null;

function parseDebugTimeOverride(): Date {
  if (DEBUG_TIME_OVERRIDE == null) {
    return new Date();
  }
  const [hours, minutes, seconds] = DEBUG_TIME_OVERRIDE.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, seconds, 0);
  return now;
}

function useClock() {
  const [date, setDate] = React.useState(
    DEBUG_TIME_OVERRIDE != null ? parseDebugTimeOverride() : new Date(),
  );
  const [tick, setTick] = React.useState(true);

  React.useEffect(() => {
    const interval = setInterval(() => {
      if (DEBUG_TIME_OVERRIDE) {
        setDate((prev) => new Date(prev.getTime() + 1000));
      } else {
        setDate(new Date());
      }
      setTick((prev) => !prev);
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return { date, tick };
}

export default useClock;
