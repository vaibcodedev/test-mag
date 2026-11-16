import type { Meta, StoryObj } from "@storybook/react-vite";

import { CATALOG_LINKS } from "~/lib/content/site";

import { SearchEmpty } from "./search-empty";

const meta = {
  title: "Search/SearchEmpty",
  component: SearchEmpty,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { categories: CATALOG_LINKS },
} satisfies Meta<typeof SearchEmpty>;

export default meta;
type Story = StoryObj<typeof meta>;

/** За запитом нічого не знайшли. */
export const NotFound: Story = { args: { term: "айфон 20 ультра" } };

/** Сторінку /search відкрили без запиту. */
export const NoQuery: Story = {};
