import type { Meta, StoryObj } from "@storybook/react-vite";

import { STORE_INFO } from "~/lib/content/site";

import { AccountView, type AccountCustomer } from "./account-view";

const CUSTOMER: AccountCustomer = {
  firstName: "Олена",
  lastName: "Коваль",
  emailAddress: { emailAddress: "olena.koval@example.com" },
  orders: {
    nodes: [
      {
        id: "gid://shopify/Order/3",
        name: "#1003",
        processedAt: "2026-11-12T10:00:00Z",
        financialStatus: "PENDING",
        statusPageUrl: "#",
        totalPrice: { amount: "119999", currencyCode: "UAH" },
      },
      {
        id: "gid://shopify/Order/2",
        name: "#1002",
        processedAt: "2026-10-03T10:00:00Z",
        financialStatus: "PAID",
        statusPageUrl: "#",
        totalPrice: { amount: "8499", currencyCode: "UAH" },
      },
      {
        id: "gid://shopify/Order/1",
        name: "#1001",
        processedAt: "2026-08-21T10:00:00Z",
        financialStatus: "REFUNDED",
        statusPageUrl: "#",
        totalPrice: { amount: "64999", currencyCode: "UAH" },
      },
    ],
    pageInfo: { hasNextPage: true, hasPreviousPage: false, startCursor: "a", endCursor: "b" },
  },
};

const meta = {
  title: "Account/AccountView",
  component: AccountView,
  parameters: { surface: "page" },
  args: { store: STORE_INFO, state: { status: "signed-in", customer: CUSTOMER } },
} satisfies Meta<typeof AccountView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignedIn: Story = {};

export const NoOrders: Story = {
  args: {
    state: {
      status: "signed-in",
      customer: {
        ...CUSTOMER,
        orders: { nodes: [], pageInfo: { hasNextPage: false, hasPreviousPage: false } },
      },
    },
  },
};

export const SignedOut: Story = { args: { state: { status: "signed-out", loginFailed: false } } };

export const LoginFailed: Story = { args: { state: { status: "signed-out", loginFailed: true } } };

/** mock.shop або магазин без налаштованого Customer Account API. */
export const Unavailable: Story = { args: { state: { status: "unavailable" } } };

export const LoadError: Story = { args: { state: { status: "error" } } };
