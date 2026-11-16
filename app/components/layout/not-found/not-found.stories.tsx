import type { Meta, StoryObj } from "@storybook/react-vite";
import { NotFound } from "./not-found";

const meta = {
  title: "Layout/NotFound",
  component: NotFound,
  parameters: { surface: "page" },
} satisfies Meta<typeof NotFound>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const FewCategories: Story = {
  args: {
    categories: [
      { title: "iPhone", to: "/collections/iphone" },
      { title: "Mac", to: "/collections/mac" },
    ],
  },
};
