import type { Meta, StoryObj } from "@storybook/react-vite";

import { CategoryPills } from "./category-pills";
import { DEMO_CATEGORY_PILLS } from "./category-pills.demo";

const meta = {
  title: "Home/CategoryPills",
  component: CategoryPills,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { categories: DEMO_CATEGORY_PILLS },
} satisfies Meta<typeof CategoryPills>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImages: Story = {
  args: { categories: DEMO_CATEGORY_PILLS.map((category) => ({ ...category, image: null })) },
};
