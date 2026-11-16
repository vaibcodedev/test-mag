import type { Meta, StoryObj } from "@storybook/react-vite";

import { VariantPicker } from "./variant-picker";
import { DEMO_VARIANT_OPTIONS } from "./variant-picker.fixtures";

const meta = {
  title: "Product/VariantPicker",
  component: VariantPicker,
  tags: ["autodocs"],
  args: { options: DEMO_VARIANT_OPTIONS },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof VariantPicker>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Вибране, розпродане («512 ГБ») і неіснуюче («1 ТБ») значення. */
export const Default: Story = {};

/** Без кольорів у даних товару опція «Колір» теж показується пігулками. */
export const PillsOnly: Story = {
  args: {
    options: DEMO_VARIANT_OPTIONS.map((option) => ({
      ...option,
      values: option.values.map((value) => ({ ...value, swatch: null })),
    })),
  },
};
