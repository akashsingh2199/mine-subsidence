import { Activity, Battery, BrainCircuit, Radio, ShieldAlert, TrendingUp, Waves } from 'lucide-react';

const metrics = [
  { key: 'tilt_roll_deg', label: 'Tilt roll', unit: 'deg', icon: Activity },
  { key: 'tilt_pitch_deg', label: 'Tilt pitch', unit: 'deg', icon: Activity },
  { key: 'tilt_magnitude_deg', label: 'Tilt magnitude', unit: 'deg', icon: Activity },
  { key: 'tilt_rate_deg_per_min', label: 'Tilt rate', unit: 'deg/min', icon: Activity },
  { key: 'vibration_rms_g', label: 'Vibration RMS', unit: 'g', icon: Waves },
  { key: 'dominant_frequency_hz', label: 'Dominant frequency', unit: 'Hz', icon: Waves },
  { key: 'displacement_mm', label: 'Displacement', unit: 'mm', icon: TrendingUp },
  { key: 'displacement_rate_mm_per_min', label: 'Displacement rate', unit: 'mm/min', icon: TrendingUp },
  { key: 'crackEvent', label: 'Crack event', unit: '', icon: ShieldAlert },
  { key: 'crack_opening_mm', label: 'Crack opening', unit: 'mm', icon: ShieldAlert },
  { key: 'battery_v', label: 'Battery', unit: 'V', icon: Battery },
  { key: 'rssi_dbm', label: 'RSSI', unit: 'dBm', icon: Radio },
  { key: 'packet_loss_rate', label: 'Packet loss rate', unit: '', icon: Activity }
];

const legacyMetrics = [
  { key: 'displacement', label: 'Displacement', unit: 'mm', icon: TrendingUp },
  { key: 'displacementRate', label: 'Displacement rate', unit: 'mm/min', icon: TrendingUp },
  { key: 'tilt', label: 'Tilt magnitude', unit: 'deg', icon: Activity },
  { key: 'tiltRate', label: 'Tilt rate', unit: 'deg/min', icon: Activity },
  { key: 'vibration', label: 'Vibration', unit: 'g', icon: Waves },
  { key: 'dominantFrequency', label: 'Dominant frequency', unit: 'Hz', icon: Waves },
  { key: 'crackOpening', label: 'Crack opening', unit: 'mm', icon: ShieldAlert },
  { key: 'battery', label: 'Battery', unit: 'V', icon: Battery },
  { key: 'rssi', label: 'RSSI', unit: 'dBm', icon: Radio },
  { key: 'packetLoss', label: 'Packet loss', unit: '%', icon: Activity }
];

function formatMetric(value) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return 'NA';
  }
  if (typeof value === 'number') {
    return Number.isInteger(value) ? value : value.toFixed(4).replace(/0+$/, '').replace(/\.$/, '');
  }
  return value;
}

function formatRisk(prediction) {
  if (!prediction || prediction.risk_probability === null || prediction.risk_probability === undefined) {
    return 'Not connected';
  }
  return `${(Number(prediction.risk_probability) * 100).toFixed(1)}%`;
}

function formatAnomaly(prediction) {
  if (!prediction || prediction.anomaly === null || prediction.anomaly === undefined) {
    return 'Not connected';
  }
  return prediction.anomaly ? 'Yes' : 'No';
}

export default function SelectedNodePanel({ node }) {
  if (!node) {
    return (
      <aside className="panel node-panel">
        <div className="empty-state">Select a node after the CSV dataset loads.</div>
      </aside>
    );
  }

  return (
    <aside className="panel node-panel">
      <div className="panel-header compact">
        <div>
          <p className="eyebrow">selected node panel</p>
          <h2>{node.id}</h2>
        </div>
        <span className={`status-badge ${node.status.toLowerCase().replaceAll(' ', '-')}`}>{node.status}</span>
      </div>

      <div className="metric-list">
        {(node.tilt_roll_deg === undefined ? legacyMetrics : metrics).map(({ key, label, unit, icon: Icon }) => (
          <div className="metric-row" key={key}>
            <span>
              <Icon size={16} />
              {label}
            </span>
            <strong>
              {formatMetric(node[key])}
              {unit && <small>{unit}</small>}
            </strong>
          </div>
        ))}
      </div>

      <div className="ground-truth-card">
        <span>Ground Truth</span>
        <strong>{node.groundTruth}</strong>
      </div>

      <div className="ai-card">
        <div className="ai-card-title">
          <BrainCircuit size={18} />
          AI Prediction
        </div>
        <strong>{node.aiPrediction?.prediction ?? 'AI Service Offline'}</strong>
        <div className="ai-meta">
          <span>Risk probability</span>
          <strong>{formatRisk(node.aiPrediction)}</strong>
        </div>
        <div className="ai-meta">
          <span>Anomaly detection</span>
          <strong>{formatAnomaly(node.aiPrediction)}</strong>
        </div>
        <div className="ai-meta">
          <span>Final status</span>
          <strong>{node.aiPrediction?.final_status ?? 'AI Service Offline'}</strong>
        </div>
      </div>
    </aside>
  );
}
