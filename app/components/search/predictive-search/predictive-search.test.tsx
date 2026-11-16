import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router";
import { beforeEach, describe, expect, it } from "vitest";

import { DEMO_PREDICTIVE_EMPTY, DEMO_PREDICTIVE_RESULT } from "~/components/search/search.fixtures";

import { PredictiveList } from "./predictive-list";
import { buildPredictiveOptions } from "./predictive-options";
import { PredictiveSearch, type PredictiveSearchProps } from "./predictive-search";

/** Адреси, на які ходив стор підказок. */
let requests: URL[] = [];
let failNext = false;

// Одна функція на всі тести: провайдер перестворює стор, коли fetch змінюється.
const fakeFetch: typeof fetch = async (input) => {
  const url = new URL(String(input), "http://localhost");
  requests.push(url);
  if (failNext) return new Response("boom", { status: 500 });
  const term = url.searchParams.get("q") ?? "";
  const body = term.startsWith("zz")
    ? { ...DEMO_PREDICTIVE_EMPTY, term }
    : { ...DEMO_PREDICTIVE_RESULT, term };
  return Response.json(body);
};

function CurrentLocation() {
  const location = useLocation();
  return <output data-testid="location">{`${location.pathname}${location.search}`}</output>;
}

function renderSearch(props: Partial<PredictiveSearchProps> = {}) {
  return render(
    <MemoryRouter>
      <PredictiveSearch fetch={fakeFetch} debounceInMs={0} {...props} />
      <button type="button">Інша кнопка</button>
      <CurrentLocation />
    </MemoryRouter>,
  );
}

const input = () => screen.getByRole("combobox", { name: "Пошук товарів" });
const activeOption = () => {
  const id = input().getAttribute("aria-activedescendant");
  return id ? document.getElementById(id) : null;
};

