import useEmblaCarousel, { type UseEmblaCarouselType } from "embla-carousel-react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";

import { Button, type ButtonProps } from "~/components/ui/button";
import { cn } from "~/lib/utils";

import { useReducedMotion } from "./use-reduced-motion";

export type CarouselApi = UseEmblaCarouselType[1];
type CarouselOptions = Parameters<typeof useEmblaCarousel>[0];
type CarouselPlugins = Parameters<typeof useEmblaCarousel>[1];

type CarouselContextValue = {
  carouselRef: UseEmblaCarouselType[0];
  scrollPrev: () => void;
  scrollNext: () => void;
  canScrollPrev: boolean;
  canScrollNext: boolean;
  selectedIndex: number;
  slideCount: number;
};

const CarouselContext = createContext<CarouselContextValue | null>(null);

export function useCarousel() {
  const context = useContext(CarouselContext);
  if (!context) throw new Error("useCarousel можна викликати лише всередині <Carousel>");
  return context;
}

export type CarouselProps = ComponentProps<"div"> & {
  opts?: CarouselOptions;
  plugins?: CarouselPlugins;
  setApi?: (api: CarouselApi) => void;
  /** Назва каруселі для читачів екрана, напр. «Популярні товари». */
  "aria-label": string;
};

/** Горизонтальна карусель на Embla. Без автопрокрутки. */
export function Carousel({ opts, plugins, setApi, className, children, ...props }: CarouselProps) {
  // Embla прокручує через JS, тож глобальне CSS-правило для reduced motion на неї не діє.
  const reducedMotion = useReducedMotion();
  const [carouselRef, api] = useEmblaCarousel(
    { align: "start", ...opts, axis: "x", ...(reducedMotion ? { duration: 0 } : null) },
    plugins,
  );
  const [state, setState] = useState({
    canScrollPrev: false,
    canScrollNext: false,
    selectedIndex: 0,
    slideCount: 0,
  });

  const sync = useCallback((embla: NonNullable<CarouselApi>) => {
    setState({
      canScrollPrev: embla.canScrollPrev(),
      canScrollNext: embla.canScrollNext(),
      selectedIndex: embla.selectedScrollSnap(),
      slideCount: embla.scrollSnapList().length,
    });
  }, []);

  const scrollPrev = useCallback(() => api?.scrollPrev(), [api]);
  const scrollNext = useCallback(() => api?.scrollNext(), [api]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        scrollPrev();
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        scrollNext();
      }
    },
    [scrollPrev, scrollNext],
  );

  useEffect(() => {
    if (api && setApi) setApi(api);
  }, [api, setApi]);

  useEffect(() => {
    if (!api) return;
    sync(api);
    api.on("reInit", sync);
    api.on("select", sync);
    return () => {
      api.off("reInit", sync);
      api.off("select", sync);
    };
  }, [api, sync]);

  return (
    <CarouselContext.Provider value={{ carouselRef, scrollPrev, scrollNext, ...state }}>
      <div
        data-slot="carousel"
        role="region"
        aria-roledescription="карусель"
        onKeyDownCapture={handleKeyDown}
        className={cn("relative", className)}
        {...props}
      >
        {children}
      </div>
    </CarouselContext.Provider>
  );
}

export function CarouselContent({ className, ...props }: ComponentProps<"div">) {
  const { carouselRef } = useCarousel();

  return (
    <div ref={carouselRef} data-slot="carousel-viewport" className="overflow-hidden">
      <div data-slot="carousel-content" className={cn("-ms-4 flex", className)} {...props} />
    </div>
  );
}

export function CarouselItem({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      data-slot="carousel-item"
      role="group"
      aria-roledescription="слайд"
      className={cn("min-w-0 shrink-0 grow-0 basis-full ps-4", className)}
      {...props}
    />
  );
}

type CarouselButtonProps = Omit<ButtonProps, "children" | "aria-label">;

/** Кругла стрілка 44px. Розташування задає той, хто використовує карусель. */
export function CarouselPrevious({
  className,
  variant = "secondary",
  ...props
}: CarouselButtonProps) {
  const { scrollPrev, canScrollPrev } = useCarousel();

  return (
    <Button
      data-slot="carousel-previous"
      variant={variant}
      size="icon"
      className={cn("rounded-pill", className)}
      disabled={!canScrollPrev}
      onClick={scrollPrev}
      aria-label="Попередній слайд"
      {...props}
    >
      <ChevronLeft strokeWidth={2} />
    </Button>
  );
}

export function CarouselNext({ className, variant = "secondary", ...props }: CarouselButtonProps) {
  const { scrollNext, canScrollNext } = useCarousel();

  return (
    <Button
      data-slot="carousel-next"
      variant={variant}
      size="icon"
      className={cn("rounded-pill", className)}
      disabled={!canScrollNext}
      onClick={scrollNext}
      aria-label="Наступний слайд"
      {...props}
    >
      <ChevronRight strokeWidth={2} />
    </Button>
  );
}
