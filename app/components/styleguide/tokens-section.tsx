import { cn } from "~/lib/utils";

import { Specimen, StyleguideSection } from "./styleguide-section";
import { TokenValue } from "./token-value";

type ColorToken = {
  name: `--${string}`;
  role: string;
  /** Клас заливки зразка. */
  swatch: string;
  bordered?: boolean;
};

const COLOR_GROUPS: { title: string; note: string; tokens: ColorToken[] }[] = [
  {
    title: "60% — світла основа",
    note: "Тло, картки, межі. Колір на сторінці дають фото техніки.",
    tokens: [
      { name: "--page", role: "Тло сторінки, чипи, пігулки", swatch: "bg-page", bordered: true },
      { name: "--surface", role: "Картки, плитки, секції", swatch: "bg-surface", bordered: true },
      { name: "--photo", role: "Тло під фото товарів", swatch: "bg-photo", bordered: true },
      { name: "--line", role: "Межі, розділювачі, поля", swatch: "bg-line" },
    ],
  },
  {
    title: "30% — ink",
    note: "Текст і темні секції.",
    tokens: [
      { name: "--ink", role: "Текст, темні секції", swatch: "bg-ink" },
      { name: "--ink-2", role: "Вторинний текст", swatch: "bg-ink-2" },
      { name: "--muted-ink", role: "Підписи", swatch: "bg-muted-foreground" },
    ],
  },
  {
    title: "10% — акценти",
    note: "Blue — усі дії. Lime — тільки на ink. Sale — тільки знижки.",
    tokens: [
      { name: "--blue", role: "Кнопки, кошик, вкладки, посилання, «Новинка»", swatch: "bg-blue" },
      { name: "--lime", role: "Тільки на ink: CTA й цифри", swatch: "bg-lime" },
      { name: "--sale", role: "Тільки знижки: −%, нова ціна, «Економія»", swatch: "bg-sale" },
    ],
  },
  {
    title: "Стани",
    note: "Службові кольори з однією роллю кожен.",
    tokens: [
      { name: "--success", role: "Наявність", swatch: "bg-success" },
      { name: "--star", role: "Рейтинг", swatch: "bg-star" },
      { name: "--danger", role: "Помилки форм", swatch: "bg-danger" },
    ],
  },
];

const TYPE_SCALE: { utility: string; sample: string; spec: string }[] = [
  { utility: "text-display", sample: "iPhone 17 Pro", spec: "Unbounded 600 · 76 / 38 · −0.035em" },
  {
    utility: "text-h2",
    sample: "Каталог техніки Apple",
    spec: "Unbounded 600 · 40 / 28 · −0.02em",
  },
  { utility: "text-h2-panel", sample: "Знижки тижня", spec: "Unbounded 600 · 32 · −0.02em" },
  { utility: "text-h3", sample: "Доставимо завтра", spec: "Unbounded 600 · 26 · −0.02em" },
  { utility: "text-price", sample: "119 999 ₴", spec: "Onest 800 · 22" },
  {
    utility: "text-body",
    sample: "Невеликий магазин, де вас пам'ятають.",
    spec: "Onest 500 · 16",
  },
  {
    utility: "text-card-title",
    sample: "iPhone 17 Pro 256 ГБ, синій титан",
    spec: "Onest 600 · 15",
  },
  { utility: "text-small", sample: "Гарантія 12 місяців", spec: "Onest 500 · 14" },
  { utility: "text-caption", sample: "4 800 ₴ × 25 міс.", spec: "Onest 500 · 12" },
];

const RADII: { name: string; value: string; use: string; className: string }[] = [
  { name: "sm", value: "8", use: "Бейджі, чипи", className: "rounded-sm" },
  { name: "md", value: "14", use: "Кнопки, поля", className: "rounded-md" },
  { name: "lg", value: "20", use: "Картки, плитки", className: "rounded-lg" },
  { name: "xl", value: "24", use: "Банери, секції", className: "rounded-xl" },
  { name: "pill", value: "∞", use: "Пігулки, круглі кнопки", className: "rounded-pill" },
];

const SPACING: { value: string; className: string }[] = [
  { value: "4", className: "w-1" },
  { value: "8", className: "w-2" },
  { value: "12", className: "w-3" },
  { value: "16", className: "w-4" },
  { value: "24", className: "w-6" },
  { value: "32", className: "w-8" },
  { value: "48", className: "w-12" },
  { value: "80", className: "w-20" },
];

