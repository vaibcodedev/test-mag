import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductMedia } from "~/lib/shopify/product";

import { ProductGallery } from "./product-gallery";
import {
  DEMO_MIXED_MEDIA,
  DEMO_MODEL,
  DEMO_VIDEO,
  DEMO_VIDEO_URL,
  DEMO_YOUTUBE,
  demoPhotos,
} from "./product-gallery.fixtures";
import { mediaLabel, scrollDeltaToReveal, slideLabel } from "./product-gallery.utils";

/**
 * Embla рахує слайди за розмірами, яких у jsdom немає, тому тут її замінює проста модель
 * з тим самим API: індекс слайда, подія select, прокрутка до слайда без зациклення.
 */
const embla = vi.hoisted(() => {
  type Listener = (api: unknown) => void;
  const state = { index: 0, count: 0, options: {} as Record<string, unknown> };
  const listeners = new Map<string, Set<Listener>>();
  const emit = (event: string) => listeners.get(event)?.forEach((listener) => listener(api));
  const goTo = (index: number) => {
    const next = Math.min(Math.max(index, 0), state.count - 1);
    if (next === state.index) return;
    state.index = next;
    emit("select");
  };

  const api = {
    canScrollPrev: () => state.index > 0,
    canScrollNext: () => state.index < state.count - 1,
    selectedScrollSnap: () => state.index,
    scrollSnapList: () => Array.from({ length: state.count }, (_, index) => index),
    scrollPrev: () => goTo(state.index - 1),
    scrollNext: () => goTo(state.index + 1),
    scrollTo: (index: number) => goTo(index),
    on: (event: string, listener: Listener) => {
      listeners.set(event, (listeners.get(event) ?? new Set()).add(listener));
      return api;
    },
    off: (event: string, listener: Listener) => {
      listeners.get(event)?.delete(listener);
      return api;
    },
  };

  const viewportRef = (node: HTMLElement | null) => {
    state.count = node?.querySelectorAll('[data-slot="carousel-item"]').length ?? 0;
  };

  return {
    state,
    hook: (options: Record<string, unknown>) => {
      state.options = options;
      return [viewportRef, api] as const;
    },
    reset: () => {
      state.index = 0;
      state.count = 0;
      listeners.clear();
    },
  };
});

vi.mock("embla-carousel-react", () => ({ default: embla.hook }));

const IMAGE: ProductMedia = {
  type: "image",
  id: "gid://shopify/MediaImage/1",
  alt: null,
  image: {
    url: "https://cdn.shopify.com/iphone.png",
    altText: "iPhone 17 Pro спереду",
    width: 1000,
    height: 1000,
  },
};

const TITLE = "iPhone 17 Pro";

// jsdom не вміє відтворювати медіа: play і pause підмінюються, щоб перевірити самі виклики.
let play: ReturnType<typeof vi.spyOn>;
let pause: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  embla.reset();
  // Radix Slider у панелі плеєра міряє повзунок через ResizeObserver, якого в jsdom немає.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  );
  play = vi.spyOn(HTMLMediaElement.prototype, "play").mockResolvedValue(undefined);
  pause = vi.spyOn(HTMLMediaElement.prototype, "pause").mockImplementation(() => {});
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

const slides = () => [...document.querySelectorAll('[data-slot="carousel-item"]')];
const counter = () =>
  (document.querySelector('[data-slot="product-gallery-counter"]')?.textContent ?? "").replace(
    /\s/g,
    " ",
  );
const thumb = (name: RegExp) => screen.getByRole("radio", { name });

