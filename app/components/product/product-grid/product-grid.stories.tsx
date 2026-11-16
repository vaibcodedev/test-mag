import type { Meta, StoryObj } from "@storybook/react-vite";
import { PackageSearch } from "lucide-react";

import { DEMO_PRODUCTS } from "~/components/home/home.fixtures";
import { Button } from "~/components/ui/button";

import { ProductGrid, ProductGridSkeleton } from "./product-grid";
import { ProductGridEmpty } from "./product-grid-empty";

const PRODUCTS = DEMO_PRODUCTS.slice(0, 8);

const meta = {
  title: "Product/ProductGrid",
  component: ProductGrid,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { products: PRODUCTS, columns: "full", pending: false, loadingMore: 0 },
  argTypes: { columns: { control: "inline-radio", options: ["full", "sidebar"] } },
} satisfies Meta<typeof ProductGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

/** На всю ширину: 2 / 3 / 4 / 5 колонок, як у пошуку. */
export const Default: Story = {};

/** Поруч із колонкою фільтрів: 2 / 3 / 4 колонки, як у колекції. */
export const BesideFilters: Story = { args: { columns: "sidebar" } };

/** Список оновлюється: старі товари приглушені, доки не прийдуть нові. */
export const Pending: Story = { args: { pending: true } };

/** «Показати ще»: заглушки в кінці сітки. */
export const LoadingMore: Story = {
  args: { products: PRODUCTS.slice(0, 4), loadingMore: 4, columns: "sidebar" },
};

export const Adding: Story = { args: { addingHandle: PRODUCTS[0]?.handle } };

export const Skeleton: Story = { render: (args) => <ProductGridSkeleton columns={args.columns} /> };

export const Empty: Story = {
  render: () => (
    <ProductGridEmpty
      icon={<PackageSearch strokeWidth={2} />}
      title="Тут поки немає товарів"
      description="Ми ще наповнюємо цю категорію. Подивіться інші розділи каталогу."
    >
      <Button>Перейти до каталогу</Button>
    </ProductGridEmpty>
  ),
};