describe("PredictiveSearch", () => {
  beforeEach(() => {
    requests = [];
    failNext = false;
  });

  it("без JavaScript це GET-форма на /search з полем q", () => {
    const { container } = renderSearch({ defaultTerm: "mac" });
    const form = container.querySelector("form") as HTMLFormElement;

    expect(form).toHaveAttribute("method", "get");
    expect(form).toHaveAttribute("action", "/search");
    expect(form).toHaveAttribute("role", "search");
    expect(input()).toHaveAttribute("name", "q");
    expect(input()).toHaveValue("mac");
    expect(input()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("під час набору показує групи: запити, товари, категорії та рядок усіх результатів", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    const listbox = await screen.findByRole("listbox", { name: "Підказки пошуку" });

    expect(input()).toHaveAttribute("aria-expanded", "true");
    expect(input()).toHaveAttribute("aria-controls", listbox.id);

    const queries = within(listbox).getByRole("group", { name: "Часто шукають" });
    const products = within(listbox).getByRole("group", { name: "Товари" });
    const collections = within(listbox).getByRole("group", { name: "Категорії" });
    expect(within(queries).getAllByRole("option")).toHaveLength(1);
    expect(within(products).getAllByRole("option")).toHaveLength(2);
    expect(within(collections).getAllByRole("option")).toHaveLength(1);

    const product = within(products).getByRole("option", { name: /iPhone 17 Pro 256 ГБ/ });
    expect((product.textContent ?? "").replace(/\s/g, " ")).toContain("64 999 ₴");
    // Адресу будує Hydrogen: у ній лишаються параметри відстеження й сам запит.
    expect(product.getAttribute("href")).toContain("/products/iphone-17-pro-256-blue?");
    expect(product.getAttribute("href")).toContain("_pos=1");

    expect(
      within(listbox).getByRole("option", { name: "Усі результати за запитом «iphone»" }),
    ).toHaveAttribute("href", "/search?q=iphone");
  });

  it("запитує той самий маршрут /api/predictive-search із потрібними типами", async () => {
    renderSearch();

    await userEvent.setup().type(input(), "mac");
    await screen.findByRole("listbox");

    const last = requests.at(-1) as URL;
    expect(last.pathname).toBe("/api/predictive-search");
    expect(last.searchParams.get("q")).toBe("mac");
    expect(last.searchParams.get("types")).toBe("QUERY,PRODUCT,COLLECTION");
  });

  it("стрілки рухають вибір по колу, Enter відкриває вибрану підказку", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    await screen.findByRole("listbox");
    expect(activeOption()).toBeNull();

    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toHaveTextContent("iphone 17 pro");
    expect(activeOption()).toHaveAttribute("aria-selected", "true");

    await user.keyboard("{ArrowDown}");
    expect(activeOption()).toHaveTextContent("iPhone 17 Pro 256 ГБ");
    expect(screen.getAllByRole("option", { selected: true })).toHaveLength(1);

    // Угору з першого рядка — на останній: «Усі результати».
    await user.keyboard("{ArrowUp}{ArrowUp}");
    expect(activeOption()).toHaveTextContent("Усі результати за запитом «iphone»");
    await user.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}");
    expect(activeOption()).toHaveTextContent("iPhone 17 128 ГБ");

    await user.keyboard("{Enter}");
    expect(screen.getByTestId("location").textContent).toContain("/products/iphone-17-128-black");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    // Фокус увесь час лишається в полі.
    expect(input()).toHaveFocus();
  });

  it("Enter без вибраної підказки відкриває сторінку всіх результатів", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    await screen.findByRole("listbox");
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("location")).toHaveTextContent("/search?q=iphone");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("Escape закриває список і не стирає запит; стрілка відкриває знову", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    await screen.findByRole("listbox");
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input()).toHaveValue("iphone");
    expect(input()).toHaveAttribute("aria-expanded", "false");

    await user.keyboard("{ArrowDown}");
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    expect(activeOption()).toHaveTextContent("iphone 17 pro");
  });

  it("закривається, коли фокус іде з поля, і лишається відкритим під час кліку по списку", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    const listbox = await screen.findByRole("listbox");

    // Натискання мишею в списку не забирає фокус із поля.
    await user.pointer({ keys: "[MouseLeft>]", target: listbox });
    expect(input()).toHaveFocus();
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await user.pointer({ keys: "[/MouseLeft]" });

    await user.click(screen.getByRole("button", { name: "Інша кнопка" }));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("клік по підказці веде на її сторінку й закриває список", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    const listbox = await screen.findByRole("listbox");
    await user.click(within(listbox).getByRole("option", { name: "iPhone" }));

    expect(screen.getByTestId("location").textContent).toContain("/collections/iphone");
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("порожній результат: порада й посилання на Telegram, без списку", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "zzzz");

    expect(await screen.findByText(/Нічого не знайшли\. Перевірте назву або/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "напишіть нам у Telegram" })).toHaveAttribute(
      "href",
      "https://t.me/sad_vinnytsia",
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
    expect(input()).toHaveAttribute("aria-expanded", "false");
    // Для екранних читачів результат озвучує live-регіон біля поля.
    await waitFor(() =>
      expect(screen.getByText("Нічого не знайшли за запитом «zzzz»")).toHaveAttribute(
        "aria-live",
        "polite",
      ),
    );
  });

  it("помилка сервера: пояснення біля поля, рядок усіх результатів лишається", async () => {
    failNext = true;
    renderSearch();

    await userEvent.setup().type(input(), "mac");

    expect(await screen.findByRole("alert")).toHaveTextContent("Підказки зараз недоступні");
    expect(
      screen.getByRole("option", { name: "Усі результати за запитом «mac»" }),
    ).toBeInTheDocument();
  });

  it("стерли запит — список зникає", async () => {
    renderSearch();
    const user = userEvent.setup();

    await user.type(input(), "iphone");
    await screen.findByRole("listbox");
    await user.clear(input());

    await waitFor(() => expect(screen.queryByRole("listbox")).not.toBeInTheDocument());
  });
});

describe("PredictiveList", () => {
  const options = buildPredictiveOptions(DEMO_PREDICTIVE_RESULT.items, {
    idPrefix: "test",
    resultTerm: "iphone",
    typedTerm: "iphone",
  });
  const noOptions = buildPredictiveOptions(DEMO_PREDICTIVE_EMPTY.items, {
    idPrefix: "test",
    resultTerm: "",
    typedTerm: "iph",
  });

  it("під час першого завантаження показує «Шукаємо…» і рядок усіх результатів", () => {
    render(
      <MemoryRouter>
        <PredictiveList listId="list" status="loading" options={noOptions} />
      </MemoryRouter>,
    );

    expect(screen.getByText("Шукаємо…")).toBeInTheDocument();
    expect(screen.getAllByRole("option")).toHaveLength(1);
  });

  it("поки вантажиться новий запит, попередні підказки лишаються тьмяними", () => {
    render(
      <MemoryRouter>
        <PredictiveList listId="list" status="loading" options={options} />
      </MemoryRouter>,
    );

    expect(screen.getByRole("listbox")).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("group", { name: "Товари" })).toHaveClass("opacity-60");
    expect(screen.queryByText("Шукаємо…")).not.toBeInTheDocument();
  });

  it("позначає активну опцію й нічого не рендерить у стані idle", () => {
    const { rerender } = render(
      <MemoryRouter>
        <PredictiveList
          listId="list"
          status="success"
          options={options}
          activeId="test-product-1"
        />
      </MemoryRouter>,
    );

    expect(screen.getByRole("option", { selected: true })).toHaveTextContent("iPhone 17 128 ГБ");

    rerender(
      <MemoryRouter>
        <PredictiveList listId="list" status="idle" options={options} />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });
});
