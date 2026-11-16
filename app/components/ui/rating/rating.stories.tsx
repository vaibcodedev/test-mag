import type { Meta, StoryObj } from "@storybook/react-vite";

import { Rating } from "./rating";

const meta = {
  title: "UI/Rating",
  component: Rating,
  tags: ["autodocs"],
  args: { value: 4.9, count: 128, variant: "stars", onDark: false },
  argTypes: {
    value: { control: { type: "range", min: 0, max: 5, step: 0.1 } },
    variant: { control: "inline-radio", options: ["stars", "compact"] },
  },
} satisfies Meta<typeof Rating>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Stars: Story = {};

export const Compact: Story = { args: { variant: "compact" } };

export const FewReviews: Story = { args: { value: 4.2, count: 3 } };

export const OnInk: Story = { args: { onDark: true, count: 412 }, parameters: { surface: "ink" } };
