import type { Meta, StoryObj } from "@storybook/react-vite";

import { ARTICLES_DEMO, type ArticleCardData } from "~/components/home/articles";

import { ArticleCard } from "./article-card";

const [FIRST] = ARTICLES_DEMO;
if (!FIRST) throw new Error("ARTICLES_DEMO порожній");

const LONG: ArticleCardData = {
  ...FIRST,
  handle: "dovha-nazva",
  title: "Як перенести дані зі старого iPhone на новий і нічого не загубити дорогою",
  excerpt:
    "Резервна копія в iCloud, перенесення напряму з телефона на телефон і через комп'ютер: коли який спосіб зручніший, скільки це триває та що перевірити наприкінці, щоб фото, листування й банківські застосунки були на місці.",
};

const meta = {
  title: "Content/ArticleCard",
  component: ArticleCard,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { article: FIRST, blogHandle: "blog", headingLevel: "h3", priority: false },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ArticleCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

/** Довгий заголовок переноситься, уривок обрізається до трьох рядків. */
export const LongText: Story = { args: { article: LONG } };

export const WithoutImage: Story = { args: { article: { ...FIRST, image: null } } };

export const WithoutExcerpt: Story = { args: { article: { ...FIRST, excerpt: "" } } };

/** Сітка, як у списку блогу: картки однакової висоти. */
export const Grid: Story = {
  decorators: [
    () => (
      <ul role="list" className="grid max-w-none gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {[...ARTICLES_DEMO, LONG].map((article) => (
          <li key={article.handle} className="min-w-0">
            <ArticleCard article={article} headingLevel="h2" />
          </li>
        ))}
      </ul>
    ),
  ],
};
