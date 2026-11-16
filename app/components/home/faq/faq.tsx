import { Section, SectionHeader } from "~/components/layout/section";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "~/components/ui/accordion";
import { Card } from "~/components/ui/card";

export type FaqItem = { question: string; answer: string };

export type FaqProps = {
  title?: string;
  description?: string;
  /** Метаоб'єкти `faq_item`: питання й відповідь. */
  items: FaqItem[];
};

const SECTION_ID = "faq";

/**
 * Відповідь змонтована завжди (`forceMount`), тому Radix її не ховає сам:
 * закритий блок прибирає з екрана цей клас на AccordionItem.
 */
const HIDE_CLOSED_ANSWER = "[&[data-state=closed]>[data-slot=accordion-content]]:hidden";

/**
 * Часті запитання на Accordion. Відповіді змонтовані примусово, тож повністю лежать
 * у серверному HTML і лишаються в DOM, поки блок згорнутий: їх бачать пошуковики.
 * Розгортання потребує JS; можна відкрити кілька відповідей одразу.
 */
export function Faq({ title = "Часті запитання", description, items }: FaqProps) {
  return (
    <Section id={SECTION_ID}>
      <div className="grid gap-x-12 gap-y-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <SectionHeader
          sectionId={SECTION_ID}
          title={title}
          description={description}
          className="mb-0 items-start lg:sticky lg:top-28 lg:self-start"
        />

        <Accordion asChild type="multiple" className="min-w-0 gap-3">
          <ul role="list">
            {items.map((item) => (
              <Card key={item.question} asChild padding="none">
                <AccordionItem asChild value={item.question} className={HIDE_CLOSED_ANSWER}>
                  <li>
                    <AccordionTrigger className="rounded-lg px-5 md:px-6">
                      {item.question}
                    </AccordionTrigger>
                    <AccordionContent
                      forceMount
                      className="max-w-3xl px-5 pb-5 whitespace-pre-line md:px-6 md:pb-6"
                    >
                      {item.answer}
                    </AccordionContent>
                  </li>
                </AccordionItem>
              </Card>
            ))}
          </ul>
        </Accordion>
      </div>
    </Section>
  );
}
