import { STATUS_META } from '../data/mockData.js';

export default function StatusLegend() {
  return (
    <div className="legend" aria-label="Node status legend">
      {Object.entries(STATUS_META).map(([status, meta]) => (
        <span key={status}>
          <i style={{ background: meta.color }} />
          Ground Truth: {status}
        </span>
      ))}
    </div>
  );
}
