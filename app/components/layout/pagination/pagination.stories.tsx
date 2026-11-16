import type { Meta, StoryObj } from "@storybook/react-vite";

import { Pagination } from "./pagination";

const NEXT = "/collections/iphone?sort_by=price-ascending&after=cursor-end";
const PREVIOUS = "/collections/iphone?sort_by=price-ascending&before=cursor-start";

const meta = {
  title: "Layout/Pagination",
  component: Pagination,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: {
    "aria-label": "Сторінки каталогу",
    previousHref: null,
    nextHref: NEXT,
    showMore: true,
    shownCount: 24,
    totalCount: 96,
    loading: false,
    // У Storybook наступної сторінки немає: кнопка лише показує свій стан.
    onLoadMore: () => undefined,
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Колекція: «Показати ще», підсумок і текстові посилання на сусідні сторінки. */
export const FirstPage: Story = {};

export const MiddlePage: Story = { args: { previousHref: PREVIOUS, shownCount: 48 } };

export const LastPage: Story = {
  args: { previousHref: PREVIOUS, nextHref: null, shownCount: 96 },
};

export const Loading: Story = { args: { loading: true } };

/** Товарів більше, ніж ми рахуємо: показуємо лише кількість на сторінці. */
export const UnknownTotal: Story = { args: { totalCount: null } };

export const SinglePage: Story = {
  args: { previousHref: null, nextHref: null, shownCount: 9, totalCount: 9 },
};

/** Пошук: лише перехід між сторінками, без «Показати ще» й підсумку. */
export const LinksOnly: Story = {
  args: {
    "aria-label": "Сторінки результатів",
    previousHref: "/search?q=iphone&before=cursor-start",
    nextHref: "/search?q=iphone&after=cursor-end",
    showMore: false,
    shownCount: undefined,
    totalCount: undefined,
    onLoadMore: undefined,
    prefetch: "intent",
  },
};
