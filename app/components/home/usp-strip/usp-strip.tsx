import { Section, type SectionProps } from "~/components/layout/section";
import { Card } from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";

import { resolveUspIcon } from "./usp-icon";

/** Вміст одного запису метаоб'єкта `usp`. */
export type Usp = {
  /** Назва іконки lucide: «truck», «shield-check». */
  icon: string;
  title: string;
  caption: string;
};

export type UspStripProps = Omit<SectionProps, "id" | "children" | "title"> & {
  usps: readonly Usp[];
  id?: string;
  /** Заголовок секції. Його чують читачі екрана, на екрані його немає. */
  title?: string;
};

/** Смуга переваг магазину: рядки Item на білих картках — іконка, заголовок і підпис. */
export function UspStrip({
  usps,
  id = "usp",
  title = "Чому купують у «Саді»",
  ...props
}: UspStripProps) {
  if (usps.length === 0) return null;

  return (
    <Section id={id} data-slot="usp-strip" {...props}>
      <h2 id={`${id}-title`} className="sr-only">
        {title}
      </h2>
      <ItemGroup asChild className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        <ul>
          {usps.map((usp) => {
            const Icon = resolveUspIcon(usp.icon);

            return (
              <li key={usp.title} className="min-w-0">
                <Card padding="sm" className="h-full justify-center">
                  <Item size="none">
                    <ItemMedia variant="icon">
                      <Icon strokeWidth={2} />
                    </ItemMedia>
                    <ItemContent>
                      <ItemTitle asChild>
                        <h3>{usp.title}</h3>
                      </ItemTitle>
                      <ItemDescription>{usp.caption}</ItemDescription>
                    </ItemContent>
                  </Item>
                </Card>
              </li>
            );
          })}
        </ul>
      </ItemGroup>
    </Section>
  );
}
