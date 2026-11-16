import type { Meta, StoryObj } from "@storybook/react-vite";

import { SeoBlock } from "./seo-block";
import {
  SEO_BLOCK_DEMO_BUYER_LINKS,
  SEO_BLOCK_DEMO_MODELS,
  SEO_BLOCK_DEMO_PARAGRAPHS,
  SEO_BLOCK_DEMO_QUERIES,
  SEO_BLOCK_DEMO_TITLE,
} from "./seo-block.demo";

const meta = {
  title: "Home/SeoBlock",
  component: SeoBlock,
  parameters: { surface: "page" },
  args: {
    title: SEO_BLOCK_DEMO_TITLE,
    paragraphs: SEO_BLOCK_DEMO_PARAGRAPHS,
    popularModels: SEO_BLOCK_DEMO_MODELS,
    buyerLinks: SEO_BLOCK_DEMO_BUYER_LINKS,
    popularQueries: SEO_BLOCK_DEMO_QUERIES,
  },
} satisfies Meta<typeof SeoBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};
