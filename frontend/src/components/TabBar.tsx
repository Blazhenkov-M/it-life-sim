import { useGameStore, type ModalTab } from "../store/gameStore";

const TABS: { id: Exclude<ModalTab, null>; ico: string; label: string }[] = [
  { id: "skills", ico: "📚", label: "Навыки" },
  { id: "work", ico: "💼", label: "Работа" },
  { id: "shop", ico: "🛒", label: "Магазин" },
  { id: "relations", ico: "💬", label: "Отношения" },
  { id: "fun", ico: "🎮", label: "Развлечения" },
];

export function TabBar() {
  const modal = useGameStore((s) => s.modal);
  const openModal = useGameStore((s) => s.openModal);
  const closeModals = useGameStore((s) => s.closeModals);

  return (
    <div className="tab-bar-wrap" role="tablist" aria-label="Разделы">
      <div className="tab-bar-grid">
        {TABS.map((t) => {
          const active = modal === t.id;
          return (
            <button
              key={t.id}
              type="button"
              className={`tab-item${active ? " is-active" : ""}`}
              role="tab"
              aria-selected={active}
              aria-haspopup="dialog"
              aria-controls={`modal-${t.id}`}
              tabIndex={active ? 0 : -1}
              onClick={(e) => {
                e.stopPropagation();
                if (modal === t.id) closeModals();
                else openModal(t.id);
              }}
            >
              <span className="tab-item__ico" aria-hidden>
                {t.ico}
              </span>
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
