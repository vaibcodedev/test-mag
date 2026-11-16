import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs";

const meta = {
  title: "UI/Tabs, Accordion",
  component: Tabs,
  tags: ["autodocs"],
} satisfies Meta<typeof Tabs>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Вкладки «Популярні товари»: активна залита blue. */
export const Pills: Story = {
  parameters: { surface: "page" },
  render: () => (
    <Tabs defaultValue="hits">
      <TabsList>
        <TabsTrigger value="hits">Хіти</TabsTrigger>
        <TabsTrigger value="new">Новинки</TabsTrigger>
        <TabsTrigger value="study">Для навчання</TabsTrigger>
        <TabsTrigger value="accessories">Аксесуари</TabsTrigger>
      </TabsList>
      <TabsContent value="hits">Найпопулярніші моделі цього місяця.</TabsContent>
      <TabsContent value="new">Щойно з&apos;явилися в шоурумі.</TabsContent>
      <TabsContent value="study">Ноутбуки й планшети для студентів.</TabsContent>
      <TabsContent value="accessories">Чохли, скло, зарядки.</TabsContent>
    </Tabs>
  ),
};

export const Line: Story = {
  render: () => (
    <Tabs defaultValue="specs">
      <TabsList variant="line">
        <TabsTrigger value="specs">Характеристики</TabsTrigger>
        <TabsTrigger value="delivery">Доставка</TabsTrigger>
        <TabsTrigger value="reviews">Відгуки</TabsTrigger>
      </TabsList>
      <TabsContent value="specs">Дисплей 6,3 дюйма, чип A19 Pro, 256 ГБ.</TabsContent>
      <TabsContent value="delivery">Нова пошта, кур&apos;єр по Вінниці, самовивіз.</TabsContent>
      <TabsContent value="reviews">128 відгуків, середня оцінка 4,9.</TabsContent>
    </Tabs>
  ),
};

/** Фільтри каталогу. FAQ верстається на нативних details/summary. */
export const FilterAccordion: Story = {
  render: () => (
    <Accordion type="multiple" defaultValue={["memory"]} className="max-w-sm">
      <AccordionItem value="memory">
        <AccordionTrigger>Пам&apos;ять</AccordionTrigger>
        <AccordionContent>128 ГБ, 256 ГБ, 512 ГБ, 1 ТБ</AccordionContent>
      </AccordionItem>
      <AccordionItem value="color">
        <AccordionTrigger>Колір</AccordionTrigger>
        <AccordionContent>Синій титан, срібний, космічний помаранчевий</AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
