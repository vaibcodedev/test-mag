import { useCallback, useSyncExternalStore } from "react";

const SECOND = 1000;
const SECONDS_IN_MINUTE = 60;
const SECONDS_IN_HOUR = 3600;
const SECONDS_IN_DAY = 86400;

export type CountdownInstant = string | number | Date;

export type CountdownTime = {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  /** Скільки секунд лишилося загалом. */
  totalSeconds: number;
  finished: boolean;
};

function toTimestamp(value: CountdownInstant): number {
  if (value instanceof Date) return value.getTime();
  return typeof value === "number" ? value : Date.parse(value);
}

/** Цілі секунди до моменту `endsAt`; для минулої або некоректної дати — 0. */
export function secondsLeft(endsAt: CountdownInstant, now: CountdownInstant): number {
  const end = toTimestamp(endsAt);
  const current = toTimestamp(now);
  if (!Number.isFinite(end) || !Number.isFinite(current)) return 0;
  return Math.max(0, Math.ceil((end - current) / SECOND));
}

export function splitSeconds(totalSeconds: number): CountdownTime {
  return {
    days: Math.floor(totalSeconds / SECONDS_IN_DAY),
    hours: Math.floor((totalSeconds % SECONDS_IN_DAY) / SECONDS_IN_HOUR),
    minutes: Math.floor((totalSeconds % SECONDS_IN_HOUR) / SECONDS_IN_MINUTE),
    seconds: totalSeconds % SECONDS_IN_MINUTE,
    totalSeconds,
    finished: totalSeconds === 0,
  };
}

/**
 * Зворотний відлік до `endsAt`, що оновлюється щосекунди й зупиняється на нулі.
 *
 * На сервері й під час гідрації годинник браузера не читається: хук повертає значення,
 * пораховане від `serverNow` (час із loader), або `null`, якщо його не передали.
 * Тому розмітка сервера й клієнта збігається, а відлік стартує одразу після гідрації.
 */
export function useCountdown(
  endsAt: CountdownInstant,
  serverNow?: CountdownInstant | null,
): CountdownTime | null {
  const end = toTimestamp(endsAt);
  const serverTime = serverNow == null ? null : toTimestamp(serverNow);

  const subscribe = useCallback(
    (onChange: () => void) => {
      if (secondsLeft(end, Date.now()) === 0) return () => {};

      const timer = setInterval(() => {
        onChange();
        if (secondsLeft(end, Date.now()) === 0) clearInterval(timer);
      }, SECOND);

      return () => clearInterval(timer);
    },
    [end],
  );

  const total = useSyncExternalStore(
    subscribe,
    () => secondsLeft(end, Date.now()),
    () => (serverTime === null ? null : secondsLeft(end, serverTime)),
  );

  return total === null ? null : splitSeconds(total);
}
