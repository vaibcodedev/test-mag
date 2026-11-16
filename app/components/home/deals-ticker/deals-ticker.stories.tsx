import type { Meta, StoryObj } from "@storybook/react-vite";

import { DealsTicker } from "./deals-ticker";
import { DEALS_TICKER_DEMO_ITEMS } from "./deals-ticker.demo";

const meta = {
  title: "Home/DealsTicker",
  component: DealsTicker,
  tags: ["autodocs"],
  parameters: { surface: "ink" },
  args: { items: DEALS_TICKER_DEMO_ITEMS },
} satisfies Meta<typeof DealsTicker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Мало позицій: рядок сам повторює їх, щоб не було порожнечі. */
export const TwoItems: Story = { args: { items: DEALS_TICKER_DEMO_ITEMS.slice(0, 2) } };
