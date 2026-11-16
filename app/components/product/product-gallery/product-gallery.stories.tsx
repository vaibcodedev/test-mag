import type { Meta, StoryObj } from "@storybook/react-vite";

import { ProductGallery } from "./product-gallery";
import { DEMO_MIXED_MEDIA, DEMO_VIDEO, DEMO_YOUTUBE, demoPhotos } from "./product-gallery.fixtures";

const meta = {
  title: "Product/ProductGallery",
  component: ProductGallery,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { title: "iPhone 17 Pro 256 ГБ, синій титан", media: demoPhotos(5) },
  decorators: [
    (Story) => (
      <div className="max-w-2xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ProductGallery>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Кілька фото: стрілки, лічильник на телефоні, мініатюри (на десктопі — стовпчик ліворуч). */
export const Default: Story = {};

/** Одне фото: без каруселі, стрілок і мініатюр. */
export const SingleImage: Story = { args: { media: demoPhotos(1) } };

/** 12 фото: стрічка мініатюр гортається й тримає відкриту мініатюру в полі зору. */
export const TwelveImages: Story = { args: { media: demoPhotos(12) } };

/**
 * Фото, відео Shopify, відео з YouTube і 3D-модель. Плеєр з'являється після «Відтворити»;
 * інший слайд ставить відео на паузу, а плеєр YouTube прибирає.
 */
export const MixedMedia: Story = { args: { media: DEMO_MIXED_MEDIA } };

/** Єдине медіа товару — відео. */
export const SingleVideo: Story = { args: { media: [DEMO_VIDEO] } };

/** Єдине медіа товару — відео з YouTube: <iframe> немає, доки не натиснуто «Відтворити». */
export const SingleExternalVideo: Story = { args: { media: [DEMO_YOUTUBE] } };

export const NoMedia: Story = { args: { media: [] } };

/** Вузька колонка, як на телефоні: мініатюри під головним фото, лічильник замість крапок. */
export const Narrow: Story = {
  args: { media: DEMO_MIXED_MEDIA },
  decorators: [
    (Story) => (
      <div className="w-80">
        <Story />
      </div>
    ),
  ],
};
