import type { Meta, StoryObj } from "@storybook/react-vite";

import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "./accordion";

const QUESTIONS = [
  { question: "Чи є гарантія?", answer: "Так, 12 місяців на всю нову техніку." },
  { question: "Як оплатити частинами?", answer: "До 25 платежів без переплат від monobank." },
];

// Пропси Accordion — об'єднання single | multiple, тому args тут не типізуються: історії
// рендерять акордеон самі.
const meta: Meta = {
  title: "UI/Accordion",
  component: Accordion,
  tags: ["autodocs"],
  decorators: [
    (Story) => (
      <div className="max-w-xl">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj;

export const Default: Story = {
  render: () => (
    <Accordion type="single" collapsible>
      {QUESTIONS.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};

/** Відповіді лежать у DOM і в закритому стані (SEO): так зібрано «Часті запитання». */
export const ForceMounted: Story = {
  render: () => (
    <Accordion type="multiple">
      {QUESTIONS.map((item) => (
        <AccordionItem key={item.question} value={item.question}>
          <AccordionTrigger>{item.question}</AccordionTrigger>
          <AccordionContent forceMount>{item.answer}</AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  ),
};
