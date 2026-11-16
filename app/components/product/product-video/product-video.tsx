import { CircleAlert } from "lucide-react";
import { useEffect, useRef, useState, type ComponentProps } from "react";

import { Alert, AlertDescription, AlertTitle } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { ShopImage } from "~/components/ui/shop-image";
import { Spinner } from "~/components/ui/spinner";
import { shopifyImageUrl } from "~/lib/shopify/image";
import type { ProductPageImage, ProductVideoSource } from "~/lib/shopify/product";
import { cn } from "~/lib/utils";

import { useVideoPlayer } from "./use-video-player";
import { VideoControls } from "./video-controls";
import { VideoPlayButton } from "./video-play-button";

const IMAGE_FALLBACK_SIZE = 1200;
const POSTER_WIDTH = 1200;
const DEFAULT_SIZES = "(min-width: 64rem) 50vw, 100vw";

type VideoContent = {
  /** Джерела в порядку для <source>: браузер бере перше, яке може відтворити. */
  sources: readonly ProductVideoSource[];
  /** Обкладинка. Без неї — темне тло з кнопкою. */
  poster?: ProductPageImage | null;
  /** Про що відео: «Огляд камери». Стає назвою плеєра й alt обкладинки. */
  label: string;
};

export type ProductVideoProps = Omit<ComponentProps<"div">, "children"> &
  VideoContent & {
    /** Обкладинка на першому екрані: вантажиться одразу. */
    priority?: boolean;
    /** Атрибут sizes обкладинки. */
    sizes?: string;
  };

/** Сам плеєр: з'являється після натискання «Відтворити» й одразу запускає відео. */
function VideoPlayer({ sources, poster, label }: VideoContent) {
  const player = useVideoPlayer();
  const playButtonRef = useRef<HTMLButtonElement>(null);
  const { play, waiting, failed, retry, frameProps, videoProps, onSourceError } = player;

  useEffect(() => {
    // Велика кнопка зникла разом з обкладинкою: фокус переходить на панель, а не губиться.
    playButtonRef.current?.focus({ preventScroll: true });
    play();
  }, [play]);

  return (
    <div
      {...frameProps}
      data-slot="product-video-player"
      role="group"
      aria-label={`Відео: ${label}`}
      className="relative size-full bg-ink text-surface"
    >
      {/* Без атрибута controls: керування — панель VideoControls. Субтитрів Shopify для відео
          товару не віддає, тож <track> додати нема з чого. */}
      {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
      <video
        {...videoProps}
        playsInline
        preload="none"
        poster={poster ? shopifyImageUrl(poster.url, { width: POSTER_WIDTH }) : undefined}
        tabIndex={-1}
        className="size-full object-contain"
      >
        {sources.map((source) => (
          <source
            key={source.url}
            src={source.url}
            type={source.mimeType}
            onError={onSourceError}
          />
        ))}
      </video>

      {waiting && !failed ? (
        <div className="pointer-events-none absolute inset-0 grid place-items-center">
          <Spinner className="size-8" aria-label="Відео завантажується" />
        </div>
      ) : null}

      {failed ? (
        <div className="absolute inset-0 grid place-items-center p-4 pb-16">
          <Alert variant="danger" className="max-w-sm">
            <CircleAlert aria-hidden="true" strokeWidth={2} />
            <AlertTitle>Відео не завантажилось</AlertTitle>
            <AlertDescription>
              <p>Перевірте з’єднання з інтернетом і спробуйте ще раз.</p>
              <Button variant="ink" size="sm" onClick={retry}>
                Спробувати ще раз
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      ) : null}

      <VideoControls player={player} playButtonRef={playButtonRef} />
    </div>
  );
}

/**
 * Відео товару з власною панеллю керування замість рідної браузерної.
 * Спершу — обкладинка з кнопкою «Відтворити»: саме відео не вантажиться, доки його не запустили.
 * Заповнює батьківський блок і вписує кадр (object-contain) на ink, тож пропорції задає той,
 * хто його використовує. Клавіші всередині плеєра: пробіл або K — пауза, ← → — 5 секунд,
 * ↑ ↓ — гучність, M — звук, F — на весь екран.
 */
export function ProductVideo({
  sources,
  poster,
  label,
  priority = false,
  sizes = DEFAULT_SIZES,
  className,
  ...props
}: ProductVideoProps) {
  const [started, setStarted] = useState(false);

  return (
    <div
      data-slot="product-video"
      className={cn("relative size-full overflow-hidden bg-ink", className)}
      {...props}
    >
      {started ? (
        <VideoPlayer sources={sources} poster={poster} label={label} />
      ) : (
        <>
          {poster ? (
            <ShopImage
              src={poster.url}
              alt={label}
              width={poster.width ?? IMAGE_FALLBACK_SIZE}
              height={poster.height ?? IMAGE_FALLBACK_SIZE}
              sizes={sizes}
              priority={priority}
              className="size-full object-cover"
            />
          ) : null}
          <VideoPlayButton onClick={() => setStarted(true)} />
        </>
      )}
    </div>
  );
}
