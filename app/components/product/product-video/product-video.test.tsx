import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductVideo } from "./product-video";
import { formatTime, seekValueText, timeText } from "./product-video.utils";
import { CONTROLS_HIDE_DELAY_MS } from "./use-video-player";

/**
 * jsdom не відтворює медіа, тому HTMLMediaElement тут підмінено простою моделлю:
 * властивості зберігаються в об'єкті, а play і pause змінюють їх і шлють ті самі події, що й браузер.
 */
const media = {
  paused: true,
  ended: false,
  currentTime: 0,
  duration: 150,
  volume: 1,
  muted: false,
  networkState: 1,
};
type MediaKey = keyof typeof media;
const INITIAL = { ...media };
const KEYS = Object.keys(media) as MediaKey[];
const originals = new Map<MediaKey, PropertyDescriptor | undefined>();

let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;
let load: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  Object.assign(media, INITIAL);
  for (const key of KEYS) {
    originals.set(key, Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype, key));
    Object.defineProperty(HTMLMediaElement.prototype, key, {
      configurable: true,
      get: () => media[key],
      set: (value: never) => {
        media[key] = value;
      },
    });
  }

  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    media.paused = false;
    fireEvent.play(this);
    fireEvent.playing(this);
    return Promise.resolve();
  });
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(function (
    this: HTMLMediaElement,
  ) {
    media.paused = true;
    fireEvent.pause(this);
  });
  load = vi.spyOn(HTMLMediaElement.prototype, "load").mockImplementation(() => {});

  // Radix Slider міряє повзунок через ResizeObserver, якого в jsdom немає.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
});

