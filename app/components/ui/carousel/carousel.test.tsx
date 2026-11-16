import { act, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Carousel, CarouselContent, CarouselItem } from "./carousel";

const useEmblaCarousel = vi.hoisted(() => vi.fn());

vi.mock("embla-carousel-react", () => ({ default: useEmblaCarousel }));

type Listener = () => void;

/** Керована заглушка matchMedia: перемикає prefers-reduced-motion і сповіщає слухачів. */
function stubMatchMedia(initial: boolean) {
  let matches = initial;
  const listeners = new Set<Listener>();

  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      media: query,
      get matches() {
        return matches;
      },
      addEventListener: (_type: string, listener: Listener) => listeners.add(listener),
      removeEventListener: (_type: string, listener: Listener) => listeners.delete(listener),
    })),
  );

  return (next: boolean) => {
    matches = next;
    listeners.forEach((listener) => listener());
  };
}

function lastOptions() {
  return useEmblaCarousel.mock.lastCall?.[0] as Record<string, unknown>;
}

function renderCarousel(opts?: Record<string, unknown>) {
  return render(
    <Carousel aria-label="Товари" opts={opts}>
      <CarouselContent>
        <CarouselItem>Перший</CarouselItem>
        <CarouselItem>Другий</CarouselItem>
      </CarouselContent>
    </Carousel>,
  );
}

describe("Carousel", () => {
  beforeEach(() => {
    useEmblaCarousel.mockReset();
    useEmblaCarousel.mockReturnValue([vi.fn(), undefined]);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("лишає анімацію прокрутки Embla, коли рух не обмежено", () => {
    stubMatchMedia(false);
    renderCarousel({ loop: true });

    expect(lastOptions()).toMatchObject({ align: "start", axis: "x", loop: true });
    expect(lastOptions()).not.toHaveProperty("duration");
  });

  it("прокручує миттєво, коли система просить зменшити рух", () => {
    stubMatchMedia(true);
    renderCarousel({ duration: 40 });

    expect(lastOptions()).toMatchObject({ duration: 0 });
  });

  it("реагує на зміну налаштування без перезавантаження сторінки", () => {
    const setReducedMotion = stubMatchMedia(false);
    renderCarousel();
    expect(lastOptions()).not.toHaveProperty("duration");

    act(() => setReducedMotion(true));
    expect(lastOptions()).toMatchObject({ duration: 0 });

    act(() => setReducedMotion(false));
    expect(lastOptions()).not.toHaveProperty("duration");
  });
});
