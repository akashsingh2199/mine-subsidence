import { BarChart3, Bell, BrainCircuit, Gauge, Map, Network, RadioTower, Settings } from 'lucide-react';

const navItems = [
  { label: 'Overview', icon: Gauge, active: true },
  { label: 'Sensor Mesh', icon: Network },
  { label: 'Deformation', icon: Map },
  { label: 'AI Analytics', icon: BrainCircuit },
  { label: 'Alerts', icon: Bell },
  { label: 'Reports', icon: BarChart3 },
  { label: 'Gateway', icon: RadioTower },
  { label: 'Settings', icon: Settings }
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand-block">
        <div className="brand-mark">MS</div>
        <div>
          <strong>MineSight AI</strong>
          <span>SIH26025</span>
        </div>
      </div>

      <nav className="side-nav" aria-label="Dashboard sections">
        {navItems.map(({ label, icon: Icon, active }) => (
          <button className={`nav-item ${active ? 'active' : ''}`} key={label} type="button">
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar-footer">
        <span>Future stack</span>
        <strong>React {`->`} Express {`->`} Socket.IO {`->`} MongoDB</strong>
      </div>
    </aside>
  );
}
