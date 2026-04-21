import type { ReactNode } from "react";
import { useGameStore, type ModalTab, type ShopTabKey } from "../store/gameStore";

function ModalShell({
  id,
  open,
  title,
  children,
}: {
  id: Exclude<ModalTab, null>;
  open: boolean;
  title: string;
  children: ReactNode;
}) {
  const closeModals = useGameStore((s) => s.closeModals);

  return (
    <div
      className={`modal-backdrop${open ? " open" : ""}`}
      id={`modal-${id}`}
      role="dialog"
      aria-modal="true"
      aria-hidden={!open}
      aria-labelledby={`modal-${id}-title`}
      data-modal={id}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModals();
      }}
    >
      <div className="modal-panel" role="document" onClick={(e) => e.stopPropagation()}>
        <div className="modal-head">
          <h2 id={`modal-${id}-title`}>{title}</h2>
          <button type="button" className="modal-close" aria-label="Закрыть" onClick={() => closeModals()}>
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

const SHOP_TABS: { key: ShopTabKey; id: string; label: string }[] = [
  { key: "pms", id: "shop-tab-pms", label: "ПМС-шоп" },
  { key: "cygan", id: "shop-tab-cygan", label: "ЦИГАН" },
  { key: "korita", id: "shop-tab-korita", label: "корыта.ру" },
];

