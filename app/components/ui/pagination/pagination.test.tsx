import { render, screen } from "@testing-library/react";
import { Link, MemoryRouter } from "react-router";
import { describe, expect, it } from "vitest";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "./pagination";

function renderPagination({ first = false }: { first?: boolean } = {}) {
  return render(
    <MemoryRouter>
      <Pagination>
        <PaginationContent>
          <PaginationItem>
            {first ? <PaginationPrevious disabled /> : <PaginationPrevious href="?page=1" />}
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="?page=1" page={1} isActive={first} />
          </PaginationItem>
          <PaginationItem>
            <PaginationLink href="?page=2" page={2} isActive={!first} />
          </PaginationItem>
          <PaginationItem>
            <PaginationEllipsis />
          </PaginationItem>
          <PaginationItem>
            <PaginationNext asChild>
              <Link to="/collections/iphone?page=3" data-router-link="" />
            </PaginationNext>
          </PaginationItem>
        </PaginationContent>
      </Pagination>
    </MemoryRouter>,
  );
}

describe("Pagination", () => {
  it("це навігація з українськими підписами", () => {
    renderPagination();

    expect(screen.getByRole("navigation", { name: "Сторінки" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Попередня сторінка" })).toHaveAttribute(
      "href",
      "?page=1",
    );
    expect(screen.getByRole("link", { name: "Наступна сторінка" })).toHaveAttribute(
      "href",
      "/collections/iphone?page=3",
    );
    expect(screen.getByText("Більше сторінок")).toHaveClass("sr-only");
  });

  it("поточна сторінка синя і позначена aria-current, решта — surface", () => {
    renderPagination();
    const current = screen.getByRole("link", { name: "Сторінка 2" });
    const idle = screen.getByRole("link", { name: "Сторінка 1" });

    expect(current).toHaveAttribute("aria-current", "page");
    expect(current).toHaveClass("bg-blue", "text-surface", "size-11");
    expect(current).toHaveTextContent("2");
    expect(idle).not.toHaveAttribute("aria-current");
    expect(idle).toHaveClass("bg-surface", "text-ink");
  });

  it("asChild зберігає власний елемент посилання і підставляє стрілку з текстом", () => {
    renderPagination();
    const next = screen.getByRole("link", { name: "Наступна сторінка" });

    expect(next).toHaveAttribute("data-router-link");
    expect(next).toHaveAttribute("data-slot", "pagination-link");
    expect(next).toHaveAttribute("rel", "next");
    expect(next).toHaveTextContent("Наступна");
    expect(next.querySelector("svg")).toBeInTheDocument();
  });

  it("на першій сторінці «Попередня» вимкнена: без href і з aria-disabled", () => {
    renderPagination({ first: true });
    const previous = screen.getByRole("link", { name: "Попередня сторінка" });

    expect(previous.tagName).toBe("SPAN");
    expect(previous).toHaveAttribute("aria-disabled", "true");
    expect(previous).not.toHaveAttribute("href");
    expect(previous).not.toHaveAttribute("rel");
    expect(previous).toHaveClass("pointer-events-none", "opacity-45");
  });

  it("вимкнене посилання з asChild не рендерить переданий елемент", () => {
    render(
      <MemoryRouter>
        <PaginationNext asChild disabled>
          <Link to="/collections/iphone?page=9" />
        </PaginationNext>
      </MemoryRouter>,
    );
    const next = screen.getByRole("link", { name: "Наступна сторінка" });

    expect(next.tagName).toBe("SPAN");
    expect(next).toHaveTextContent("Наступна");
    expect(document.querySelector("a")).not.toBeInTheDocument();
  });
});
