import { act, render, waitFor } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";

import { Toaster, TOAST_MOBILE_OFFSET, TOAST_OFFSET } from "./sonner";

beforeAll(() => {
  // Sonner стежить за темою й розміром вікна через matchMedia, якого в jsdom немає.
  vi.stubGlobal(
    "matchMedia",
    vi.fn((query: string) => ({
      media: query,
      matches: false,
      addEventListener: () => {},
      removeEventListener: () => {},
      addListener: () => {},
      removeListener: () => {},
    })),
  );
});

afterEach(() => {
  act(() => {
    toast.dismiss();
  });
});

describe("Toaster", () => {
  it("відступ знизу рахується від змінної закріплених смуг, а не від власного числа", () => {
    expect(TOAST_OFFSET.bottom).toContain("var(--bottom-fixed-space");
    expect(TOAST_MOBILE_OFFSET.bottom).toContain("var(--bottom-fixed-space");
  });

  it("передає обидва відступи в Sonner: і для телефона, і для ширших екранів до lg", async () => {
    render(<Toaster />);
    act(() => {
      toast("Додано в кошик");
    });

    const toaster = await waitFor(() => {
      const element = document.querySelector<HTMLElement>("[data-sonner-toaster]");
      if (!element) throw new Error("Тостер ще не змонтовано");
      return element;
    });

    expect(toaster).toHaveAttribute("data-y-position", "bottom");
    expect(toaster.style.getPropertyValue("--offset-bottom")).toBe(TOAST_OFFSET.bottom);
    expect(toaster.style.getPropertyValue("--mobile-offset-bottom")).toBe(
      TOAST_MOBILE_OFFSET.bottom,
    );
  });
});
