import type { Meta, StoryObj } from "@storybook/react-vite";
import { Minus, Plus } from "lucide-react";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

import { ButtonGroup, ButtonGroupText } from "./button-group";

const MIN_QUANTITY = 1;
const MAX_QUANTITY = 5;

const meta = {
  title: "UI/ButtonGroup",
  component: ButtonGroup,
  tags: ["autodocs"],
  args: { orientation: "horizontal" },
  argTypes: { orientation: { control: "inline-radio", options: ["horizontal", "vertical"] } },
} satisfies Meta<typeof ButtonGroup>;

export default meta;
type Story = StoryObj<typeof meta>;

function Stepper() {
  const [quantity, setQuantity] = useState(MIN_QUANTITY);
  const clamp = (value: number) => Math.min(MAX_QUANTITY, Math.max(MIN_QUANTITY, value));

  return (
    <ButtonGroup aria-label="Кількість: iPhone 17 Pro">
      <Button
        variant="ghost"
        size="icon"
        aria-label="Зменшити кількість"
        disabled={quantity <= MIN_QUANTITY}
        onClick={() => setQuantity((value) => clamp(value - 1))}
      >
        <Minus aria-hidden="true" />
      </Button>
      <Input
        aria-label="Кількість"
        inputMode="numeric"
        value={quantity}
        onChange={(event) => setQuantity(clamp(Number(event.target.value) || MIN_QUANTITY))}
        className="w-14 px-0 text-center tabular-nums"
      />
      <Button
        variant="ghost"
        size="icon"
        aria-label="Збільшити кількість"
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => setQuantity((value) => clamp(value + 1))}
      >
        <Plus aria-hidden="true" />
      </Button>
    </ButtonGroup>
  );
}

/** Лічильник кількості в кошику: мінус, число, плюс в одному контурі. */
export const QuantityStepper: Story = { render: () => <Stepper /> };

/** Поле з префіксом і кнопкою. */
export const PhoneWithPrefix: Story = {
  render: () => (
    <ButtonGroup aria-label="Передзвоніть мені" className="w-full max-w-sm">
      <ButtonGroupText>+380</ButtonGroupText>
      <Input
        type="tel"
        aria-label="Номер телефону"
        placeholder="68 129 99 00"
        autoComplete="tel-national"
        className="flex-1"
      />
      <Button className="border-transparent">Передзвоніть</Button>
    </ButtonGroup>
  ),
};

export const Vertical: Story = {
  args: { orientation: "vertical" },
  render: (args) => (
    <ButtonGroup {...args} aria-label="Масштаб фото">
      <Button variant="ghost" size="icon" aria-label="Збільшити фото">
        <Plus aria-hidden="true" />
      </Button>
      <Button variant="ghost" size="icon" aria-label="Зменшити фото">
        <Minus aria-hidden="true" />
      </Button>
    </ButtonGroup>
  ),
};
