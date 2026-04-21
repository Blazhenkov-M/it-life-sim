import { useCallback, useEffect, useRef, useState } from "react";

export function useBackgroundMusic(tracks: string[]) {
  const [showUnlock, setShowUnlock] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const idxRef = useRef(0);

  const tryPlay = useCallback(() => {
    const el = audioRef.current;
    if (!el) return Promise.resolve();
    return el.play().then(
      () => setShowUnlock(false),
      () => setShowUnlock(true),
    );
  }, []);

  const onUnlockClick = useCallback(() => {
    void tryPlay();
  }, [tryPlay]);

  useEffect(() => {
    if (!tracks.length) return;
    const raw = audioRef.current;
    if (!raw) return;
    const audio: HTMLAudioElement = raw;

    function loadTrack() {
      audio.src = tracks[idxRef.current];
      audio.load();
    }

    function playWhenReady() {
      if (audio.readyState >= 2) return tryPlay();
      return new Promise<void>((resolve) => {
        const onReady = () => {
          audio.removeEventListener("canplay", onReady);
          void tryPlay().then(() => resolve());
        };
        audio.addEventListener("canplay", onReady, { once: true });
      });
    }

    const onEnded = () => {
      idxRef.current = (idxRef.current + 1) % tracks.length;
      loadTrack();
      void playWhenReady();
    };

    audio.addEventListener("ended", onEnded);
    loadTrack();
    void playWhenReady();

    const unlockFromGesture = () => {
      if (audio.paused) void playWhenReady();
    };
    document.body.addEventListener("click", unlockFromGesture, { capture: true, once: true });
    document.body.addEventListener("touchend", unlockFromGesture, { capture: true, once: true });

    return () => {
      audio.removeEventListener("ended", onEnded);
    };
  }, [tracks, tryPlay]);

  return { audioRef, showUnlock, onUnlockClick };
}
