import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowUpRight, Heart, Smartphone } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  title: "UI/Card",
  component: Card,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { tone: "surface", padding: "md", interactive: false },
  argTypes: {
    size: { control: "inline-radio", options: ["card", "panel"] },
    tone: { control: "inline-radio", options: ["surface", "page", "ink", "on-ink", "blue"] },
    padding: { control: "inline-radio", options: ["none", "sm", "md", "lg", "panel"] },
    interactive: { control: "boolean" },
  },
  decorators: [
    (Story) => (
      <div className="max-w-sm">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Card>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle asChild>
          <h3>Trade-in</h3>
        </CardTitle>
        <CardDescription>
          Здайте старий iPhone і отримайте знижку до 30 000 ₴ на новий.
        </CardDescription>
      </CardHeader>
      <CardFooter>
        <Button size="sm">Оцінити пристрій</Button>
      </CardFooter>
    </Card>
  ),
};

/** Шапка з дією в кутку. */
export const WithAction: Story = {
  render: (args) => (
    <Card {...args}>
      <CardHeader>
        <CardTitle asChild>
          <h3>iPhone 17 Pro 256 ГБ, синій титан</h3>
        </CardTitle>
        <CardDescription>У наявності в шоурумі</CardDescription>
        <CardAction>
          <Button
            variant="secondary"
            size="icon"
            className="rounded-pill"
            aria-label="Додати в обране: iPhone 17 Pro"
          >
            <Heart aria-hidden="true" />
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent className="text-price">64 999 ₴</CardContent>
    </Card>
  ),
};

/** Натискна плитка категорії: уся картка — посилання, на hover піднімається. */
export const InteractiveTile: Story = {
  args: { interactive: true },
  render: (args) => (
    <Card {...args} asChild className="focus-ring">
      <Link to="/collections/iphone">
        <div className="flex aspect-square items-center justify-center rounded-md bg-photo">
          <Smartphone aria-hidden="true" strokeWidth={2} className="size-6 lift-photo text-ink-2" />
        </div>
        <CardFooter className="justify-between">
          <CardTitle className="text-h3">iPhone</CardTitle>
          <ArrowUpRight aria-hidden="true" strokeWidth={2} className="size-6" />
        </CardFooter>
      </Link>
    </Card>
  ),
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Card tone="surface">
        <CardTitle>surface</CardTitle>
        <CardDescription>Біла картка на тлі сторінки.</CardDescription>
      </Card>
      <Card tone="ink">
        <CardTitle>ink</CardTitle>
        <CardDescription>Темна плитка: тут дозволений lime.</CardDescription>
        <CardFooter>
          <Button variant="lime" size="sm">
            Купити
          </Button>
        </CardFooter>
      </Card>
      <Card tone="blue">
        <CardTitle>blue</CardTitle>
        <CardDescription>Акцентна плитка-дія.</CardDescription>
      </Card>
    </div>
  ),
};

/** Тон page живе на білій секції. */
export const PageTone: Story = {
  args: { tone: "page" },
  parameters: { surface: "surface" },
  render: (args) => (
    <Card {...args}>
      <CardTitle>Оплата частинами</CardTitle>
      <CardDescription>До 25 платежів без переплат.</CardDescription>
    </Card>
  ),
};

/** Панель-секція: радіус xl і поля 24 → 40. Так зібрані секції головної. */
export const Panel: Story = {
  args: { size: "panel", padding: undefined },
  render: (args) => (
    <Card {...args}>
      <CardTitle asChild size="h2-panel">
        <h2>Про Ionov Store</h2>
      </CardTitle>
      <CardDescription className="text-body">
        Шоурум у центрі Вінниці: техніку можна потримати в руках, перш ніж купити.
      </CardDescription>
    </Card>
  ),
};

/** Картка всередині ink-секції (відгуки): білий 10%. */
export const OnInk: Story = {
  args: { tone: "on-ink" },
  parameters: { surface: "ink" },
  render: (args) => (
    <Card {...args}>
      <CardTitle asChild size="h3">
        <h3>Олена, Вінниця</h3>
      </CardTitle>
      <CardDescription>Допомогли перенести дані зі старого телефона.</CardDescription>
    </Card>
  ),
};
