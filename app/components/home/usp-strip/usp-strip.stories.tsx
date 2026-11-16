import type { Meta, StoryObj } from "@storybook/react-vite";

import { UspStrip } from "./usp-strip";
import { DEMO_USPS } from "./usp-strip.demo";

const meta = {
  title: "Home/UspStrip",
  component: UspStrip,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { usps: DEMO_USPS },
} satisfies Meta<typeof UspStrip>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Назви іконки немає в переліку: показується запасна. */
export const UnknownIcon: Story = {
  args: { usps: DEMO_USPS.map((usp, index) => (index === 0 ? { ...usp, icon: "rocket" } : usp)) },
};
