import type { Meta, StoryObj } from "@storybook/react-vite";
import { Breadcrumbs } from "./breadcrumbs";

const meta = {
  title: "Layout/Breadcrumbs",
  component: Breadcrumbs,
  parameters: { surface: "page" },
  args: {
    items: [
      { title: "Головна", to: "/" },
      { title: "iPhone", to: "/collections/iphone" },
      { title: "iPhone 17 Pro", to: "/products/iphone-17-pro" },
    ],
  },
} satisfies Meta<typeof Breadcrumbs>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const TwoLevels: Story = {
  args: {
    items: [
      { title: "Головна", to: "/" },
      { title: "Кошик", to: "/cart" },
    ],
  },
};
