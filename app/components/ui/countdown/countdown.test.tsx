import { act, render, screen } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { Countdown } from "./countdown";

const NOW = "2026-11-16T10:00:00.000Z";
const ENDS_AT = "2026-11-18T13:04:05.000Z";

function unit(name: string) {
  const cell = document.querySelector(`[data-unit="${name}"]`);
  return (cell?.textContent ?? "").replace(/\s/g, " ");
}

describe("Countdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("показує дні, години, хвилини й секунди з українськими підписами", () => {
    render(<Countdown endsAt={ENDS_AT} />);

    expect(unit("days")).toBe("дні02");
    expect(unit("hours")).toBe("години03");
    expect(unit("minutes")).toBe("хвилини04");
    expect(unit("seconds")).toBe("секунд05");
  });

  it("це timer з підписом без секунд, який не озвучується щосекунди", () => {
    render(<Countdown endsAt={ENDS_AT} />);
    const timer = screen.getByRole("timer");

    expect(timer).toHaveAttribute("aria-live", "off");
    expect(timer).toHaveAccessibleName("До кінця акції: 2 дні, 3 години, 4 хвилини");
  });

  it("цокає щосекунди", () => {
    render(<Countdown endsAt={ENDS_AT} />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(unit("seconds")).toBe("секунда01");
  });

  it("на нулі зупиняється й показує «Акцію завершено»", () => {
    render(<Countdown endsAt="2026-11-16T10:00:03.000Z" />);

    expect(unit("seconds")).toBe("секунди03");

    act(() => {
      vi.advanceTimersByTime(60_000);
    });

    expect(screen.getByRole("timer")).toHaveTextContent("Акцію завершено");
    expect(document.querySelector("[data-unit]")).toBeNull();
    expect(vi.getTimerCount()).toBe(0);
  });

  it("для минулої дати одразу показує, що акцію завершено", () => {
    render(<Countdown endsAt="2026-11-01T00:00:00.000Z" finishedText="Знижки закінчилися" />);

    expect(screen.getByRole("timer")).toHaveTextContent("Знижки закінчилися");
  });

  it("на сервері без часу з loader віддає прочерки, а не час сервера", () => {
    const html = renderToString(<Countdown endsAt={ENDS_AT} />);

    expect(html).toContain("––");
    expect(html).not.toMatch(/>\d\d</);
  });

  it("на сервері з часом із loader віддає пораховані цифри", () => {
    // Годинник «браузера» інший: розмітка має залежати лише від переданого часу.
    vi.setSystemTime(new Date("2026-11-17T00:00:00.000Z"));
    const html = renderToString(<Countdown endsAt={ENDS_AT} now={NOW} />);

    expect(html).toContain(">02<");
    expect(html).toContain(">03<");
    expect(html).toContain(">04<");
    expect(html).toContain(">05<");
  });
});
