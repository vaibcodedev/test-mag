import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_ORDERS } from "~/components/account/account.fixtures";

import { OrdersList } from "./orders-list";

const meta = {
  title: "Account/OrdersList",
  component: OrdersList,
  parameters: { surface: "page" },
  args: { orders: DEMO_ORDERS },
} satisfies Meta<typeof OrdersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Кнопки сторінок — варіант surface на сірому тлі. */
export const WithPages: Story = {
  args: { newerHref: "/account?before=a", olderHref: "/account?after=b" },
};

/** Завантажується інша сторінка списку: картки тьмяніють, біля заголовка — індикатор. */
export const Busy: Story = { args: { olderHref: "/account?after=b", busy: true } };

export const Empty: Story = { args: { orders: [] } };
