import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type FocusEvent,
  type KeyboardEvent,
  type PointerEvent,
  type SyntheticEvent,
} from "react";

import { clamp } from "./product-video.utils";

/** Через скільки без руху панель керування ховається, поки відео грає. */
export const CONTROLS_HIDE_DELAY_MS = 2500;
export const SEEK_STEP_SECONDS = 5;
export const VOLUME_STEP = 0.1;

/** HTMLMediaElement.NETWORK_NO_SOURCE: жодне з джерел не підійшло. */
const NETWORK_NO_SOURCE = 3;

/** iPhone не вміє розгортати довільний блок на весь екран — лише саме відео, у власному плеєрі. */
type WebkitVideoElement = HTMLVideoElement & { webkitEnterFullscreen?: () => void };

type MediaState = {
  playing: boolean;
  /** Відео вантажиться або буферизується. */
  waiting: boolean;
  /** Відео не вдалося завантажити чи відтворити. */
  failed: boolean;
  currentTime: number;
  /** 0, доки тривалість невідома. */
  duration: number;
  /** 0…1. */
  volume: number;
  muted: boolean;
};

const INITIAL: MediaState = {
  playing: false,
  waiting: false,
  failed: false,
  currentTime: 0,
  duration: 0,
  volume: 1,
  muted: false,
};

function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(":focus-visible");
  } catch {
    // Середовище без :focus-visible: вважаємо, що фокус видно.
    return true;
  }
}

/**
 * Стан і керування відеоплеєром без рідних controls браузера.
 * Джерело правди — сам <video>: кожна його подія перечитує стан, тож панель не розходиться
 * з тим, що відбувається насправді (пауза із системної шторки, кінець відео, втрата мережі).
 */
