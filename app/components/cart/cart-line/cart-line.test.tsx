import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { describe, expect, it, vi } from "vitest";

import {
  createDemoCartForm,
  DEMO_CART_LINE,
  DEMO_CART_LINE_SALE,
  type DemoCartSubmit,
} from "~/components/cart/cart.fixtures";

import { CartLine, QUANTITY_HINT, type CartLineProps } from "./cart-line";

const text = (element: HTMLElement) => (element.textContent ?? "").replace(/\s/g, " ");

function renderLine(props: Partial<CartLineProps> = {}, onSubmit?: (s: DemoCartSubmit) => void) {
  return render(
    <MemoryRouter>
      <h2 id="cart-title" tabIndex={-1}>
        Кошик
      </h2>
      <ul>
        <CartLine
          line={DEMO_CART_LINE}
          form={createDemoCartForm(onSubmit)}
          emptyCartFocusId="cart-title"
          {...props}
        />
      </ul>
    </MemoryRouter>,
  );
}

describe("CartLine", () => {
  it("показує назву-посилання, опції варіанта й суму рядка", () => {
    renderLine();
    const line = screen.getByTestId("cart-line");

    expect(screen.getByRole("link", { name: "iPhone 17 Pro" })).toHaveAttribute(
      "href",
      "/products/iphone-17-pro",
    );
    expect(text(line)).toContain("256 ГБ · Синій титан");
    expect(text(line)).toContain("64 999 ₴");
    expect(text(line)).not.toContain("за шт.");
  });

  it("для кількох одиниць показує ціну за штуку, стару ціну й ховає Default Title", () => {
    renderLine({ line: DEMO_CART_LINE_SALE });
    const line = screen.getByTestId("cart-line");

    expect(text(line)).toContain("17 998 ₴");
    expect(text(line)).toContain("8 999 ₴ за шт.");
    expect(text(line)).toContain("Стара ціна: 9 999 ₴");
    expect(text(line)).not.toContain("Default Title");
  });

  it("форма тримається контракту Hydrogen: прихована кнопка set, lineId і поле кількості", () => {
    const { container } = renderLine();
    const form = container.querySelector("form") as HTMLFormElement;

    expect(form).toHaveAttribute("method", "post");
    expect(form).toHaveAttribute("action", "/api/cart");
    // Кнопка set стоїть першою: саме вона спрацьовує на Enter у полі кількості.
    const firstButton = form.querySelector("button") as HTMLButtonElement;
    expect(firstButton).toHaveAttribute("value", "set");
    expect(firstButton).toHaveAttribute("hidden");
    expect(form.querySelector('input[name="lineId"]')).toHaveValue(DEMO_CART_LINE.id);
    expect(screen.getByRole("textbox", { name: "Кількість" })).toHaveValue("1");
  });

  it("«плюс», «мінус» і «прибрати» відправляють свій intent для цього рядка", async () => {
    const onSubmit = vi.fn();
    renderLine({ line: DEMO_CART_LINE_SALE }, onSubmit);
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Збільшити кількість" }));
    await user.click(screen.getByRole("button", { name: "Зменшити кількість" }));
    await user.click(screen.getByRole("button", { name: "Прибрати з кошика: AirPods 4" }));

    expect(onSubmit.mock.calls.map(([submit]) => submit.intent)).toEqual([
      "increase",
      "decrease",
      "remove",
    ]);
    expect(onSubmit).toHaveBeenLastCalledWith(
      expect.objectContaining({ lineId: DEMO_CART_LINE_SALE.id }),
    );
  });

  it("Enter у полі кількості відправляє intent set із введеним числом", async () => {
    const onSubmit = vi.fn();
    renderLine({}, onSubmit);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name: "Кількість" });

    await user.clear(input);
    await user.type(input, "3{Enter}");

    expect(onSubmit).toHaveBeenCalledWith({
      intent: "set",
      lineId: DEMO_CART_LINE.id,
      quantity: "3",
    });
  });

  it("Enter відправляє форму один раз, а change після втрати фокуса вже нічого не шле", async () => {
    const onSubmit = vi.fn();
    const { rerender } = renderLine({}, onSubmit);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name: "Кількість" });

    await user.clear(input);
    await user.type(input, "3{Enter}");
    expect(onSubmit).toHaveBeenCalledTimes(1);

    // Стор кошика оптимістично оновив рядок; браузер після blur надсилає change → submit.
    rerender(
      <MemoryRouter>
        <h2 id="cart-title" tabIndex={-1}>
          Кошик
        </h2>
        <ul>
          <CartLine
            line={{ ...DEMO_CART_LINE, quantity: 3 }}
            form={createDemoCartForm(onSubmit)}
            emptyCartFocusId="cart-title"
          />
        </ul>
      </MemoryRouter>,
    );
    const form = input.closest("form") as HTMLFormElement;
    form.requestSubmit(form.querySelector<HTMLButtonElement>('button[value="set"]'));

    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it("нечислове значення: нічого не відправляє, повертає останню кількість і пояснює", async () => {
    const onSubmit = vi.fn();
    renderLine({}, onSubmit);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name: "Кількість" });

    await user.clear(input);
    await user.type(input, "abc{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue("1");
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent(QUANTITY_HINT);
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);

    // Підказка зникає, щойно людина починає вводити знову.
    await user.type(input, "2");
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("порожнє поле теж не відправляється", async () => {
    const onSubmit = vi.fn();
    renderLine({}, onSubmit);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name: "Кількість" });

    await user.clear(input);
    await user.type(input, "{Enter}");

    expect(onSubmit).not.toHaveBeenCalled();
    expect(input).toHaveValue("1");
    expect(screen.getByRole("alert")).toHaveTextContent(QUANTITY_HINT);
  });

  it("кількість 0 відправляється як set і переводить фокус на заголовок кошика", async () => {
    const onSubmit = vi.fn();
    renderLine({}, onSubmit);
    const user = userEvent.setup();
    const input = screen.getByRole("textbox", { name: "Кількість" });

    await user.clear(input);
    await user.type(input, "0{Enter}");

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith(
      expect.objectContaining({ intent: "set", quantity: "0" }),
    );
    expect(screen.getByRole("heading", { name: "Кошик" })).toHaveFocus();
  });

  it("кнопки кількості мають ціль натискання 44px і підпис", () => {
    renderLine();
    const group = screen.getByRole("group", { name: "Кількість: iPhone 17 Pro" });

    for (const button of within(group).getAllByRole("button")) {
      expect(button).toHaveClass("size-11");
      expect(button).toHaveAccessibleName();
    }
    // Остання одиниця: «мінус» прибирає рядок і каже про це.
    expect(
      within(group).getByRole("button", { name: "Прибрати останню одиницю" }),
    ).toBeInTheDocument();
  });

  it("у стані pending значення тьмяніють, а кнопки лишаються активними", () => {
    renderLine({ pending: true });
    const line = screen.getByTestId("cart-line");

    expect(line).toHaveAttribute("aria-busy", "true");
    expect(line).toHaveAttribute("data-pending", "true");
    expect(screen.getByRole("textbox", { name: "Кількість" })).toHaveClass("opacity-50");
    expect(screen.getByRole("button", { name: "Збільшити кількість" })).toBeEnabled();
    expect(screen.getByRole("button", { name: /Прибрати з кошика/ })).toBeEnabled();
  });

  it("без pending рядок не позначений як зайнятий", () => {
    renderLine();

    expect(screen.getByTestId("cart-line")).not.toHaveAttribute("aria-busy");
    expect(screen.getByRole("textbox", { name: "Кількість" })).not.toHaveClass("opacity-50");
  });

  it("помилка рядка стоїть поруч і прив'язана до поля кількості", () => {
    renderLine({ error: "Стільки одиниць немає в наявності. Зменште кількість." });
    const alert = screen.getByRole("alert");
    const input = screen.getByRole("textbox", { name: "Кількість" });

    expect(alert).toHaveTextContent("Стільки одиниць немає в наявності");
    expect(input).toHaveAttribute("aria-invalid", "true");
    expect(input).toHaveAttribute("aria-describedby", alert.id);
  });

  it("перед видаленням рядка фокус переходить на таку саму кнопку сусіднього", async () => {
    const form = createDemoCartForm();
    render(
      <MemoryRouter>
        <ul>
          <CartLine line={DEMO_CART_LINE} form={form} emptyCartFocusId="cart-title" />
          <CartLine line={DEMO_CART_LINE_SALE} form={form} emptyCartFocusId="cart-title" />
        </ul>
      </MemoryRouter>,
    );
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Прибрати з кошика: iPhone 17 Pro" }));

    expect(screen.getByRole("button", { name: "Прибрати з кошика: AirPods 4" })).toHaveFocus();
  });

  it("коли прибирають єдиний рядок, фокус переходить на заголовок кошика", async () => {
    renderLine();
    const user = userEvent.setup();

    await user.click(screen.getByRole("button", { name: "Прибрати з кошика: iPhone 17 Pro" }));

    expect(screen.getByRole("heading", { name: "Кошик" })).toHaveFocus();
  });

  it("оптимістичний рядок без товару й фото рендериться без посилання", () => {
    renderLine({
      line: {
        id: "optimistic",
        quantity: 1,
        cost: { totalAmount: DEMO_CART_LINE.cost.totalAmount },
      },
    });

    expect(screen.getByRole("heading", { name: "Товар" })).toBeInTheDocument();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
