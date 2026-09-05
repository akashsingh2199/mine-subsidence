import mongoose from 'mongoose';

const sensorReadingSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, trim: true, index: true },
  timestamp: { type: Date, required: true, index: true },
  tilt_roll_deg: { type: Number, required: true },
  tilt_pitch_deg: { type: Number, required: true },
  tilt_magnitude_deg: { type: Number, required: true },
  tilt_rate_deg_per_min: { type: Number, required: true },
  vibration_rms_g: { type: Number, required: true },
  dominant_frequency_hz: { type: Number, required: true },
  displacement_mm: { type: Number, required: true },
  displacement_rate_mm_per_min: { type: Number, required: true },
  crack_event: { type: Number, required: true },
  crack_opening_mm: { type: Number, required: true },
  battery_v: { type: Number, required: true },
  rssi_dbm: { type: Number, required: true },
  packet_loss_rate: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const SensorReading = mongoose.model('SensorReading', sensorReadingSchema);
