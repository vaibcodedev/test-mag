import { LOCALE } from "~/lib/format";

type Name = string | null | undefined;

const clean = (value: Name) => value?.trim() ?? "";

/** Перша літера чи цифра рядка; розділові знаки на початку пропускаємо. */
function firstLetter(value: string): string {
  return Array.from(value).find((char) => /[\p{L}\p{N}]/u.test(char)) ?? "";
}

/** «Олена Коваль»; порожній рядок, якщо покупець не вказав імені. */
export function customerFullName(firstName: Name, lastName: Name): string {
  return [clean(firstName), clean(lastName)].filter(Boolean).join(" ");
}

/**
 * Ініціали для аватара: «ОК» для «Олена Коваль», одна літера, якщо є лише ім'я чи прізвище,
 * а без імені — перша літера пошти. Порожній рядок означає «показати іконку».
 */
export function customerInitials(firstName: Name, lastName: Name, email?: Name): string {
  const fromName = firstLetter(clean(firstName)) + firstLetter(clean(lastName));
  return (fromName || firstLetter(clean(email))).toLocaleUpperCase(LOCALE);
}

/** Привітання на ім'я; багато покупців мають лише пошту, тож без імені воно нейтральне. */
export function customerGreeting(firstName: Name): string {
  const name = clean(firstName);
  return name ? `Вітаємо, ${name}!` : "Вітаємо в кабінеті!";
}