export function Modals() {
  const modal = useGameStore((s) => s.modal);
  const player = useGameStore((s) => s.player);
  const jobs = useGameStore((s) => s.jobs);
  const laptops = useGameStore((s) => s.laptops);
  const homes = useGameStore((s) => s.homes);
  const transport = useGameStore((s) => s.transport);
  const funActivities = useGameStore((s) => s.fun_activities);

  const shopTab = useGameStore((s) => s.shopTab);
  const workTab = useGameStore((s) => s.workTab);
  const setShopTab = useGameStore((s) => s.setShopTab);
  const setWorkTab = useGameStore((s) => s.setWorkTab);

  const postWork = useGameStore((s) => s.postWork);
  const postFun = useGameStore((s) => s.postFun);
  const buyLaptop = useGameStore((s) => s.buyLaptop);
  const applyJob = useGameStore((s) => s.applyJob);
  const buyHome = useGameStore((s) => s.buyHome);
  const buyTransport = useGameStore((s) => s.buyTransport);

  return (
    <>
      <ModalShell id="skills" open={modal === "skills"} title="📚 Навыки">
        <div className="card skills-list">
          <p className="home-dashboard__title" style={{ marginBottom: 12 }}>
            Компетенции
          </p>
          <div className="dash-meta" style={{ margin: 0, padding: 0, border: "none" }}>
            <div className="dash-meta-row">
              <span className="dash-meta-label">📄 Microsoft Office</span>
              <span className="skills-soon">скоро</span>
            </div>
            <div className="dash-meta-row">
              <span className="dash-meta-label">🐍 Python</span>
              <span className="skills-soon">скоро</span>
            </div>
            <div className="dash-meta-row">
              <span className="dash-meta-label">🚗 Права кат. В</span>
              <span className="skills-soon">скоро</span>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell id="work" open={modal === "work"} title="💼 Работа">
        <div className="work-browser-shell">
          <div className="work-browser__tabs" role="tablist" aria-label="Работа">
            <button
              type="button"
              className={`work-tab${workTab === "freelance" ? " is-active" : ""}`}
              role="tab"
              id="work-tab-freelance"
              aria-selected={workTab === "freelance"}
              aria-controls="work-panel-freelance"
              onClick={(e) => {
                e.stopPropagation();
                setWorkTab("freelance");
              }}
            >
              Фриланс
            </button>
            <button
              type="button"
              className={`work-tab${workTab === "career" ? " is-active" : ""}`}
              role="tab"
              id="work-tab-career"
              aria-selected={workTab === "career"}
              aria-controls="work-panel-career"
              onClick={(e) => {
                e.stopPropagation();
                setWorkTab("career");
              }}
            >
              Карьера
            </button>
          </div>
          <div className="work-panels-wrap">
            <div
              className="work-panel"
              id="work-panel-freelance"
              role="tabpanel"
              hidden={workTab !== "freelance"}
              aria-labelledby="work-tab-freelance"
            >
              <p className="work-freelance-hint">Статы на главном экране обновятся после смены.</p>
              <div className="actions">
                <button type="button" disabled={player.energy < 15} onClick={() => void postWork()}>
                  💻 Работать
                </button>
              </div>
            </div>
            <div
              className="work-panel"
              id="work-panel-career"
              role="tabpanel"
              hidden={workTab !== "career"}
              aria-labelledby="work-tab-career"
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 17 }}>💼 Карьера</h2>
              <div className="grid">
                {jobs.map((j) => {
                  const isCurrent = player.job === j.name;
                  const canApply =
                    player.level >= j.min_level && (!j.laptop || player.laptop === j.laptop);
                  if (isCurrent) {
                    return (
                      <button key={j.name} type="button" className="current" disabled>
                        ✅ {j.name}
                      </button>
                    );
                  }
                  if (canApply) {
                    return (
                      <button
                        key={j.name}
                        type="button"
                        className="btn-amber"
                        onClick={() => void applyJob(j.name)}
                      >
                        📋 {j.name} (ур.{j.min_level})
                      </button>
                    );
                  }
                  return (
                    <button key={j.name} type="button" disabled>
                      🔒 {j.name} (ур.{j.min_level}
                      {j.laptop ? `, ${j.laptop}` : ""})
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell id="shop" open={modal === "shop"} title="🛒 Магазин">
        <div className="shop-browser-shell">
          <div className="shop-browser__tabs" role="tablist" aria-label="Витрины">
            {SHOP_TABS.map((st) => (
              <button
                key={st.key}
                type="button"
                className={`shop-tab${shopTab === st.key ? " is-active" : ""}`}
                role="tab"
                id={st.id}
                aria-selected={shopTab === st.key}
                aria-controls={`shop-panel-${st.key}`}
                onClick={(e) => {
                  e.stopPropagation();
                  setShopTab(st.key);
                }}
              >
                {st.label}
              </button>
            ))}
          </div>
          <div className="shop-panels-wrap">
            <div
              className="shop-panel"
              id="shop-panel-pms"
              role="tabpanel"
              hidden={shopTab !== "pms"}
              aria-labelledby="shop-tab-pms"
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 17 }}>💻 Ноутбуки</h2>
              <div className="grid">
                {laptops.map((l) => {
                  const owned = player.laptop === l.name;
                  const canBuy = player.money >= l.price;
                  if (owned) {
                    return (
                      <button key={l.name} type="button" className="current" disabled>
                        ✅ {l.name}
                      </button>
                    );
                  }
                  if (canBuy) {
                    return (
                      <button
                        key={l.name}
                        type="button"
                        className="btn-green"
                        onClick={() => void buyLaptop(l.name)}
                      >
                        🛒 {l.name} ({l.price}₽)
                      </button>
                    );
                  }
                  return (
                    <button key={l.name} type="button" disabled>
                      🛒 {l.name} ({l.price}₽)
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              className="shop-panel"
              id="shop-panel-cygan"
              role="tabpanel"
              hidden={shopTab !== "cygan"}
              aria-labelledby="shop-tab-cygan"
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 17 }}>🏠 Жильё</h2>
              <div className="grid">
                {homes.map((h) => {
                  const owned = player.home === h.name;
                  const canBuy = player.money >= h.price;
                  if (owned) {
                    return (
                      <button key={h.name} type="button" className="current" disabled>
                        ✅ {h.name}
                      </button>
                    );
                  }
                  if (canBuy) {
                    return (
                      <button key={h.name} type="button" className="btn-green" onClick={() => void buyHome(h.name)}>
                        {h.name} — {h.price}₽
                      </button>
                    );
                  }
                  return (
                    <button key={h.name} type="button" disabled>
                      {h.name} — {h.price}₽
                    </button>
                  );
                })}
              </div>
            </div>
            <div
              className="shop-panel"
              id="shop-panel-korita"
              role="tabpanel"
              hidden={shopTab !== "korita"}
              aria-labelledby="shop-tab-korita"
            >
              <h2 style={{ margin: "0 0 10px", fontSize: 17 }}>🛴 Транспорт</h2>
              <div className="grid">
                {transport.map((t) => {
                  const owned = player.transport === t.name;
                  const canBuy = player.money >= t.price;
                  if (owned) {
                    return (
                      <button key={t.name} type="button" className="current" disabled>
                        ✅ {t.name}
                      </button>
                    );
                  }
                  if (canBuy) {
                    return (
                      <button
                        key={t.name}
                        type="button"
                        className="btn-green"
                        onClick={() => void buyTransport(t.name)}
                      >
                        {t.name} — {t.price}₽ (+{t.work_bonus}%)
                      </button>
                    );
                  }
                  return (
                    <button key={t.name} type="button" disabled>
                      {t.name} — {t.price}₽
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </ModalShell>

      <ModalShell id="relations" open={modal === "relations"} title="💬 Отношения">
        <div className="card">
          <p className="relations-placeholder">
            Здесь будут коллеги, друзья и быт. Пока прокачивай настроение через развлечения — скоро добавим сюда
            сюжеты.
          </p>
        </div>
      </ModalShell>

      <ModalShell id="fun" open={modal === "fun"} title="🎮 Развлечения">
        <div className="card fun-stack">
          {funActivities.map((fa) => (
            <button
              key={fa.id}
              type="button"
              className="btn-fun-option"
              disabled={player.money < fa.price}
              onClick={() => void postFun(fa.id)}
            >
              <span className="btn-fun-option__title">{fa.title}</span>
              <span className="btn-fun-option__meta">
                {fa.price}₽ · +{fa.mood} к настроению
              </span>
            </button>
          ))}
        </div>
        <p className="modal-fun-hint">События смотри на главном экране в блоке «Последние действия».</p>
      </ModalShell>
    </>
  );
}
