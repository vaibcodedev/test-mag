import type { Meta, StoryObj } from "@storybook/react-vite";

import { Newsletter } from "./newsletter";
import { NEWSLETTER_DEMO_CONTENT } from "./newsletter.demo";

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const meta = {
  title: "Home/Newsletter",
  component: Newsletter,
  parameters: { surface: "page" },
  args: { content: NEWSLETTER_DEMO_CONTENT },
} satisfies Meta<typeof Newsletter>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Розсилку ще не підключено (без `onSubmit`): після правильної адреси форма не звітує про
 * підписку, а показує `content.pending` із посиланням на Telegram і лишає адресу в полі.
 */
export const Default: Story = { args: { telegramUrl: "https://t.me/ionov_store" } };

/** Підписку підключено: після відповіді сервера на місці форми з'являється підтвердження. */
export const Connected: Story = { args: { onSubmit: () => wait(300) } };

/** Відповідь сервера із затримкою: кнопка показує завантаження. */
export const SlowSubmit: Story = { args: { onSubmit: () => wait(1500) } };

/** Сервер відмовив: під полем з'являється пояснення, що робити далі. */
export const FailedSubmit: Story = {
  args: {
    onSubmit: async () => {
      await wait(600);
      throw new Error("Демо-помилка підписки");
    },
  },
};
