import type { Meta, StoryObj } from "@storybook/react-vite";
import { demoImage } from "~/components/home/home.fixtures";

import { ShopImage } from "./shop-image";

const IMAGE = demoImage(0);

const meta = {
  title: "UI/ShopImage",
  component: ShopImage,
  tags: ["autodocs"],
  args: {
    src: IMAGE.url,
    alt: IMAGE.altText ?? "",
    width: IMAGE.width ?? 600,
    height: IMAGE.height ?? 600,
    sizes: "320px",
    className: "h-auto w-80 rounded-lg",
  },
} satisfies Meta<typeof ShopImage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Фото товару на тлі bg-photo: mix-blend-multiply прибирає білу підкладку. */
export const ProductPhoto: Story = {
  render: (args) => (
    <div className="w-80 overflow-hidden rounded-lg bg-photo">
      <ShopImage {...args} className="size-full object-contain mix-blend-multiply" />
    </div>
  ),
};

/** Зображення першого екрана: без lazy, з fetchpriority="high". */
export const Priority: Story = { args: { priority: true } };
