import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard } from "lucide-react";

import { Chip } from "./chip";

const meta = {
  title: "UI/Chip",
  component: Chip,
  tags: ["autodocs"],
  args: { children: "4 800 ₴ × 25 міс.", tone: "page" },
  argTypes: { tone: { control: "inline-radio", options: ["page", "surface", "on-dark"] } },
} satisfies Meta<typeof Chip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const OnCard: Story = {};

export const WithIcon: Story = {
  render: (args) => (
    <Chip {...args}>
      <CreditCard aria-hidden="true" strokeWidth={2} />
      0% частинами
    </Chip>
  ),
};

export const OnPage: Story = { args: { tone: "surface" }, parameters: { surface: "page" } };

export const OnInk: Story = {
  parameters: { surface: "ink" },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Chip tone="on-dark">A19 Pro</Chip>
      <Chip tone="on-dark">Камера 48 Мп</Chip>
      <Chip tone="on-dark">до 33 годин відео</Chip>
    </div>
  ),
};
