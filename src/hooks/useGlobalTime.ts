import { useState, useEffect } from 'react';

const DEBUG_TIME_OVERRIDE: string | null = '23:30:00';

function parseDebugTimeOverride(): Date {
  const [hours, minutes, seconds] = DEBUG_TIME_OVERRIDE!.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, seconds, 0);
  return now;
}

function useGlobalTime() {
  const [date, setDate] = useState(() =>
    DEBUG_TIME_OVERRIDE ? parseDebugTimeOverride() : new Date(),
  );

  useEffect(() => {
    const interval = setInterval(() => {
      setDate((prev) => (DEBUG_TIME_OVERRIDE ? new Date(prev.getTime() + 1000) : new Date()));
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return date;
}

export default useGlobalTime;
