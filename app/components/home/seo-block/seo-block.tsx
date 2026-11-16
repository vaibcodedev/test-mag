import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router";

import { Section, SectionHeader } from "~/components/layout/section";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "~/components/ui/collapsible";
import { Item } from "~/components/ui/item";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/utils";

export type SeoBlockLink = { title: string; to: string };

export type SeoBlockProps = {
  /** Заголовок секції (h2); він же заголовок SEO-тексту. */
  title: string;
  /** Абзаци SEO-тексту. Усі потрапляють у HTML і лишаються в DOM, поки текст згорнутий. */
  paragraphs: string[];
  popularModels: SeoBlockLink[];
  buyerLinks: SeoBlockLink[];
  popularQueries: SeoBlockLink[];
};

const SECTION_ID = "seo";

function LinkColumn({
  id,
  title,
  links,
  variant = "list",
}: {
  id: string;
  title: string;
  links: SeoBlockLink[];
  variant?: "list" | "chips";
}) {
  if (links.length === 0) return null;

  const chips = variant === "chips";

  return (
    <nav aria-labelledby={id} className="min-w-0">
      <h3 id={id} className="mb-2 text-card-title text-ink">
        {title}
      </h3>
      {/* Рядки-посилання мають власні поля 12px, тому список зсунуто на них ліворуч. */}
      <ul role="list" className={chips ? "flex flex-wrap gap-2" : "-mx-3 grid grid-cols-2 gap-x-2"}>
        {links.map((link) => (
          <li key={`${link.to}-${link.title}`} className="min-w-0">
            <Item
              asChild
              variant={chips ? "muted" : "default"}
              size="sm"
              className={cn("text-ink-2", chips && "w-auto")}
            >
              <Link to={link.to} prefetch="intent">
                {link.title}
              </Link>
            </Item>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/**
 * SEO-блок: посилання на популярні моделі, сторінки для покупців, популярні запити й текст.
 * Текст лежить у Collapsible із `forceMount`: він повністю є в серверному HTML і в DOM.
 * Поки блок згорнутий, видно перші шість рядків; кнопка «Читати далі» (потребує JS)
 * знімає обмеження висоти.
 */
export function SeoBlock({
  title,
  paragraphs,
  popularModels,
  buyerLinks,
  popularQueries,
}: SeoBlockProps) {
  const [open, setOpen] = useState(false);

  return (
    <Section id={SECTION_ID}>
      <Card className="gap-8 rounded-xl md:p-10">
        <SectionHeader sectionId={SECTION_ID} title={title} className="mb-0" />

        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3 lg:gap-12">
          <LinkColumn id="seo-models" title="Популярні моделі" links={popularModels} />
          <LinkColumn id="seo-buyers" title="Покупцям" links={buyerLinks} />
          <LinkColumn
            id="seo-queries"
            title="Популярні запити"
            links={popularQueries}
            variant="chips"
          />
        </div>

        <Separator />

        <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col items-start gap-2">
          {/*
            Згорнутий текст не ховається, а обрізається по шостому рядку: висота й проміжки
            задані в одиницях lh. Клас data-closed:block скасовує базовий data-closed:hidden.
          */}
          <CollapsibleContent
            forceMount
            data-slot="seo-text"
            className="max-w-4xl space-y-[1lh] overflow-hidden text-body text-ink-2 data-closed:block data-closed:max-h-[6lh]"
          >
            {paragraphs.map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </CollapsibleContent>
          <CollapsibleTrigger asChild>
            <Button variant="link" className="min-h-11">
              {open ? "Згорнути" : "Читати далі"}
              <ChevronDown
                aria-hidden="true"
                strokeWidth={2}
                className={cn("transition-transform", open && "rotate-180")}
              />
            </Button>
          </CollapsibleTrigger>
        </Collapsible>
      </Card>
    </Section>
  );
}
