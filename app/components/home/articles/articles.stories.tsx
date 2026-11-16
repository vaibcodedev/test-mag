import type { Meta, StoryObj } from "@storybook/react-vite";

import { Articles } from "./articles";
import { ARTICLES_DEMO, ARTICLES_DEMO_CONTENT } from "./articles.demo";

const meta = {
  title: "Home/Articles",
  component: Articles,
  parameters: { surface: "page" },
  args: { content: ARTICLES_DEMO_CONTENT, articles: ARTICLES_DEMO },
} satisfies Meta<typeof Articles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImages: Story = {
  args: { articles: ARTICLES_DEMO.map((article) => ({ ...article, image: null })) },
};
