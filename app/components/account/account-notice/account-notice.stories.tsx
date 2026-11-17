import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, UserRoundX } from "lucide-react";

import { Button } from "~/components/ui/button";

import { AccountNotice } from "./account-notice";

const meta = {
  title: "Account/AccountNotice",
  component: AccountNotice,
  parameters: { surface: "page" },
  args: {
    icon: <CircleAlert strokeWidth={2} />,
    title: "Не вдалося завантажити кабінет",
    description: "Спробуйте ще раз за хвилину.",
    actions: (
      <>
        <Button>Спробувати ще раз</Button>
        <Button variant="secondary">Вийти з кабінету</Button>
      </>
    ),
  },
} satisfies Meta<typeof AccountNotice>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutActions: Story = {
  args: {
    icon: <UserRoundX strokeWidth={2} />,
    title: "Вхід запрацює після підключення магазину",
    actions: undefined,
  },
};
