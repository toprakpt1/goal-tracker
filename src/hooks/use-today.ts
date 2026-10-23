import { addDays, startOfDay } from 'date-fns';
import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

/**
 * Returns "now", refreshed when the app comes back to the foreground and at
 * midnight while the app stays open. Without this, Today would keep showing
 * yesterday's progress after the clock rolls over.
 */
export function useToday(): Date {
  const [today, setToday] = useState(() => new Date());

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;

    const scheduleMidnight = () => {
      const nextMidnight = startOfDay(addDays(new Date(), 1)).getTime();
      const delay = Math.max(nextMidnight - Date.now(), 0) + 500;
      timer = setTimeout(() => {
        setToday(new Date());
        scheduleMidnight();
      }, delay);
    };

    scheduleMidnight();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        setToday(new Date());
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, []);

  return today;
}
