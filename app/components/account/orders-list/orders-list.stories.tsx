import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_ORDERS } from "~/components/account/account.fixtures";
import { DEFAULT_ORDERS_CHOICE } from "~/lib/account/orders-list";

import { OrdersList } from "./orders-list";

const meta = {
  title: "Account/OrdersList",
  component: OrdersList,
  parameters: { surface: "page" },
  args: { orders: DEMO_ORDERS.slice(0, 4), choice: DEFAULT_ORDERS_CHOICE },
} satisfies Meta<typeof OrdersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Кнопки сторінок — варіант surface на сірому тлі. */
export const WithPages: Story = {
  args: { previousHref: "/account?before=a", nextHref: "/account?after=b" },
};

/** Завантажується інша сторінка списку: картки тьмяніють, біля заголовка — індикатор. */
export const Busy: Story = { args: { nextHref: "/account?after=b", busy: true } };

/** Замовлень ще не було: вибору періоду й сортування немає. */
export const Empty: Story = { args: { orders: [] } };

/** За вибраний період нічого не знайшлося: вибір лишається, щоб змінити період. */
export const EmptyPeriod: Story = {
  args: { orders: [], choice: { sort: "new", period: "30d" } },
};
