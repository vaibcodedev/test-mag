import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleAlert, CircleCheck, Info, Truck, X } from "lucide-react";

import { Button } from "~/components/ui/button";

import { Alert, AlertAction, AlertDescription, AlertTitle } from "./alert";

const meta = {
  title: "UI/Alert",
  component: Alert,
  tags: ["autodocs"],
  args: { variant: "info" },
  argTypes: {
    variant: {
      control: "select",
      options: ["info", "success", "warning", "danger", "on-dark"],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Alert>;

export default meta;
type Story = StoryObj<typeof meta>;

export const InfoMessage: Story = {
  render: (args) => (
    <Alert {...args}>
      <Info aria-hidden="true" strokeWidth={2} />
      <AlertTitle>Самовивіз сьогодні до 20:00</AlertTitle>
      <AlertDescription>Шоурум у Вінниці, вул. Соборна, 64. Товар уже на місці.</AlertDescription>
    </Alert>
  ),
};

export const Success: Story = {
  args: { variant: "success" },
  render: (args) => (
    <Alert {...args}>
      <CircleCheck aria-hidden="true" strokeWidth={2} />
      <AlertTitle>Промокод застосовано</AlertTitle>
      <AlertDescription>Знижка 1 500 ₴ уже врахована в сумі замовлення.</AlertDescription>
    </Alert>
  ),
};

export const Warning: Story = {
  args: { variant: "warning" },
  render: (args) => (
    <Alert {...args}>
      <CircleAlert aria-hidden="true" strokeWidth={2} />
      <AlertTitle>Залишився 1 iPhone 17 Pro у цьому кольорі</AlertTitle>
      <AlertDescription>Оформіть замовлення, щоб ми відклали його для вас.</AlertDescription>
    </Alert>
  ),
};

/** Помилка каже, що сталося і як це виправити. Її можна закрити. */
export const Danger: Story = {
  args: { variant: "danger" },
  render: (args) => (
    <Alert {...args}>
      <CircleAlert aria-hidden="true" strokeWidth={2} />
      <AlertTitle>Не вдалося додати товар у кошик</AlertTitle>
      <AlertDescription>
        Перевірте з&apos;єднання з інтернетом і спробуйте ще раз. Якщо не вийде, напишіть нам у{" "}
        <a href="#telegram">Telegram</a>.
      </AlertDescription>
      <AlertAction>
        <Button variant="ghost" size="icon" className="rounded-pill" aria-label="Закрити">
          <X aria-hidden="true" />
        </Button>
      </AlertAction>
    </Alert>
  ),
};

export const TitleOnly: Story = {
  render: (args) => (
    <Alert {...args}>
      <AlertTitle>Ціни дійсні до кінця тижня.</AlertTitle>
    </Alert>
  ),
};

export const OnInk: Story = {
  args: { variant: "on-dark" },
  parameters: { surface: "ink" },
  render: (args) => (
    <Alert {...args}>
      <Truck aria-hidden="true" strokeWidth={2} />
      <AlertTitle>Доставимо завтра</AlertTitle>
      <AlertDescription>Замовлення до 16:00 відправляємо Новою поштою того ж дня.</AlertDescription>
    </Alert>
  ),
};
