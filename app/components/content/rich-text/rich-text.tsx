import type { ComponentProps } from "react";

import { cn } from "~/lib/utils";

/**
 * Типографіка для HTML із Shopify (сторінки, статті). Класів у цьому HTML немає,
 * тому все стилізується селекторами нащадків і лише токенами дизайн-системи.
 */
const RICH_TEXT = [
  "min-w-0 text-body wrap-break-word text-ink-2",
  // Вертикальний ритм: 16 між блоками, 40 перед заголовком розділу.
  "[&>*+*]:mt-4 [&>*:first-child]:mt-0",
  "[&_h2]:mt-10 [&_h2]:text-h2-panel [&_h2]:text-ink",
  "[&_h3]:mt-8 [&_h3]:text-h3 [&_h3]:text-ink",
  "[&_h4]:mt-6 [&_h4]:text-body [&_h4]:font-extrabold [&_h4]:text-ink",
  "[&_h5]:mt-6 [&_h5]:text-body [&_h5]:font-semibold [&_h5]:text-ink",
  "[&_h6]:mt-6 [&_h6]:text-small [&_h6]:font-semibold [&_h6]:text-ink",
  "[&_strong]:font-semibold [&_strong]:text-ink [&_b]:font-semibold [&_b]:text-ink",
  // Посилання — дія, тому blue; підкреслення відрізняє їх від тексту не лише кольором.
  "[&_a]:rounded-sm [&_a]:text-blue [&_a]:underline [&_a]:underline-offset-4 [&_a]:focus-ring [&_a]:hover:text-blue-hover",
  "[&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6",
  "[&_li]:pl-1 [&_li]:marker:text-muted-foreground [&_li+li]:mt-2 [&_li>ul]:mt-2 [&_li>ol]:mt-2",
  "[&_blockquote]:border-l-4 [&_blockquote]:border-blue [&_blockquote]:pl-4 [&_blockquote]:text-ink",
  "[&_hr]:my-8 [&_hr]:border-line",
  "[&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg",
  "[&_figure]:my-8 [&_figcaption]:mt-2 [&_figcaption]:text-small [&_figcaption]:text-muted-foreground",
  "[&_iframe]:aspect-video [&_iframe]:h-auto [&_iframe]:w-full [&_iframe]:max-w-full [&_iframe]:rounded-lg [&_video]:h-auto [&_video]:max-w-full [&_video]:rounded-lg",
  // Широка таблиця прокручується сама й не розсуває сторінку на телефоні.
  "[&_table]:block [&_table]:max-w-full [&_table]:border-collapse [&_table]:overflow-x-auto [&_table]:text-small",
  "[&_th]:border-b [&_th]:border-line [&_th]:px-3 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-ink",
  "[&_td]:border-b [&_td]:border-line [&_td]:px-3 [&_td]:py-2 [&_td]:align-top",
  "[&_code]:rounded-sm [&_code]:bg-page [&_code]:px-1 [&_pre]:overflow-x-auto [&_pre]:rounded-md [&_pre]:bg-page [&_pre]:p-4",
].join(" ");

/**
 * На сторінці один h1 — її заголовок. Якщо в тексті з адмінки трапився ще один,
 * він стає h2: вигляд і структура лишаються правильними.
 */
export function demoteHeadings(html: string): string {
  return html.replace(/<(\/?)h1(?=[\s>])/gi, "<$1h2");
}

export type RichTextProps = Omit<ComponentProps<"div">, "dangerouslySetInnerHTML"> & {
  /**
   * HTML із Shopify. Вставляється як є, так само як у шаблоні Hydrogen: це вміст,
   * який редагує власник магазину в адмінці, а не дані від відвідувачів. Вбудовані
   * скрипти в ньому не виконуються: їх блокує Content-Security-Policy з nonce,
   * а під час навігації на клієнті — сам спосіб вставки (innerHTML).
   * Без `html` компонент стилізує `children`.
   */
  html?: string;
};

/** Текстовий блок сторінки чи статті: заголовки, абзаци, списки, посилання, таблиці, фото, цитати. */
export function RichText({ html, className, children, ...props }: RichTextProps) {
  const classes = cn(RICH_TEXT, className);

  if (html !== undefined) {
    return (
      <div
        data-slot="rich-text"
        className={classes}
        dangerouslySetInnerHTML={{ __html: demoteHeadings(html) }}
        {...props}
      />
    );
  }

  return (
    <div data-slot="rich-text" className={classes} {...props}>
      {children}
    </div>
  );
}
