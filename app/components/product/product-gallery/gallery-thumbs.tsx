import { Box, Play } from "lucide-react";
import { useEffect, useRef } from "react";

import { ShopImage } from "~/components/ui/shop-image";
import { ToggleGroup, ToggleGroupItem } from "~/components/ui/toggle-group";
import type { ProductMedia } from "~/lib/shopify/product";

import { mediaLabel, mediaPreview, scrollDeltaToReveal } from "./product-gallery.utils";

const IMAGE_FALLBACK_SIZE = 1200;
const THUMB_SIZES = "5rem";
const THUMB_WIDTHS = [96, 160, 240] as const;
/** Сусідня мініатюра визирає з-за краю: видно, що стрічку можна гортати далі. */
const REVEAL_MARGIN = 24;

/** Позначка типу медіа по центру мініатюри: 32px, іконка 16px. Фото позначки не мають. */
const MARK =
  "absolute inset-0 m-auto flex size-8 items-center justify-center rounded-pill bg-scrim text-surface";

export type GalleryThumbsProps = {
  media: readonly ProductMedia[];
  title: string;
  selectedIndex: number;
  onSelect: (index: number) => void;
};

/**
 * Стрічка мініатюр: горизонтальна під головним фото на телефоні, вертикальна ліворуч на десктопі.
 * Гортається сама так, щоб відкрита мініатюра лишалась у полі зору; сторінку при цьому не рухає.
 */
export function GalleryThumbs({ media, title, selectedIndex, onSelect }: GalleryThumbsProps) {
  const stripRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const strip = stripRef.current;
    const thumb = strip?.querySelector<HTMLElement>(`[data-index="${selectedIndex}"]`);
    if (!strip || !thumb) return;

    const delta = scrollDeltaToReveal(
      strip.getBoundingClientRect(),
      thumb.getBoundingClientRect(),
      REVEAL_MARGIN,
    );
    if (delta.left !== 0 || delta.top !== 0) strip.scrollBy(delta);
  }, [selectedIndex]);

  return (
    <div
      ref={stripRef}
      data-slot="product-gallery-thumbs"
      // Поля з від'ємним відступом лишають місце кільцю фокуса: інакше прокрутка його обрізає.
      className="-m-1 [scrollbar-width:none] overflow-auto scroll-smooth p-1 motion-reduce:scroll-auto lg:absolute lg:inset-0"
    >
      <ToggleGroup
        type="single"
        variant="thumbnail"
        aria-label="Мініатюри фото та відео"
        value={String(selectedIndex)}
        // Повторне натискання на відкриту мініатюру дає порожнє значення: лишаємо її відкритою.
        onValueChange={(next) => {
          if (next) onSelect(Number(next));
        }}
        className="max-w-none flex-nowrap lg:flex-col"
      >
        {media.map((item, index) => {
          const preview = mediaPreview(item);

          return (
            <ToggleGroupItem
              key={item.id}
              value={String(index)}
              data-index={index}
              aria-label={mediaLabel(item, index, media.length, title)}
            >
              {preview ? (
                <ShopImage
                  src={preview.url}
                  alt=""
                  width={preview.width ?? IMAGE_FALLBACK_SIZE}
                  height={preview.height ?? IMAGE_FALLBACK_SIZE}
                  sizes={THUMB_SIZES}
                  widths={THUMB_WIDTHS}
                  className="size-full object-cover"
                />
              ) : null}
              {item.type === "video" || item.type === "external-video" ? (
                <span data-slot="product-gallery-thumb-mark" data-kind="video" className={MARK}>
                  <Play aria-hidden="true" strokeWidth={2} className="size-4 fill-current" />
                </span>
              ) : null}
              {item.type === "model" ? (
                <span data-slot="product-gallery-thumb-mark" data-kind="model" className={MARK}>
                  <Box aria-hidden="true" strokeWidth={2} className="size-4" />
                </span>
              ) : null}
            </ToggleGroupItem>
          );
        })}
      </ToggleGroup>
    </div>
  );
}
