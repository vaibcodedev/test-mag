import { ArrowUpRight } from "lucide-react";
import type { ComponentProps } from "react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Wordmark } from "~/components/ui/wordmark";
import { mapsUrl, type StoreInfo } from "~/lib/content/site";
import { cn } from "~/lib/utils";

import { SHOWROOM_MAP } from "./showroom-map.data";

export type ShowroomMapProps = Omit<ComponentProps<"div">, "children"> & {
  /** Метаоб'єкт `store_info`: з нього беруться координати позначки й посилання. */
  store: StoreInfo;
};

/** Полотно схеми в одиницях SVG; пропорція 5:4 повторена в класах aspect-[5/4]. */
const VIEW = SHOWROOM_MAP.view;

/** Ділянка міста, яку зображає схема: її задає генератор (npm run map). */
const BOUNDS = SHOWROOM_MAP.bounds;

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

const ROAD = "fill-none [stroke-linecap:round] [stroke-linejoin:round]";
const LABEL = "fill-on-ink-muted text-caption [paint-order:stroke] stroke-ink [stroke-width:4px]";

/**
 * Статична схема району шоуруму в кольорах теми: без iframe і без JS-карт.
 * Вулиці, вода й парки справжні — з OpenStreetMap, їх готує scripts/build-map.ts.
/* Керування масштабом немає навмисно: це малюнок, справжня карта відкривається посиланням. */
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
          aria-label={`Схема району з позначкою шоуруму: ${store.city}, ${store.street}`}
          viewBox={`0 0 ${VIEW.width} ${VIEW.height}`}
          className="absolute inset-0 size-full"
        >
          <path d={SHOWROOM_MAP.parks} className="fill-on-ink-12" />
          <path d={SHOWROOM_MAP.water} className="fill-on-ink-20" />
          <path
            d={SHOWROOM_MAP.minorRoads}
            strokeWidth={3}
            className={cn(ROAD, "stroke-on-ink-10")}
          />
          <path
            d={SHOWROOM_MAP.majorRoads}
            strokeWidth={6}
            className={cn(ROAD, "stroke-on-ink-20")}
          />
          {/* Вулиця шоуруму виділена: за нею покупець орієнтується. */}
          <path
            d={SHOWROOM_MAP.homeStreet}
            strokeWidth={9}
            className={cn(ROAD, "stroke-on-ink-muted")}
          />
          {SHOWROOM_MAP.labels.map((label) => (
            <text
              key={label.text}
              x={label.x}
              y={label.y}
              textAnchor="middle"
              dominantBaseline="middle"
              transform={label.angle ? `rotate(${label.angle} ${label.x} ${label.y})` : undefined}
              className={LABEL}
            >
              {label.text}
            </text>
          ))}
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

      <a
        href="https://www.openstreetmap.org/copyright"
        target="_blank"
        rel="noopener noreferrer"
        className="absolute end-3 bottom-3 rounded-sm px-1 text-caption text-on-ink-muted hover:text-surface focus-visible:shadow-focus-on-ink"
      >
        © OpenStreetMap
        <span className="sr-only"> (відкриється в новій вкладці)</span>
      </a>

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
