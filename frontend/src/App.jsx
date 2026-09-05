import { useEffect, useMemo, useState } from 'react';
import { Activity, AlertTriangle, BrainCircuit, CircleDot, RadioTower, ShieldCheck, TriangleAlert } from 'lucide-react';
import { systemStatus } from './data/mockData.js';
import { useSocketSimulation } from './hooks/useSocketSimulation.js';
import Header from './components/Header.jsx';
import Sidebar from './components/Sidebar.jsx';
import StatCard from './components/StatCard.jsx';
import SensorMesh from './components/SensorMesh.jsx';
import SelectedNodePanel from './components/SelectedNodePanel.jsx';
import AlertsPanel from './components/AlertsPanel.jsx';
import HistoricalCharts from './components/HistoricalCharts.jsx';
import DeformationMap from './components/DeformationMap.jsx';
import StatusLegend from './components/StatusLegend.jsx';
import SimulationControls from './components/SimulationControls.jsx';

function createAlertsFromNodes(nodes) {
  return nodes
    .filter(
      (node) =>
        node.status !== 'Normal' ||
        Number(node.crackEvent) === 1 ||
        node.crackEvent === true ||
        String(node.crackEvent).toLowerCase() === 'true' ||
        Number(node.packetLoss) > 0.15
    )
    .slice(0, 6)
    .map((node, index) => ({
      id: `SIM-${String(index + 1).padStart(3, '0')}`,
      node: node.id,
      level: node.status === 'Active Subsidence' ? 'Critical' : node.status === 'Sensor Fault' ? 'Fault' : 'Warning',
      message: `Ground Truth: ${node.groundTruth}. AI: ${node.aiPrediction?.prediction ?? 'Not connected'}. Risk ${formatRisk(node.aiPrediction)}.`,
      time: node.timestamp ? new Date(node.timestamp).toLocaleTimeString() : 'Dataset time'
    }));
}

function formatRisk(prediction) {
  if (!prediction || prediction.risk_probability === null || prediction.risk_probability === undefined) {
    return 'NA';
  }
  return `${(Number(prediction.risk_probability) * 100).toFixed(1)}%`;
}

