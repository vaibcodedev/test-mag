import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mapsUrl } from "~/lib/content/site";

import { projectToMap, ShowroomMap } from "./showroom-map";
import { SHOWROOM_MAP } from "./showroom-map.data";
import { SHOWROOM_MAP_DEMO_STORE } from "./showroom-map.demo";

describe("projectToMap", () => {
  it("ставить шоурум у точку, довкола якої збудовано схему", () => {
    const { latitude, longitude } = SHOWROOM_MAP.center;
    const { left, top } = projectToMap(latitude, longitude);

    // Трохи нижче центру: над позначкою лишається місце для картки з логотипом.
    expect(Number.parseFloat(left)).toBeCloseTo(50, 0);
    expect(Number.parseFloat(top)).toBeCloseTo(56, 0);
  });

  it("не випускає позначку за край, якщо координати поза схемою", () => {
    expect(projectToMap(50.45, 30.52)).toEqual({ left: "88.00%", top: "12.00%" });
  });
});

describe("дані схеми", () => {
  it("містять вулиці, вулицю шоуруму та підписи в межах полотна", () => {
    expect(SHOWROOM_MAP.minorRoads).toMatch(/^M/);
    expect(SHOWROOM_MAP.majorRoads).toMatch(/^M/);
    expect(SHOWROOM_MAP.homeStreet).toMatch(/^M/);
    expect(SHOWROOM_MAP.labels.length).toBeGreaterThan(0);
    for (const label of SHOWROOM_MAP.labels) {
      expect(label.x).toBeGreaterThanOrEqual(0);
      expect(label.x).toBeLessThanOrEqual(SHOWROOM_MAP.view.width);
      expect(label.y).toBeGreaterThanOrEqual(0);
      expect(label.y).toBeLessThanOrEqual(SHOWROOM_MAP.view.height);
    }
  });
});

describe("ShowroomMap", () => {
  it("схема — статичний SVG з підписом, без iframe", () => {
    const { container } = render(<ShowroomMap store={SHOWROOM_MAP_DEMO_STORE} />);

    expect(
      screen.getByRole("img", {
        name: "Схема району з позначкою шоуруму: Вінниця, вул. Соборна, 64",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("підписує вулиці з даних і джерело даних", () => {
    render(<ShowroomMap store={SHOWROOM_MAP_DEMO_STORE} />);

    for (const label of SHOWROOM_MAP.labels) {
      expect(screen.getByText(label.text)).toBeInTheDocument();
    }
    expect(screen.getByRole("link", { name: /OpenStreetMap/ })).toHaveAttribute(
      "href",
      "https://www.openstreetmap.org/copyright",
    );
  });

  it("елементів керування картою немає: лише посилання на Google Maps і джерело", () => {
    render(<ShowroomMap store={SHOWROOM_MAP_DEMO_STORE} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: /Відкрити в Google Maps/ })).toHaveAttribute(
      "href",
      mapsUrl(SHOWROOM_MAP_DEMO_STORE),
    );
  });
});
