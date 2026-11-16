import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { ProductGallery } from "./product-gallery";

const IMAGE = {
  url: "https://cdn.shopify.com/iphone.png",
  altText: "iPhone 17 Pro спереду",
  width: 1000,
  height: 1000,
};

describe("ProductGallery", () => {
  it("головне фото вантажиться одразу з високим пріоритетом", () => {
    render(<ProductGallery images={[IMAGE]} title="iPhone 17 Pro" />);
    const image = screen.getByRole("img", { name: "iPhone 17 Pro спереду" });

    expect(image).toHaveAttribute("loading", "eager");
    expect(image).toHaveAttribute("fetchpriority", "high");
    expect(image.getAttribute("srcset")).toContain("width=720 720w");
  });

  it("без alt у фото підставляє назву товару", () => {
    render(<ProductGallery images={[{ ...IMAGE, altText: null }]} title="iPhone 17 Pro" />);

    expect(screen.getByRole("img", { name: "iPhone 17 Pro" })).toBeInTheDocument();
  });

  it("без фото пояснює, що їх ще немає", () => {
    render(<ProductGallery images={[]} title="iPhone 17 Pro" />);

    expect(screen.getByText("Фото цього товару ще готуємо")).toBeInTheDocument();
    expect(screen.queryByRole("img")).toBeNull();
  });
});
