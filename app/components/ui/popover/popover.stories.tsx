import type { Meta, StoryObj } from "@storybook/react-vite";
import { CreditCard, Info } from "lucide-react";

import { Button } from "~/components/ui/button";

import {
  Popover,
  PopoverClose,
  PopoverContent,
  PopoverDescription,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "./popover";

const meta = {
  title: "UI/Popover",
  component: Popover,
  tags: ["autodocs"],
} satisfies Meta<typeof Popover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Пояснення поруч з умовою: що таке оплата частинами. */
export const Installment: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary">
          <CreditCard aria-hidden="true" />
          Оплата частинами
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start">
        <PopoverHeader>
          <PopoverTitle>4 800 ₴ на місяць</PopoverTitle>
          <PopoverDescription>
            25 платежів без переплат від monobank або ПриватБанку. Перший платіж — у день покупки.
          </PopoverDescription>
        </PopoverHeader>
        <PopoverClose asChild>
          <Button size="sm" className="w-fit">
            Зрозуміло
          </Button>
        </PopoverClose>
      </PopoverContent>
    </Popover>
  ),
};

export const FromIconButton: Story = {
  render: () => (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="secondary" size="icon" aria-label="Що означає стан «Відмінний»">
          <Info aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent>
        <PopoverHeader>
          <PopoverTitle>Стан «Відмінний»</PopoverTitle>
          <PopoverDescription>
            Ледь помітні сліди на корпусі, екран без подряпин, акумулятор від 90%.
          </PopoverDescription>
        </PopoverHeader>
      </PopoverContent>
    </Popover>
  ),
};
