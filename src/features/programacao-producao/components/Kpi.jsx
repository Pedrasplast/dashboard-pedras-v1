export default function Kpi({ icon, label, value, tipo = "" }) {
  return (
    <div className={`programacao-kpi ${tipo}`.trim()}>
      <span className="kpi-icon">{icon}</span>
      <div>
        <small>{label}</small>
        <strong>{value}</strong>
      </div>
    </div>
  );
}
