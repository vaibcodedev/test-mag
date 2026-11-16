import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./table";

function renderCompare(props: Parameters<typeof Table>[0] = {}) {
  return render(
    <Table {...props}>
      <TableHeader>
        <TableRow>
          <TableHead>Характеристика</TableHead>
          <TableHead>iPhone 17 Pro</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <TableRow>
          <TableHead scope="row">Пам&apos;ять</TableHead>
          <TableCell>256 ГБ</TableCell>
        </TableRow>
      </TableBody>
    </Table>,
  );
}

describe("Table", () => {
  it("рендерить таблицю в обгортці з горизонтальною прокруткою", () => {
    renderCompare();
    const table = screen.getByRole("table");

    expect(table.parentElement).toHaveClass("overflow-x-auto");
    expect(table.parentElement).not.toHaveAttribute("tabindex");
    expect(table).toHaveClass("text-small");
  });

  it("заголовки колонок і рядків мають правильний scope", () => {
    renderCompare();

    expect(screen.getByRole("columnheader", { name: "iPhone 17 Pro" })).toHaveAttribute(
      "scope",
      "col",
    );
    expect(screen.getByRole("rowheader", { name: "Пам'ять" })).toHaveAttribute("scope", "row");
    expect(screen.getByRole("columnheader", { name: "iPhone 17 Pro" })).toHaveClass(
      "text-caption",
      "font-semibold",
      "text-muted-foreground",
    );
  });

  it("stickyFirstColumn закріплює першу колонку", () => {
    renderCompare({ stickyFirstColumn: true });

    expect(screen.getByRole("table")).toHaveAttribute("data-sticky-first", "true");
    expect(screen.getByRole("table")).toHaveClass("[&_tr>*:first-child]:sticky");
  });

  it("scrollLabel робить обгортку регіоном, доступним із клавіатури", () => {
    renderCompare({ scrollLabel: "Порівняння товарів" });
    const region = screen.getByRole("region", { name: "Порівняння товарів" });

    expect(region).toHaveAttribute("tabindex", "0");
    expect(region).toContainElement(screen.getByRole("table"));
  });
});
