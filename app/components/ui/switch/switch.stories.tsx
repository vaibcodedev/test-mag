import type { Meta, StoryObj } from "@storybook/react-vite";

import { Label } from "~/components/ui/label";

import { Switch } from "./switch";

const meta = {
  title: "UI/Switch",
  component: Switch,
  tags: ["autodocs"],
  args: { "aria-label": "Лише в наявності", size: "md" },
  argTypes: { size: { control: "inline-radio", options: ["md", "sm"] } },
} satisfies Meta<typeof Switch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Checked: Story = { args: { defaultChecked: true } };

export const Small: Story = { args: { size: "sm", defaultChecked: true } };

export const Disabled: Story = { args: { disabled: true, defaultChecked: true } };

/** Рядок фільтра: підпис ліворуч, перемикач праворуч, уся висота рядка 44px. */
export const WithLabel: Story = {
  render: () => (
    <div className="flex max-w-xs flex-col">
      <div className="flex min-h-11 items-center justify-between gap-4">
        <Label htmlFor="story-switch-stock">Лише в наявності</Label>
        <Switch id="story-switch-stock" defaultChecked />
      </div>
      <div className="flex min-h-11 items-center justify-between gap-4">
        <Label htmlFor="story-switch-sale">Зі знижкою</Label>
        <Switch id="story-switch-sale" />
      </div>
    </div>
  ),
};
