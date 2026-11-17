import type { Meta, StoryObj } from "@storybook/react-vite";

import { demoImage } from "~/components/home/home.fixtures";
import { AspectRatio } from "~/components/ui/aspect-ratio";

import { ProductVideo } from "./product-video";

/** Відкритий зразок відео (CC0) з прикладів MDN: лише для історій. */
const SAMPLE_MP4 = "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4";

const meta = {
  title: "Product/ProductVideo",
  component: ProductVideo,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    label: "Огляд камери",
    poster: demoImage(1),
    sources: [{ url: SAMPLE_MP4, mimeType: "video/mp4", width: 960, height: 540 }],
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl overflow-hidden rounded-xl">
        <AspectRatio ratio={1}>
          <Story />
        </AspectRatio>
      </div>
    ),
  ],
} satisfies Meta<typeof ProductVideo>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Обкладинка з кнопкою; після натискання — відео без панелі керування. Клік по кадру ставить
 * на паузу, і кнопка «Відтворити» повертається. З клавіатури: пробіл або K.
 */
export const Default: Story = {};

/** Shopify ще не згенерував обкладинку: темне тло з кнопкою. */
export const NoPoster: Story = { args: { poster: null } };

/** Жодне джерело не завантажилось: після «Відтворити» — пояснення й «Спробувати ще раз». */
export const BrokenSource: Story = {
  args: {
    sources: [{ url: "https://cdn.shopify.com/videos/missing.mp4", mimeType: "video/mp4" }],
  },
};
