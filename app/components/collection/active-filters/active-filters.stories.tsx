import type { Meta, StoryObj } from "@storybook/react-vite";

import { ActiveFilters } from "./active-filters";

const meta = {
  title: "Collection/ActiveFilters",
  component: ActiveFilters,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    clearHref: "/collections/iphone",
    chips: [
      { key: "price", label: "Ціна: 30 000 ₴ – 70 000 ₴", href: "/collections/iphone?a" },
      { key: "memory", label: "Пам'ять: 256 ГБ", href: "/collections/iphone?b" },
      { key: "color", label: "Колір: Синій титан", href: "/collections/iphone?c" },
      { key: "stock", label: "В наявності", href: "/collections/iphone?d" },
    ],
  },
} satisfies Meta<typeof ActiveFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const Single: Story = {
  args: { chips: [{ key: "memory", label: "Пам'ять: 256 ГБ", href: "/collections/iphone" }] },
};
