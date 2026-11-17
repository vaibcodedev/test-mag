import type { Meta, StoryObj } from "@storybook/react-vite";

import { SignInPanel } from "./sign-in-panel";

const meta = {
  title: "Account/SignInPanel",
  component: SignInPanel,
  parameters: { surface: "page" },
} satisfies Meta<typeof SignInPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Після невдалої спроби входу: помилка над кнопкою, кнопка пропонує спробувати ще раз. */
export const LoginFailed: Story = { args: { loginFailed: true } };
