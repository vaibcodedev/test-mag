import { Check } from "lucide-react";

import { Section, SectionHeader } from "~/components/layout/section";
import { Avatar, AvatarFallback } from "~/components/ui/avatar";
import { Card } from "~/components/ui/card";
import {
  Item,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "~/components/ui/item";

export type AboutTeamMember = { name: string; role: string };
export type AboutStat = { value: string; label: string };

export type AboutProps = {
  /** Заголовок секції (h2). */
  title?: string;
  description?: string;
  /** Три короткі тези з Check. */
  points: string[];
  team: AboutTeamMember[];
  /** Метаоб'єкти `about_stat`: число й підпис. */
  stats: AboutStat[];
};

const SECTION_ID = "about";

/** «Олена Садова» → «ОС». */
function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part.charAt(0).toLocaleUpperCase("uk-UA"))
    .join("");
}

/** Про «Сад»: тези, команда з ініціалами замість фото та цифри магазину. */
export function About({
  title = "Невеликий магазин, де вас пам'ятають",
  description,
  points,
  team,
  stats,
}: AboutProps) {
  return (
    <Section id={SECTION_ID}>
      <Card size="panel" className="grid gap-8 lg:grid-cols-2 lg:gap-12">
        <div className="flex min-w-0 flex-col gap-8">
          <div>
            <p className="mb-3 text-small font-semibold text-muted-foreground">Про «Сад»</p>
            <SectionHeader
              sectionId={SECTION_ID}
              title={title}
              description={description}
              className="mb-0"
            />
          </div>

          {points.length > 0 ? (
            <ItemGroup asChild className="gap-3">
              <ul>
                {points.map((point) => (
                  <li key={point}>
                    <Item size="none" className="flex-nowrap gap-3">
                      <ItemMedia variant="icon" size="sm" shape="round">
                        <Check aria-hidden="true" strokeWidth={2} />
                      </ItemMedia>
                      <ItemContent>
                        <ItemDescription className="text-body text-ink">{point}</ItemDescription>
                      </ItemContent>
                    </Item>
                  </li>
                ))}
              </ul>
            </ItemGroup>
          ) : null}

          {team.length > 0 ? (
            <div>
              <h3 className="mb-4 text-card-title text-ink">Хто вас зустріне</h3>
              <ItemGroup asChild className="flex-row flex-wrap gap-x-8 gap-y-4">
                <ul>
                  {team.map((member) => (
                    <li key={member.name}>
                      <Item size="none" className="w-auto flex-nowrap gap-3">
                        <Avatar tone="ink" aria-hidden="true">
                          <AvatarFallback>{initials(member.name)}</AvatarFallback>
                        </Avatar>
                        <ItemContent className="gap-0">
                          <ItemTitle className="text-small">{member.name}</ItemTitle>
                          <ItemDescription className="text-caption">{member.role}</ItemDescription>
                        </ItemContent>
                      </Item>
                    </li>
                  ))}
                </ul>
              </ItemGroup>
            </div>
          ) : null}
        </div>

        {stats.length > 0 ? (
          <dl className="grid min-w-0 grid-cols-2 gap-3 self-start md:gap-4 lg:self-stretch">
            {stats.map((stat) => (
              <Card
                key={stat.label}
                tone="page"
                padding="sm"
                className="flex-col-reverse justify-end gap-2 wrap-break-word md:p-6"
              >
                <dt className="text-small text-ink-2">{stat.label}</dt>
                <dd className="text-h3 text-ink tabular-nums">{stat.value}</dd>
              </Card>
            ))}
          </dl>
        ) : null}
      </Card>
    </Section>
  );
}
