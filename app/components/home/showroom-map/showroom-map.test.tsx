import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { mapsUrl } from "~/lib/content/site";

import { projectToMap, ShowroomMap } from "./showroom-map";
import { SHOWROOM_MAP_DEMO_STORE } from "./showroom-map.demo";

describe("projectToMap", () => {
  it("ставить шоурум на Соборній ближче до центру схеми", () => {
    expect(projectToMap(49.2331, 28.4682)).toEqual({ left: "45.50%", top: "49.38%" });
  });

  it("не випускає позначку за край, якщо координати поза схемою", () => {
    expect(projectToMap(50.45, 30.52)).toEqual({ left: "88.00%", top: "12.00%" });
  });
});

describe("ShowroomMap", () => {
  it("схема — статичний SVG з підписом, без iframe", () => {
    const { container } = render(<ShowroomMap store={SHOWROOM_MAP_DEMO_STORE} />);

    expect(
      screen.getByRole("img", {
        name: "Схема центру Вінниці з позначкою шоуруму: вул. Соборна, 64",
      }),
    ).toBeInTheDocument();
    expect(container.querySelector("iframe")).toBeNull();
  });

  it("єдиний елемент керування — справжнє посилання на Google Maps", () => {
    render(<ShowroomMap store={SHOWROOM_MAP_DEMO_STORE} />);

    expect(screen.queryByRole("button")).toBeNull();
    expect(screen.getByRole("link", { name: /Відкрити в Google Maps/ })).toHaveAttribute(
      "href",
      mapsUrl(SHOWROOM_MAP_DEMO_STORE),
    );
  });
});
