import { useState, type ComponentProps, type KeyboardEvent } from "react";

import { Card } from "~/components/ui/card";
import {
  Carousel,
  CarouselContent,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
  type CarouselApi,
} from "~/components/ui/carousel";
import { Progress } from "~/components/ui/progress";
import { cn } from "~/lib/utils";

import { HeroSlide } from "./hero-slide";
import type { HomeBanner } from "./hero-slider.types";

export type HeroSliderProps = Omit<ComponentProps<"div">, "children" | "aria-label"> & {
  /** Записи метаоб'єкта `home_banner` у порядку показу. */
  banners: readonly HomeBanner[];
  /** Назва каруселі для читачів екрана. */
  label?: string;
};

const twoDigits = (value: number) => String(value).padStart(2, "0");

/**
 * Вікно каруселі обрізає все, що виходить за його межі, зокрема кільця фокуса кнопок
 * біля краю слайда. Тому вікно на 4px ширше з кожного боку й має такі самі внутрішні поля.
 * Воно ж розтягується на всю вільну висоту банера, а слайди — на висоту вікна.
 */
const VIEWPORT =
  "[&>[data-slot=carousel-viewport]]:-m-1 [&>[data-slot=carousel-viewport]]:flex [&>[data-slot=carousel-viewport]]:flex-1 [&>[data-slot=carousel-viewport]]:p-1";

/** Лічильник «01 / 04», смуга поступу і стрілки. */
function HeroControls({ count }: { count: number }) {
  const { selectedIndex } = useCarousel();
  const position = Math.min(selectedIndex, count - 1) + 1;

  return (
    <div className="flex items-center justify-between gap-4">
      <div aria-hidden="true" className="flex items-center gap-3">
        <p
          data-slot="hero-counter"
          className="shrink-0 text-small font-semibold whitespace-nowrap tabular-nums"
        >
          <span className="text-lime">{twoDigits(position)}</span>
          <span className="text-on-ink-muted"> / {twoDigits(count)}</span>
        </p>
        <Progress
          tone="on-dark"
          value={position}
          max={count}
          aria-label="Поступ каруселі"
          className="w-24"
        />
      </div>
      <div className="flex gap-2">
        <CarouselPrevious variant="on-dark" />
        <CarouselNext variant="on-dark" />
      </div>
    </div>
  );
}

/** Оголошення для читачів екрана. З'являється лише після першого перемикання. */
function HeroAnnouncement({ banners }: { banners: readonly HomeBanner[] }) {
  const { selectedIndex } = useCarousel();
  const [changed, setChanged] = useState(false);
  if (!changed && selectedIndex !== 0) setChanged(true);

  const current = banners[selectedIndex];

  return (
    <p className="sr-only" aria-live="polite">
      {changed && current ? `Слайд ${selectedIndex + 1} з ${banners.length}: ${current.title}` : ""}
    </p>
  );
}

/**
 * Великий ink-банер зі слайдами на Carousel. Без автопрокрутки: слайди перемикають стрілки,
 * клавіші ← → і свайп; після останнього слайда йде перший. Усі слайди є в HTML і стоять
 * в один ряд однакової висоти, тому банер не стрибає, а без JS видно перший слайд.
 */
export function HeroSlider({
  banners,
  label = "Головні пропозиції",
  className,
  ...props
}: HeroSliderProps) {
  const [api, setApi] = useState<CarouselApi>();

  const count = banners.length;
  if (count === 0) return null;

  /**
   * Замінює обробник стрілок Carousel: той перехоплює ← → і в перемикачі кольору,
   * а там ці клавіші мають вибирати колір, а не гортати слайди.
   */
  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    if (event.target instanceof Element && event.target.closest('[role="radiogroup"]')) return;

    event.preventDefault();
    if (event.key === "ArrowLeft") api?.scrollPrev();
    else api?.scrollNext();
  };

  return (
    <Card tone="ink" className={cn("@container h-full rounded-xl md:p-10", className)} {...props}>
      <Carousel
        aria-label={label}
        opts={{ loop: true }}
        setApi={setApi}
        onKeyDownCapture={handleKeyDown}
        className={cn("flex min-w-0 flex-1 flex-col gap-6", VIEWPORT)}
      >
        {count > 1 ? <HeroControls count={count} /> : null}
        <HeroAnnouncement banners={banners} />

        <CarouselContent className="min-w-0 flex-1">
          {banners.map((banner, position) => (
            <HeroSlide
              key={banner.id}
              banner={banner}
              index={position}
              count={count}
              priority={position === 0}
            />
          ))}
        </CarouselContent>
      </Carousel>
    </Card>
  );
}
