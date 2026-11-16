import type { Meta, StoryObj } from "@storybook/react-vite";
import { OrdersList, type AccountOrder } from "./orders-list";

const uah = (amount: string) => ({ amount, currencyCode: "UAH" });

const ORDERS: AccountOrder[] = [
  {
    id: "gid://shopify/Order/1003",
    name: "#1003",
    processedAt: "2026-11-12T14:20:00+02:00",
    financialStatus: "PAID",
    statusPageUrl: "https://example.com/orders/1003",
    totalPrice: uah("64999.0"),
  },
  {
    id: "gid://shopify/Order/1002",
    name: "#1002",
    processedAt: "2026-10-03T10:05:00+03:00",
    financialStatus: "PENDING",
    statusPageUrl: "https://example.com/orders/1002",
    totalPrice: uah("11499.0"),
  },
  {
    id: "gid://shopify/Order/1001",
    name: "#1001",
    processedAt: "2026-08-21T18:40:00+03:00",
    financialStatus: "REFUNDED",
    statusPageUrl: "https://example.com/orders/1001",
    totalPrice: uah("2399.0"),
  },
];

const meta = {
  title: "Account/OrdersList",
  component: OrdersList,
  parameters: { surface: "page" },
  args: { orders: ORDERS },
} satisfies Meta<typeof OrdersList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Кнопки сторінок — варіант surface на сірому тлі. */
export const WithPages: Story = {
  args: { newerHref: "/account?page=1", olderHref: "/account?page=3" },
};

export const Busy: Story = { args: { olderHref: "/account?page=2", busy: true } };

export const Empty: Story = { args: { orders: [] } };
