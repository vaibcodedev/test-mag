import { ImageOff } from "lucide-react";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from "react";

import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
  type CarouselProps,
} from "~/components/ui/carousel";
import type { ProductMedia, ProductPageImage } from "~/lib/shopify/product";
import { cn } from "~/lib/utils";

import { GallerySlide } from "./gallery-slide";
import { GalleryThumbs } from "./gallery-thumbs";
import { slideLabel } from "./product-gallery.utils";

export type ProductGalleryImage = ProductPageImage;

export type ProductGalleryProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  /**
   * Медіа товару: фото, відео, 3D-моделі. Перший елемент — головний: він вантажиться одразу,
   * решта — ліниво. Готовий список дає productGalleryMedia з ~/lib/shopify/product.
   */
  media?: readonly ProductMedia[];
  /** Лише фото. Лишився для місць, що ще не передають media; з media не поєднується. */
  images?: readonly ProductGalleryImage[];
  /** Назва товару: підпис галереї та запасний alt. */
  title: string;
};

const PLAYER = '[data-slot="product-video-player"]';

/**
 * Поки грає відео, жест по ньому належить плеєру (перемотування, гучність), а не каруселі.
 * Гортати далі можна стрілками та мініатюрами. Об'єкт сталий: інакше Embla перезапускалась би.
 */
const CAROUSEL_OPTIONS: CarouselProps["opts"] = {
  watchDrag: (_, event) => !isInsidePlayer(event.target),
};

/** Запущений плеєр (обкладинка з кнопкою ще не він: її можна гортати пальцем). */
function isInsidePlayer(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest(PLAYER) !== null;
}

function imageMedia(image: ProductGalleryImage): ProductMedia {
  return { type: "image", id: `image:${image.url}`, alt: image.altText ?? null, image };
}

/**
 * Галерея товару: фото, відео з Shopify, відео з YouTube чи Vimeo та 3D-моделі.
 * Головна область завжди квадратна, тож верстка не стрибає, яким би не було медіа.
 * Гортається пальцем, стрілками на екрані та клавішами ← →; мініатюри — стрічкою, що гортається
 * (на десктопі — вертикальною ліворуч). Плеєр YouTube/Vimeo створюється лише після натискання
 * «Відтворити» і зникає, щойно відкрито інший слайд; відео Shopify тоді ставиться на паузу.
 */
export function ProductGallery({ media, images, title, className, ...props }: ProductGalleryProps) {
  const rootRef = useRef<HTMLDivElement>(null);
  const [api, setApi] = useState<CarouselApi>();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [embedId, setEmbedId] = useState<string | null>(null);

  const items = useMemo(() => media ?? (images ?? []).map(imageMedia), [media, images]);
  const count = items.length;
  const firstId = items[0]?.id;
  const active = items[selectedIndex];

  // Вибрали інший варіант — його фото стало першим: повертаємо галерею на початок.
  useEffect(() => {
    api?.scrollTo(0, true);
  }, [api, firstId]);

  useEffect(() => {
    if (!api) return;

    const sync = () => setSelectedIndex(api.selectedScrollSnap());
    const stopPlayers = () => {
      sync();
      setEmbedId(null);
      rootRef.current?.querySelectorAll("video").forEach((video) => video.pause());
    };

    api.on("reInit", sync);
    api.on("select", stopPlayers);
    return () => {
      api.off("reInit", sync);
      api.off("select", stopPlayers);
    };
  }, [api]);

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (isInsidePlayer(event.target)) return;
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;

    event.preventDefault();
    if (event.key === "ArrowLeft") api?.scrollPrev();
    else api?.scrollNext();
  };

  const [first] = items;

  if (!first) {
    return (
      <div
        data-slot="product-gallery"
        className={cn("overflow-hidden rounded-xl bg-photo text-muted-foreground", className)}
        {...props}
      >
        <AspectRatio ratio={1} className="flex flex-col items-center justify-center gap-3">
          <ImageOff aria-hidden="true" strokeWidth={2} className="size-6" />
          <p className="text-small">Фото цього товару ще готуємо</p>
        </AspectRatio>
      </div>
    );
  }

  if (count === 1) {
    return (
      <div
        data-slot="product-gallery"
        className={cn("overflow-hidden rounded-xl", className)}
        {...props}
      >
        <GallerySlide
          media={first}
          title={title}
          priority
          embedPlaying={embedId === first.id}
          onPlayEmbed={() => setEmbedId(first.id)}
        />
      </div>
    );
  }

  const hasOnlyPhotos = items.every((item) => item.type === "image");

  return (
    <div ref={rootRef} data-slot="product-gallery" className={className} {...props}>
      <Carousel
        // Замінює обробник клавіш самої каруселі: він спрацьовує раніше за плеєр і забирав би
        // ← → у відео, де ці клавіші перемотують.
        onKeyDownCapture={handleKeyDown}
        aria-label={`${hasOnlyPhotos ? "Фото товару" : "Фото та відео товару"}: ${title}`}
        opts={CAROUSEL_OPTIONS}
        setApi={setApi}
        tabIndex={0}
        className="flex flex-col gap-3 rounded-xl focus-ring lg:grid lg:grid-cols-[5rem_minmax(0,1fr)]"
      >
        <div className="relative overflow-hidden rounded-xl bg-photo lg:col-start-2 lg:row-start-1">
          <CarouselContent className="ms-0">
            {items.map((item, index) => (
              <CarouselItem
                key={item.id}
                className="ps-0"
                aria-label={slideLabel(item, index, count)}
                // Сусідні слайди є в розмітці, але фокус і читач екрана їх минають.
                aria-hidden={index === selectedIndex ? undefined : true}
                inert={index !== selectedIndex}
              >
                <GallerySlide
                  media={item}
                  title={title}
                  priority={index === 0}
                  embedPlaying={index === selectedIndex && embedId === item.id}
                  onPlayEmbed={() => setEmbedId(item.id)}
                />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="absolute start-3 top-1/2 -translate-y-1/2">
            <CarouselPrevious className="bg-surface" />
          </div>
          <div className="absolute end-3 top-1/2 -translate-y-1/2">
            <CarouselNext className="bg-surface" />
          </div>

          {/* На телефоні замість крапок — лічильник: його видно і з 3, і з 20 медіа. */}
          <Badge
            variant="outline"
            aria-hidden="true"
            data-slot="product-gallery-counter"
            className="absolute start-3 top-3 tabular-nums lg:hidden"
          >
            {selectedIndex + 1} / {count}
          </Badge>
          <p className="sr-only" aria-live="polite">
            {active ? slideLabel(active, selectedIndex, count) : null}
          </p>
        </div>

        <div className="relative lg:col-start-1 lg:row-start-1">
          <GalleryThumbs
            media={items}
            title={title}
            selectedIndex={selectedIndex}
            onSelect={(index) => api?.scrollTo(index)}
          />
        </div>
      </Carousel>
    </div>
  );
}
