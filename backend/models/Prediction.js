import mongoose from 'mongoose';

const predictionSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, trim: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  predictedClass: { type: String, required: true, trim: true },
  anomaly: { type: Boolean, required: true },
  riskScore: { type: Number, required: true, min: 0, max: 1 },
  severity: { type: String, required: true, trim: true },
  modelVersion: { type: String, required: true, trim: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const Prediction = mongoose.model('Prediction', predictionSchema);
