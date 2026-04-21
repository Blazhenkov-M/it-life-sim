type Props = { entries: string[] };

export function ActionLog({ entries }: Props) {
  const shown = [...entries].reverse();

  return (
    <div className="card log home-log" aria-label="Журнал действий">
      <strong>📜 Последние действия</strong>
      <ul>
        {shown.length === 0 ? (
          <li>Пока ничего не произошло...</li>
        ) : (
          shown.map((entry, i) => (
            <li key={`${entries.length}-${i}-${entry.slice(0, 48)}`}>{entry}</li>
          ))
        )}
      </ul>
    </div>
  );
}
