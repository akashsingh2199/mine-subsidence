import { CRS } from 'leaflet';
import { Circle, CircleMarker, MapContainer, Polyline, Popup } from 'react-leaflet';
import { STATUS_META } from '../data/mockData.js';

export default function DeformationMap({ nodes, selectedNode }) {
  const positions = nodes
    .filter((node) => node.x !== null && node.y !== null)
    .map((node) => [node.y, node.x]);

  if (!positions.length) {
    return <div className="map-shell empty-state">Waiting for x_m and y_m coordinates from the CSV frame.</div>;
  }

  return (
    <div className="map-shell">
      <MapContainer
        center={[75, 75]}
        zoom={0}
        minZoom={-2}
        maxZoom={3}
        crs={CRS.Simple}
        scrollWheelZoom={false}
        className="mine-map"
      >
        <Polyline positions={positions} pathOptions={{ color: '#334155', weight: 2, dashArray: '6 8' }} />
        {nodes
          .filter((node) => node.status !== 'Normal')
          .map((node) => (
          <Circle
            key={`${node.id}-influence`}
            center={[node.y, node.x]}
            radius={node.status === 'Active Subsidence' ? 28 : 20}
            pathOptions={{
              color: STATUS_META[node.status]?.color ?? '#94a3b8',
              fillColor: STATUS_META[node.status]?.color ?? '#94a3b8',
              fillOpacity: 0.22,
              opacity: 0.8
            }}
          />
        ))}
        {nodes.map((node) => (
          <CircleMarker
            key={node.id}
            center={[node.y, node.x]}
            radius={node.id === selectedNode?.id ? 10 : 7}
            pathOptions={{
              color: '#020617',
              weight: 2,
              fillColor: STATUS_META[node.status]?.color ?? '#94a3b8',
              fillOpacity: 0.95
            }}
          >
            <Popup>
              {node.id}: {node.status}
              <br />
              x {node.x}m / y {node.y}m
              <br />
              Ground Truth: {node.groundTruth}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
