import type { Meta, StoryObj } from "@storybook/react-vite";
import { ProductForm, type ProductFormFields } from "./product-form";

/** Те, що в магазині повертає register() форми товару Hydrogen. */
const FIELDS: ProductFormFields = {
  merchandiseId: { name: "merchandiseId", value: "gid://shopify/ProductVariant/1" },
  quantity: { name: "quantity", value: "1" },
  submit: { name: "add-to-cart", type: "submit" },
};

const meta = {
  title: "Product/ProductForm",
  component: ProductForm,
  args: {
    fields: FIELDS,
    state: "available",
    method: "post",
    action: "/api/cart",
    onSubmit: (event) => event.preventDefault(),
  },
  argTypes: {
    state: {
      control: "inline-radio",
      options: ["available", "sold-out", "unselected", "unavailable"],
    },
  },
  decorators: [
    (Story) => (
      <div className="max-w-md">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Available: Story = {};

export const Pending: Story = { args: { pending: true } };

export const SoldOut: Story = { args: { state: "sold-out" } };

export const Unselected: Story = { args: { state: "unselected" } };

export const Unavailable: Story = { args: { state: "unavailable" } };

export const WithErrors: Story = {
  args: { errors: ["Стільки одиниць немає в наявності. Зменште кількість."] },
};
