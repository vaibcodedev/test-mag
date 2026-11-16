import type { Meta, StoryObj } from "@storybook/react-vite";

import { VariantPicker } from "~/components/product/variant-picker";
import { DEMO_VARIANT_OPTIONS } from "~/components/product/variant-picker/variant-picker.fixtures";

import { ProductInfo } from "./product-info";
import { ProductTrust } from "./product-trust";

const meta = {
  title: "Product/ProductInfo",
  component: ProductInfo,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    title: "iPhone 17 Pro 256 ГБ, синій титан",
    price: { amount: "64999", currencyCode: "UAH" },
    available: true,
    delivery: "доставимо завтра",
    shortSpecs: ["6,3″ OLED 120 Гц", "A19 Pro", "Камера 48 Мп", "USB-C"],
  },
  decorators: [
    (Story) => (
      <div className="max-w-md rounded-xl bg-surface p-6">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductInfo>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = { args: { badge: "Хіт", rating: { value: 4.9, count: 128 } } };

export const Sale: Story = {
  args: {
    title: "MacBook Air 13 M4 16/256 ГБ, темна ніч",
    price: { amount: "49999", currencyCode: "UAH" },
    compareAt: { amount: "54499", currencyCode: "UAH" },
    installmentMonths: 24,
  },
};

export const Used: Story = {
  args: {
    title: "iPhone 15 Pro 128 ГБ, натуральний титан",
    price: { amount: "31999", currencyCode: "UAH" },
    used: { grade: "Відмінний", batteryHealth: 91 },
    shortSpecs: [],
  },
};

export const SoldOut: Story = { args: { available: false, delivery: null } };

/** З вибором варіанта між ціною та наявністю і списком гарантій під ним. */
export const WithVariantsAndTrust: Story = {
  render: (args) => (
    <div className="flex flex-col gap-5">
      <ProductInfo {...args}>
        <VariantPicker options={DEMO_VARIANT_OPTIONS} />
      </ProductInfo>
      <ProductTrust />
    </div>
  ),
};
