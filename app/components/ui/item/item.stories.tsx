import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  ArrowUpRight,
  Check,
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
    variant: {
      control: "inline-radio",
      options: ["default", "outline", "muted", "active", "on-dark"],
    },
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

/** Поточний пункт бічної навігації: variant="active" разом з aria-current. */
export const ActiveNavigation: Story = {
  render: () => (
    <ItemGroup asChild className="gap-1">
      <ul>
        <li>
          <Item asChild size="sm" variant="active">
            <Link to="/pages/delivery" aria-current="page">
              <ItemContent>
                <ItemTitle>Доставка й оплата</ItemTitle>
              </ItemContent>
            </Link>
          </Item>
        </li>
        <li>
          <Item asChild size="sm">
            <Link to="/pages/warranty">
              <ItemContent>
                <ItemTitle>Гарантія</ItemTitle>
              </ItemContent>
            </Link>
          </Item>
        </li>
      </ul>
    </ItemGroup>
  ),
};

/** Позначка-галочка 24px і кругла плитка-стрілка: size="sm", shape="round". */
export const RoundMedia: Story = {
  render: () => (
    <Item size="none" className="flex-nowrap gap-3">
      <ItemMedia variant="icon" size="sm" shape="round">
        <Check strokeWidth={2} aria-hidden="true" />
      </ItemMedia>
      <ItemContent>
        <ItemDescription className="text-body text-ink">
          Перевіряємо кожен пристрій перед продажем
        </ItemDescription>
      </ItemContent>
      <ItemMedia variant="icon" shape="round" aria-hidden="true">
        <ArrowUpRight strokeWidth={2} />
      </ItemMedia>
    </Item>
  ),
};

/** Lime-іконка на ink: контакти у футері та блок шоуруму. */
export const LimeOnInk: Story = {
  parameters: { surface: "ink" },
  render: () => (
    <ItemGroup>
      <Item variant="on-dark" size="none">
        <ItemMedia variant="icon" tone="lime">
          <MapPin strokeWidth={2} aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>Шоурум у Вінниці</ItemTitle>
          <ItemDescription>Щодня з 10:00 до 20:00</ItemDescription>
        </ItemContent>
      </Item>
      <Item variant="on-dark" size="sm">
        <ItemMedia tone="lime">
          <Phone strokeWidth={2} aria-hidden="true" />
        </ItemMedia>
        <ItemContent>
          <ItemTitle>068 129 99 00</ItemTitle>
        </ItemContent>
      </Item>
    </ItemGroup>
  ),
};
