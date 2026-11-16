import type { Meta, StoryObj } from "@storybook/react-vite";

import { HeroSlider } from "./hero-slider";
import { DEMO_HOME_BANNERS } from "./hero-slider.demo";

const meta = {
  title: "Home/HeroSlider",
  component: HeroSlider,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { banners: DEMO_HOME_BANNERS },
  decorators: [
    (Story) => (
      <div className="max-w-4xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof HeroSlider>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Один банер: лічильника і стрілок немає. */
export const SingleBanner: Story = { args: { banners: DEMO_HOME_BANNERS.slice(0, 1) } };

/** Вузька колонка (мобільний): фото стає над текстом. */
export const Narrow: Story = {
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
};
