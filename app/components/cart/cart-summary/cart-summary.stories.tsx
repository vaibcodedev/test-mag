import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_CART_TOTALS } from "~/components/cart/cart.fixtures";
import { Button } from "~/components/ui/button";

import { CartSummary } from "./cart-summary";

const meta = {
  title: "Cart/CartSummary",
  component: CartSummary,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    ...DEMO_CART_TOTALS,
    pending: false,
    shopPay: true,
    secondaryAction: (
      <Button variant="ghost" className="w-full">
        Продовжити покупки
      </Button>
    ),
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm rounded-lg bg-surface p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CartSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Кошик змінюється: попередня сума лишається на місці, але тьмяна, а Shop Pay неактивний. */
export const Pending: Story = { args: { pending: true } };

/** Діє знижка на кошик: окремий рядок із сумою до сплати. */
export const WithDiscount: Story = {
  args: { total: { amount: "78997", currencyCode: "UAH" } },
};

/** Без швидкої оплати: лише перехід до оформлення. */
export const WithoutShopPay: Story = { args: { shopPay: false } };
