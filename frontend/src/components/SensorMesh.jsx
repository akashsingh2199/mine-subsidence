import { Battery, Radio, TriangleAlert } from 'lucide-react';
import { STATUS_META } from '../data/mockData.js';

export default function SensorMesh({ nodes, selectedNodeId, onSelectNode }) {
  const xValues = [...new Set(nodes.map((node) => node.x).filter((value) => value !== null))].sort((a, b) => a - b);
  const yValues = [...new Set(nodes.map((node) => node.y).filter((value) => value !== null))].sort((a, b) => a - b);

  if (!nodes.length) {
    return <div className="empty-state">Waiting for CSV frame with all 16 sensor nodes.</div>;
  }

  return (
    <div className="mesh-grid" role="grid" aria-label="4 by 4 underground mine node grid">
      {nodes.map((node) => {
        const meta = STATUS_META[node.status] ?? STATUS_META.Normal;
        const gridColumn = xValues.indexOf(node.x) + 1 || undefined;
        const gridRow = yValues.indexOf(node.y) + 1 || undefined;
        return (
          <button
            key={node.id}
            type="button"
            className={`node-tile ${meta.className} ${selectedNodeId === node.id ? 'selected' : ''}`}
            style={{ gridColumn, gridRow }}
            onClick={() => onSelectNode(node.id)}
            role="gridcell"
            aria-label={`${node.id} ${node.status}`}
          >
            <span className="node-id">{node.id}</span>
            <span className="node-status">Ground Truth: {node.groundTruth}</span>
            <span className="node-reading">{node.displacement ?? 'NA'} mm</span>
            <span className="node-coord">x {node.x ?? 'NA'}m / y {node.y ?? 'NA'}m</span>
            <span className="node-ai">AI: {node.aiPrediction?.prediction ?? 'Not connected'}</span>
            <span className="node-meta">
              <span>
                <Battery size={13} />
                {node.battery ?? 'NA'}V
              </span>
              <span>
                <Radio size={13} />
                {node.rssi ?? 'NA'} dBm
              </span>
            </span>
            {node.status !== 'Normal' && <TriangleAlert className="node-alert-icon" size={18} />}
          </button>
        );
      })}
    </div>
  );
}
