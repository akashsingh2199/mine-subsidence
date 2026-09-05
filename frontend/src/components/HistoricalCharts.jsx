import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';

const tooltipStyle = {
  background: '#111827',
  border: '1px solid rgba(148, 163, 184, 0.2)',
  borderRadius: 8,
  color: '#e5eefb'
};

const charts = [
  { title: 'Live Displacement', dataKey: 'displacement', stroke: '#38bdf8', unit: 'mm' },
  { title: 'Live Vibration', dataKey: 'vibration', stroke: '#29d391', unit: 'g' },
  { title: 'Live Tilt', dataKey: 'tilt', stroke: '#a78bfa', unit: 'deg' },
  { title: 'Live Crack Opening', dataKey: 'crack', stroke: '#f97316', unit: 'mm' }
];

export default function HistoricalCharts({ data }) {
  if (!data.length) {
    return (
      <section className="charts-grid" aria-label="Live selected node charts">
        <div className="panel chart-panel">
          <div className="empty-state">Live charts will populate from actual CSV readings as the replay advances.</div>
        </div>
      </section>
    );
  }

  return (
    <section className="charts-grid" aria-label="Live selected node charts">
      {charts.map((chart) => (
        <LiveChart key={chart.dataKey} data={data} {...chart} />
      ))}
    </section>
  );
}

function LiveChart({ title, dataKey, stroke, unit, data }) {
  return (
    <div className="panel chart-panel">
      <div className="panel-header">
        <div>
          <p className="eyebrow">selected node history</p>
          <h2>{title}</h2>
        </div>
      </div>
      <ResponsiveContainer width="100%" height={240}>
        <LineChart data={data} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
          <CartesianGrid stroke="rgba(148, 163, 184, 0.14)" vertical={false} />
          <XAxis dataKey="time" stroke="#94a3b8" tickLine={false} axisLine={false} />
          <YAxis stroke="#94a3b8" tickLine={false} axisLine={false} />
          <Tooltip contentStyle={tooltipStyle} />
          <Line type="monotone" dataKey={dataKey} stroke={stroke} strokeWidth={3} dot={false} name={`${title} ${unit}`} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
