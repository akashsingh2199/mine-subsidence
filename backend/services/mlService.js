import axios from 'axios';

const featureKeys = [
  'tilt_magnitude_deg',
  'tilt_rate_deg_per_min',
  'vibration_rms_g',
  'dominant_frequency_hz',
  'displacement_mm',
  'displacement_rate_mm_per_min',
  'crack_event',
  'crack_opening_mm'
];

export class MlService {
  constructor(baseUrl) {
    this.client = axios.create({
      baseURL: baseUrl,
      timeout: 3000
    });
  }

  async health() {
    try {
      const response = await this.client.get('/health');
      return Boolean(response.data?.model_loaded);
    } catch {
      return false;
    }
  }

  async predictNode(node) {
    const payload = featureKeys.reduce((features, key) => {
      features[key] = Number(node.sensor_data[key] ?? 0);
      return features;
    }, {});

    const response = await this.client.post('/predict', payload);
    return response.data;
  }

  offlinePrediction() {
    return {
      prediction: 'AI Service Offline',
      probabilities: {},
      anomaly: null,
      risk_probability: null,
      risk_threshold: null,
      final_status: 'AI Service Offline'
    };
  }
}
