import type { Meta, StoryObj } from "@storybook/react-vite";

import { StickyBuyBar } from "./sticky-buy-bar";

const meta = {
  title: "Product/StickyBuyBar",
  component: StickyBuyBar,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    visible: true,
    title: "iPhone 17 Pro 256 ГБ, синій титан",
    price: { amount: "64999", currencyCode: "UAH" },
    formId: "product-form",
    submit: { name: "add-to-cart", type: "submit" },
    // У сторіс панель стоїть у потоці й видна на будь-якій ширині.
    className: "static lg:block",
  },
  decorators: [
    (Story) => (
      <div className="w-96 max-w-full">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof StickyBuyBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Sale: Story = {
  args: {
    title: "MacBook Air 13 M4 16/256 ГБ, темна ніч",
    price: { amount: "49999", currencyCode: "UAH" },
    compareAt: { amount: "54499", currencyCode: "UAH" },
  },
};

export const Pending: Story = { args: { pending: true } };

/** Схована панель: зсунута вниз, прозора й недоступна. */
export const Hidden: Story = { args: { visible: false } };
