import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_FILTERS, DEMO_PRICE_CEILING } from "~/components/collection/collection.fixtures";
import { FiltersSheet } from "~/components/collection/filters-sheet";

import { Filters } from "./filters";

const meta = {
  title: "Collection/Filters",
  component: Filters,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    filters: DEMO_FILTERS,
    activeFilters: [],
    action: "/collections/iphone",
    currencyCode: "UAH",
    priceCeiling: DEMO_PRICE_CEILING,
    // У Storybook форма нікуди не відправляється.
    onSubmit: (event) => event.preventDefault(),
  },
  render: (args) => (
    <div className="max-w-72 rounded-lg bg-surface px-5 py-1">
      <Filters {...args} />
    </div>
  ),
} satisfies Meta<typeof Filters>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Ліва колонка на великих екранах. */
export const Default: Story = {};

export const WithActiveFilters: Story = {
  args: {
    activeFilters: [
      { price: { min: 30000, max: 70000 } },
      { variantOption: { name: "Пам'ять", value: "256 ГБ" } },
      { variantOption: { name: "Колір", value: "Синій титан" } },
      { available: true },
    ],
  },
};

/** Магазин повернув лише ціну (так поводиться mock.shop). */
export const PriceOnly: Story = { args: { filters: DEMO_FILTERS.slice(0, 1) } };

/** На телефоні та сама форма відкривається в шухляді. */
export const InSheet: Story = {
  render: (args) => (
    <FiltersSheet
      activeCount={args.activeFilters.length}
      applyLabel="Показати 38 товарів"
      clearHref="/collections/iphone"
    >
      <Filters {...args} />
    </FiltersSheet>
  ),
};
