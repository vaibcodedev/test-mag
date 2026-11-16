import { LOCALE } from "./format-price";

/** «18 листопада». */
export function formatDayMonth(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long" }).format(date);
}

/** «18 листопада 2026 р.». */
export function formatDate(date: Date): string {
  return new Intl.DateTimeFormat(LOCALE, { day: "numeric", month: "long", year: "numeric" }).format(
    date,
  );
}

/**
 * Календарна дата з ISO-рядка. Береться день, записаний у самому рядку, а не день
 * у часовому поясі середовища: інакше сервер (UTC) і браузер (Київ) показали б різні
 * дати для запису, зробленого близько півночі, і гідрація не збіглася б.
 */
export function calendarDate(iso: string): { date: Date; dateTime: string } | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  if (!match) return null;
  const [dateTime, year, month, day] = match;
  return { date: new Date(Number(year), Number(month) - 1, Number(day)), dateTime };
}
