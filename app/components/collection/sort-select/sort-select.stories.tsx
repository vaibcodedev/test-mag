import type { Meta, StoryObj } from "@storybook/react-vite";

import { SORT_OPTIONS } from "~/lib/shopify/collection";

import { SortSelect } from "./sort-select";

const meta = {
  title: "Collection/SortSelect",
  component: SortSelect,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    value: SORT_OPTIONS[0]?.value ?? "",
    action: "/collections/iphone",
    // У Storybook форма нікуди не відправляється.
    onSubmit: (event) => event.preventDefault(),
  },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SortSelect>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Popular: Story = {};

export const Cheapest: Story = { args: { value: "price-ascending" } };

export const WithActiveFilters: Story = {
  args: {
    value: "created-descending",
    hiddenParams: [["filter.v.option.Пам'ять", "256 ГБ"]],
  },
};
