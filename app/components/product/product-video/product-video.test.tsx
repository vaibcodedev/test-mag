import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ProductVideo } from "./product-video";

/**
 * jsdom не відтворює медіа, тому HTMLMediaElement тут підмінено простою моделлю:
 * властивості зберігаються в об'єкті, а play і pause змінюють їх і шлють ті самі події, що й браузер.
 */
const media = { paused: true, ended: false, networkState: 1 };
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
});

afterEach(() => {
  for (const key of KEYS) {
    const original = originals.get(key);
    if (original) Object.defineProperty(HTMLMediaElement.prototype, key, original);
    else Reflect.deleteProperty(HTMLMediaElement.prototype, key);
  }
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
const playButton = () => screen.getByRole("button", { name: "Відтворити відео" });
const pauseButton = () => screen.getByRole("button", { name: "Поставити відео на паузу" });

describe("ProductVideo: до запуску", () => {
  it("показує обкладинку з кнопкою, а <video> у розмітці немає", () => {
    renderVideo();

    expect(screen.getByRole("img", { name: "Огляд камери" })).toBeInTheDocument();
    expect(playButton()).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("велика кнопка — одне коло 64px без зсуву при натисканні, іконка зсунута на 2px", () => {
    renderVideo();
    const button = playButton();

    expect(button).toHaveClass("size-16", "rounded-pill", "active:translate-y-0");
    expect(button.parentElement).toHaveClass("grid", "place-items-center");
    expect(button.querySelector("svg")).toHaveClass("translate-x-0.5");
  });

  it("без обкладинки лишається кнопка на темному тлі", () => {
    render(<ProductVideo sources={SOURCES} poster={null} label="Огляд камери" />);

    expect(screen.queryByRole("img")).toBeNull();
    expect(playButton()).toBeInTheDocument();
  });
});

describe("ProductVideo: плеєр", () => {
  it("кнопка замінює обкладинку відео без рідних controls і запускає його", async () => {
    await start();

    expect(screen.queryByRole("img", { name: "Огляд камери" })).toBeNull();
    expect(video()).not.toHaveAttribute("controls");
    expect(video().querySelectorAll("source")).toHaveLength(2);
    expect(play).toHaveBeenCalledOnce();
    expect(frame()).toBeInTheDocument();
  });

  it("панелі керування немає: ні перемотування, ні гучності, ні повного екрана", async () => {
    await start();

    expect(screen.queryByRole("slider")).toBeNull();
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("поки відео грає, кнопка — «Пауза» і її не видно; фокус на ній, щоб працювала клавіатура", async () => {
    await start();

    expect(pauseButton()).toHaveClass("opacity-0", "focus-visible:opacity-100");
    expect(pauseButton()).toHaveFocus();
  });

  it("натискання на відео ставить на паузу, і кнопка «Відтворити» повертається", async () => {
    const { user } = await start();

    await user.click(video());
    expect(pause).toHaveBeenCalledOnce();
    expect(playButton()).not.toHaveClass("opacity-0");

    await user.click(playButton());
    expect(play).toHaveBeenCalledTimes(2);
    expect(pauseButton()).toBeInTheDocument();
  });

  it("клік по невидимій кнопці в центрі кадру теж ставить на паузу", async () => {
    const { user } = await start();

    await user.click(pauseButton());

    expect(pause).toHaveBeenCalledOnce();
    expect(playButton()).toBeInTheDocument();
  });
});

describe("ProductVideo: клавіатура", () => {
  it("K і пробіл на плеєрі — пауза й відтворення", async () => {
    await start();

    fireEvent.keyDown(video(), { code: "KeyK" });
    expect(pause).toHaveBeenCalledOnce();

    fireEvent.keyDown(video(), { code: "Space" });
    expect(play).toHaveBeenCalledTimes(2);
  });

  it("пробіл на кнопці натискає її саму, без подвійного перемикання", async () => {
    const { user } = await start();

    await user.keyboard(" ");

    expect(pause).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledOnce();
  });

  it("клавіші плеєра не доходять до каруселі довкола, решта — доходять", async () => {
    const onKeyDown = vi.fn();
    const user = userEvent.setup();
    renderVideo(onKeyDown);
    await user.click(playButton());

    fireEvent.keyDown(video(), { code: "KeyK" });
    expect(onKeyDown).not.toHaveBeenCalled();

    // Стрілки більше не належать плеєру: ними гортається галерея.
    fireEvent.keyDown(video(), { code: "ArrowRight", key: "ArrowRight" });
    expect(onKeyDown).toHaveBeenCalledOnce();
  });
});

describe("ProductVideo: стани", () => {
  it("поки відео буферизується, показує індикатор замість кнопки", async () => {
    await start();

    fireEvent.waiting(video());
    expect(screen.getByLabelText("Відео завантажується")).toBeInTheDocument();
    expect(screen.queryByRole("button")).toBeNull();

    fireEvent.playing(video());
    expect(screen.queryByLabelText("Відео завантажується")).toBeNull();
    expect(pauseButton()).toBeInTheDocument();
  });

  it("помилку пояснює і дає спробувати ще раз", async () => {
    const { user } = await start();

    fireEvent.error(video());
    expect(screen.getByText("Відео не завантажилось")).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Спробувати ще раз" }));
    expect(load).toHaveBeenCalledOnce();
    expect(play).toHaveBeenCalledTimes(2);
    expect(screen.queryByText("Відео не завантажилось")).toBeNull();
  });

  it("помилка джерела — це помилка відео, лише коли не підійшло жодне", async () => {
    await start();
    const [first, last] = Array.from(video().querySelectorAll("source"));

    fireEvent.error(first as HTMLSourceElement);
    expect(screen.queryByText("Відео не завантажилось")).toBeNull();

    media.networkState = 3;
    fireEvent.error(last as HTMLSourceElement);
    expect(screen.getByText("Відео не завантажилось")).toBeInTheDocument();
  });

  it("ставить відео на паузу, коли вкладку сховано", async () => {
    await start();
    const hidden = vi.spyOn(document, "hidden", "get").mockReturnValue(true);

    act(() => {
      document.dispatchEvent(new Event("visibilitychange"));
    });

    expect(pause).toHaveBeenCalledOnce();
    hidden.mockRestore();
  });

  it("після кінця відео кнопка знову «Відтворити»", async () => {
    await start();

    media.ended = true;
    fireEvent.ended(video());

    expect(playButton()).toBeInTheDocument();
  });
});
