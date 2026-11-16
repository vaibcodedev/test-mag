import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, LogIn } from "lucide-react";

import { Button } from "~/components/ui/button";

import { AccountNotice } from "./account-notice";

const meta = {
  title: "Account/AccountNotice",
  component: AccountNotice,
  parameters: { surface: "page" },
  args: {
    icon: <LogIn strokeWidth={2} />,
    title: "Увійдіть до кабінету",
    description: "Тут зберігаються ваші замовлення та контактні дані.",
    actions: <Button>Увійти</Button>,
  },
} satisfies Meta<typeof AccountNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const SignIn: Story = {};

export const WithAlert: Story = {
  args: {
    icon: <CircleAlert strokeWidth={2} />,
    title: "Не вдалося завантажити кабінет",
    description: "Спробуйте ще раз за хвилину.",
    alert: "Немає зв'язку з магазином. Перевірте інтернет і повторіть.",
    actions: <Button variant="secondary">Спробувати ще раз</Button>,
  },
};