describe("ProductGallery: одне медіа та порожній стан", () => {
  it("головне фото вантажиться одразу з високим пріоритетом", () => {
    render(<ProductGallery media={[IMAGE]} title={TITLE} />);
    const image = screen.getByRole("img", { name: "iPhone 17 Pro спереду" });

    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image).toHaveClass("object-cover");
    expect(image.getAttribute("srcset")).toContain("width=720 720w");
    expect(screen.queryByRole("radiogroup")).toBeNull();
    expect(screen.queryByRole("button", { name: "Наступний слайд" })).toBeNull();
  });

  it("без alt у фото підставляє назву товару", () => {
    render(
      <ProductGallery
        media={[{ ...IMAGE, image: { ...IMAGE.image, altText: null } } as ProductMedia]}
        title={TITLE}
      />,
    );

    expect(screen.getByRole("img", { name: TITLE })).toBeInTheDocument();
  });

  it("приймає й старий список фото через images", () => {
    render(
      <ProductGallery
        images={[
          { url: "https://cdn.shopify.com/a.png", altText: "Спереду" },
          { url: "https://cdn.shopify.com/b.png", altText: "Ззаду" },
        ]}
        title={TITLE}
      />,
    );

    expect(slides()).toHaveLength(2);
    expect(screen.getByRole("img", { name: "Спереду" })).toHaveAttribute("fetchpriority", "high");
  });

  it("без медіа пояснює, що фото ще немає", () => {
    render(<ProductGallery media={[]} title={TITLE} />);

    expect(screen.getByText("Фото цього товару ще готуємо")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });

  it("єдине відео товару теж відтворюється", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={[DEMO_YOUTUBE]} title={TITLE} />);

    expect(document.querySelector("iframe")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));

    expect(screen.getByTitle("Відео: Розпакування")).toBeInstanceOf(HTMLIFrameElement);
  });
});

