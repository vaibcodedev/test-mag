import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart, Scale } from "lucide-react";

import { SavedCount } from "./saved-count";

/**
 * Лічильник на іконці шапки. WishlistCount і CompareCount — це SavedCount,
 * який бере число зі сторів обраного та порівняння в браузері.
 */
const meta = {
  title: "Saved/SavedCount",
  component: SavedCount,
  tags: ["autodocs"],
  parameters: { surface: "surface" },
  args: { count: 3, label: "Товарів в обраному" },
  decorators: [
    (Story) => (
      <span className="relative inline-flex size-11 items-center justify-center rounded-md text-ink">
        <Heart aria-hidden="true" strokeWidth={2} className="size-6" />
        <Story />
      </span>
    ),
  ],
} satisfies Meta<typeof SavedCount>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Wishlist: Story = {};

export const TwoDigits: Story = { args: { count: 24 } };

/** Порожній список: лічильника немає. */
export const Empty: Story = { args: { count: 0 } };

export const Compare: Story = {
  args: { count: 4, label: "Товарів у порівнянні" },
  decorators: [
    (Story) => (
      <span className="relative inline-flex size-11 items-center justify-center rounded-md text-ink">
        <Scale aria-hidden="true" strokeWidth={2} className="size-6" />
        <Story />
      </span>
    ),
  ],
};
