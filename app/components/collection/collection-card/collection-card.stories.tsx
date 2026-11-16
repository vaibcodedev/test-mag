import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_COLLECTIONS } from "~/components/collection/collection.fixtures";

import { CollectionCard, type CollectionCardData } from "./collection-card";
import { CollectionList } from "./collection-list";

const COLLECTION = DEMO_COLLECTIONS[0] as CollectionCardData;

const meta = {
  title: "Collection/CollectionCard",
  component: CollectionCard,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { collection: COLLECTION },
  render: (args) => (
    <div className="max-w-sm">
      <CollectionCard {...args} />
    </div>
  ),
} satisfies Meta<typeof CollectionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutDescription: Story = {
  args: { collection: { ...COLLECTION, description: null } },
};

export const WithoutImage: Story = { args: { collection: { ...COLLECTION, image: null } } };

/** Сітка сторінки «Каталог». */
export const List: Story = { render: () => <CollectionList collections={DEMO_COLLECTIONS} /> };

export const EmptyList: Story = { render: () => <CollectionList collections={[]} /> };
