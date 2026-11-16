import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heart, SearchX, ShoppingCart } from "lucide-react";
import { Link } from "react-router";

import { Button } from "~/components/ui/button";

import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./empty";

const meta = {
  title: "UI/Empty",
  component: Empty,
  tags: ["autodocs"],
  parameters: { surface: "page" },
  args: { size: "md", centered: false },
  argTypes: {
    size: { control: "inline-radio", options: ["md", "sm"] },
    centered: { control: "boolean" },
  },
} satisfies Meta<typeof Empty>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Порожня сторінка кошика: заголовок h1, одна головна дія. */
export const Cart: Story = {
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia>
          <ShoppingCart strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle as="h1">У кошику поки порожньо</EmptyTitle>
        <EmptyDescription>
          Додайте iPhone, Mac чи аксесуар — і оформіть замовлення за дві хвилини.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/collections/all">Перейти в каталог</Link>
        </Button>
        <Button asChild variant="secondary">
          <Link to="/collections/deals">Подивитися знижки</Link>
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

export const Centered: Story = {
  args: { centered: true },
  render: (args) => (
    <Empty {...args}>
      <EmptyHeader>
        <EmptyMedia>
          <SearchX strokeWidth={2} />
        </EmptyMedia>
        <EmptyTitle>За запитом «айфон 18» нічого немає</EmptyTitle>
        <EmptyDescription>
          Перевірте назву або <Link to="/pages/contacts">напишіть нам</Link> — підкажемо, що є в
          наявності.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild>
          <Link to="/collections/all">Увесь каталог</Link>
        </Button>
      </EmptyContent>
    </Empty>
  ),
};

/** Компактний варіант для шухляди чи блока в кабінеті. */
export const Small: Story = {
  args: { size: "sm" },
  render: (args) => (
    <div className="max-w-sm">
      <Empty {...args}>
        <EmptyHeader>
          <EmptyMedia>
            <Heart strokeWidth={2} />
          </EmptyMedia>
          <EmptyTitle as="h3">В обраному порожньо</EmptyTitle>
          <EmptyDescription>Натисніть сердечко на товарі, щоб зберегти його тут.</EmptyDescription>
        </EmptyHeader>
      </Empty>
    </div>
  ),
};
