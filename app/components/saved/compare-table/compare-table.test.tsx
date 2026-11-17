import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import { DEMO_SAVED_PRODUCTS, IPHONE_CATEGORY } from "~/components/saved/saved.fixtures";
import type { SavedProduct } from "~/lib/saved-lists";

import { buildCompareSections } from "./compare-rows";
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
      <CompareTable category={IPHONE_CATEGORY} products={[PRO, BASE]} {...props} />
    </MemoryRouter>,
  );
}

const rowLabels = () => screen.getAllByRole("rowheader").map((header) => header.textContent ?? "");
const sectionTitles = () =>
  screen
    .getAllByRole("columnheader")
    .filter((header) => header.getAttribute("scope") === "colgroup")
    .map((header) => header.textContent ?? "");

const rowsOf = (products: SavedProduct[]) =>
  buildCompareSections(products, IPHONE_CATEGORY).flatMap((section) => section.rows);

describe("buildCompareSections", () => {
  it("групує характеристики за схемою категорії й пропускає порожні групи", () => {
    const sections = buildCompareSections([PRO, BASE], IPHONE_CATEGORY);

    expect(sections.map((section) => section.title)).toEqual([
      "Загальне",
      "Екран",
      "Продуктивність",
      "Камера",
      "Корпус",
    ]);
    expect(sections[1]?.rows.map((row) => row.label)).toEqual(["Діагональ", "Тип екрана"]);
  });

  it("позначає рядки, де значення різні", () => {
    const differs = Object.fromEntries(rowsOf([PRO, BASE]).map((row) => [row.id, row.differs]));

    expect(differs).toMatchObject({
      availability: false,
      colors: true,
      warranty: false,
      "spec-display_size": false,
      "spec-chip": true,
      "spec-camera_tele": true,
      "spec-weight": true,
    });
  });

  it("рядки стану й акумулятора з'являються лише разом з уживаним пристроєм", () => {
    expect(rowsOf([PRO, BASE]).map((row) => row.id)).not.toContain("condition");

    const rows = rowsOf([PRO, USED]);
    expect(rows.map((row) => row.id)).toEqual(
      expect.arrayContaining(["condition", "battery-health"]),
    );
    expect(rows.find((row) => row.id === "condition")?.cells.map((cell) => cell.key)).toEqual([
      "Новий",
      "Відмінний",
    ]);
    expect(rows.find((row) => row.id === "warranty")?.cells.map((cell) => cell.key)).toEqual([
      "12 місяців",
      "6 місяців",
    ]);
  });

  it("товар без значення характеристики отримує порожню клітинку", () => {
    const partial = { ...BASE, specs: { chip: "A19" } };
    const weight = rowsOf([PRO, partial]).find((row) => row.id === "spec-weight");

    expect(weight?.cells.map((cell) => cell.key)).toEqual(["206 г", ""]);
    expect(weight?.differs).toBe(true);
  });

  it("без метаполя custom.specs показує опції та короткі характеристики товару", () => {
    const bare = (product: SavedProduct) => ({ ...product, specs: {} });
    const sections = buildCompareSections([bare(PRO), bare(BASE)], IPHONE_CATEGORY);

    expect(sections.map((section) => section.title)).toEqual(["Загальне", "Характеристики"]);
    expect(sections[1]?.rows.map((row) => row.label)).toEqual(["Пам'ять", "Головне"]);
  });

  it("товар без жодних даних лишає тільки загальні рядки", () => {
    const empty = { ...BASE, options: [], shortSpecs: [], specs: {} };

    expect(rowsOf([empty]).map((row) => row.id)).toEqual(["availability", "warranty"]);
  });
});

