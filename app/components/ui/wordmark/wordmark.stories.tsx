import type { Meta, StoryObj } from "@storybook/react-vite";

import { Wordmark } from "./wordmark";

const meta = {
  title: "UI/Wordmark",
  component: Wordmark,
  tags: ["autodocs"],
  args: { tone: "ink", size: "md" },
  argTypes: {
    tone: { control: "inline-radio", options: ["ink", "on-dark", "lime"] },
    size: { control: "inline-radio", options: ["sm", "md", "giant"] },
  },
} satisfies Meta<typeof Wordmark>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Header: Story = {};

export const OnInk: Story = { args: { tone: "on-dark" }, parameters: { surface: "ink" } };

/** Великий вордмарк у футері: lime, крапка blue. */
export const Footer: Story = {
  args: { tone: "lime", size: "giant" },
  parameters: { surface: "ink" },
};
