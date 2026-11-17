/**
 * Телефон покупця. Customer Account API приймає номер лише у форматі E.164 (`+380671234567`),
 * а люди пишуть його по-різному: `067 123 45 67`, `(067) 123-45-67`, `380671234567`,
 * `8 067 123 45 67`. Тут ці записи зводяться до одного вигляду.
 */

export type PhoneResult =
  | { ok: true; value: string }
  /** `empty` — поле порожнє; `invalid` — це не схоже на номер телефону. */
  | { ok: false; reason: "empty" | "invalid" };

/** Український номер без коду країни: дев'ять цифр, код оператора не починається з нуля. */
const UA_NATIONAL = /^[1-9]\d{8}$/;
/** Номер іншої країни: приймаємо тільки з плюсом і кодом країни. */
const E164 = /^\+[1-9]\d{7,14}$/;
/** Усе, що люди ставлять між цифрами. */
const SEPARATORS = /[\s().\-–—]/g;

function uaNational(digits: string): string | null {
  // 380671234567 · 80671234567 · 0671234567 · 671234567
  for (const prefix of ["380", "80", "0", ""]) {
    if (!digits.startsWith(prefix)) continue;
    const national = digits.slice(prefix.length);
    if (UA_NATIONAL.test(national)) return national;
  }
  return null;
}

/** Зводить введений номер до E.164. Український номер можна писати без `+38`. */
export function normalizePhone(input: string | null | undefined): PhoneResult {
  const compact = (input ?? "").replace(SEPARATORS, "");
  if (!compact) return { ok: false, reason: "empty" };

  // «00» на початку — міжнародний префікс, те саме, що «+».
  const text = compact.startsWith("00") ? `+${compact.slice(2)}` : compact;
  const hasPlus = text.startsWith("+");
  const digits = hasPlus ? text.slice(1) : text;
  if (!/^\d+$/.test(digits)) return { ok: false, reason: "invalid" };

  if (hasPlus && !digits.startsWith("380")) {
    return E164.test(text) ? { ok: true, value: text } : { ok: false, reason: "invalid" };
  }

  const national = uaNational(digits);
  return national ? { ok: true, value: `+380${national}` } : { ok: false, reason: "invalid" };
}

/** `+380671234567` → `+380 67 123 45 67`. Номери інших країн лишаються як є. */
export function formatPhone(value: string | null | undefined): string {
  const phone = (value ?? "").trim();
  const match = phone.match(/^\+380(\d{2})(\d{3})(\d{2})(\d{2})$/);
  return match ? `+380 ${match[1]} ${match[2]} ${match[3]} ${match[4]}` : phone;
}
