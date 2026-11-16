import type { Meta, StoryObj } from "@storybook/react-vite";

import { PageNav } from "~/components/content/page-nav";
import { ContentSections, RichText } from "~/components/content/rich-text";
import { ShowroomBlock } from "~/components/content/showroom-block";
import { getFallbackPage, SERVICE_PAGES } from "~/lib/content/pages";
import { STORE_INFO } from "~/lib/content/site";

import { PageLayout } from "./page-layout";

const NAV = SERVICE_PAGES.map((page) => ({ title: page.title, to: `/pages/${page.handle}` }));

function fallback(handle: string) {
  const page = getFallbackPage(handle);
  if (!page) throw new Error(`Немає запасної сторінки ${handle}`);
  return page;
}

const delivery = fallback("delivery");
const contacts = fallback("contacts");

const meta = {
  title: "Content/PageLayout",
  component: PageLayout,
  parameters: { surface: "page" },
  args: {
    breadcrumbs: [
      { title: "Головна", to: "/" },
      { title: delivery.title, to: "/pages/delivery" },
    ],
    title: delivery.title,
    lead: delivery.description,
    store: STORE_INFO,
    nav: <PageNav links={NAV} current="/pages/delivery" />,
    children: <ContentSections sections={delivery.sections} />,
  },
} satisfies Meta<typeof PageLayout>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Сервісна сторінка із запасним вмістом і навігацією між сусідніми сторінками. */
export const ServicePage: Story = {};

/** Сторінка контактів: без посилання на саму себе в картці, під текстом — шоурум із картою. */
export const Contacts: Story = {
  args: {
    breadcrumbs: [
      { title: "Головна", to: "/" },
      { title: contacts.title, to: "/pages/contacts" },
    ],
    title: contacts.title,
    lead: contacts.description,
    showroomLink: false,
    nav: <PageNav links={NAV} current="/pages/contacts" />,
    after: <ShowroomBlock store={STORE_INFO} />,
    children: <ContentSections sections={contacts.sections} />,
  },
};

/** Довільна сторінка з магазину: HTML із Shopify, без вступу й без сервісної навігації. */
export const ShopifyPage: Story = {
  args: {
    breadcrumbs: [
      { title: "Головна", to: "/" },
      { title: "Про магазин", to: "/pages/about" },
    ],
    title: "Про магазин",
    lead: null,
    nav: null,
    children: (
      <RichText html="<p>Текст сторінки з адмінки Shopify.</p><h2>Розділ</h2><p>Ще один абзац.</p>" />
    ),
  },
};