describe("CompareTable", () => {
  it("це таблиця з підписом, заголовками колонок, груп і рядків", () => {
    renderTable();
    const table = screen.getByRole("table", {
      name: "Порівняння характеристик iPhone: 2 товари",
    });

    for (const header of within(table).getAllByRole("rowheader")) {
      expect(header).toHaveAttribute("scope", "row");
    }
    expect(within(table).getByRole("link", { name: PRO.title })).toHaveAttribute(
      "href",
      `/products/${PRO.handle}`,
    );
    expect(sectionTitles()).toEqual(["Загальне", "Екран", "Продуктивність", "Камера", "Корпус"]);
    expect(rowLabels()).toEqual([
      "Наявність",
      "Кольори",
      "Гарантія",
      "Діагональ",
      "Тип екрана",
      "Чип",
      "Пам'ять",
      "Основна камера",
      "Телеоб'єктив",
      "Захист від води",
      "Вага",
    ]);
  });

  it("показує ціну кожного товару в шапці та значення в клітинках рядка", () => {
    renderTable();

    const summary = screen.getAllByRole("row")[1] as HTMLElement;
    expect(summary).toHaveTextContent("64 999");
    expect(summary).toHaveTextContent("44 999");

    const chip = screen.getByRole("row", { name: /^Чип/ });
    expect(
      within(chip)
        .getAllByRole("cell")
        .slice(0, 2)
        .map((cell) => cell.textContent),
    ).toEqual(["A19 Pro", "A19"]);
  });

  it("«Лише відмінності» ховає однакові рядки й порожні групи та повертає їх назад", async () => {
    renderTable();
    const toggle = screen.getByRole("switch", { name: "Лише відмінності" });
    expect(toggle).not.toBeChecked();

    await userEvent.click(toggle);
    expect(toggle).toBeChecked();
    expect(rowLabels()).toEqual(["Кольори", "Чип", "Пам'ять", "Телеоб'єктив", "Вага"]);
    expect(sectionTitles()).toEqual(["Загальне", "Продуктивність", "Камера", "Корпус"]);

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

  it("широку таблицю можна прокрутити з клавіатури", () => {
    renderTable();

    const region = screen.getByRole("region", { name: "Таблиця порівняння: iPhone" });
    expect(region).toHaveAttribute("tabindex", "0");
    expect(within(region).getByRole("table")).toBeVisible();
  });

  it("назва рядка для телефона продубльована над значеннями й прихована від читачів екрана", () => {
    renderTable();

    const chip = screen.getByRole("row", { name: /^Чип/ });
    const mobileLabel = chip.previousElementSibling as HTMLElement;
    expect(mobileLabel).toHaveAttribute("aria-hidden", "true");
    expect(mobileLabel).toHaveTextContent("Чип");
  });

  it("пояснює, коли відмінностей немає", async () => {
    renderTable({ products: [BASE, { ...BASE, handle: "iphone-17-256-black-copy" }] });

    await userEvent.click(screen.getByRole("switch", { name: "Лише відмінності" }));

    expect(screen.getByText(/За цими характеристиками товари однакові/)).toBeVisible();
    expect(screen.queryAllByRole("rowheader")).toHaveLength(0);
  });

  it("вільне місце веде до каталогу цієї категорії", () => {
    renderTable();

    expect(screen.getByText("2 з 4 моделей iPhone")).toBeVisible();
    const add = screen.getByRole("link", { name: /Додати iPhone/ });
    expect(add).toHaveAttribute("href", "/collections/iphone");
    expect(add).toHaveTextContent("Ще 2 місця");
  });

  it("повна таблиця не пропонує додати ще й показує не більше чотирьох товарів", () => {
    renderTable({
      products: [...DEMO_SAVED_PRODUCTS, { ...BASE, handle: "fifth", title: "П'ятий товар" }],
    });

    expect(screen.queryByRole("link", { name: /Додати iPhone/ })).toBeNull();
    expect(screen.queryByRole("link", { name: "П'ятий товар" })).toBeNull();
    expect(screen.getByText(/Щоб додати іншу, приберіть одну зі списку/)).toBeVisible();
  });

  it("для одного товару перемикача відмінностей немає", () => {
    renderTable({ products: [PRO] });

    expect(screen.queryByRole("switch")).toBeNull();
    expect(
      screen.getByRole("table", { name: "Порівняння характеристик iPhone: 1 товар" }),
    ).toBeVisible();
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

  it("товар із кількома варіантами веде на свою сторінку, щоб обрати варіант", () => {
    renderTable();

    expect(screen.queryByRole("button", { name: `Купити: ${PRO.title}` })).toBeNull();
    expect(screen.getByRole("link", { name: `Обрати варіант: ${PRO.title}` })).toHaveAttribute(
      "href",
      `/products/${PRO.handle}`,
    );
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
