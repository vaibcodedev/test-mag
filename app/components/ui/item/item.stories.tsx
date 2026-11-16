import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowUpRight,
  ChevronRight,
  MapPin,
  Phone,
  ShieldCheck,
  Smartphone,
  Truck,
} from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemSeparator,
  ItemTitle,
} from "./item";

const meta = {
  title: "UI/Item",
  component: Item,
  tags: ["autodocs"],
  args: { variant: "default", size: "md" },
  argTypes: {
    variant: { control: "inline-radio", options: ["default", "outline", "muted", "on-dark"] },
    size: { control: "inline-radio", options: ["md", "sm", "none"] },
  },
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Item>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Рядок переваги: плитка з іконкою, заголовок, пояснення. */
export const Usp: Story = {
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon">
        <Truck strokeWidth={2} aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Доставка завтра</ItemTitle>
        <ItemDescription>Новою поштою по Україні або кур&apos;єром по Вінниці.</ItemDescription>
      </ItemContent>
    </Item>
  ),
};

export const Outline: Story = {
  args: { variant: "outline" },
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon" size="lg">
        <ShieldCheck strokeWidth={2} aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Гарантія 12 місяців</ItemTitle>
        <ItemDescription>Ремонтуємо або міняємо у власному сервісі.</ItemDescription>
      </ItemContent>
      <ItemActions>
        <Button variant="secondary" size="sm">
          Умови
        </Button>
      </ItemActions>
    </Item>
  ),
};

/** Рядок-посилання: увесь рядок натискається, hover підсвічує тло. */
export const ContactLinks: Story = {
  render: () => (
    <ItemGroup asChild>
      <ul>
        <li>
          <Item asChild variant="muted">
            <a href="tel:+380681299900">
              <ItemMedia>
                <Phone strokeWidth={2} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>068 129 99 00</ItemTitle>
                <ItemDescription>Щодня з 10:00 до 20:00</ItemDescription>
              </ItemContent>
              <ChevronRight strokeWidth={2} aria-hidden="true" className="size-5 text-ink-2" />
            </a>
          </Item>
        </li>
        <li>
          <Item asChild variant="muted">
            <Link to="/pages/contacts">
              <ItemMedia>
                <MapPin strokeWidth={2} aria-hidden="true" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>Шоурум у Вінниці</ItemTitle>
                <ItemDescription>Подивитися на мапі та прокласти маршрут</ItemDescription>
              </ItemContent>
              <ChevronRight strokeWidth={2} aria-hidden="true" className="size-5 text-ink-2" />
            </Link>
          </Item>
        </li>
      </ul>
    </ItemGroup>
  ),
};

/** Підказки пошуку: компактні рядки з мініатюрою. */
export const SearchSuggestions: Story = {
  render: () => (
    <ItemGroup className="gap-0">
      {["iPhone 17 Pro 256 ГБ, синій титан", "iPhone 17 256 ГБ, чорний"].map((title, index) => (
        <div key={title}>
          {index > 0 ? <ItemSeparator /> : null}
          <Item asChild size="sm">
            <Link to="/products/iphone-17-pro">
              <ItemMedia variant="image">
                <Smartphone strokeWidth={2} aria-hidden="true" className="size-6 text-ink-2" />
              </ItemMedia>
              <ItemContent>
                <ItemTitle>{title}</ItemTitle>
                <ItemDescription>від 64 999 ₴</ItemDescription>
              </ItemContent>
              <ArrowUpRight strokeWidth={2} aria-hidden="true" className="size-5 text-ink-2" />
            </Link>
          </Item>
        </div>
      ))}
    </ItemGroup>
  ),
};

export const OnInk: Story = {
  args: { variant: "on-dark" },
  parameters: { surface: "ink" },
  render: (args) => (
    <Item {...args}>
      <ItemMedia variant="icon" tone="dark" size="lg">
        <Truck strokeWidth={2} aria-hidden="true" className="text-lime" />
      </ItemMedia>
      <ItemContent>
        <ItemTitle>Самовивіз сьогодні</ItemTitle>
        <ItemDescription>
          Заберіть замовлення в шоурумі через годину після оформлення.
        </ItemDescription>
      </ItemContent>
    </Item>
  ),
};
