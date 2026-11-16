import type { Meta, StoryObj } from "@storybook/react-vite";

import { Reviews } from "./reviews";
import { REVIEWS_DEMO, REVIEWS_DEMO_RATING } from "./reviews.demo";

const meta = {
  title: "Home/Reviews",
  component: Reviews,
  parameters: { surface: "page" },
  args: { rating: REVIEWS_DEMO_RATING, reviews: REVIEWS_DEMO },
} satisfies Meta<typeof Reviews>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
