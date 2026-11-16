import type { Meta, StoryObj } from "@storybook/react-vite";
import { ARTICLES_DEMO } from "~/components/home/articles";

import { RelatedArticles } from "./related-articles";

const meta = {
  title: "Content/RelatedArticles",
  component: RelatedArticles,
  parameters: { surface: "page" },
  args: { articles: ARTICLES_DEMO.slice(0, 3), blogHandle: "blog" },
} satisfies Meta<typeof RelatedArticles>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OneArticle: Story = { args: { articles: ARTICLES_DEMO.slice(0, 1) } };
