import { Box, ExternalLink } from "lucide-react";

import { ProductVideo, VideoPlayButton } from "~/components/product/product-video";
import { AspectRatio } from "~/components/ui/aspect-ratio";
import { Badge } from "~/components/ui/badge";
import { Button } from "~/components/ui/button";
import { ShopImage } from "~/components/ui/shop-image";
import type { ProductMedia, ProductPageImage } from "~/lib/shopify/product";
import { cn } from "~/lib/utils";

const IMAGE_FALLBACK_SIZE = 1200;
const MAIN_SIZES = "(min-width: 64rem) 50vw, 100vw";

type ExternalVideoMedia = Extract<ProductMedia, { type: "external-video" }>;
type ModelMedia = Extract<ProductMedia, { type: "model" }>;

export type GallerySlideProps = {
  media: ProductMedia;
  /** Назва товару: запасний alt і підпис плеєра. */
  title: string;
  /** Перший елемент галереї: зображення вантажиться одразу. */
  priority: boolean;
  /** Чи відкритий плеєр YouTube/Vimeo цього слайда. Керує галерея: інший слайд — плеєр зникає. */
  embedPlaying: boolean;
  onPlayEmbed: () => void;
};

/** Плеєр щойно з'явився на місці кнопки: фокус переходить на нього, а не губиться. */
function focusPlayer(node: HTMLIFrameElement | null) {
  node?.focus({ preventScroll: true });
}

/**
 * Адреса плеєра із запуском одразу (користувач уже натиснув «Відтворити») і з найменшою
 * кількістю елементів самого сервісу. Кнопки всередині <iframe> належать YouTube чи Vimeo:
 * перефарбувати або сховати їх зі сторінки не можна.
 */
function playerSrc(media: ExternalVideoMedia): string {
  const url = new URL(media.embedUrl);
  const params: Record<string, string> =
    media.host === "youtube"
      ? { autoplay: "1", rel: "0", modestbranding: "1", playsinline: "1" }
      : // dnt: Vimeo не відстежує перегляд.
        { autoplay: "1", title: "0", byline: "0", portrait: "0", dnt: "1" };

  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  return url.toString();
}

function SlideImage({
  image,
  alt,
  priority,
  fit,
}: {
  image: ProductPageImage;
  alt: string;
  priority: boolean;
  /** Фото заповнює рамку; обкладинка відео вписується, як і саме відео. */
  fit: "cover" | "contain";
}) {
  return (
    <ShopImage
      src={image.url}
      alt={alt}
      width={image.width ?? IMAGE_FALLBACK_SIZE}
      height={image.height ?? IMAGE_FALLBACK_SIZE}
      sizes={MAIN_SIZES}
      priority={priority}
      className={cn("size-full", fit === "cover" ? "object-cover" : "object-contain")}
    />
  );
}

function ExternalVideoSlide({
  media,
  title,
  priority,
  playing,
  onPlay,
}: {
  media: ExternalVideoMedia;
  title: string;
  priority: boolean;
  playing: boolean;
  onPlay: () => void;
}) {
  const label = media.alt || title;

  return (
    <AspectRatio ratio={1} data-slot="product-gallery-embed" className="bg-ink">
      {playing ? (
        // <iframe> створюється лише після натискання: до того сторонній плеєр нічого не вантажить.
        <iframe
          ref={focusPlayer}
          src={playerSrc(media)}
          title={`Відео: ${label}`}
          allow="accelerometer; autoplay; encrypted-media; picture-in-picture; fullscreen"
          allowFullScreen
          loading="lazy"
          referrerPolicy="strict-origin-when-cross-origin"
          className="size-full border-0"
        />
      ) : (
        <>
          {media.poster ? (
            <SlideImage image={media.poster} alt={label} priority={priority} fit="cover" />
          ) : null}
          <VideoPlayButton onClick={onPlay} />
        </>
      )}
    </AspectRatio>
  );
}

function ModelSlide({
  media,
  title,
  priority,
}: {
  media: ModelMedia;
  title: string;
  priority: boolean;
}) {
  const label = media.alt || title;
  // GLB відкривають і Windows, і Android, і macOS; USDZ — лише пристрої Apple.
  const source = media.sources.find((item) => item.format === "glb") ?? media.sources[0];

  return (
    <AspectRatio ratio={1} className="bg-photo">
      {media.poster ? (
        <SlideImage image={media.poster} alt={label} priority={priority} fit="cover" />
      ) : (
        <div className="flex size-full items-center justify-center text-muted-foreground">
          <Box aria-hidden="true" strokeWidth={2} className="size-6" />
        </div>
      )}
      <div className="absolute inset-x-3 bottom-3 flex flex-wrap items-center gap-2">
        <Badge variant="outline">3D</Badge>
        {source ? (
          <Button asChild variant="surface" size="sm">
            <a href={source.url} target="_blank" rel="noopener noreferrer">
              Відкрити 3D-модель
              <ExternalLink aria-hidden="true" strokeWidth={2} />
              <span className="sr-only">(файл {source.format.toUpperCase()}, у новій вкладці)</span>
            </a>
          </Button>
        ) : null}
      </div>
    </AspectRatio>
  );
}

/** Один слайд галереї: фото, відео Shopify, відео з YouTube чи Vimeo або 3D-модель. */
export function GallerySlide({
  media,
  title,
  priority,
  embedPlaying,
  onPlayEmbed,
}: GallerySlideProps) {
  switch (media.type) {
    case "image":
      return (
        <AspectRatio ratio={1} className="bg-photo">
          <SlideImage
            image={media.image}
            alt={media.image.altText || media.alt || title}
            priority={priority}
            fit="cover"
          />
        </AspectRatio>
      );
    case "video":
      return (
        <AspectRatio ratio={1}>
          <ProductVideo
            sources={media.sources}
            poster={media.poster}
            label={media.alt || title}
            priority={priority}
            sizes={MAIN_SIZES}
          />
        </AspectRatio>
      );
    case "external-video":
      return (
        <ExternalVideoSlide
          media={media}
          title={title}
          priority={priority}
          playing={embedPlaying}
          onPlay={onPlayEmbed}
        />
      );
    case "model":
      return <ModelSlide media={media} title={title} priority={priority} />;
  }
}
