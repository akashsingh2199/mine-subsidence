import mongoose from 'mongoose';

const nodeSchema = new mongoose.Schema({
  nodeId: { type: String, required: true, unique: true, trim: true },
  x: { type: Number, required: true },
  y: { type: Number, required: true },
  status: { type: String, required: true, trim: true },
  lastSeen: { type: Date, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { versionKey: false });

export const Node = mongoose.model('Node', nodeSchema);
