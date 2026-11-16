import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "./breadcrumb";

function renderTrail() {
  return render(
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink href="/">Головна</BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <a href="/collections/iphone" data-router-link="">
              iPhone
            </a>
          </BreadcrumbLink>
        </BreadcrumbItem>
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbPage>iPhone 17 Pro</BreadcrumbPage>
        </BreadcrumbItem>
      </BreadcrumbList>
    </Breadcrumb>,
  );
}

describe("Breadcrumb", () => {
  it("це навігація з українським підписом", () => {
    renderTrail();

    expect(screen.getByRole("navigation", { name: "Навігаційний ланцюжок" })).toBeInTheDocument();
  });

  it("посилання мають ціль натискання 44px, asChild зберігає власний елемент", () => {
    renderTrail();
    const home = screen.getByRole("link", { name: "Головна" });
    const category = screen.getByRole("link", { name: "iPhone" });

    expect(home).toHaveAttribute("href", "/");
    expect(home).toHaveClass("min-h-11", "focus-ring");
    expect(category).toHaveAttribute("data-router-link");
    expect(category).toHaveAttribute("data-slot", "breadcrumb-link");
    expect(category).toHaveClass("min-h-11");
  });

  it("поточна сторінка не посилання і позначена aria-current", () => {
    renderTrail();
    const current = screen.getByText("iPhone 17 Pro");

    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass("text-ink");
    expect(screen.queryByRole("link", { name: "iPhone 17 Pro" })).not.toBeInTheDocument();
  });

  it("роздільники приховані від читачів екрана", () => {
    renderTrail();
    const list = screen.getByRole("list");

    expect(within(list).getAllByRole("listitem")).toHaveLength(3);
    expect(
      list.querySelectorAll('[data-slot="breadcrumb-separator"][aria-hidden="true"]'),
    ).toHaveLength(2);
  });
});
