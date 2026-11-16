import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { secondsLeft, splitSeconds, useCountdown } from "./use-countdown";

const NOW = "2026-11-16T10:00:00.000Z";

describe("secondsLeft", () => {
  it("рахує цілі секунди до дати", () => {
    expect(secondsLeft("2026-11-16T10:00:10.000Z", NOW)).toBe(10);
  });

  it("для минулої або некоректної дати повертає 0", () => {
    expect(secondsLeft("2026-11-15T10:00:00.000Z", NOW)).toBe(0);
    expect(secondsLeft("не дата", NOW)).toBe(0);
  });
});

describe("splitSeconds", () => {
  it("розкладає секунди на дні, години, хвилини й секунди", () => {
    expect(splitSeconds(2 * 86400 + 3 * 3600 + 4 * 60 + 5)).toEqual({
      days: 2,
      hours: 3,
      minutes: 4,
      seconds: 5,
      totalSeconds: 183845,
      finished: false,
    });
  });
});

describe("useCountdown", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(NOW));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("повертає час до дати й оновлюється щосекунди", () => {
    const { result } = renderHook(() => useCountdown("2026-11-18T13:04:05.000Z"));

    expect(result.current).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 5 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current).toMatchObject({ days: 2, hours: 3, minutes: 4, seconds: 4 });

    act(() => {
      vi.advanceTimersByTime(5000);
    });
    expect(result.current).toMatchObject({ minutes: 3, seconds: 59, finished: false });
  });

  it("зупиняється на нулі й прибирає таймер", () => {
    const { result } = renderHook(() => useCountdown("2026-11-16T10:00:02.000Z"));

    expect(result.current?.totalSeconds).toBe(2);

    act(() => {
      vi.advanceTimersByTime(10_000);
    });

    expect(result.current).toMatchObject({ totalSeconds: 0, finished: true });
    expect(vi.getTimerCount()).toBe(0);
  });

  it("для минулої дати одразу завершений і не запускає таймер", () => {
    const { result } = renderHook(() => useCountdown("2026-11-01T00:00:00.000Z"));

    expect(result.current?.finished).toBe(true);
    expect(vi.getTimerCount()).toBe(0);
  });

  it("прибирає таймер після розмонтування", () => {
    const { unmount } = renderHook(() => useCountdown("2026-11-18T13:04:05.000Z"));

    expect(vi.getTimerCount()).toBe(1);
    unmount();
    expect(vi.getTimerCount()).toBe(0);
  });
});
