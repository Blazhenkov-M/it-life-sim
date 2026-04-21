import { useEffect, useState } from "react";
import { ActionLog } from "./components/ActionLog";
import { Dashboard } from "./components/Dashboard";
import { Modals } from "./components/Modals";
import { TabBar } from "./components/TabBar";
import { useBackgroundMusic } from "./hooks/useBackgroundMusic";
import { useTabBarHeight } from "./hooks/useTabBarHeight";
import { useGameStore } from "./store/gameStore";

export default function App() {
  const [err, setErr] = useState<string | null>(null);

  const ready = useGameStore((s) => s.ready);
  const load = useGameStore((s) => s.load);
  const initFromUrl = useGameStore((s) => s.initFromUrl);
  const player = useGameStore((s) => s.player);
  const log = useGameStore((s) => s.log);
  const musicTracks = useGameStore((s) => s.music_tracks);
  const modal = useGameStore((s) => s.modal);
  const closeModals = useGameStore((s) => s.closeModals);

  const { audioRef, showUnlock, onUnlockClick } = useBackgroundMusic(musicTracks);

  useEffect(() => {
    void load()
      .then(() => initFromUrl())
      .catch(() => setErr("Не удалось загрузить состояние. Проверь, что API запущен (порт 8000)."));
  }, [load, initFromUrl]);

  useEffect(() => {
    document.body.classList.toggle("modal-open", Boolean(modal));
  }, [modal]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && modal) closeModals();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [modal, closeModals]);

  useTabBarHeight(Boolean(modal));

  return (
    <>
      <audio ref={audioRef} id="bg-audio" preload="auto" playsInline />

      {musicTracks.length > 0 && (
        <button type="button" id="music-unlock" hidden={!showUnlock} onClick={onUnlockClick}>
          🔊 Включить музыку
        </button>
      )}

      {err ? (
        <p className="app-error">{err}</p>
      ) : !ready ? (
        <div className="card home-dashboard" style={{ textAlign: "center" }}>
          Загрузка…
        </div>
      ) : (
        <>
          <main className="home-main">
            <h1>🧑‍💻 Симулятор айтишника</h1>
            <Dashboard player={player} />
            <ActionLog entries={log} />
          </main>
          <Modals />
          <TabBar />
        </>
      )}
    </>
  );
}
