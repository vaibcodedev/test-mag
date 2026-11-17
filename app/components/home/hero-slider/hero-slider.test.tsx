import { act, render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { addToCompare } from "~/hooks/use-compare";
import { COMPARE_LIMIT, compareStore } from "~/lib/saved-lists";

import { HeroSlider } from "./hero-slider";
import { DEMO_HOME_BANNERS } from "./hero-slider.demo";
import type { HomeBanner } from "./hero-slider.types";

/**
 * Embla рахує слайди за розмірами, яких у jsdom немає, тому тут її замінює проста модель
 * з тим самим API: індекс слайда, події select і прокрутка по колу (loop).
 */
const embla = vi.hoisted(() => {
  type Listener = (api: unknown) => void;
  const state = { index: 0, count: 0, options: {} as Record<string, unknown> };
  const listeners = new Map<string, Set<Listener>>();
  const emit = (event: string) => listeners.get(event)?.forEach((listener) => listener(api));
  const go = (step: number) => {
    if (state.count === 0) return;
    state.index = (state.index + step + state.count) % state.count;
    emit("select");
  };

  const api = {
    canScrollPrev: () => state.count > 1,
    canScrollNext: () => state.count > 1,
    selectedScrollSnap: () => state.index,
    scrollSnapList: () => Array.from({ length: state.count }, (_, index) => index),
    scrollPrev: () => go(-1),
    scrollNext: () => go(1),
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
vi.mock("~/components/ui/sonner", () => ({
  toast: Object.assign(vi.fn(), { success: vi.fn(), warning: vi.fn(), error: vi.fn() }),
}));

beforeEach(() => {
  embla.reset();
  act(() => compareStore.clear());
  localStorage.clear();
});

/** Банер, у якого вибір кольору справді щось змінює: у кольору є власне посилання. */
function bannerWithColorLinks(): HomeBanner {
  const [first] = DEMO_HOME_BANNERS;
  if (!first) throw new Error("Немає демо-банера");
  return {
    ...first,
    colors: [
      { name: "Темно-синій", hex: "#32374a" },
      { name: "Сріблястий", hex: "#e3e4e5", href: "/products/iphone-17-pro-256-silver" },
    ],
  };
}

function renderSlider(banners: HomeBanner[] = DEMO_HOME_BANNERS) {
  return render(
    <MemoryRouter>
      <HeroSlider banners={banners} />
    </MemoryRouter>,
  );
}

const text = (element: Element | null) => (element?.textContent ?? "").replace(/\s/g, " ");
const counter = () => document.querySelector('[data-slot="hero-counter"]');

describe("HeroSlider", () => {
  it("одразу показує перший слайд: заголовок, ціну, розстрочку та посилання", () => {
    renderSlider();
    const region = screen.getByRole("region", { name: "Головні пропозиції" });
    const slide = within(region).getByRole("group", { name: "Слайд 1 з 4" });

    expect(within(slide).getByRole("heading", { level: 2, name: "iPhone 17 Pro" })).toBeVisible();
    expect(text(slide)).toContain("від 64 999 ₴");
    expect(text(slide)).toContain("або 2 600 ₴ × 25 міс.");
    expect(within(slide).getByRole("link", { name: "Купити: iPhone 17 Pro" })).toHaveAttribute(
      "href",
      "/products/iphone-17-pro-256-blue",
    );
    // Демо-банер не прив'язаний до товару: друга кнопка чесно веде до всіх моделей.
    expect(within(slide).getByRole("link", { name: "Усі моделі: iPhone 17 Pro" })).toHaveAttribute(
      "href",
      "/collections/iphone",
    );
    expect(within(slide).queryByRole("link", { name: /Порівняти/ })).toBeNull();
    expect(text(slide)).toContain("Доставимо завтра");
    expect(text(counter())).toBe("01 / 04");
  });

  it("усі слайди є в розмітці, але неактивні приховані від читачів екрана", () => {
    renderSlider();

    expect(document.querySelectorAll('[data-slot="hero-slide"]')).toHaveLength(4);
    expect(screen.getAllByRole("group", { name: /^Слайд/ })).toHaveLength(1);
    expect(screen.queryByRole("heading", { name: "MacBook Air M4" })).toBeNull();
  });

  it("лише фото першого слайда вантажиться одразу", () => {
    renderSlider();
    const images = [...document.querySelectorAll('[data-slot="hero-slide"] img')];

    expect(images[0]).toHaveAttribute("loading", "eager");
    expect(images[0]).toHaveAttribute("fetchpriority", "high");
    expect(images.slice(1).every((image) => image.getAttribute("loading") === "lazy")).toBe(true);
  });

  it("стрілки перемикають слайд і лічильник, по колу", async () => {
    const user = userEvent.setup();
    renderSlider();

    await user.click(screen.getByRole("button", { name: "Наступний слайд" }));

    expect(text(counter())).toBe("02 / 04");
    expect(screen.getByRole("group", { name: "Слайд 2 з 4" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { level: 2, name: "MacBook Air M4" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "iPhone 17 Pro" })).toBeNull();
    expect(screen.getByText("Слайд 2 з 4: MacBook Air M4")).toHaveAttribute("aria-live", "polite");

    await user.click(screen.getByRole("button", { name: "Попередній слайд" }));
    await user.click(screen.getByRole("button", { name: "Попередній слайд" }));

    expect(text(counter())).toBe("04 / 04");
    expect(screen.getByRole("heading", { level: 2, name: "AirPods Pro 3" })).toBeInTheDocument();
  });

  it("стрілки працюють із клавіатури", async () => {
    const user = userEvent.setup();
    renderSlider();

    screen.getByRole("button", { name: "Наступний слайд" }).focus();
    await user.keyboard("{Enter}");

    expect(text(counter())).toBe("02 / 04");

    // Клавіші ← → гортають слайди з будь-якого місця банера.
    await user.keyboard("{ArrowRight}");
    expect(text(counter())).toBe("03 / 04");
    await user.keyboard("{ArrowLeft}");
    expect(text(counter())).toBe("02 / 04");
  });

  it("карусель зациклена, без автопрокрутки, а поступ показує смуга Progress", async () => {
    const user = userEvent.setup();
    renderSlider();
    const progress = document.querySelector('[data-slot="progress"]');

    expect(embla.state.options).toMatchObject({ loop: true, axis: "x" });
    expect(embla.state.options).not.toHaveProperty("plugins");
    expect(progress).toHaveAttribute("data-tone", "on-dark");
    expect(progress).toHaveAttribute("aria-valuenow", "1");
    expect(progress).toHaveAttribute("aria-valuemax", "4");

    await user.click(screen.getByRole("button", { name: "Наступний слайд" }));

    expect(progress).toHaveAttribute("aria-valuenow", "2");
  });

  it("без даних для окремих кольорів показує їх переліком, а не перемикачем", () => {
    renderSlider();
    const slide = screen.getByRole("group", { name: "Слайд 1 з 4" });

    expect(within(slide).queryByRole("radiogroup")).toBeNull();
    expect(
      within(slide).getByRole("img", {
        name: "Кольори iPhone 17 Pro: Космічний помаранчевий, Темно-синій, Сріблястий",
      }),
    ).toBeInTheDocument();
  });

  it("«Порівняти» в банері з товаром додає його до порівняння і веде на /compare", async () => {
    const user = userEvent.setup();
    const [first] = DEMO_HOME_BANNERS;
    if (!first) throw new Error("Немає демо-банера");
    renderSlider([{ ...first, productHandle: "iphone-17-pro", compareCategory: "iphone" }]);

    const link = screen.getByRole("link", { name: "Порівняти: iPhone 17 Pro" });
    expect(link).toHaveAttribute("href", "/compare");
    expect(screen.queryByRole("link", { name: /Усі моделі/ })).toBeNull();

    await user.click(link);
    expect(compareStore.getSnapshot()).toEqual(["iphone-17-pro"]);

    // Повторний клік не прибирає товар зі списку.
    await user.click(link);
    expect(compareStore.getSnapshot()).toEqual(["iphone-17-pro"]);
  });

  it("коли порівняння повне, «Порівняти» лишає на сторінці й пояснює чому", async () => {
    const user = userEvent.setup();
    const { toast } = await import("~/components/ui/sonner");
    const [first] = DEMO_HOME_BANNERS;
    if (!first) throw new Error("Немає демо-банера");
    act(() => {
      for (let index = 0; index < COMPARE_LIMIT; index += 1)
        addToCompare(`item-${index}`, "iphone");
    });
    renderSlider([{ ...first, productHandle: "iphone-17-pro", compareCategory: "iphone" }]);

    await user.click(screen.getByRole("link", { name: "Порівняти: iPhone 17 Pro" }));

    expect(compareStore.getSnapshot()).not.toContain("iphone-17-pro");
    expect(toast.warning).toHaveBeenCalled();
  });

  it("у перемикачі кольору клавіші ← → не гортають слайди", async () => {
    const user = userEvent.setup();
    renderSlider([bannerWithColorLinks(), ...DEMO_HOME_BANNERS.slice(1)]);

    const [radio] = screen.getAllByRole("radio");
    if (!radio) throw new Error("У першому банері немає кольорів");
    radio.focus();
    await user.keyboard("{ArrowRight}");

    expect(text(counter())).toBe("01 / 04");
    expect(screen.getByRole("group", { name: "Слайд 1 з 4" })).toBeInTheDocument();
  });

  it("вибір кольору підміняє посилання «Купити», якщо в кольору є своє", async () => {
    const user = userEvent.setup();
    renderSlider([bannerWithColorLinks()]);

    const silver = screen.getByRole("radio", { name: "Сріблястий" });
    expect(silver).toHaveAttribute("aria-checked", "false");

    await user.click(silver);

    expect(silver).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("link", { name: "Купити: iPhone 17 Pro" })).toHaveAttribute(
      "href",
      "/products/iphone-17-pro-256-silver",
    );
  });

  it("з одним банером не показує лічильник і стрілки", () => {
    renderSlider(DEMO_HOME_BANNERS.slice(0, 1));

    expect(counter()).toBeNull();
    expect(screen.queryByRole("button", { name: "Наступний слайд" })).toBeNull();
    expect(screen.getByRole("group", { name: "Слайд 1 з 1" })).toBeInTheDocument();
  });

  it("без банерів нічого не рендерить", () => {
    const { container } = renderSlider([]);

    expect(container).toBeEmptyDOMElement();
  });
});
