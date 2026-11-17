import { useLayoutEffect, useRef, type CSSProperties } from "react";

/**
 * Переходи між сторінками за посібником React Router «View Transitions»:
 * посилання з `viewTransition` загортають навігацію в `document.startViewTransition()`,
 * а `NavLink` на час переходу до своєї адреси (чи з неї) отримує клас `transitioning`.
 * Решту робить CSS у app/styles/app.css.
 *
 * «Картка розкривається в сторінку»: у картки й у місця призначення однакова
 * `view-transition-name`, тож браузер сам перетягує одне в інше. Назва береться зі змінної
 * `--vt-name` і вмикається лише в картки-джерела (`data-vt-source`) на час переходу:
 * назви на сторінці мають бути унікальні, а той самий товар може стояти в кількох секціях.
 */

export type TransitionKind = "product" | "collection" | "article";

/** Назва переходу для сутності: «product-iphone-17-pro». Лише символи, дозволені в CSS-ідентифікаторі. */
export function viewTransitionName(kind: TransitionKind, handle: string): string {
  return `${kind}-${handle.replace(/[^a-zA-Z0-9_-]/g, "_")}`;
}

/** Стиль зі змінною `--vt-name`: і для картки, і для місця призначення на сторінці. */
export function viewTransitionStyle(kind: TransitionKind, handle: string): CSSProperties {
  return { "--vt-name": viewTransitionName(kind, handle) } as CSSProperties;
}

const SOURCE_ATTRIBUTE = "data-vt-source";

/** Адреса, на яку перейшли з картки востаннє: за нею картку знаходимо після «Назад». */
let lastSourceHref: string | null = null;

/**
 * Позначає картку джерелом переходу.
 *  - Клік по картці ставить на неї `data-vt-source` і знімає з решти.
 *  - Після «Назад» розмітка списку нова: першу картку з тією ж адресою позначаємо знову,
 *    щоб сторінка «згорнулася» назад у картку. useLayoutEffect спрацьовує всередині
 *    оновлення, яке роутер загортає у view transition, тож браузер устигає це побачити.
 */
export function useTransitionSource<T extends HTMLElement>(href: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    const element = ref.current;
    if (!element || lastSourceHref !== href) return;
    if (!document.querySelector(`[${SOURCE_ATTRIBUTE}]`))
      element.setAttribute(SOURCE_ATTRIBUTE, "");
  }, [href]);

  const markSource = () => {
    lastSourceHref = href;
    for (const marked of document.querySelectorAll(`[${SOURCE_ATTRIBUTE}]`)) {
      marked.removeAttribute(SOURCE_ATTRIBUTE);
    }
    ref.current?.setAttribute(SOURCE_ATTRIBUTE, "");
  };

  return { ref, onClickCapture: markSource };
}
