import { Slot } from "radix-ui";
import {
  useLayoutEffect,
  useRef,
  useSyncExternalStore,
  type ComponentProps,
  type CSSProperties,
} from "react";

/**
 * Переходи між сторінками за посібником React Router «View Transitions»:
 * посилання з `viewTransition` загортають навігацію в `document.startViewTransition()`,
 * а `NavLink` на час переходу до своєї адреси (чи з неї) отримує клас `transitioning`.
 * Решту робить CSS у app/styles/app.css.
 *
 * «Картка розкривається в сторінку»: у картки й у місця призначення однакова
 * `view-transition-name`, тож браузер сам перетягує одне в інше. Назва береться зі змінної
 * `--vt-name` і вмикається лише в парі «картка-джерело ↔ її сторінка»:
 *  - у картки — поки вона позначена `data-vt-source`, а її NavLink має клас `transitioning`;
 *  - на сторінці — поки `<main>` має `data-vt-active`, тобто перехід почався з картки саме
 *    цієї сутності. Якщо зі сторінки йдуть звичайним посиланням, її фото лишається частиною
 *    сторінки й проявляється разом з нею, а не окремим шаром.
 * Назви на сторінці мають бути унікальні, а той самий товар може стояти в кількох секціях.
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

/** Адреса сторінки → тип і handle сутності: «/products/iphone-17» → product, iphone-17. */
export function transitionTargetOf(href: string): { kind: TransitionKind; handle: string } | null {
  const [pathname = ""] = href.split(/[?#]/);
  const product = /^\/products\/([^/]+)$/.exec(pathname);
  if (product?.[1]) return { kind: "product", handle: decodeURIComponent(product[1]) };
  const collection = /^\/collections\/([^/]+)$/.exec(pathname);
  if (collection?.[1]) return { kind: "collection", handle: decodeURIComponent(collection[1]) };
  const article = /^\/blogs\/[^/]+\/([^/]+)$/.exec(pathname);
  if (article?.[1]) return { kind: "article", handle: decodeURIComponent(article[1]) };
  return null;
}

/* ── Стан «розкриття»: з якої картки почався перехід ──────────────────── */

const SOURCE_ATTRIBUTE = "data-vt-source";
const HREF_ATTRIBUTE = "data-vt-href";

/** Остання картка, з якої перейшли: адреса, назва переходу й номер серед карток цієї адреси. */
let lastSource: { href: string; name: string | null; index: number } | null = null;
/** Назва переходу, що триває (або null, якщо перехід звичайний). */
let activeName: string | null = null;
const listeners = new Set<() => void>();
let listening = false;

function setActiveName(next: string | null) {
  if (next === activeName) return;
  activeName = next;
  for (const listener of listeners) listener();
}

function nameOfHref(href: string): string | null {
  const target = transitionTargetOf(href);
  return target ? viewTransitionName(target.kind, target.handle) : null;
}

/**
 * Слухачі на документі, одні на всю сторінку:
 *  - клік поза карткою-джерелом скидає «розкриття»: це звичайний перехід. Клік по картці
 *    тут не чіпаємо — його обробляє сама картка. Порядок обробників не важливий: корінь
 *    React теж висить на document, і хто з них спрацює першим, залежить від часу реєстрації;
 *  - «Назад» і «Вперед» повертають останню пару, щоб сторінка згорнулася назад у картку.
 */
function listen() {
  if (listening || typeof window === "undefined") return;
  listening = true;
  document.addEventListener(
    "click",
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target?.closest(`[${HREF_ATTRIBUTE}]`)) setActiveName(null);
    },
    true,
  );
  window.addEventListener("popstate", () => setActiveName(lastSource?.name ?? null));
}

function subscribe(listener: () => void) {
  listen();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function sourcesOf(href: string): Element[] {
  return [...document.querySelectorAll(`[${HREF_ATTRIBUTE}]`)].filter(
    (element) => element.getAttribute(HREF_ATTRIBUTE) === href,
  );
}

/**
 * Позначає картку джерелом переходу.
 *  - Клік по картці ставить на неї `data-vt-source` і знімає з решти.
 *  - Після «Назад» розмітка списку нова: позначку отримує картка на тому самому місці серед
 *    карток цієї адреси (той самий товар у «Знижках» і в «Популярному» — дві різні картки).
 *    useLayoutEffect спрацьовує всередині оновлення, яке роутер загортає у view transition,
 *    тож браузер устигає це побачити.
 */
export function useTransitionSource<T extends HTMLElement>(href: string) {
  const ref = useRef<T>(null);

  useLayoutEffect(() => {
    listen();
    const element = ref.current;
    // Позначаємо лише тоді, коли триває саме «розкриття» цієї пари (після «Назад»):
    // на сторінку з карткою можна потрапити й звичайним посиланням.
    if (!element || lastSource?.href !== href || activeName !== lastSource.name) return;
    const siblings = sourcesOf(href);
    const wanted = siblings[lastSource.index] ?? siblings[0];
    if (wanted === element) element.setAttribute(SOURCE_ATTRIBUTE, "");
    else element.removeAttribute(SOURCE_ATTRIBUTE);
  }, [href]);

  const markSource = () => {
    const element = ref.current;
    if (!element) return;
    for (const marked of document.querySelectorAll(`[${SOURCE_ATTRIBUTE}]`)) {
      marked.removeAttribute(SOURCE_ATTRIBUTE);
    }
    element.setAttribute(SOURCE_ATTRIBUTE, "");
    const name = nameOfHref(href);
    lastSource = { href, name, index: Math.max(sourcesOf(href).indexOf(element), 0) };
    setActiveName(name);
  };

  return { ref, onClickCapture: markSource, [HREF_ATTRIBUTE]: href };
}

/**
 * Пропси для `<main>` сторінки товару, колекції чи статті: змінна `--vt-name` і позначка
 * `data-vt-active`, поки перехід іде з картки (або назад у картку) саме цієї сутності.
 * Елемент із `data-vt-detail` усередині бере участь у переході лише з цією позначкою.
 */
export function useTransitionDetail(kind: TransitionKind, handle: string) {
  const name = viewTransitionName(kind, handle);
  const active = useSyncExternalStore(
    subscribe,
    () => activeName === name,
    () => false,
  );

  return {
    style: viewTransitionStyle(kind, handle),
    "data-vt-active": active ? "" : undefined,
  };
}

export type TransitionSourceProps = ComponentProps<typeof Slot.Root> & {
  /** Куди веде плитка: за адресою визначається назва переходу. */
  href: string;
};

/**
 * Обгортка без власної розмітки для плитки, що «розкривається» в сторінку: додає дочірньому
 * елементу позначку джерела та змінну `--vt-name`. Усередині потрібні `NavLink` з `viewTransition`
 * і елемент з `data-vt-target`. Для адрес, що не ведуть на товар, колекцію чи статтю,
 * переходу з розкриттям немає.
 */
export function TransitionSource({ href, style, children, ...props }: TransitionSourceProps) {
  const transition = useTransitionSource<HTMLElement>(href);
  const target = transitionTargetOf(href);

  return (
    <Slot.Root
      {...props}
      {...transition}
      style={target ? { ...viewTransitionStyle(target.kind, target.handle), ...style } : style}
    >
      {children}
    </Slot.Root>
  );
}
