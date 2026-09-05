import { Clock, Database, Server, Wifi } from 'lucide-react';

export default function Header({ status }) {
  return (
    <header className="top-header">
      <div>
        <p className="eyebrow">AI-powered mine subsidence monitoring system</p>
        <h1>Industrial Mine Monitoring Dashboard</h1>
      </div>
      <div className="status-strip" aria-label="Live system status">
        <div className="status-item online">
          <Wifi size={16} />
          <span>{status.health}</span>
        </div>
        <div className="status-item">
          <Clock size={16} />
          <span>Sync {status.sync}</span>
        </div>
        <div className="status-item">
          <Server size={16} />
          <span>{status.gateway}</span>
        </div>
        <div className="status-item">
          <Database size={16} />
          <span>Uptime {status.uptime}</span>
        </div>
      </div>
    </header>
  );
}
