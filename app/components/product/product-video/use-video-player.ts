import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type SyntheticEvent,
} from "react";

/** HTMLMediaElement.NETWORK_NO_SOURCE: жодне з джерел не підійшло. */
const NETWORK_NO_SOURCE = 3;

type MediaState = {
  playing: boolean;
  /** Відео вантажиться або буферизується. */
  waiting: boolean;
  /** Відео не вдалося завантажити чи відтворити. */
  failed: boolean;
};

const INITIAL: MediaState = { playing: false, waiting: false, failed: false };

/**
 * Стан і керування відео без рідних controls браузера: лише «відтворити» й «пауза».
 * Джерело правди — сам <video>: кожна його подія перечитує стан, тож кнопка не розходиться
 * з тим, що відбувається насправді (пауза із системної шторки, кінець відео, втрата мережі).
 */
export function useVideoPlayer() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [media, setMedia] = useState<MediaState>(INITIAL);

  const sync = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setMedia((previous) => ({ ...previous, playing: !video.paused && !video.ended }));
  }, []);

  const play = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    setMedia((previous) => ({ ...previous, waiting: true, failed: false }));
    // Браузер може відхилити запуск (режим заощадження даних): лишається кнопка «Відтворити».
    video.play().catch(() => setMedia((previous) => ({ ...previous, waiting: false })));
  }, []);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused || video.ended) play();
    else video.pause();
  }, [play]);

  const retry = useCallback(() => {
    videoRef.current?.load();
    play();
  }, [play]);

  useEffect(() => {
    // Вкладку сховали — відео не грає у фоні.
    const onVisibilityChange = () => {
      if (document.hidden) videoRef.current?.pause();
    };

    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
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

    // event.code не залежить від розкладки: «K» працює і з українською клавіатурою.
    // На кнопці пробіл натискає саму кнопку.
    const toggles =
      event.code === "KeyK" || (event.code === "Space" && !target.closest("button, a"));
    if (!toggles) return;

    togglePlay();
    // Клавіша належить плеєру: карусель галереї її не отримує.
    event.preventDefault();
    event.stopPropagation();
  };

  return {
    ...media,
    play,
    togglePlay,
    retry,
    /** На контейнер плеєра. */
    frameProps: { onKeyDownCapture },
    /** На сам <video>. */
    videoProps: {
      ref: videoRef,
      onPlay: sync,
      onPause: settle,
      onEnded: settle,
      onWaiting: () => setMedia((previous) => ({ ...previous, waiting: true })),
      onPlaying: settle,
      onCanPlay: settle,
      // Помилка <source> сюди теж може дійти: вона ще не означає, що відео не відтвориться.
      onError: (event: SyntheticEvent<HTMLVideoElement>) => {
        if (event.target === event.currentTarget) fail();
      },
      // Натискання на відео: пауза або відтворення.
      onClick: togglePlay,
    },
    /** На кожен <source>: помилка останнього означає, що відтворити нема чого. */
    onSourceError: () => {
      if (videoRef.current?.networkState === NETWORK_NO_SOURCE) fail();
    },
  };
}

export type VideoPlayer = ReturnType<typeof useVideoPlayer>;
