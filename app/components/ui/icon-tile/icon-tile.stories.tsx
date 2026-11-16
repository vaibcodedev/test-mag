import type { Meta, StoryObj } from "@storybook/react-vite";
import { ShieldCheck, Truck } from "lucide-react";

import { IconTile } from "./icon-tile";

const meta = {
  title: "UI/IconTile",
  component: IconTile,
  tags: ["autodocs"],
  args: { size: "md", tone: "light", children: <Truck strokeWidth={2} /> },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "lg"] },
    tone: { control: "inline-radio", options: ["light", "dark"] },
    children: { control: false },
  },
} satisfies Meta<typeof IconTile>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Light: Story = {};

export const Large: Story = {
  args: { size: "lg", children: <ShieldCheck strokeWidth={2} /> },
};

export const Dark: Story = {
  args: { tone: "dark" },
  parameters: { surface: "ink" },
};
