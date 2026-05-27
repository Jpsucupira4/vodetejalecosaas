interface Props {
  label: string;
  value: string | number;
  sub?: string;
  accent?: boolean;
  danger?: boolean;
}

export default function StatCard({ label, value, sub, accent, danger }: Props) {
  return (
    <div className="stat-card">
      <div className="stat-label">{label}</div>
      <div
        className="stat-value"
        style={
          danger ? { color: "var(--danger)" } :
          accent ? { color: "var(--success)" } : {}
        }
      >
        {value}
      </div>
      {sub && <div className="stat-sub">{sub}</div>}
    </div>
  );
}