afterEach(() => {
  for (const key of KEYS) {
    const original = originals.get(key);
    if (original) Object.defineProperty(HTMLMediaElement.prototype, key, original);
    else Reflect.deleteProperty(HTMLMediaElement.prototype, key);
  }
  vi.useRealTimers();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const POSTER = {
  url: "https://cdn.shopify.com/poster.jpg",
  altText: null,
  width: 1920,
  height: 1080,
};
const SOURCES = [
  { url: "https://cdn.shopify.com/videos/1.m3u8", mimeType: "application/x-mpegURL" },
  { url: "https://cdn.shopify.com/videos/1.mp4", mimeType: "video/mp4" },
];

function renderVideo(onKeyDown?: () => void) {
  return render(
    // eslint-disable-next-line jsx-a11y/no-static-element-interactions -- імітує карусель довкола плеєра
    <div onKeyDown={onKeyDown}>
      <ProductVideo sources={SOURCES} poster={POSTER} label="Огляд камери" />
    </div>,
  );
}

async function start() {
  const user = userEvent.setup();
  const view = renderVideo();
  await user.click(screen.getByRole("button", { name: "Відтворити відео" }));
  return { user, ...view };
}

const video = () => {
  const element = document.querySelector("video");
  if (!element) throw new Error("Відео ще не запущено");
  return element;
};
const frame = () => screen.getByRole("group", { name: "Відео: Огляд камери" });
const controls = () => document.querySelector('[data-slot="video-controls"]');
const time = () =>
  (document.querySelector('[data-slot="video-time"]')?.textContent ?? "").replace(/\s/g, " ");

describe("ProductVideo: до запуску", () => {
  it("показує обкладинку з кнопкою, а <video> у розмітці немає", () => {
    renderVideo();

    expect(screen.getByRole("img", { name: "Огляд камери" })).toHaveClass("object-cover");
    expect(screen.getByRole("button", { name: "Відтворити відео" })).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("велика кнопка — одне коло 64px без зсуву при натисканні, іконка зсунута на 2px", () => {
    renderVideo();
    const button = screen.getByRole("button", { name: "Відтворити відео" });

    expect(button).toHaveClass(
      "size-16",
      "rounded-pill",
      "active:translate-y-0",
      "active:scale-95",
    );
    expect(button).toHaveAttribute("data-variant", "ink");
    expect(button.parentElement).toHaveClass("grid", "place-items-center");
    expect(button.parentElement?.children).toHaveLength(1);
    expect(button.querySelector("svg")).toHaveClass("translate-x-0.5", "fill-current");
  });

  it("без обкладинки лишається кнопка на темному тлі", () => {
    render(<ProductVideo sources={SOURCES} poster={null} label="Огляд камери" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(screen.getByRole("button", { name: "Відтворити відео" })).toBeInTheDocument();
  });
});

describe("ProductVideo: плеєр", () => {
  it("кнопка замінює обкладинку плеєром без рідних controls і запускає відео", async () => {
    await start();

    expect(video()).not.toHaveAttribute("controls");
    expect(video()).not.toHaveAttribute("autoplay");
    expect(video()).toHaveAttribute("playsinline");
    expect(video()).toHaveAttribute("preload", "none");
    expect(video().getAttribute("poster")).toContain("width=1200");
    expect(video()).toHaveClass("object-contain");
    expect(
      [...video().querySelectorAll("source")].map((source) => source.getAttribute("type")),
    ).toEqual(["application/x-mpegURL", "video/mp4"]);
    expect(play).toHaveBeenCalledTimes(1);
    expect(screen.queryByRole("button", { name: "Відтворити відео" })).toBeNull();
    // Фокус не губиться: він на кнопці панелі.
    expect(screen.getByRole("button", { name: "Пауза" })).toHaveFocus();
  });

  it("кнопка панелі перемикає відтворення й назву", async () => {
    const { user } = await start();

    await user.click(screen.getByRole("button", { name: "Пауза" }));
    expect(pause).toHaveBeenCalledTimes(1);

    await user.click(screen.getByRole("button", { name: "Відтворити" }));
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.getByRole("button", { name: "Пауза" })).toBeInTheDocument();
  });

  it("натискання на відео — пауза або відтворення, подвійне — на весь екран", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const { user } = await start();
    frame().requestFullscreen = requestFullscreen;

    await user.click(video());
    expect(pause).toHaveBeenCalledTimes(1);
    await user.click(video());
    expect(play).toHaveBeenCalledTimes(2);

    await user.dblClick(video());
    expect(requestFullscreen).toHaveBeenCalledTimes(1);
  });

  it("показує час і тривалість, а повзунок називає їх словами", async () => {
    await start();

    media.currentTime = 65;
    fireEvent.timeUpdate(video());

    expect(time()).toBe("1:05 / 2:30");
    expect(document.querySelector('[data-slot="video-time"]')).toHaveClass(
      "text-caption",
      "tabular-nums",
    );
    const seek = screen.getByRole("slider", { name: "Перемотування" });
    expect(seek).toHaveAttribute("aria-valuetext", "1 хв 05 с із 2 хв 30 с");
    expect(seek).toHaveAttribute("aria-valuemax", "150");
  });

  it("кнопка звуку вимикає й вмикає його; повзунок гучності має назву й значення", async () => {
    const { user } = await start();

    await user.click(screen.getByRole("button", { name: "Вимкнути звук" }));
    expect(media.muted).toBe(true);
    expect(screen.getByRole("slider", { name: "Гучність" })).toHaveAttribute(
      "aria-valuetext",
      "0 %",
    );

    await user.click(screen.getByRole("button", { name: "Увімкнути звук" }));
    expect(media.muted).toBe(false);
    expect(screen.getByRole("slider", { name: "Гучність" })).toHaveAttribute(
      "aria-valuetext",
      "100 %",
    );
  });

  it("стрілки на повзунку гучності міняють гучність, а не перемотують", async () => {
    const { user } = await start();

    screen.getByRole("slider", { name: "Гучність" }).focus();
    await user.keyboard("{ArrowLeft}");

    expect(media.volume).toBeCloseTo(0.95);
    expect(media.currentTime).toBe(0);
  });
});

describe("ProductVideo: клавіатура", () => {
  it("K і пробіл — пауза, ← → — 5 секунд, ↑ ↓ — гучність, M — звук", async () => {
    const { user } = await start();
    media.currentTime = 20;

    await user.keyboard("{ArrowRight}");
    expect(media.currentTime).toBe(25);
    await user.keyboard("{ArrowLeft}{ArrowLeft}");
    expect(media.currentTime).toBe(15);

    await user.keyboard("{ArrowDown}");
    expect(media.volume).toBeCloseTo(0.9);
    await user.keyboard("{ArrowUp}");
    expect(media.volume).toBeCloseTo(1);

    await user.keyboard("m");
    expect(media.muted).toBe(true);
    await user.keyboard("m");
    expect(media.muted).toBe(false);

    await user.keyboard("k");
    expect(pause).toHaveBeenCalledTimes(1);
    await user.keyboard("k");
    expect(play).toHaveBeenCalledTimes(2);

    // Фокус на кнопці «Пауза»: пробіл натискає її рівно один раз.
    await user.keyboard(" ");
    expect(pause).toHaveBeenCalledTimes(2);
  });

  it("перемотування не виходить за межі відео", async () => {
    const { user } = await start();

    await user.keyboard("{ArrowLeft}");
    expect(media.currentTime).toBe(0);

    media.currentTime = 148;
    await user.keyboard("{ArrowRight}");
    expect(media.currentTime).toBe(150);
  });

  it("← → на повзунку перемотування теж дають 5 секунд", async () => {
    const { user } = await start();

    screen.getByRole("slider", { name: "Перемотування" }).focus();
    await user.keyboard("{ArrowRight}");

    expect(media.currentTime).toBe(5);
  });

  it("клавіші плеєра не доходять до каруселі довкола", async () => {
    const onKeyDown = vi.fn();
    const user = userEvent.setup();
    renderVideo(onKeyDown);
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));

    await user.keyboard("{ArrowRight}{ArrowLeft}k");

    expect(onKeyDown).not.toHaveBeenCalled();
  });

  it("F розгортає контейнер плеєра, а назва кнопки показує стан", async () => {
    const requestFullscreen = vi.fn().mockResolvedValue(undefined);
    const exitFullscreen = vi.fn().mockResolvedValue(undefined);
    const { user } = await start();
    frame().requestFullscreen = requestFullscreen;
    Object.defineProperty(document, "exitFullscreen", {
      configurable: true,
      value: exitFullscreen,
    });

    await user.keyboard("f");
    expect(requestFullscreen).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: frame() });
    fireEvent(document, new Event("fullscreenchange"));

    await user.click(screen.getByRole("button", { name: "Вийти з повноекранного режиму" }));
    expect(exitFullscreen).toHaveBeenCalledTimes(1);

    Object.defineProperty(document, "fullscreenElement", { configurable: true, value: null });
    fireEvent(document, new Event("fullscreenchange"));
    expect(screen.getByRole("button", { name: "На весь екран" })).toBeInTheDocument();

    Reflect.deleteProperty(document, "fullscreenElement");
    Reflect.deleteProperty(document, "exitFullscreen");
  });

  it("на iPhone, де блок розгорнути не можна, розгортається саме відео", async () => {
    const webkitEnterFullscreen = vi.fn();
    const { user } = await start();
    Object.defineProperty(frame(), "requestFullscreen", { configurable: true, value: undefined });
    Object.assign(video(), { webkitEnterFullscreen });

    await user.click(screen.getByRole("button", { name: "На весь екран" }));

    expect(webkitEnterFullscreen).toHaveBeenCalledTimes(1);
  });
});

