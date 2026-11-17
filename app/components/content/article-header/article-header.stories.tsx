import type { Meta, StoryObj } from "@storybook/react-vite";
import { ARTICLES_DEMO } from "~/components/home/articles";

import { ArticleHeader } from "./article-header";

const meta = {
  title: "Content/ArticleHeader",
  component: ArticleHeader,
  parameters: { surface: "page" },
  args: {
    title: "Як вибрати iPhone у 2026 році",
    publishedAt: "2026-11-10T09:00:00+02:00",
    readingMinutes: 5,
    authorName: "Олена з Ionov Store",
    image: ARTICLES_DEMO[0]?.image ?? null,
  },
} satisfies Meta<typeof ArticleHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WithoutImage: Story = { args: { image: null } };

/** Лише обов'язкові поля: заголовок і дата. */
export const Minimal: Story = { args: { image: null, readingMinutes: null, authorName: null } };