describe("ProductGallery: багато медіа", () => {
  it("малює слайд і мініатюру на кожне з 12 фото; одразу вантажиться лише перше", () => {
    render(<ProductGallery media={demoPhotos(12)} title={TITLE} />);

    expect(slides()).toHaveLength(12);
    expect(screen.getAllByRole("radio")).toHaveLength(12);

    const main = slides().map((slide) => slide.querySelector("img"));
    expect(main[0]).toHaveAttribute("loading", "eager");
    expect(main[0]).toHaveAttribute("fetchpriority", "high");
    expect(main.slice(1).every((image) => image?.getAttribute("loading") === "lazy")).toBe(true);

    const thumbs = [...document.querySelectorAll('[data-slot="product-gallery-thumbs"] img')];
    expect(thumbs).toHaveLength(12);
    expect(thumbs.every((image) => image.getAttribute("loading") === "lazy")).toBe(true);
  });

  it("показує лічильник і називає слайд; сусідні слайди приховані від читача екрана", () => {
    render(<ProductGallery media={demoPhotos(12)} title={TITLE} />);

    expect(screen.getByRole("region", { name: `Фото товару: ${TITLE}` })).toBeInTheDocument();
    expect(counter()).toBe("1 / 12");
    expect(screen.getAllByRole("group", { name: /^Фото \d+ з 12$/ })).toHaveLength(1);
    expect(screen.getByRole("group", { name: "Фото 1 з 12" })).toBeInTheDocument();
    expect(slides()[1]).toHaveAttribute("inert");
    expect(thumb(/^Фото 1 з 12/)).toHaveAttribute("aria-checked", "true");
  });

  it("стрілки на екрані гортають слайди й оновлюють лічильник і мініатюру", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={demoPhotos(12)} title={TITLE} />);

    expect(screen.getByRole("button", { name: "Попередній слайд" })).toBeDisabled();
    await user.click(screen.getByRole("button", { name: "Наступний слайд" }));
    await user.click(screen.getByRole("button", { name: "Наступний слайд" }));

    expect(counter()).toBe("3 / 12");
    expect(screen.getByRole("group", { name: "Фото 3 з 12" })).toBeInTheDocument();
    expect(screen.getByText("Фото 3 з 12", { selector: "p" })).toHaveAttribute(
      "aria-live",
      "polite",
    );
    expect(thumb(/^Фото 3 з 12/)).toHaveAttribute("aria-checked", "true");
    expect(thumb(/^Фото 1 з 12/)).toHaveAttribute("aria-checked", "false");

    await user.click(screen.getByRole("button", { name: "Попередній слайд" }));
    expect(counter()).toBe("2 / 12");
  });

  it("клавіші ← → гортають слайди", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={demoPhotos(12)} title={TITLE} />);

    screen.getByRole("region", { name: `Фото товару: ${TITLE}` }).focus();
    await user.keyboard("{ArrowRight}{ArrowRight}");
    expect(counter()).toBe("3 / 12");

    await user.keyboard("{ArrowLeft}");
    expect(counter()).toBe("2 / 12");
  });

  it("мініатюра відкриває свій слайд; повторне натискання лишає його відкритим", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={demoPhotos(12)} title={TITLE} />);

    await user.click(thumb(/^Фото 9 з 12/));
    expect(counter()).toBe("9 / 12");

    await user.click(thumb(/^Фото 9 з 12/));
    expect(counter()).toBe("9 / 12");
    expect(thumb(/^Фото 9 з 12/)).toHaveAttribute("aria-checked", "true");
  });

  it("мініатюри — заокруглені квадрати 80px; позначка відео — одне коло по центру", () => {
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    const video = thumb(/^Відео 2 з 5/);
    const mark = video.querySelector('[data-slot="product-gallery-thumb-mark"]');

    for (const item of screen.getAllByRole("radio")) {
      expect(item).toHaveAttribute("data-variant", "thumbnail");
      expect(item).toHaveClass("size-20", "rounded-md", "border-2");
      expect(item).not.toHaveClass("rounded-pill");
      expect(item.querySelector("img")).toHaveClass("object-cover");
    }
    expect(thumb(/^Фото 1 з 5/)).toHaveAttribute("data-state", "on");
    expect(video).toHaveAttribute("data-state", "off");

    expect(mark).toHaveClass("inset-0", "m-auto", "size-8", "rounded-pill", "bg-scrim");
    expect(mark?.children).toHaveLength(1);
    expect(mark?.querySelector("svg")).toHaveClass("size-4", "fill-current");
    expect(mark?.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("мініатюри відео та 3D-моделі мають позначку й зрозумілу назву", () => {
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    const mark = (element: HTMLElement) =>
      element.querySelector('[data-slot="product-gallery-thumb-mark"]')?.getAttribute("data-kind");

    expect(screen.getByRole("region", { name: `Фото та відео товару: ${TITLE}` })).toBeVisible();
    expect(mark(thumb(/^Фото 1 з 5: iPhone 17 Pro спереду$/))).toBeUndefined();
    expect(mark(thumb(/^Відео 2 з 5: Огляд камери$/))).toBe("video");
    expect(mark(thumb(/^Фото 3 з 5$/))).toBeUndefined();
    expect(mark(thumb(/^Відео 4 з 5: Розпакування$/))).toBe("video");
    expect(mark(thumb(/^3D-модель 5 з 5: Модель корпусу$/))).toBe("model");
  });
});

describe("ProductGallery: відео Shopify", () => {
  it("до натискання показує обкладинку з кнопкою, а <video> у розмітці немає", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    await user.click(thumb(/^Відео 2 з 5/));

    const slide = screen.getByRole("group", { name: "Відео 2 з 5" });
    expect(within(slide).getByRole("img", { name: "Огляд камери" })).toHaveClass("object-cover");
    expect(within(slide).getByRole("button", { name: "Відтворити відео" })).toBeInTheDocument();
    expect(document.querySelector("video")).toBeNull();
    expect(play).not.toHaveBeenCalled();
  });

  it("кнопка замінює обкладинку власним плеєром без рідних controls", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    await user.click(thumb(/^Відео 2 з 5/));
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));

    const player = screen.getByRole("group", { name: "Відео: Огляд камери" });
    const video = player.querySelector("video");
    expect(video).not.toBeNull();
    expect(video).not.toHaveAttribute("controls");
    expect(video).toHaveAttribute("playsinline");
    expect(video).toHaveAttribute("preload", "none");
    expect(
      [...(video?.querySelectorAll("source") ?? [])].map((source) => [
        source.getAttribute("src"),
        source.getAttribute("type"),
      ]),
    ).toEqual([
      ["https://cdn.shopify.com/videos/demo/master.m3u8", "application/x-mpegURL"],
      [DEMO_VIDEO_URL, "video/mp4"],
    ]);
    expect(play).toHaveBeenCalledTimes(1);
    // Панелі керування немає. Тут play() лише обіцяє запуск (події playing ще не було),
    // тож на місці кнопки — індикатор завантаження.
    expect(within(player).queryByRole("slider")).toBeNull();
    expect(within(player).getByLabelText("Відео завантажується")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Відтворити відео" })).toBeNull();
  });

  it("інший слайд ставить відео на паузу, але не прибирає його", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    await user.click(thumb(/^Відео 2 з 5/));
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));
    pause.mockClear();

    await user.click(screen.getByRole("button", { name: "Наступний слайд" }));

    expect(counter()).toBe("3 / 5");
    expect(pause).toHaveBeenCalledTimes(1);
    expect(document.querySelector("video")).not.toBeNull();
    expect(play).toHaveBeenCalledTimes(1);
  });

  it("← → у плеєрі перемотують відео й слайд не гортають", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    await user.click(thumb(/^Відео 2 з 5/));
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));

    // Фокус на кнопці панелі плеєра.
    await user.keyboard("{ArrowRight}{ArrowLeft}");

    expect(counter()).toBe("2 / 5");
  });

  it("жест по запущеному плеєру не тягне карусель, по фото й обкладинці — тягне", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    const watchDrag = embla.state.options.watchDrag as (api: unknown, event: Event) => boolean;
    const from = (target: Element | null) => ({ target }) as unknown as Event;

    await user.click(thumb(/^Відео 2 з 5/));
    const poster = screen.getByRole("img", { name: "Огляд камери" });
    expect(watchDrag(null, from(poster))).toBe(true);

    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));
    expect(watchDrag(null, from(document.querySelector("video")))).toBe(false);
  });
});