describe("ProductVideo: стани", () => {
  it("панель ховається за 2,5 с без руху й повертається від руху та на паузі", () => {
    vi.useFakeTimers();
    renderVideo();
    fireEvent.click(screen.getByRole("button", { name: "Відтворити відео" }));
    // Фокус від миші панель не тримає: прибираємо його, як після натискання на відео.
    act(() => (document.activeElement as HTMLElement).blur());
    fireEvent.pointerMove(frame());

    expect(controls()).toHaveAttribute("data-visible", "true");

    act(() => vi.advanceTimersByTime(CONTROLS_HIDE_DELAY_MS - 1));
    expect(controls()).toHaveAttribute("data-visible", "true");
    act(() => vi.advanceTimersByTime(1));
    expect(controls()).toHaveAttribute("data-visible", "false");
    expect(controls()).toHaveClass("motion-safe:transition-opacity");

    fireEvent.pointerMove(frame());
    expect(controls()).toHaveAttribute("data-visible", "true");

    act(() => vi.advanceTimersByTime(CONTROLS_HIDE_DELAY_MS));
    expect(controls()).toHaveAttribute("data-visible", "false");

    act(() => video().pause());
    expect(controls()).toHaveAttribute("data-visible", "true");
  });

  it("дотик по відео з прихованою панеллю лише показує її", () => {
    vi.useFakeTimers();
    renderVideo();
    fireEvent.click(screen.getByRole("button", { name: "Відтворити відео" }));
    act(() => (document.activeElement as HTMLElement).blur());
    fireEvent.pointerMove(frame());
    act(() => vi.advanceTimersByTime(CONTROLS_HIDE_DELAY_MS));
    expect(controls()).toHaveAttribute("data-visible", "false");

    fireEvent.pointerDown(video(), { pointerType: "touch" });
    fireEvent.click(video());

    expect(controls()).toHaveAttribute("data-visible", "true");
    expect(pause).not.toHaveBeenCalled();

    // Другий дотик, коли панель уже видно, ставить на паузу.
    fireEvent.pointerDown(video(), { pointerType: "touch" });
    fireEvent.click(video());
    expect(pause).toHaveBeenCalledTimes(1);
  });

  it("поки відео буферизується, показує індикатор", async () => {
    await start();

    fireEvent.waiting(video());
    expect(screen.getByRole("status", { name: "Відео завантажується" })).toBeInTheDocument();

    fireEvent.playing(video());
    expect(screen.queryByRole("status", { name: "Відео завантажується" })).toBeNull();
  });

  it("помилку пояснює і дає спробувати ще раз", async () => {
    const { user } = await start();

    fireEvent.error(video());

    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Відео не завантажилось");
    expect(controls()).toHaveAttribute("data-visible", "true");

    await user.click(screen.getByRole("button", { name: "Спробувати ще раз" }));

    expect(load).toHaveBeenCalledTimes(1);
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.queryByRole("alert")).toBeNull();
  });

  it("помилка джерела — це помилка відео, лише коли не підійшло жодне", async () => {
    await start();
    const [first, last] = [...video().querySelectorAll("source")];
    if (!first || !last) throw new Error("Немає джерел");

    fireEvent.error(first);
    expect(screen.queryByRole("alert")).toBeNull();

    media.networkState = 3;
    fireEvent.error(last);
    expect(screen.getByRole("alert")).toBeInTheDocument();
  });

  it("ставить відео на паузу, коли вкладку сховано", async () => {
    await start();

    Object.defineProperty(document, "hidden", { configurable: true, value: true });
    fireEvent(document, new Event("visibilitychange"));
    Reflect.deleteProperty(document, "hidden");

    expect(pause).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "Відтворити" })).toBeInTheDocument();
  });

  it("після кінця відео кнопка знову «Відтворити»", async () => {
    await start();

    media.ended = true;
    fireEvent.ended(video());

    expect(screen.getByRole("button", { name: "Відтворити" })).toBeInTheDocument();
    expect(controls()).toHaveAttribute("data-visible", "true");
  });
});

describe("час у плеєрі", () => {
  it("цифрами для панелі", () => {
    expect(formatTime(0)).toBe("0:00");
    expect(formatTime(65.9)).toBe("1:05");
    expect(formatTime(3723)).toBe("1:02:03");
    expect(formatTime(Number.NaN)).toBe("0:00");
  });

  it("словами для читача екрана", () => {
    expect(timeText(45)).toBe("45 с");
    expect(timeText(65)).toBe("1 хв 05 с");
    expect(timeText(3723)).toBe("1 год 02 хв 03 с");
    expect(seekValueText(65, 150)).toBe("1 хв 05 с із 2 хв 30 с");
  });
});
