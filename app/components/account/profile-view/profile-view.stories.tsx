import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_PROFILE, DEMO_PROFILE_NEW } from "~/components/account/account.fixtures";

import { ProfileView } from "./profile-view";

const VALUES = { firstName: "Олена", lastName: "Коваль" };

const meta = {
  title: "Account/ProfileView",
  component: ProfileView,
  parameters: { surface: "page" },
  args: { profile: DEMO_PROFILE },
} satisfies Meta<typeof ProfileView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Профіль заповнено, розсилку ввімкнено. */
export const Idle: Story = {};

/** Форма надсилається: кнопка зі спінером. */
export const Saving: Story = { args: { pending: { intent: "profile" } } };

/** Збережено: статус біля кнопки й тост. */
export const Saved: Story = { args: { result: { intent: "profile", ok: true, values: VALUES } } };

/** Помилки біля полів: значення лишаються у формі, фокус на першому полі з помилкою. */
export const WithErrors: Story = {
  args: {
    result: {
      intent: "profile",
      ok: false,
      values: { firstName: "", lastName: "https://spam.example" },
      errors: {
        firstName: "Вкажіть ім'я.",
        lastName: "Прізвище не може містити посилань і символів < >.",
      },
    },
  },
};

/** Тимчасовий збій: спокійне повідомлення, дані у формі. */
export const SaveFailed: Story = {
  args: {
    result: { intent: "profile", ok: false, values: VALUES, errors: {}, failure: "failed" },
  },
};

/** Магазин не дозволив запис (немає права в налаштуваннях Customer Account API). */
export const SaveForbidden: Story = {
  args: {
    result: { intent: "profile", ok: false, values: VALUES, errors: {}, failure: "forbidden" },
  },
};

/** Новий покупець: без імені, з довгою поштою, розсилку вимкнено. */
export const NewCustomer: Story = { args: { profile: DEMO_PROFILE_NEW } };

/** Розсилку вимкнено. */
export const MarketingOff: Story = {
  args: { profile: { ...DEMO_PROFILE, marketing: "unsubscribed" } },
};

/** Перемикання в дорозі: перемикач уже показує вибір покупця. */
export const MarketingSaving: Story = {
  args: {
    profile: { ...DEMO_PROFILE, marketing: "unsubscribed" },
    pending: { intent: "marketing", target: "subscribe" },
  },
};

/** Підписку ще треба підтвердити з листа. */
export const MarketingPendingConfirmation: Story = {
  args: { profile: { ...DEMO_PROFILE, marketing: "pending" } },
};

/** Магазин не віддав стан підписки або не дозволяє нею керувати. */
export const MarketingUnavailable: Story = {
  args: { profile: { ...DEMO_PROFILE, marketing: "unavailable" } },
};

/** Перемкнути не вдалося: стан лишився попереднім. */
export const MarketingFailed: Story = {
  args: {
    profile: { ...DEMO_PROFILE, marketing: "unsubscribed" },
    result: { intent: "marketing", ok: false, target: "subscribe", failure: "forbidden" },
  },
};