describe("ProductGallery: відео з YouTube і Vimeo", () => {
  it("<iframe> немає до натискання і є після нього", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    await user.click(thumb(/^Відео 4 з 5/));

    expect(document.querySelector("iframe")).toBeNull();
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));

    const frame = screen.getByTitle<HTMLIFrameElement>("Відео: Розпакування");
    const src = new URL(frame.src);
    expect(src.origin + src.pathname).toBe("https://www.youtube-nocookie.com/embed/aqz-KE-bpKQ");
    expect(Object.fromEntries(src.searchParams)).toEqual({
      autoplay: "1",
      rel: "0",
      modestbranding: "1",
      playsinline: "1",
    });
    expect(frame).toHaveAttribute(
      "allow",
      "accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen",
    );
    expect(frame).toHaveAttribute("loading", "lazy");
    expect(screen.queryByRole("button", { name: "Відтворити відео" })).toBeNull();
  });

  it("інший слайд прибирає плеєр; після повернення знову обкладинка", async () => {
    const user = userEvent.setup();
    render(<ProductGallery media={DEMO_MIXED_MEDIA} title={TITLE} />);
    await user.click(thumb(/^Відео 4 з 5/));
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));
    expect(document.querySelector("iframe")).not.toBeNull();

    await user.click(screen.getByRole("button", { name: "Попередній слайд" }));
    expect(document.querySelector("iframe")).toBeNull();

    await user.click(screen.getByRole("button", { name: "Наступний слайд" }));
    expect(document.querySelector("iframe")).toBeNull();
    expect(screen.getByRole("button", { name: "Відтворити відео" })).toBeInTheDocument();
  });

  it("Vimeo відкривається без відстеження", async () => {
    const user = userEvent.setup();
    const vimeo: ProductMedia = {
      type: "external-video",
      id: "vimeo",
      alt: null,
      poster: null,
      host: "vimeo",
      embedUrl: "https://player.vimeo.com/video/76979871",
      originUrl: "https://vimeo.com/76979871",
    };
    render(<ProductGallery media={[vimeo]} title={TITLE} />);
    await user.click(screen.getByRole("button", { name: "Відтворити відео" }));

    const src = new URL(screen.getByTitle<HTMLIFrameElement>(`Відео: ${TITLE}`).src);
    expect(src.origin + src.pathname).toBe("https://player.vimeo.com/video/76979871");
    expect(Object.fromEntries(src.searchParams)).toEqual({
      autoplay: "1",
      title: "0",
      byline: "0",
      portrait: "0",
      dnt: "1",
    });
  });
});

