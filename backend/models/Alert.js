import mongoose from 'mongoose';

const alertSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, trim: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  alertType: { type: String, required: true, trim: true },
  severity: { type: String, required: true, trim: true },
  message: { type: String, required: true, trim: true },
  acknowledged: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const Alert = mongoose.model('Alert', alertSchema);
