import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectionEmpty } from "./collection-empty";

const meta = {
  title: "Collection/CollectionEmpty",
  component: CollectionEmpty,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { filtered: true, resetHref: "/collections/iphone" },
} satisfies Meta<typeof CollectionEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Товари сховали фільтри: пропонуємо їх скинути. */
export const ByFilters: Story = {};

/** Колекція порожня сама по собі: ведемо до каталогу. */
export const NoProducts: Story = { args: { filtered: false } };