describe("ProductGallery: 3D-модель", () => {
  it("показує обкладинку з позначкою «3D» і посилання на файл моделі в новій вкладці", () => {
    render(<ProductGallery media={[DEMO_MODEL]} title={TITLE} />);

    expect(screen.getByRole("img", { name: "Модель корпусу" })).toHaveClass("object-cover");
    expect(screen.getByText("3D")).toHaveAttribute("data-slot", "badge");

    const link = screen.getByRole("link", { name: /^Відкрити 3D-модель/ });
    expect(link).toHaveAttribute(
      "href",
      "https://modelviewer.dev/shared-assets/models/Astronaut.glb",
    );
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", "noopener noreferrer");
  });
});

describe("підписи та прокрутка стрічки", () => {
  it("називає слайди й мініатюри за типом медіа", () => {
    expect(slideLabel(DEMO_YOUTUBE, 2, 12)).toBe("Відео 3 з 12");
    expect(mediaLabel(DEMO_YOUTUBE, 2, 12, TITLE)).toBe("Відео 3 з 12: Розпакування");
    expect(mediaLabel({ ...DEMO_VIDEO, alt: null }, 0, 2, TITLE)).toBe(`Відео 1 з 2: ${TITLE}`);
    expect(mediaLabel(IMAGE, 0, 2, TITLE)).toBe("Фото 1 з 2: iPhone 17 Pro спереду");
  });

  it("рахує, на скільки прокрутити стрічку, щоб мініатюру було видно", () => {
    const strip = { left: 100, right: 400, top: 0, bottom: 80 };

    // Уже видно — нічого не рухаємо.
    expect(scrollDeltaToReveal(strip, { left: 180, right: 260, top: 0, bottom: 80 })).toEqual({
      left: 0,
      top: 0,
    });
    // Сховалась праворуч.
    expect(scrollDeltaToReveal(strip, { left: 380, right: 460, top: 0, bottom: 80 }, 8).left).toBe(
      68,
    );
    // Сховалась ліворуч.
    expect(scrollDeltaToReveal(strip, { left: 40, right: 120, top: 0, bottom: 80 }, 8).left).toBe(
      -68,
    );
    // Вертикальна стрічка: мініатюра нижче за край.
    expect(
      scrollDeltaToReveal(
        { left: 0, right: 80, top: 100, bottom: 500 },
        { left: 0, right: 80, top: 480, bottom: 560 },
      ),
    ).toEqual({ left: 0, top: 60 });
    // Стрічка без розміру (jsdom, прихований блок).
    expect(
      scrollDeltaToReveal(
        { left: 0, right: 0, top: 0, bottom: 0 },
        { left: 0, right: 0, top: 0, bottom: 0 },
        24,
      ),
    ).toEqual({ left: 0, top: 0 });
  });
});
