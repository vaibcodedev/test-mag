import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_ORDERS } from "~/components/account/account.fixtures";

import { OrderCard } from "./order-card";
import type { AccountOrder } from "./order-card.types";

const order = (index: number) => DEMO_ORDERS[index] as AccountOrder;

const meta = {
  title: "Account/OrderCard",
  component: OrderCard,
  parameters: { surface: "page" },
  args: { order: order(0) },
} satisfies Meta<typeof OrderCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Одна позиція, оплату ще не отримано. */
export const Pending: Story = {};

/** Позицій більше, ніж плиток: остання плитка — лічильник «+3». */
export const ManyItems: Story = { args: { order: order(1) } };

/** Довга назва обрізається до двох рядків; позиція без фото — плитка з іконкою. */
export const LongTitleWithoutImage: Story = { args: { order: order(2) } };

export const ReadyForPickup: Story = { args: { order: order(3) } };

/** Скасоване замовлення: замість стану доставки — «Скасовано». */
export const Cancelled: Story = { args: { order: order(4) } };

/** Невідомий код оплати не показуємо; позицій немає — лишаються номер, дата й сума. */
export const UnknownStatusNoItems: Story = { args: { order: order(5) } };
