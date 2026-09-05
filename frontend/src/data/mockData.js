export const STATUS_META = {
  Normal: { color: '#29d391', className: 'normal' },
  'Early Subsidence': { color: '#f6c85f', className: 'early' },
  'Active Subsidence': { color: '#ff5c66', className: 'active' },
  'Sensor Fault': { color: '#fb923c', className: 'fault' }
};

export const mineNodes = [
  { id: 'N001', status: 'Normal', displacement: 2.1, tilt: 0.08, vibration: 0.18, crackOpening: 0.4, battery: 94, rssi: -58, packetLoss: 0.7, prediction: 'Stable strata movement', riskProbability: 9, anomaly: 'Clear', lat: 23.348, lng: 85.312 },
  { id: 'N002', status: 'Normal', displacement: 2.7, tilt: 0.1, vibration: 0.23, crackOpening: 0.5, battery: 88, rssi: -61, packetLoss: 1.1, prediction: 'Stable strata movement', riskProbability: 13, anomaly: 'Clear', lat: 23.349, lng: 85.316 },
  { id: 'N003', status: 'Early Subsidence', displacement: 8.8, tilt: 0.42, vibration: 0.44, crackOpening: 1.8, battery: 81, rssi: -66, packetLoss: 2.4, prediction: 'Progressive roof convergence likely', riskProbability: 56, anomaly: 'Anomaly detected', lat: 23.35, lng: 85.32 },
  { id: 'N004', status: 'Normal', displacement: 3.4, tilt: 0.14, vibration: 0.2, crackOpening: 0.6, battery: 90, rssi: -63, packetLoss: 1.6, prediction: 'Stable strata movement', riskProbability: 16, anomaly: 'Clear', lat: 23.351, lng: 85.324 },
  { id: 'N005', status: 'Normal', displacement: 4.2, tilt: 0.16, vibration: 0.26, crackOpening: 0.9, battery: 76, rssi: -68, packetLoss: 2.1, prediction: 'Stable with minor drift', riskProbability: 22, anomaly: 'Clear', lat: 23.344, lng: 85.313 },
  { id: 'N006', status: 'Active Subsidence', displacement: 18.6, tilt: 1.24, vibration: 0.91, crackOpening: 5.9, battery: 68, rssi: -72, packetLoss: 4.8, prediction: 'Critical subsidence acceleration', riskProbability: 91, anomaly: 'High confidence anomaly', lat: 23.345, lng: 85.317 },
  { id: 'N007', status: 'Early Subsidence', displacement: 9.5, tilt: 0.55, vibration: 0.51, crackOpening: 2.2, battery: 84, rssi: -67, packetLoss: 2.9, prediction: 'Watch zone expansion', riskProbability: 63, anomaly: 'Anomaly detected', lat: 23.346, lng: 85.321 },
  { id: 'N008', status: 'Normal', displacement: 3.1, tilt: 0.12, vibration: 0.22, crackOpening: 0.7, battery: 93, rssi: -59, packetLoss: 1, prediction: 'Stable strata movement', riskProbability: 15, anomaly: 'Clear', lat: 23.347, lng: 85.325 },
  { id: 'N009', status: 'Normal', displacement: 5.3, tilt: 0.24, vibration: 0.3, crackOpening: 1.1, battery: 73, rssi: -71, packetLoss: 3, prediction: 'Stable with localized stress', riskProbability: 29, anomaly: 'Clear', lat: 23.34, lng: 85.314 },
  { id: 'N010', status: 'Early Subsidence', displacement: 10.2, tilt: 0.61, vibration: 0.62, crackOpening: 2.7, battery: 79, rssi: -69, packetLoss: 3.6, prediction: 'Possible pillar load redistribution', riskProbability: 66, anomaly: 'Anomaly detected', lat: 23.341, lng: 85.318 },
  { id: 'N011', status: 'Active Subsidence', displacement: 16.9, tilt: 1.05, vibration: 0.82, crackOpening: 4.8, battery: 71, rssi: -75, packetLoss: 5.2, prediction: 'Rapid deformation corridor', riskProbability: 87, anomaly: 'High confidence anomaly', lat: 23.342, lng: 85.322 },
  { id: 'N012', status: 'Sensor Fault', displacement: 0, tilt: 0, vibration: 0, crackOpening: 0, battery: 21, rssi: -91, packetLoss: 38.5, prediction: 'Insufficient sensor confidence', riskProbability: 0, anomaly: 'Sensor diagnostics required', lat: 23.343, lng: 85.326 },
  { id: 'N013', status: 'Normal', displacement: 4.8, tilt: 0.2, vibration: 0.27, crackOpening: 1, battery: 86, rssi: -62, packetLoss: 1.8, prediction: 'Stable strata movement', riskProbability: 25, anomaly: 'Clear', lat: 23.336, lng: 85.315 },
  { id: 'N014', status: 'Normal', displacement: 6.1, tilt: 0.3, vibration: 0.36, crackOpening: 1.4, battery: 82, rssi: -65, packetLoss: 2.2, prediction: 'Stable with minor drift', riskProbability: 34, anomaly: 'Clear', lat: 23.337, lng: 85.319 },
  { id: 'N015', status: 'Early Subsidence', displacement: 11.4, tilt: 0.72, vibration: 0.69, crackOpening: 3.1, battery: 77, rssi: -70, packetLoss: 3.9, prediction: 'Escalating tensile crack trend', riskProbability: 71, anomaly: 'Anomaly detected', lat: 23.338, lng: 85.323 },
  { id: 'N016', status: 'Normal', displacement: 3.7, tilt: 0.18, vibration: 0.24, crackOpening: 0.8, battery: 89, rssi: -64, packetLoss: 1.5, prediction: 'Stable strata movement', riskProbability: 18, anomaly: 'Clear', lat: 23.339, lng: 85.327 }
];

