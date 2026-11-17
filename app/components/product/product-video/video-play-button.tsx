import { Pause, Play } from "lucide-react";

import { Button, type ButtonProps } from "~/components/ui/button";
import { cn } from "~/lib/utils";

export type VideoPlayButtonProps = Omit<ButtonProps, "children" | "variant" | "size"> & {
  /**
   * Відео зараз грає: кнопка стає «Пауза» й зникає з очей, щоб не закривати кадр.
   * Вона лишається в розмітці: з клавіатури її видно у фокусі, а клік по центру кадру
   * ставить відео на паузу так само, як клік будь-де по відео.
   */
  playing?: boolean;
};

/**
 * Єдина кнопка відео по центру кадру — і для відео Shopify, і для YouTube/Vimeo.
 * Одне коло 64px без шарів довкола: край на темних фото дає внутрішня обвідка самої кнопки,
 * кільце фокуса — тінь тієї ж кнопки, тому все концентричне. Центрує контейнер (grid),
 * а transform кнопки вільний для станів: наведення збільшує, натискання зменшує, без зсуву вниз.
 */
export function VideoPlayButton({ playing = false, className, ...props }: VideoPlayButtonProps) {
  return (
    <div
      data-slot="video-play-overlay"
      className="pointer-events-none absolute inset-0 grid place-items-center"
    >
      <Button
        data-slot="video-play-button"
        data-playing={playing}
        variant="ink"
        size="icon"
        aria-label={playing ? "Поставити відео на паузу" : "Відтворити відео"}
        className={cn(
          "pointer-events-auto size-16 rounded-pill inset-ring-2 inset-ring-on-ink-20 transition-[background-color,scale,opacity] hover:scale-105 active:translate-y-0 active:scale-95",
          playing && "opacity-0 focus-visible:opacity-100",
          className,
        )}
        {...props}
      >
        {playing ? (
          <Pause aria-hidden="true" strokeWidth={2} className="size-6 fill-current" />
        ) : (
          // Трикутник оптично лівіший за свою рамку: зсув на 2px праворуч.
          <Play
            aria-hidden="true"
            strokeWidth={2}
            className="size-6 translate-x-0.5 fill-current"
          />
        )}
      </Button>
    </div>
  );
}
