import type { Player } from "../store/gameStore";

type Props = { player: Player };

export function Dashboard({ player }: Props) {
  const laptopLabel = player.laptop ?? "нет";
  const xpCap = player.level * 100;

  return (
    <div className="card home-dashboard" aria-label="Состояние персонажа">
      <p className="home-dashboard__title">Сейчас у тебя</p>
      <div className="dash-bars">
        <div className="dash-bar-col">
          <span className="dash-bar-caption">⚡ Энергия</span>
          <div className="bar-bg">
            <div className="bar-fill" style={{ background: "#22c55e", width: `${player.energy}%` }} />
          </div>
          <span className="dash-bar-num">
            {player.energy} / 100
          </span>
        </div>
        <div className="dash-bar-col">
          <span className="dash-bar-caption">😊 Настроение</span>
          <div className="bar-bg">
            <div className="bar-fill" style={{ background: "#3b82f6", width: `${player.mood}%` }} />
          </div>
          <span className="dash-bar-num">
            {player.mood} / 100
          </span>
        </div>
      </div>
      <div className="dash-meta">
        <div className="dash-meta-row">
          <span className="dash-meta-label">✨ Опыт</span>
          <span className="dash-meta-val">
            {player.xp} / {xpCap} XP
          </span>
        </div>
        <div className="dash-meta-row">
          <span className="dash-meta-label">📈 Уровень</span>
          <span className="dash-meta-val">{player.level}</span>
        </div>
        <div className="dash-meta-row">
          <span className="dash-meta-label">💻 Ноутбук</span>
          <span className="dash-meta-val">{laptopLabel}</span>
        </div>
      </div>
      <div className="dash-meta">
        <div className="dash-meta-row">
          <span className="dash-meta-label">💰 Деньги</span>
          <span className="dash-meta-val dash-meta-val--money">{player.money}₽</span>
        </div>
        <div className="dash-meta-row">
          <span className="dash-meta-label">💼 Должность</span>
          <span className="dash-meta-val">{player.job}</span>
        </div>
        <div className="dash-meta-row">
          <span className="dash-meta-label">🏠 Жильё</span>
          <span className="dash-meta-val">{player.home}</span>
        </div>
        <div className="dash-meta-row">
          <span className="dash-meta-label">🛴 Транспорт</span>
          <span className="dash-meta-val">{player.transport}</span>
        </div>
      </div>
    </div>
  );
}
