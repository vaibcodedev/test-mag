import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_SAVED_PRODUCTS, IPHONE_CATEGORY } from "~/components/saved/saved.fixtures";

import { CompareTable } from "./compare-table";
import { CompareTableSkeleton } from "./compare-table-skeleton";

const meta = {
  title: "Saved/CompareTable",
  component: CompareTable,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    category: IPHONE_CATEGORY,
    products: DEMO_SAVED_PRODUCTS.slice(0, 2),
    addingHandle: null,
    onRemove: () => {},
    onAddToCart: () => {},
  },
} satisfies Meta<typeof CompareTable>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TwoProducts: Story = {};

/** Повний список: новий, уживаний і товар без наявності. Вільного місця «Додати» вже немає. */
export const FourProducts: Story = { args: { products: DEMO_SAVED_PRODUCTS } };

/** Один товар: перемикача «Лише відмінності» немає, поруч — місце «Додати iPhone». */
export const SingleProduct: Story = { args: { products: DEMO_SAVED_PRODUCTS.slice(0, 1) } };

export const Mobile: Story = {
  args: { products: DEMO_SAVED_PRODUCTS },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};

export const Loading: Story = { render: () => <CompareTableSkeleton columns={3} /> };
