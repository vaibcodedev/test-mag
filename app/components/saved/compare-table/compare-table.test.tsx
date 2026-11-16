import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { DEMO_SAVED_PRODUCTS } from "~/components/saved/saved.fixtures";
import type { SavedProduct } from "~/lib/saved-lists";

import { buildCompareRows } from "./compare-rows";
import { CompareTable, type CompareTableProps } from "./compare-table";

const [PRO, BASE, USED, SOLD_OUT] = DEMO_SAVED_PRODUCTS as [
  SavedProduct,
  SavedProduct,
  SavedProduct,
  SavedProduct,
];

function renderTable(props: Partial<CompareTableProps> = {}) {
  return render(
    <MemoryRouter>
      <CompareTable products={[PRO, BASE]} {...props} />
    </MemoryRouter>,
  );
}

const rowLabels = () => screen.getAllByRole("rowheader").map((header) => header.textContent ?? "");

describe("buildCompareRows", () => {
  it("позначає рядки, де значення різні", () => {
    const rows = buildCompareRows([PRO, BASE]);
    const differs = Object.fromEntries(rows.map((row) => [row.id, row.differs]));

    expect(differs).toMatchObject({
      price: true,
      availability: false,
      "option-Пам'ять": true,
      specs: true,
      warranty: false,
      vendor: false,
      type: false,
    });
  });

  it("рядки стану й акумулятора з'являються лише разом з уживаним пристроєм", () => {
    expect(buildCompareRows([PRO, BASE]).map((row) => row.id)).not.toContain("condition");

    const rows = buildCompareRows([PRO, USED]);
    expect(rows.map((row) => row.id)).toEqual(expect.arrayContaining(["condition", "battery"]));
    expect(rows.find((row) => row.id === "condition")?.cells.map((cell) => cell.key)).toEqual([
      "Новий",
      "Відмінний",
    ]);
    expect(rows.find((row) => row.id === "warranty")?.cells.map((cell) => cell.key)).toEqual([
      "12 місяців",
      "6 місяців",
    ]);
  });

  it("не додає рядки, для яких немає даних у жодного товару", () => {
    const bare = { ...BASE, vendor: null, productType: null, options: [], shortSpecs: [] };

    expect(buildCompareRows([bare]).map((row) => row.id)).toEqual([
      "price",
      "availability",
      "warranty",
    ]);
  });
});

describe("CompareTable", () => {
  it("це таблиця з підписом, заголовками колонок і рядків", () => {
    renderTable();
    const table = screen.getByRole("table", { name: "Порівняння характеристик: 2 товари" });

    const columns = within(table).getAllByRole("columnheader");
    expect(columns).toHaveLength(3);
    for (const column of columns) expect(column).toHaveAttribute("scope", "col");
    for (const header of within(table).getAllByRole("rowheader")) {
      expect(header).toHaveAttribute("scope", "row");
    }

    expect(within(table).getByRole("link", { name: PRO.title })).toHaveAttribute(
      "href",
      `/products/${PRO.handle}`,
    );
    expect(rowLabels()).toEqual([
      "Ціна",
      "Наявність",
      "Пам'ять",
      "Колір",
      "Характеристики",
      "Гарантія",
      "Виробник",
      "Тип",
      "Купівля",
    ]);
  });

  it("показує значення товарів у клітинках рядка", () => {
    renderTable();
    const memory = screen.getByRole("row", { name: /^Пам'ять/ });

    expect(
      within(memory)
        .getAllByRole("cell")
        .map((cell) => cell.textContent),
    ).toEqual(["256 ГБ, 512 ГБ, 1 ТБ", "256 ГБ, 512 ГБ"]);
  });

  it("«Лише відмінності» ховає однакові рядки й повертає їх назад", async () => {
    renderTable();
    const toggle = screen.getByRole("switch", { name: "Лише відмінності" });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(rowLabels()).toEqual(["Ціна", "Пам'ять", "Колір", "Характеристики", "Купівля"]);

    await userEvent.click(toggle);
    expect(toggle).not.toBeChecked();
    expect(rowLabels()).toContain("Гарантія");
  });

  it("перемикач вмикається й кліком по підпису", async () => {
    renderTable();

    await userEvent.click(screen.getByText("Лише відмінності"));

    expect(screen.getByRole("switch", { name: "Лише відмінності" })).toBeChecked();
    expect(rowLabels()).not.toContain("Гарантія");
  });

  it("широку таблицю можна прокрутити з клавіатури, а назви рядків закріплено", () => {
    renderTable();

    const region = screen.getByRole("region", { name: "Таблиця порівняння товарів" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByRole("table")).toHaveAttribute("data-sticky-first", "true");
  });

  it("пояснює, коли відмінностей немає", async () => {
    renderTable({ products: [PRO, { ...PRO, handle: "copy" }] });

    await userEvent.click(screen.getByRole("switch", { name: "Лише відмінності" }));

    expect(rowLabels()).toEqual(["Купівля"]);
    expect(screen.getByRole("status")).toHaveTextContent("товари однакові");
  });

  it("для одного товару перемикача відмінностей немає", () => {
    renderTable({ products: [PRO] });

    expect(screen.queryByRole("switch")).toBeNull();
    expect(screen.getByRole("table", { name: "Порівняння характеристик: 1 товар" })).toBeVisible();
  });

  it("«Купити» та кнопка видалення передають свій товар", async () => {
    const onAddToCart = vi.fn();
    const onRemove = vi.fn();
    renderTable({ onAddToCart, onRemove });

    await userEvent.click(screen.getByRole("button", { name: `Купити: ${BASE.title}` }));
    expect(onAddToCart).toHaveBeenCalledWith(BASE);

    await userEvent.click(
      screen.getByRole("button", { name: `Прибрати з порівняння: ${PRO.title}` }),
    );
    expect(onRemove).toHaveBeenCalledWith(PRO);
  });

  it("товар без наявності веде на свою сторінку замість «Купити»", () => {
    renderTable({ products: [PRO, SOLD_OUT] });

    expect(screen.queryByRole("button", { name: `Купити: ${SOLD_OUT.title}` })).toBeNull();
    expect(screen.getByRole("link", { name: `Докладніше: ${SOLD_OUT.title}` })).toHaveAttribute(
      "href",
      `/products/${SOLD_OUT.handle}`,
    );
  });

  it("без товарів нічого не рендерить", () => {
    const { container } = renderTable({ products: [] });

    expect(container).toBeEmptyDOMElement();
  });
});
