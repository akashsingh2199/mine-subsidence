export default function AlertsPanel({ alerts }) {
  return (
    <section className="panel alerts-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">recent alerts</p>
          <h2>Incident Stream</h2>
        </div>
      </div>
      <div className="alert-list">
        {alerts.map((alert) => (
          <article className={`alert-item ${alert.level.toLowerCase()}`} key={alert.id}>
            <div>
              <strong>{alert.node}</strong>
              <span>{alert.id}</span>
            </div>
            <p>{alert.message}</p>
            <time>{alert.time}</time>
          </article>
        ))}
      </div>
    </section>
  );
}