export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  /** Дотик лише показав приховану панель: наступний click не має ставити відео на паузу. */
  const tapRevealedControls = useRef(false);

  const [media, setMedia] = useState<MediaState>(INITIAL);
  const [fullscreen, setFullscreen] = useState(false);
  const [recentlyActive, setRecentlyActive] = useState(true);
  const [focusInside, setFocusInside] = useState(false);

  const controlsVisible = !media.playing || media.failed || recentlyActive || focusInside;

  const sync = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setMedia((previous) => ({
      ...previous,
      playing: !video.paused && !video.ended,
      currentTime: video.currentTime,
      duration: Number.isFinite(video.duration) ? video.duration : 0,
      volume: video.volume,
      muted: video.muted,
    }));
  }, []);

  /** Позначає активність: панель видно ще CONTROLS_HIDE_DELAY_MS. */
  const poke = useCallback(() => {
    setRecentlyActive(true);
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setRecentlyActive(false), CONTROLS_HIDE_DELAY_MS);
  }, []);

  useEffect(() => () => clearTimeout(hideTimer.current), []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setMedia((previous) => ({ ...previous, waiting: true, failed: false }));
    poke();
    // Браузер може відхилити запуск (режим заощадження даних): лишається кнопка «Відтворити».
    video.play().catch(() => setMedia((previous) => ({ ...previous, waiting: false })));
  }, [poke]);

  const pause = useCallback(() => videoRef.current?.pause(), []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) play();
    else video.pause();
  }, [play]);

  const seek = useCallback(
    (time: number) => {
      const video = videoRef.current;
      if (!video) return;
      const end = Number.isFinite(video.duration) ? video.duration : 0;
      video.currentTime = clamp(time, 0, end);
      sync();
    },
    [sync],
  );

  const seekBy = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (video) seek(video.currentTime + delta);
    },
    [seek],
  );

  const setVolume = useCallback(
    (volume: number) => {
      const video = videoRef.current;
      if (!video) return;
      const next = clamp(volume, 0, 1);
      video.volume = next;
      video.muted = next === 0;
      sync();
    },
    [sync],
  );

  const changeVolume = useCallback(
    (delta: number) => {
      const video = videoRef.current;
      if (video) setVolume((video.muted ? 0 : video.volume) + delta);
    },
    [setVolume],
  );

  const toggleMute = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    // Звук увімкнули при нульовій гучності: повертаємо чутний рівень.
    if (!video.muted && video.volume === 0) video.volume = 0.5;
    sync();
  }, [sync]);

  const toggleFullscreen = useCallback(() => {
    const frame = frameRef.current;
    const video: WebkitVideoElement | null = videoRef.current;

    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (frame && typeof frame.requestFullscreen === "function") {
      frame.requestFullscreen().catch(() => {});
    } else {
      video?.webkitEnterFullscreen?.();
    }
  }, []);

  const retry = useCallback(() => {
    videoRef.current?.load();
    play();
  }, [play]);

  useEffect(() => {
    const onFullscreenChange = () =>
      setFullscreen(Boolean(frameRef.current) && document.fullscreenElement === frameRef.current);
    // Вкладку сховали — відео не грає у фоні.
    const onVisibilityChange = () => {
      if (document.hidden) videoRef.current?.pause();
    };

    document.addEventListener("fullscreenchange", onFullscreenChange);
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => {
      document.removeEventListener("fullscreenchange", onFullscreenChange);
      document.removeEventListener("visibilitychange", onVisibilityChange);
    };
  }, []);

  const settle = () => {
    setMedia((previous) => ({ ...previous, waiting: false }));
    sync();
  };
  const fail = () => setMedia((previous) => ({ ...previous, failed: true, waiting: false }));

  const onKeyDownCapture = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.altKey || event.ctrlKey || event.metaKey) return;
    const target = event.target instanceof Element ? event.target : null;
    if (!target) return;
    poke();

    // Повзунок гучності керується стрілками сам.
    if (target.closest('[data-player-control="volume"]') && event.key.startsWith("Arrow")) return;

    // event.code не залежить від розкладки: «K» працює і з українською клавіатурою.
    switch (event.code) {
      case "Space":
        // На кнопці пробіл натискає саму кнопку.
        if (target.closest("button, a")) return;
        togglePlay();
        break;
      case "KeyK":
        togglePlay();
        break;
      case "ArrowLeft":
        seekBy(-SEEK_STEP_SECONDS);
        break;
      case "ArrowRight":
        seekBy(SEEK_STEP_SECONDS);
        break;
      case "ArrowUp":
        changeVolume(VOLUME_STEP);
        break;
      case "ArrowDown":
        changeVolume(-VOLUME_STEP);
        break;
      case "KeyM":
        toggleMute();
        break;
      case "KeyF":
        toggleFullscreen();
        break;
      default:
        return;
    }

    // Клавіша належить плеєру: ні повзунок, ні карусель галереї її не отримують.
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    ...media,
    fullscreen,
    controlsVisible,
    play,
    pause,
    togglePlay,
    seek,
    seekBy,
    setVolume,
    changeVolume,
    toggleMute,
    toggleFullscreen,
    retry,
    /** На контейнер плеєра: він же розгортається на весь екран. */
    frameProps: {
      ref: frameRef,
      onKeyDownCapture,
      onPointerMove: poke,
      onPointerDown: (event: PointerEvent<HTMLDivElement>) => {
        tapRevealedControls.current = event.pointerType === "touch" && !controlsVisible;
        poke();
      },
      onFocus: (event: FocusEvent<HTMLDivElement>) => {
        setFocusInside(isFocusVisible(event.target));
        poke();
      },
      onBlur: (event: FocusEvent<HTMLDivElement>) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setFocusInside(false);
      },
    },
    /** На сам <video>. */
    videoProps: {
      ref: videoRef,
      onPlay: sync,
      onPause: settle,
      onEnded: settle,
      onTimeUpdate: sync,
      onDurationChange: sync,
      onLoadedMetadata: sync,
      onVolumeChange: sync,
      onSeeked: sync,
      onWaiting: () => setMedia((previous) => ({ ...previous, waiting: true })),
      onPlaying: settle,
      onCanPlay: settle,
      // Помилка <source> сюди теж може дійти: вона ще не означає, що відео не відтвориться.
      onError: (event: SyntheticEvent<HTMLVideoElement>) => {
        if (event.target === event.currentTarget) fail();
      },
      // Натискання на відео: відтворити або пауза. Дотик по прихованій панелі лише показує її.
      onClick: () => {
        if (tapRevealedControls.current) tapRevealedControls.current = false;
        else togglePlay();
      },
      onDoubleClick: toggleFullscreen,
    },
    /** На кожен <source>: помилка останнього означає, що відтворити нема чого. */
    onSourceError: () => {
      if (videoRef.current?.networkState === NETWORK_NO_SOURCE) fail();
    },
  };
}

export type VideoPlayer = ReturnType<typeof useVideoPlayer>;
