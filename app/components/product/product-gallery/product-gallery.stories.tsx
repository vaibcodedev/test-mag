import type { Meta, StoryObj } from "@storybook/react-vite";

import { DEMO_IMAGES } from "~/components/home/home.fixtures";

import { ProductGallery } from "./product-gallery";

const meta = {
  title: "Product/ProductGallery",
  component: ProductGallery,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { title: "iPhone 17 Pro 256 ГБ, синій титан", images: DEMO_IMAGES },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Кілька фото: стрілки й мініатюри на десктопі, крапки на мобільному. */
export const Default: Story = {};

export const SingleImage: Story = { args: { images: DEMO_IMAGES.slice(0, 1) } };

export const NoImages: Story = { args: { images: [] } };

/** Вузька колонка, як на телефоні. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
