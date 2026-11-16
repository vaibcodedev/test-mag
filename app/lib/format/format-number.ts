import { LOCALE } from "./format-price";

/** «4,9»: десятковий роздільник — кома. */
export function formatDecimal(value: number, fractionDigits = 1): string {
  return new Intl.NumberFormat(LOCALE, {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits,
  }).format(value);
}

export function formatInteger(value: number): string {
  return new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 }).format(value);
}
