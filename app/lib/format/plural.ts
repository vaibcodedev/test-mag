import { LOCALE } from "./format-price";

export type PluralForms = { one: string; few: string; many: string; other?: string };

const rules = new Intl.PluralRules(LOCALE);

/** plural(3, { one: "відгук", few: "відгуки", many: "відгуків" }) → «відгуки». */
export function plural(count: number, forms: PluralForms): string {
  const rule = rules.select(count);
  if (rule === "one") return forms.one;
  if (rule === "few") return forms.few;
  if (rule === "many") return forms.many;
  return forms.other ?? forms.many;
}