export function TokensSection() {
  return (
    <>
      <StyleguideSection
        id="colors"
        title="Кольори"
        description="Правило 60 / 30 / 10. Значення беруться з tokens.css; у компонентах дозволені тільки ці токени."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          {COLOR_GROUPS.map((group) => (
            <Specimen key={group.title} label={group.title}>
              <p className="text-small text-ink-2">{group.note}</p>
              <ul className="flex flex-col gap-3">
                {group.tokens.map((token) => (
                  <li key={token.name} className="flex items-center gap-4">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-13 shrink-0 rounded-md",
                        token.swatch,
                        token.bordered && "border border-line",
                      )}
                    />
                    <span className="flex min-w-0 flex-col">
                      <span className="text-small font-semibold text-ink">
                        {token.name} <span className="text-muted-foreground">·</span>{" "}
                        <TokenValue name={token.name} />
                      </span>
                      <span className="text-small text-ink-2">{token.role}</span>
                    </span>
                  </li>
                ))}
              </ul>
            </Specimen>
          ))}
        </div>
        <Specimen label="Lime живе тільки на ink" tone="ink">
          <p className="max-w-2xl text-body text-on-ink-muted">
            На білому, сірому чи синьому lime заборонений, як і білий текст на lime. На темному він
            позначає головну дію та цифри:{" "}
            <span className="font-semibold text-lime">до 24 500 ₴ за ваш старий iPhone</span>.
          </p>
        </Specimen>
      </StyleguideSection>

      <StyleguideSection
        id="type"
        title="Шрифти та шкала"
        description="Unbounded 600 — заголовки, великі цифри, логотип. Onest 500 / 600 / 800 — увесь інший текст, ціни в картках, кнопки. Unbounded широкий, тому в картках назви моделей набрані Onest."
      >
        <Specimen label="Шкала">
          <ul className="flex flex-col divide-y divide-line">
            {TYPE_SCALE.map((row) => (
              <li
                key={row.utility}
                className="flex flex-col gap-1 py-4 first:pt-0 last:pb-0 md:flex-row md:items-baseline md:justify-between md:gap-6"
              >
                <span className={cn(row.utility, "min-w-0 text-ink")}>{row.sample}</span>
                <span className="shrink-0 text-caption text-muted-foreground md:text-end">
                  <span className="font-semibold text-ink-2">{row.utility}</span>
                  <br />
                  {row.spec}
                </span>
              </li>
            ))}
          </ul>
        </Specimen>
      </StyleguideSection>

      <StyleguideSection
        id="sizes"
        title="Розміри"
        description="Радіуси, відступи й фокус. Тіні для декору не використовуються: лише фокус і hover-підйом карток."
      >
        <div className="grid gap-4 lg:grid-cols-2">
          <Specimen label="Радіуси">
            <ul className="grid grid-cols-2 gap-4 sm:grid-cols-5 lg:grid-cols-3 xl:grid-cols-5">
              {RADII.map((radius) => (
                <li key={radius.name} className="flex flex-col gap-2">
                  <span
                    aria-hidden="true"
                    className={cn("h-20 border border-line bg-page", radius.className)}
                  />
                  <span className="text-small font-semibold text-ink">
                    {radius.name} · {radius.value}
                  </span>
                  <span className="text-caption text-muted-foreground">{radius.use}</span>
                </li>
              ))}
            </ul>
          </Specimen>
          <Specimen label="Відступи: 4 8 12 16 24 32 48 80">
            <ul className="flex flex-col gap-2">
              {SPACING.map((step) => (
                <li key={step.value} className="flex items-center gap-4">
                  <span className="w-6 text-caption text-muted-foreground tabular-nums">
                    {step.value}
                  </span>
                  <span
                    aria-hidden="true"
                    className={cn("h-3 rounded-pill bg-blue", step.className)}
                  />
                </li>
              ))}
            </ul>
            <p className="text-small text-ink-2">
              80 — між секціями. Контейнер 1440, поля 24. Цілі натискання від 44.
            </p>
          </Specimen>
          <Specimen label="Фокус">
            <p className="text-small text-ink-2">
              Натисніть Tab, щоб побачити кільце: 3px blue; на ink — lime.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <span className="rounded-md bg-page px-4 py-3 text-small shadow-focus">
                На світлому
              </span>
              <span className="rounded-md bg-blue px-4 py-3 text-small text-surface shadow-focus-offset">
                На blue
              </span>
            </div>
          </Specimen>
          <Specimen label="Рух">
            <p className="text-small text-ink-2">
              Наведіть на плитку: підйом на 4px і м&apos;яка тінь за 250 мс. За
              prefers-reduced-motion увесь рух вимикається.
            </p>
            <div className="lift rounded-lg border border-line bg-surface p-6 text-small font-semibold">
              Плитка з hover-підйомом
            </div>
          </Specimen>
        </div>
      </StyleguideSection>
    </>
  );
}
