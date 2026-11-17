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
  const {
    play,
    togglePlay,
    playing,
    waiting,
    failed,
    retry,
    frameProps,
    videoProps,
    onSourceError,
  } = useVideoPlayer();
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    // Кнопка обкладинки зникла разом з обкладинкою: фокус переходить на кнопку плеєра.
    buttonRef.current?.focus({ preventScroll: true });
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
      {/* Без атрибута controls і без панелі: клік по відео чи кнопка по центру — пауза або
          відтворення. Субтитрів Shopify для відео товару не віддає, тож <track> додати нема з чого. */}
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
        <div className="absolute inset-0 grid place-items-center p-4">
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

      {/* Під час завантаження й помилки кнопки немає: на її місці індикатор або пояснення. */}
      {waiting || failed ? null : (
        <VideoPlayButton ref={buttonRef} playing={playing} onClick={togglePlay} />
      )}
    </div>
  );
}

/**
 * Відео товару без панелі керування: лише кнопка «Відтворити» по центру.
 * Спершу — обкладинка з кнопкою: саме відео не вантажиться, доки його не запустили.
 * Поки відео грає, кнопки не видно; клік по кадру ставить на паузу, і кнопка повертається.
 * Заповнює батьківський блок і вписує кадр (object-contain) на ink, тож пропорції задає той,
 * хто його використовує. З клавіатури: пробіл або K — пауза й відтворення.
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
