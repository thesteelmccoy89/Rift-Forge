import type { DeckStats as Stats } from "@/lib/stats";

export default function DeckStats({ stats }: { stats: Stats }) {
  if (!stats.total) return <span className="meta">Stats appear once the deck has cards.</span>;
  const peak = Math.max(...stats.curve.map((b) => b.count), 1);
  return (
    <div className="stats">
      <div className="stat-line mono">
        <span>Avg energy {stats.averageEnergy}</span>
        <span>{stats.units} units, avg Might {stats.averageMight}</span>
      </div>
      <div className="curve" role="img" aria-label={`Energy curve: ${stats.curve.map((b) => `${b.count} at ${b.label}`).join(", ")}`}>
        {stats.curve.map((b) => (
          <div key={b.label} className="bar-col">
            <span className="mono">{b.count || ""}</span>
            <div className="bar" style={{ height: `${(b.count / peak) * 100}%` }} />
            <span className="mono">{b.label}</span>
          </div>
        ))}
      </div>
      <div className="split" aria-label="Domain split">
        {stats.domains.map((d) => (
          <div key={d.domain} className={`d-${d.domain}`} style={{ flex: d.count }} title={`${d.domain}: ${d.count}`} />
        ))}
      </div>
      <div className="wrap" style={{ margin: 0 }}>
        {stats.domains.map((d) => <span key={d.domain} className="mono">{d.domain} {d.count}</span>)}
      </div>
      <div className="wrap" style={{ margin: 0 }}>
        {stats.types.map((t) => <span key={t.type} className="mono">{t.type} {t.count}</span>)}
      </div>
    </div>
  );
}
