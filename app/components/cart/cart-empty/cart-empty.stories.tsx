import type { Meta, StoryObj } from "@storybook/react-vite";

import { CartEmpty } from "./cart-empty";

const meta = {
  title: "Cart/CartEmpty",
  component: CartEmpty,
  tags: ["autodocs"],
  parameters: { surface: "page" },
} satisfies Meta<typeof CartEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

/** На сторінці /cart: біла панель на тлі сторінки. */
export const Page: Story = {
  args: { headingLevel: "h2", className: "rounded-xl bg-surface p-8 md:p-12" },
};

/** У бічній панелі кошика. */
export const Drawer: Story = {
  args: { headingLevel: "h3" },
  parameters: { surface: "surface" },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
};
