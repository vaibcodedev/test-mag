import type { Meta, StoryObj } from "@storybook/react-vite";
import { Smartphone } from "lucide-react";

import { AspectRatio } from "./aspect-ratio";

const SQUARE = 1;
const BANNER = 16 / 9;

const meta = {
  title: "UI/AspectRatio",
  component: AspectRatio,
  tags: ["autodocs"],
  args: { ratio: SQUARE },
  decorators: [
    (Story) => (
      <div className="max-w-xs">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof AspectRatio>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Квадрат під фото товару. */
export const Square: Story = {
  render: (args) => (
    <AspectRatio {...args} className="flex items-center justify-center rounded-lg bg-photo">
      <Smartphone aria-hidden="true" strokeWidth={2} className="size-6 text-ink-2" />
    </AspectRatio>
  ),
};

/** 16:9 під банер або відео. */
export const Banner: Story = {
  args: { ratio: BANNER },
  parameters: { surface: "page" },
  render: (args) => (
    <AspectRatio {...args} className="flex items-end rounded-xl bg-ink p-6 text-h3 text-surface">
      Trade-in: здайте старий iPhone
    </AspectRatio>
  ),
};
