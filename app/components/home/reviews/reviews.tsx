import { ArrowUpRight } from "lucide-react";

import { Section, SectionHeader } from "~/components/layout/section";
import { Button } from "~/components/ui/button";
import { Card, CardDescription, CardTitle } from "~/components/ui/card";
import { Rating } from "~/components/ui/rating";
import { formatDate, formatInteger, plural } from "~/lib/format";

export type ReviewsRating = {
  /** Середня оцінка в Google, від 0 до 5. */
  value: number;
  /** Кількість відгуків у Google. */
  count: number;
  /** Сторінка магазину з відгуками в Google. */
  url: string;
};

export type Review = {
  name: string;
  text: string;
  /** Дата ISO: «2026-10-28». */
  date: string;
  /** Звідки відгук: «Google». */
  source: string;
};

export type ReviewsProps = {
  title?: string;
  rating: ReviewsRating;
  /** Метаоб'єкти `review`; на головній показуємо два. */
  reviews: Review[];
};

const SECTION_ID = "reviews";
const DATE_ONLY = /^(\d{4})-(\d{2})-(\d{2})$/;

/**
 * Дата з метаоб'єкта приходить без часу. `new Date("2026-10-28")` — це північ за UTC,
 * і на сервері західніше Гринвіча вийшло б 27 жовтня, тому збираємо локальну дату.
 */
function parseDate(value: string): Date | null {
  const match = DATE_ONLY.exec(value);
  const date = match
    ? new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]))
    : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function ReviewCard({ review }: { review: Review }) {
  const date = parseDate(review.date);

  return (
    <li className="min-w-0">
      {/* Плитка на ink-панелі: тло — білий 10%, такого тону в Card немає. */}
      <Card asChild tone="ink" className="h-full justify-between gap-6 bg-on-ink-10">
        <figure>
          <blockquote className="text-body">
            <p>{review.text}</p>
          </blockquote>
          <figcaption className="flex flex-col gap-1">
            <CardTitle className="text-small">{review.name}</CardTitle>
            <CardDescription className="text-caption">
              {date ? <time dateTime={review.date}>{formatDate(date)}</time> : null}
              {date ? ", " : null}
              {review.source}
            </CardDescription>
          </figcaption>
        </figure>
      </Card>
    </li>
  );
}

/** Відгуки: рейтинг магазину в Google і два відгуки покупців на ink-панелі. */
export function Reviews({ title = "Що кажуть покупці", rating, reviews }: ReviewsProps) {
  const countLabel = `${formatInteger(rating.count)} ${plural(rating.count, {
    one: "відгук",
    few: "відгуки",
    many: "відгуків",
  })} у Google`;

  return (
    <Section id={SECTION_ID}>
      <Card
        tone="ink"
        className="grid gap-8 rounded-xl md:p-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)] lg:gap-12"
      >
        <div className="flex min-w-0 flex-col items-start gap-6">
          <SectionHeader sectionId={SECTION_ID} title={title} onDark className="mb-0" />
          <div className="flex flex-col gap-2">
            <Rating value={rating.value} onDark />
            <p className="text-small text-on-ink-muted">{countLabel}</p>
          </div>
          <Button asChild variant="on-dark">
            <a href={rating.url} target="_blank" rel="noopener noreferrer">
              Читати всі відгуки
              <ArrowUpRight aria-hidden="true" strokeWidth={2} />
              <span className="sr-only"> у Google (відкриється в новій вкладці)</span>
            </a>
          </Button>
        </div>

        <ul role="list" className="grid min-w-0 gap-4 md:grid-cols-2">
          {reviews.map((review) => (
            <ReviewCard key={`${review.name}-${review.date}`} review={review} />
          ))}
        </ul>
      </Card>
    </Section>
  );
}