export default function App() {
  const simulation = useSocketSimulation();
  const currentNodes = simulation.currentFrame?.nodes ?? [];
  const nodesWithPredictions = currentNodes;
  const [selectedNodeId, setSelectedNodeId] = useState('N001');

  useEffect(() => {
    if (nodesWithPredictions.length && !nodesWithPredictions.some((node) => node.id === selectedNodeId)) {
      setSelectedNodeId(nodesWithPredictions[0].id);
    }
  }, [nodesWithPredictions, selectedNodeId]);

  const selectedNode = useMemo(
    () => nodesWithPredictions.find((node) => node.id === selectedNodeId) ?? nodesWithPredictions[0] ?? null,
    [nodesWithPredictions, selectedNodeId]
  );

  const activeEvents = nodesWithPredictions.filter((node) => node.status === 'Active Subsidence').length;
  const earlyEvents = nodesWithPredictions.filter((node) => node.status === 'Early Subsidence').length;
  const faultEvents = nodesWithPredictions.filter((node) => node.status === 'Sensor Fault').length;
  const normalEvents = nodesWithPredictions.filter((node) => node.status === 'Normal').length;
  const groundTruthEvent = selectedNode?.groundTruth ?? 'No selected node';
  const currentAlerts = createAlertsFromNodes(nodesWithPredictions);
  const chartData = selectedNode ? simulation.getNodeHistory(selectedNode.id, 120) : [];
  const liveStatus = {
    ...systemStatus,
    health: simulation.socketConnected ? 'Simulation Ready' : 'Backend Offline',
    sync: simulation.currentFrame?.timestamp ? new Date(simulation.currentFrame.timestamp).toLocaleString() : 'pending',
    packetIntegrity: nodesWithPredictions.length
      ? (100 - nodesWithPredictions.reduce((sum, node) => sum + (Number(node.packetLoss) || 0), 0) / nodesWithPredictions.length).toFixed(2)
      : '0.00',
    gateway: simulation.mlConnected ? 'AI Connected' : 'AI Service Offline'
  };

  return (
    <div className="app-shell">
      <Sidebar />
      <div className="main-shell">
        <Header status={liveStatus} />
        <main className="dashboard">
          <SimulationControls
            currentIndex={simulation.currentIndex}
            frameCount={simulation.frameCount}
            isPlaying={simulation.isPlaying}
            speed={simulation.speed}
            timestamp={simulation.currentFrame?.timestamp}
            metadata={simulation.metadata}
            controls={simulation.controls}
          />

          {simulation.error && (
            <section className="panel dataset-error">
              <p className="eyebrow">backend simulation status</p>
              <h2>Connection notice</h2>
              <p>{simulation.error}</p>
            </section>
          )}

          <section className="overview-grid" aria-label="Mine monitoring overview">
            <StatCard
              icon={ShieldCheck}
              label="Total Nodes"
              value={nodesWithPredictions.length || 0}
              detail="Current timestamp frame"
              tone="green"
            />
            <StatCard icon={CircleDot} label="Normal Nodes" value={normalEvents} detail="Ground Truth: normal" tone="green" />
            <StatCard
              icon={AlertTriangle}
              label="Early Warning Nodes"
              value={earlyEvents}
              detail="Ground Truth: early_subsidence"
              tone="amber"
            />
            <StatCard
              icon={TriangleAlert}
              label="Active Nodes"
              value={activeEvents}
              detail="Ground Truth: active_subsidence"
              tone="red"
            />
            <StatCard
              icon={RadioTower}
              label="Sensor Faults"
              value={faultEvents}
              detail="Ground Truth: sensor_fault"
              tone="blue"
            />
          </section>

          <section className="truth-ai-grid">
            <div className="panel event-panel">
              <p className="eyebrow">ground truth event</p>
              <h2>{selectedNode ? `${selectedNode.id}: ${groundTruthEvent}` : 'No CSV frame loaded'}</h2>
              <span>Visualization status is derived from the dataset label only.</span>
            </div>
            <div className="panel event-panel">
              <p className="eyebrow">ai prediction</p>
              <h2>{simulation.mlConnected ? 'AI Connected' : 'AI Service Offline'}</h2>
              <span>
                {selectedNode
                  ? `AI Prediction: ${selectedNode.aiPrediction?.prediction ?? 'Not connected'} | Risk: ${formatRisk(selectedNode.aiPrediction)} | Anomaly: ${
                      selectedNode.aiPrediction?.anomaly === null || selectedNode.aiPrediction?.anomaly === undefined
                        ? 'Unknown'
                        : selectedNode.aiPrediction.anomaly
                          ? 'Yes'
                          : 'No'
                    }`
                  : 'The ground-truth label is not being used as an ML prediction.'}
              </span>
            </div>
          </section>

          <section className="content-grid">
            <div className="panel mesh-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">16-node underground sensor mesh</p>
                  <h2>4x4 Node Visualization</h2>
                </div>
                <StatusLegend />
              </div>
              <SensorMesh nodes={nodesWithPredictions} selectedNodeId={selectedNode?.id} onSelectNode={setSelectedNodeId} />
            </div>

            <SelectedNodePanel node={selectedNode} />

            <div className="panel map-panel">
              <div className="panel-header">
                <div>
                  <p className="eyebrow">mine deformation visualization</p>
                  <h2>Coordinate Deformation View</h2>
                </div>
                <div className="live-pill">
                  <Activity size={14} />
                  CSV Replay
                </div>
              </div>
              <DeformationMap nodes={nodesWithPredictions} selectedNode={selectedNode} />
            </div>

            <AlertsPanel alerts={currentAlerts} />
          </section>

          <HistoricalCharts data={chartData} />
        </main>
      </div>
    </div>
  );
}
