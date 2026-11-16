import type { Meta, StoryObj } from "@storybook/react-vite";

import { Badge } from "./badge";

const meta = {
  title: "UI/Badge",
  component: Badge,
  tags: ["autodocs"],
  args: { children: "Новинка", variant: "new" },
  argTypes: {
    variant: {
      control: "select",
      options: [
        "new",
        "hit",
        "top",
        "sale",
        "grade",
        "outline",
        "count",
        "count-on-blue",
        "chip",
        "chip-surface",
        "chip-on-dark",
      ],
    },
  },
} satisfies Meta<typeof Badge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const New: Story = {};

export const All: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="new">Новинка</Badge>
      <Badge variant="hit">Хіт</Badge>
      <Badge variant="top">Топ</Badge>
      <Badge variant="sale">−8%</Badge>
      <Badge variant="grade">Відмінний</Badge>
      <Badge variant="outline">eSIM</Badge>
    </div>
  ),
};

/** Лічильники: count на світлому тлі, count-on-blue на синій кнопці. */
export const Counts: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Badge variant="count">3</Badge>
      <Badge variant="count">12</Badge>
      <span className="inline-flex h-11 items-center gap-2 rounded-md bg-blue px-4 text-small font-semibold text-surface">
        Кошик
        <Badge variant="count-on-blue">2</Badge>
      </span>
    </div>
  ),
};

/** Чипи: умова чи характеристика. chip — на білій картці, chip-on-dark — на ink. */
export const Chips: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="chip">4 800 ₴ × 25 міс.</Badge>
        <Badge variant="chip">256 ГБ</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-page p-4">
        <Badge variant="chip-surface">eSIM</Badge>
        <Badge variant="chip-surface">Гарантія 12 міс.</Badge>
      </div>
      <div className="flex flex-wrap items-center gap-2 rounded-md bg-ink p-4">
        <Badge variant="chip-on-dark">A19 Pro</Badge>
        <Badge variant="chip-on-dark">Камера 48 Мп</Badge>
      </div>
    </div>
  ),
};
