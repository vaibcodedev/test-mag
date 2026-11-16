import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowRight, Heart, ShoppingCart } from "lucide-react";

import { Button } from "./button";

const meta = {
  title: "UI/Button",
  component: Button,
  tags: ["autodocs"],
  args: { children: "Купити", variant: "primary", size: "md" },
  argTypes: {
    variant: {
      control: "select",
      options: ["primary", "lime", "ink", "secondary", "surface", "ghost", "on-dark", "link"],
    },
    size: { control: "inline-radio", options: ["sm", "md", "lg", "icon"] },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Primary: Story = {};

export const WithIcon: Story = {
  render: (args) => (
    <Button {...args}>
      <ShoppingCart aria-hidden="true" />
      Купити
    </Button>
  ),
};

export const OnLight: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Купити</Button>
      <Button variant="ink">Оформити замовлення</Button>
      <Button variant="secondary">Порівняти</Button>
      <Button variant="ghost">Скасувати</Button>
      <Button variant="link">Усі умови доставки</Button>
    </div>
  ),
};

/** lime та on-dark дозволені тільки на ink. */
export const OnInk: Story = {
  parameters: { surface: "ink" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button variant="lime">
        Купити
        <ArrowRight aria-hidden="true" />
      </Button>
      <Button variant="on-dark">Порівняти</Button>
      <Button variant="on-dark" size="icon" aria-label="Додати в обране">
        <Heart aria-hidden="true" />
      </Button>
    </div>
  ),
};

/** surface: друга дія на сірому тлі сторінки, де secondary зливається з тлом. */
export const OnPage: Story = {
  parameters: { surface: "page" },
  render: () => (
    <div className="flex flex-wrap items-center gap-3">
      <Button>Купити</Button>
      <Button variant="surface">Показати ще</Button>
      <Button variant="surface" size="sm">
        Усі статті
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-end gap-3">
      <Button size="sm">sm, 40</Button>
      <Button size="md">md, 46</Button>
      <Button size="lg">lg, 56</Button>
      <Button size="icon" aria-label="Кошик">
        <ShoppingCart aria-hidden="true" />
      </Button>
    </div>
  ),
};

export const Disabled: Story = { args: { disabled: true } };

export const Loading: Story = { args: { loading: true } };

export const FullWidth: Story = { args: { className: "w-full" } };
