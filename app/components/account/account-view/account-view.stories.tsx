import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  DEMO_CUSTOMER,
  DEMO_CUSTOMER_WITHOUT_NAME,
  DEMO_CUSTOMER_WITHOUT_ORDERS,
} from "~/components/account/account.fixtures";
import { STORE_INFO } from "~/lib/content/site";

import { AccountView } from "./account-view";

const meta = {
  title: "Account/AccountView",
  component: AccountView,
  parameters: { surface: "page" },
  args: { store: STORE_INFO, state: { status: "signed-in", customer: DEMO_CUSTOMER } },
} satisfies Meta<typeof AccountView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Кілька замовлень: різні стани, з фото й без, довга назва, «+N», невідомий код стану. */
export const SignedIn: Story = {};

export const NoOrders: Story = {
  args: { state: { status: "signed-in", customer: DEMO_CUSTOMER_WITHOUT_ORDERS } },
};

/** Покупець без імені: нейтральне привітання, ініціал — з пошти. */
export const WithoutName: Story = {
  args: { state: { status: "signed-in", customer: DEMO_CUSTOMER_WITHOUT_NAME } },
};

export const SignedOut: Story = { args: { state: { status: "signed-out", loginFailed: false } } };

export const LoginFailed: Story = { args: { state: { status: "signed-out", loginFailed: true } } };

/** mock.shop або магазин без налаштованого Customer Account API. */
export const Unavailable: Story = { args: { state: { status: "unavailable" } } };

export const LoadError: Story = { args: { state: { status: "error" } } };
