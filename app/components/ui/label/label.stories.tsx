import type { Meta, StoryObj } from "@storybook/react-vite";

import { Input } from "~/components/ui/input";

import { Label } from "./label";

const meta = {
  title: "UI/Label",
  component: Label,
  tags: ["autodocs"],
  args: { children: "Телефон" },
} satisfies Meta<typeof Label>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithInput: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col gap-2">
      <Label htmlFor="story-label-phone">Телефон</Label>
      <Input id="story-label-phone" type="tel" placeholder="068 129 99 00" autoComplete="tel" />
    </div>
  ),
};

/** Підпис після вимкненого поля з класом peer тьмяніє разом із ним. */
export const Disabled: Story = {
  render: () => (
    <div className="flex max-w-sm flex-col-reverse gap-2">
      <Input id="story-label-imei" className="peer" disabled defaultValue="35 209900 176148 1" />
      <Label htmlFor="story-label-imei">IMEI</Label>
    </div>
  ),
};
