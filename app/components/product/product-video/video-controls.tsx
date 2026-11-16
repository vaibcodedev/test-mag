import { Maximize, Minimize, Pause, Play, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, type Ref } from "react";

import { Button } from "~/components/ui/button";
import { Slider, type SliderProps } from "~/components/ui/slider";
import { cn } from "~/lib/utils";

import { formatTime, seekValueText } from "./product-video.utils";
import type { VideoPlayer } from "./use-video-player";

/**
 * Slider із текстом значення для читача екрана. База не дає передати aria-valuetext на повзунок,
 * тому атрибут ставиться напряму: React цим атрибутом не керує і не затирає його.
 */
function LabelledSlider({
  valueText,
  control,
  className,
  ...props
}: SliderProps & { valueText: string; control: "seek" | "volume" }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    ref.current
      ?.querySelector('[data-slot="slider-thumb"]')
      ?.setAttribute("aria-valuetext", valueText);
  }, [valueText]);

  return (
    <div ref={ref} data-player-control={control} className={cn("min-w-0", className)}>
      <Slider {...props} />
    </div>
  );
}

export type VideoControlsProps = {
  player: VideoPlayer;
  /** Кнопка «Відтворити / Пауза»: на неї переходить фокус після запуску. */
  playButtonRef?: Ref<HTMLButtonElement>;
};

/**
 * Панель керування внизу відео на суцільному ink. Кожна кнопка — 44px, фокус — кільце для ink.
 * Поки відео грає і нічого не відбувається, панель прозора; з клавіатури до неї можна дійти
 * завжди — фокус усередині повертає її.
 */
export function VideoControls({ player, playButtonRef }: VideoControlsProps) {
  const {
    playing,
    currentTime,
    duration,
    volume,
    muted,
    fullscreen,
    controlsVisible,
    togglePlay,
    seek,
    setVolume,
    toggleMute,
    toggleFullscreen,
  } = player;
  const volumePercent = muted ? 0 : Math.round(volume * 100);

  return (
    <div
      data-slot="video-controls"
      data-visible={controlsVisible}
      className="absolute inset-x-0 bottom-0 flex items-center gap-1 bg-ink px-2 py-1 text-surface duration-150 data-[visible=false]:pointer-events-none data-[visible=false]:opacity-0 motion-safe:transition-opacity"
    >
      <Button
        ref={playButtonRef}
        variant="on-dark"
        size="icon"
        aria-label={playing ? "Пауза" : "Відтворити"}
        onClick={togglePlay}
        className="rounded-pill"
      >
        {playing ? (
          <Pause aria-hidden="true" strokeWidth={2} className="fill-current" />
        ) : (
          <Play aria-hidden="true" strokeWidth={2} className="translate-x-px fill-current" />
        )}
      </Button>

      <LabelledSlider
        control="seek"
        className="mx-2 flex-1"
        thumbLabels={["Перемотування"]}
        valueText={seekValueText(currentTime, duration)}
        value={[Math.min(currentTime, duration)]}
        min={0}
        max={duration > 0 ? duration : 1}
        step={0.1}
        disabled={duration <= 0}
        onValueChange={([time]) => {
          if (time !== undefined) seek(time);
        }}
      />

      <span data-slot="video-time" className="px-1 text-caption whitespace-nowrap tabular-nums">
        {formatTime(currentTime)} / {formatTime(duration)}
      </span>

      <Button
        variant="on-dark"
        size="icon"
        aria-label={muted ? "Увімкнути звук" : "Вимкнути звук"}
        onClick={toggleMute}
        className="rounded-pill"
      >
        {muted ? (
          <VolumeX aria-hidden="true" strokeWidth={2} />
        ) : (
          <Volume2 aria-hidden="true" strokeWidth={2} />
        )}
      </Button>

      {/* На телефоні гучність міняють кнопки самого пристрою; iOS і не дає задати її зі сторінки. */}
      <LabelledSlider
        control="volume"
        className="mx-1 hidden w-20 lg:block"
        thumbLabels={["Гучність"]}
        valueText={`${volumePercent} %`}
        value={[volumePercent]}
        min={0}
        max={100}
        step={5}
        onValueChange={([percent]) => {
          if (percent !== undefined) setVolume(percent / 100);
        }}
      />

      <Button
        variant="on-dark"
        size="icon"
        aria-label={fullscreen ? "Вийти з повноекранного режиму" : "На весь екран"}
        onClick={toggleFullscreen}
        className="rounded-pill"
      >
        {fullscreen ? (
          <Minimize aria-hidden="true" strokeWidth={2} />
        ) : (
          <Maximize aria-hidden="true" strokeWidth={2} />
        )}
      </Button>
    </div>
  );
}
