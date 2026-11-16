import { ImageOff } from "lucide-react";
import { useEffect, useState, type ComponentProps } from "react";

import { AspectRatio } from "~/components/ui/aspect-ratio";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  useCarousel,
  type CarouselApi,
} from "~/components/ui/carousel";
import { ShopImage } from "~/components/ui/shop-image";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import { cn } from "~/lib/utils";

const IMAGE_FALLBACK_SIZE = 1200;
const MAIN_SIZES = "(min-width: 64rem) 50vw, 100vw";
const THUMB_SIZES = "5rem";
const THUMB_WIDTHS = [96, 160, 240] as const;

export type ProductGalleryImage = {
  url: string;
  altText?: string | null;
  width?: number | null;
  height?: number | null;
};

export type ProductGalleryProps = Omit<ComponentProps<"div">, "children" | "title"> & {
  /** Перше фото — головне: воно вантажиться одразу, решта — ліниво. */
  images: readonly ProductGalleryImage[];
  /** Назва товару: підпис галереї та запасний alt. */
  title: string;
};

function MainImage({
  image,
  title,
  priority,
}: {
  image: ProductGalleryImage;
  title: string;
  priority: boolean;
}) {
  return (
    <AspectRatio ratio={1} className="bg-photo">
      <ShopImage
        src={image.url}
        alt={image.altText || title}
        width={image.width ?? IMAGE_FALLBACK_SIZE}
        height={image.height ?? IMAGE_FALLBACK_SIZE}
        sizes={MAIN_SIZES}
        priority={priority}
        className="size-full object-cover"
      />
    </AspectRatio>
  );
}

/** Крапки на мобільному: показують, скільки фото і яке відкрите. */
function GalleryDots({ count }: { count: number }) {
  const { selectedIndex } = useCarousel();

  return (
    <>
      <div
        aria-hidden="true"
        className="absolute inset-x-0 bottom-3 flex justify-center gap-1.5 lg:hidden"
      >
        {Array.from({ length: count }, (_, index) => (
          <span
            key={index}
            data-active={index === selectedIndex}
            className={cn(
              "size-2 rounded-pill bg-ink transition-opacity duration-150",
              index === selectedIndex ? "opacity-100" : "opacity-25",
            )}
          />
        ))}
      </div>
      <p className="sr-only" aria-live="polite">
        Фото {selectedIndex + 1} з {count}
      </p>
    </>
  );
}

/** Рамка мініатюри поверх Toggle: у базі немає варіанта під фото 80px. */
const THUMB =
  "size-20 overflow-hidden rounded-md border-2 border-transparent bg-photo p-0 hover:border-line hover:bg-photo data-[state=on]:border-blue";

/** Мініатюри на десктопі: група перемикачів, що відкривають відповідне фото. */
function GalleryThumbs({
  images,
  title,
  api,
}: {
  images: readonly ProductGalleryImage[];
  title: string;
  api: CarouselApi;
}) {
  const { selectedIndex } = useCarousel();

  return (
    <ToggleGroup
      type="single"
      variant="icon"
      aria-label="Фото товару"
      value={String(selectedIndex)}
      // Повторне натискання на відкрите фото дає порожнє значення: лишаємо фото відкритим.
      onValueChange={(next) => {
        if (next) api?.scrollTo(Number(next));
      }}
      className="hidden gap-2 lg:flex"
    >
      {images.map((image, index) => (
        <ToggleGroupItem
          key={image.url}
          value={String(index)}
          aria-label={`Показати фото ${index + 1} з ${images.length}: ${image.altText || title}`}
          className={THUMB}
        >
          <ShopImage
            src={image.url}
            alt=""
            width={image.width ?? IMAGE_FALLBACK_SIZE}
            height={image.height ?? IMAGE_FALLBACK_SIZE}
            sizes={THUMB_SIZES}
            widths={THUMB_WIDTHS}
            className="size-full object-cover"
          />
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}

/**
 * Галерея товару. На мобільному — рядок фото, що гортається пальцем, із крапками;
 * на десктопі — головне фото зі стрілками та мініатюрами. Стрілки ← → гортають із клавіатури.
 */
export function ProductGallery({ images, title, className, ...props }: ProductGalleryProps) {
  const [api, setApi] = useState<CarouselApi>();
  const firstUrl = images[0]?.url;

  // Вибрали інший варіант — його фото стало першим: повертаємо галерею на початок.
  useEffect(() => {
    api?.scrollTo(0, true);
  }, [api, firstUrl]);

  const [first] = images;

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

  if (images.length === 1) {
    return (
      <div
        data-slot="product-gallery"
        className={cn("overflow-hidden rounded-xl", className)}
        {...props}
      >
        <MainImage image={first} title={title} priority />
      </div>
    );
  }

  return (
    <div data-slot="product-gallery" className={className} {...props}>
      <Carousel
        aria-label={`Фото товару: ${title}`}
        setApi={setApi}
        tabIndex={0}
        className="flex flex-col gap-3 rounded-xl focus-ring"
      >
        <div className="relative overflow-hidden rounded-xl bg-photo">
          <CarouselContent className="ms-0">
            {images.map((image, index) => (
              <CarouselItem
                key={image.url}
                className="ps-0"
                aria-label={`Фото ${index + 1} з ${images.length}`}
              >
                <MainImage image={image} title={title} priority={index === 0} />
              </CarouselItem>
            ))}
          </CarouselContent>

          <div className="absolute inset-y-0 start-3 hidden items-center lg:flex">
            <CarouselPrevious className="bg-surface" />
          </div>
          <div className="absolute inset-y-0 end-3 hidden items-center lg:flex">
            <CarouselNext className="bg-surface" />
          </div>

          <GalleryDots count={images.length} />
        </div>

        <GalleryThumbs images={images} title={title} api={api} />
      </Carousel>
    </div>
  );
}
