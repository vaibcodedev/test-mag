import type { Meta, StoryObj } from "@storybook/react-vite";

import { Price } from "./price";

const meta = {
  title: "UI/Price",
  component: Price,
  tags: ["autodocs"],
  args: {
    price: { amount: "64999", currencyCode: "UAH" },
    size: "card",
    showSavings: true,
    from: false,
    onDark: false,
  },
  argTypes: { size: { control: "inline-radio", options: ["card", "lg", "hero"] } },
} satisfies Meta<typeof Price>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Card: Story = {};

/** Знижка: sale-ціна, закреслена стара ціна, «Економія N ₴». */
export const Sale: Story = {
  args: {
    price: { amount: "49999", currencyCode: "UAH" },
    compareAt: { amount: "54499", currencyCode: "UAH" },
  },
};

export const Large: Story = {
  args: { size: "lg", price: { amount: "119999", currencyCode: "UAH" } },
};

export const HeroOnInk: Story = {
  args: {
    size: "hero",
    from: true,
    onDark: true,
    price: { amount: "119999", currencyCode: "UAH" },
  },
  parameters: { surface: "ink" },
};