export const systemStatus = {
  health: 'Operational',
  sync: '12 sec ago',
  uptime: '99.98%',
  packetIntegrity: 96.4,
  gateway: 'MQTT-ready edge gateway',
  model: 'mine_subsidence_models.joblib placeholder'
};

export const alerts = [
  { id: 'A-1048', node: 'N006', level: 'Critical', message: 'Displacement exceeded active subsidence threshold', time: '09:42 IST' },
  { id: 'A-1047', node: 'N011', level: 'Critical', message: 'Tilt and crack opening rising together', time: '09:38 IST' },
  { id: 'A-1046', node: 'N015', level: 'Warning', message: 'AI model flagged early deformation signature', time: '09:31 IST' },
  { id: 'A-1045', node: 'N012', level: 'Fault', message: 'High packet loss and low RSSI detected', time: '09:26 IST' },
  { id: 'A-1044', node: 'N003', level: 'Warning', message: 'Roof convergence trend requires inspection', time: '09:12 IST' }
];

export const historicalSeries = [
  { time: '00:00', displacement: 4.2, tilt: 0.18, vibration: 0.22, crack: 0.8, risk: 18 },
  { time: '02:00', displacement: 4.7, tilt: 0.21, vibration: 0.25, crack: 1.0, risk: 23 },
  { time: '04:00', displacement: 5.6, tilt: 0.28, vibration: 0.32, crack: 1.3, risk: 30 },
  { time: '06:00', displacement: 7.9, tilt: 0.44, vibration: 0.46, crack: 1.9, risk: 47 },
  { time: '08:00', displacement: 11.5, tilt: 0.67, vibration: 0.64, crack: 3.0, risk: 66 },
  { time: '10:00', displacement: 15.2, tilt: 0.93, vibration: 0.78, crack: 4.4, risk: 81 },
  { time: '12:00', displacement: 18.6, tilt: 1.24, vibration: 0.91, crack: 5.9, risk: 91 }
];

export const deformationZones = [
  { name: 'North panel', center: [23.349, 85.319], radius: 260, risk: 'moderate' },
  { name: 'Central corridor', center: [23.344, 85.32], radius: 330, risk: 'high' },
  { name: 'South return airway', center: [23.338, 85.322], radius: 230, risk: 'moderate' }
];
