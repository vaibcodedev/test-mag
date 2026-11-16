import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  createDemoCartForm,
  DEMO_CART_LINE,
  DEMO_CART_LINE_SALE,
} from "~/components/cart/cart.fixtures";

import { CartLine } from "./cart-line";

/** На сайті форму дає useCartForm(); тут відправка нікуди не йде. */
const form = createDemoCartForm();

const meta = {
  title: "Cart/CartLine",
  component: CartLine,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { line: DEMO_CART_LINE, form, emptyCartFocusId: "story-cart-title", pending: false },
  decorators: [
    (Story) => (
      <ul role="list" className="max-w-md divide-y divide-line rounded-lg bg-surface px-6">
        <Story />
      </ul>
    ),
  ],
} satisfies Meta<typeof CartLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Кілька одиниць зі знижкою: ціна за штуку й стара ціна. */
export const SeveralWithDiscount: Story = { args: { line: DEMO_CART_LINE_SALE } };

/** Зміна ще не підтверджена сервером: значення тьмяні, кнопки активні. */
export const Pending: Story = { args: { pending: true } };

export const WithError: Story = {
  args: { error: "Стільки одиниць немає в наявності. Зменште кількість." },
};

/** Оптимістичний рядок одразу після «Купити»: ще без фото й назви товару. */
export const Optimistic: Story = {
  args: {
    pending: true,
    line: { id: "optimistic", quantity: 1, cost: { totalAmount: DEMO_CART_LINE.cost.totalAmount } },
  },
};

export const List: Story = {
  render: (args) => (
    <>
      <CartLine {...args} line={DEMO_CART_LINE} />
      <CartLine {...args} line={DEMO_CART_LINE_SALE} />
    </>
  ),
};
