import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Wordmark } from "~/components/ui/wordmark";
import { mapsUrl, type StoreInfo } from "~/lib/content/site";
import { cn } from "~/lib/utils";

export type ShowroomMapProps = Omit<ComponentProps<"div">, "children"> & {
  /** Метаоб'єкт `store_info`: з нього беруться координати позначки й посилання. */
  store: StoreInfo;
};

/** Полотно схеми в одиницях SVG; пропорція 5:4 повторена в класах aspect-[5/4]. */
const VIEW = { width: 600, height: 480 };

/** Ділянка центру Вінниці, яку зображає схема. */
const BOUNDS = { north: 49.241, south: 49.225, west: 28.45, east: 28.49 };

/** Позначка не підходить до краю ближче, ніж на цю частку полотна. */
const EDGE = 0.12;

function clamp(value: number): number {
  return Math.min(1 - EDGE, Math.max(EDGE, value));
}

/** Координати магазину → положення на схемі у відсотках. */
export function projectToMap(latitude: number, longitude: number): { left: string; top: string } {
  const x = (longitude - BOUNDS.west) / (BOUNDS.east - BOUNDS.west);
  const y = (BOUNDS.north - latitude) / (BOUNDS.north - BOUNDS.south);
  const percent = (value: number) => `${(clamp(value) * 100).toFixed(2)}%`;

  return { left: percent(x), top: percent(y) };
}

const STREET = "fill-none stroke-on-ink-10";
const LABEL = "fill-on-ink-muted text-caption";
const RIVER = "M470 -20C430 80 560 150 520 250S400 400 450 500";

/**
 * Статична стилізована схема центру Вінниці: без iframe і без JS-карт.
 * Керування масштабом немає навмисно: це малюнок, справжня карта відкривається посиланням.
 */
export function ShowroomMap({ store, className, ...props }: ShowroomMapProps) {
  const position = projectToMap(store.latitude, store.longitude);

  return (
    <div
      data-slot="showroom-map"
      className={cn(
        "[container-type:size] relative isolate aspect-[5/4] overflow-hidden rounded-lg border border-on-ink-12 bg-ink lg:aspect-auto lg:min-h-96",
        className,
      )}
      {...props}
    >
      {/* Блок 5:4, що завжди накриває контейнер: відсотки позначки збігаються з SVG. */}
      <div className="absolute top-1/2 left-1/2 aspect-[5/4] w-[max(100cqw,125cqh)] min-w-full -translate-1/2">
        <svg
          role="img"
          aria-label={`Схема центру Вінниці з позначкою шоуруму: ${store.street}`}
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          className="absolute inset-0 size-full"
        >
          {/* Вулиці, паралельні Соборній. */}
          <g className={STREET} strokeWidth={6} strokeLinecap="round">
            <path d="M-10 137L450 70" />
            <path d="M-10 207L450 140" />
            <path d="M-10 347L460 279" />
            <path d="M-10 417L400 358" />
          </g>
          {/* Поперечні вулиці. */}
          <g className={STREET} strokeWidth={6} strokeLinecap="round">
            <path d="M60 -10L133 490" />
            <path d="M150 -10L223 490" />
            <path d="M240 -10L313 490" />
            <path d="M330 -10L403 490" />
            <path d="M420 -10L465 300" />
          </g>

          {/* Центральний парк. Підписи тримаються ближче до центру: краї схеми обрізаються рамкою. */}
          <g transform="rotate(-8.3 126 190)">
            <rect x={70} y={128} width={112} height={104} rx={16} className="fill-ink" />
            <rect x={70} y={128} width={112} height={104} rx={16} className="fill-on-ink-12" />
          </g>
          <text x={80} y={176} className={LABEL}>
            <tspan x={80}>Центральний</tspan>
            <tspan x={80} dy={16}>
              парк
            </tspan>
          </text>

          {/* Південний Буг. */}
          <path d={RIVER} strokeWidth={40} className="fill-none stroke-ink" />
          <path d={RIVER} strokeWidth={36} className="fill-none stroke-on-ink-20" />
          <text x={410} y={452} className={LABEL}>
            Південний Буг
          </text>

          {/* Соборна з мостом через річку. */}
          <path
            d="M-10 277L610 187"
            strokeWidth={12}
            strokeLinecap="round"
            className="fill-none stroke-on-ink-muted"
          />
          <text x={300} y={262} transform="rotate(-8.3 300 262)" className={LABEL}>
            вул. Соборна
          </text>
        </svg>

        <span
          aria-hidden="true"
          className="absolute size-4 -translate-1/2"
          style={{ left: position.left, top: position.top }}
        >
          <span className="absolute inset-0 animate-pulse-dot rounded-pill bg-lime motion-reduce:hidden" />
          <span className="absolute inset-0 rounded-pill border-2 border-ink bg-lime" />
        </span>

        <Card
          padding="none"
          className="absolute -mt-4 -translate-x-1/2 -translate-y-full items-center gap-1 rounded-md px-4 py-3"
          style={{ left: position.left, top: position.top }}
        >
          <Wordmark />
          <span className="text-caption font-semibold whitespace-nowrap text-ink-2">
            {store.street}
          </span>
        </Card>
      </div>

      {/* surface, а не on-dark: напівпрозора кнопка губиться на лініях вулиць. */}
      <Button
        asChild
        variant="surface"
        size="sm"
        className="absolute bottom-4 left-4 min-h-11 focus-visible:shadow-focus-on-ink"
      >
        <a href={mapsUrl(store)} target="_blank" rel="noopener noreferrer">
          Відкрити в Google Maps
          <ArrowUpRight aria-hidden="true" strokeWidth={2} />
          <span className="sr-only"> (відкриється в новій вкладці)</span>
        </a>
      </Button>
    </div>
  );
}
