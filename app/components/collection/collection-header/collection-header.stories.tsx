import type { Meta, StoryObj } from "@storybook/react-vite";

import { CollectionHeader } from "./collection-header";

const meta = {
  title: "Collection/CollectionHeader",
  component: CollectionHeader,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    crumbs: [
      { title: "Головна", to: "/" },
      { title: "Каталог", to: "/collections" },
      { title: "iPhone", to: "/collections/iphone" },
    ],
    title: "iPhone",
    description:
      "Нові iPhone з офіційною гарантією 12 місяців. Допоможемо перенести дані та підберемо скло й чохол у шоурумі на Соборній, 64.",
    count: "96 товарів",
  },
} satisfies Meta<typeof CollectionHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CatalogRoot: Story = {
  args: {
    crumbs: [
      { title: "Головна", to: "/" },
      { title: "Каталог", to: "/collections" },
    ],
    title: "Каталог",
    description: "Уся техніка Apple, аксесуари та вживані пристрої з гарантією.",
    count: null,
  },
};

export const WithoutDescription: Story = { args: { description: null, count: "1 товар" } };
