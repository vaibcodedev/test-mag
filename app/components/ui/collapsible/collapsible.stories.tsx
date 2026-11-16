import type { Meta, StoryObj } from "@storybook/react-vite";
import { ChevronDown } from "lucide-react";

import { Button } from "~/components/ui/button";

import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "./collapsible";

const meta = {
  title: "UI/Collapsible",
  component: Collapsible,
  tags: ["autodocs"],
} satisfies Meta<typeof Collapsible>;

export default meta;
type Story = StoryObj<typeof meta>;

function Trigger() {
  return (
    <CollapsibleTrigger asChild>
      <Button variant="secondary" size="sm" className="group/trigger w-fit">
        Усі характеристики
        <ChevronDown
          aria-hidden="true"
          className="size-4 transition-transform group-aria-expanded/trigger:rotate-180"
        />
      </Button>
    </CollapsibleTrigger>
  );
}

export const Default: Story = {
  render: () => (
    <Collapsible className="flex max-w-md flex-col gap-3">
      <p className="text-body text-ink-2">Дисплей 6,3 дюйма, чип A19 Pro, 256 ГБ.</p>
      <CollapsibleContent className="text-body text-ink-2">
        Камера 48 Мп, до 33 годин відео, eSIM і nano-SIM, захист IP68, вага 199 г.
      </CollapsibleContent>
      <Trigger />
    </Collapsible>
  ),
};

/** Вміст лишається в DOM і в закритому стані: текст доступний пошуковим роботам. */
export const ForceMount: Story = {
  render: () => (
    <Collapsible className="flex max-w-md flex-col gap-3">
      <p className="text-body text-ink-2">Доставимо завтра Новою поштою.</p>
      <CollapsibleContent forceMount className="text-body text-ink-2">
        Кур&apos;єр по Вінниці привозить у день замовлення, якщо оформити до 16:00. Самовивіз із
        шоуруму — щодня з 10:00 до 20:00.
      </CollapsibleContent>
      <Trigger />
    </Collapsible>
  ),
};
