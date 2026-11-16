import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart, Scale } from "lucide-react";

import { Toggle } from "./toggle";

const meta = {
  title: "UI/Toggle",
  component: Toggle,
  tags: ["autodocs"],
  args: { variant: "pill", onDark: false, children: "Лише в наявності" },
  argTypes: {
    variant: { control: "inline-radio", options: ["pill", "icon", "swatch"] },
    onDark: { control: "boolean" },
  },
} satisfies Meta<typeof Toggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Pill: Story = {};

export const PillPressed: Story = { args: { defaultPressed: true } };

export const PillDisabled: Story = { args: { disabled: true, children: "1 ТБ" } };

/** Кругла кнопка 44px на тлі сторінки: увімкнена іконка стає blue із заливкою. */
export const Icon: Story = {
  parameters: { surface: "page" },
  render: () => (
    <div className="flex gap-2">
      <Toggle variant="icon" aria-label="Додати в обране: iPhone 17 Pro">
        <Heart aria-hidden="true" strokeWidth={2} />
      </Toggle>
      <Toggle variant="icon" defaultPressed aria-label="Прибрати з обраного: iPhone 17">
        <Heart aria-hidden="true" strokeWidth={2} />
      </Toggle>
      <Toggle variant="icon" aria-label="Додати до порівняння: iPhone 17 Pro">
        <Scale aria-hidden="true" strokeWidth={2} />
      </Toggle>
    </div>
  ),
};

export const Swatch: Story = {
  render: () => (
    <div className="flex">
      <Toggle variant="swatch" swatch="#3c4a5e" defaultPressed aria-label="Синій титан" />
      <Toggle variant="swatch" swatch="#e3e4e5" aria-label="Срібний" />
      <Toggle variant="swatch" swatch="#f77e2d" aria-label="Космічний помаранчевий" />
    </div>
  ),
};

export const OnInk: Story = {
  parameters: { surface: "ink" },
  render: () => (
    <div className="flex flex-wrap items-center gap-2">
      <Toggle onDark defaultPressed>
        256 ГБ
      </Toggle>
      <Toggle onDark>512 ГБ</Toggle>
      <Toggle variant="icon" onDark defaultPressed aria-label="Прибрати з обраного: iPhone 17 Pro">
        <Heart aria-hidden="true" strokeWidth={2} />
      </Toggle>
      <Toggle variant="swatch" onDark swatch="#e3e4e5" defaultPressed aria-label="Срібний" />
    </div>
  ),
};
