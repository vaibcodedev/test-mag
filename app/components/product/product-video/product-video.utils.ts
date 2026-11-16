export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function parts(seconds: number) {
  const total = Number.isFinite(seconds) && seconds > 0 ? Math.floor(seconds) : 0;
  return {
    hours: Math.floor(total / 3600),
    minutes: Math.floor((total % 3600) / 60),
    seconds: total % 60,
  };
}

const pad = (value: number) => String(value).padStart(2, "0");

/** Час на панелі плеєра: «1:05», для довгих відео — «1:02:03». */
export function formatTime(value: number): string {
  const { hours, minutes, seconds } = parts(value);
  return hours > 0 ? `${hours}:${pad(minutes)}:${pad(seconds)}` : `${minutes}:${pad(seconds)}`;
}

/** Час словами для читача екрана: «45 с», «1 хв 05 с», «1 год 02 хв 03 с». */
export function timeText(value: number): string {
  const { hours, minutes, seconds } = parts(value);
  if (hours > 0) return `${hours} год ${pad(minutes)} хв ${pad(seconds)} с`;
  return minutes > 0 ? `${minutes} хв ${pad(seconds)} с` : `${seconds} с`;
}

/** Положення повзунка перемотування: «1 хв 05 с із 2 хв 30 с». */
export function seekValueText(currentTime: number, duration: number): string {
  return `${timeText(currentTime)} із ${timeText(duration)}`;
}
