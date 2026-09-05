import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const datasetPath = path.resolve(__dirname, '../../data/synthetic_mine_subsidence_mesh.csv');

const requiredNodeIds = Array.from({ length: 16 }, (_, index) => `N${String(index + 1).padStart(3, '0')}`);
const validSpeeds = new Set([1, 5, 10, 30]);
const frameDelayBySpeed = {
  1: 900,
  5: 360,
  10: 220,
  30: 90
};

const sensorFields = [
  'tilt_roll_deg',
  'tilt_pitch_deg',
  'tilt_magnitude_deg',
  'tilt_rate_deg_per_min',
  'vibration_rms_g',
  'dominant_frequency_hz',
  'displacement_mm',
  'displacement_rate_mm_per_min',
  'crack_event',
  'crack_opening_mm',
  'battery_v',
  'rssi_dbm',
  'packet_loss_rate'
];

function parseCsv(text) {
  const rows = [];
  let field = '';
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const nextChar = text[index + 1];

    if (char === '"' && inQuotes && nextChar === '"') {
      field += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      row.push(field);
      field = '';
    } else if ((char === '\n' || char === '\r') && !inQuotes) {
      if (char === '\r' && nextChar === '\n') index += 1;
      row.push(field);
      if (row.some((value) => value.trim() !== '')) rows.push(row);
      field = '';
      row = [];
    } else {
      field += char;
    }
  }

  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }

  const headers = rows[0]?.map((header) => header.trim()) ?? [];
  return rows.slice(1).map((values) =>
    headers.reduce((record, header, index) => {
      record[header] = values[index]?.trim() ?? '';
      return record;
    }, {})
  );
}

function toNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeNode(record) {
  const sensorData = sensorFields.reduce((data, field) => {
    data[field] = toNumber(record[field]);
    return data;
  }, {});

  return {
    node_id: record.node_id,
    x_m: toNumber(record.x_m),
    y_m: toNumber(record.y_m),
    panel_id: record.panel_id,
    sensor_data: sensorData,
    ground_truth: record.label ?? ''
  };
}

function createFrames(records) {
  const grouped = new Map();

  records.forEach((record) => {
    if (!record.timestamp || !record.node_id) return;
    if (!grouped.has(record.timestamp)) grouped.set(record.timestamp, []);
    grouped.get(record.timestamp).push(normalizeNode(record));
  });

  return [...grouped.entries()]
    .map(([timestamp, nodes]) => {
      const byNodeId = new Map(nodes.map((node) => [node.node_id, node]));
      if (!requiredNodeIds.every((nodeId) => byNodeId.has(nodeId))) return null;

      const orderedNodes = requiredNodeIds.map((nodeId) => byNodeId.get(nodeId));
      return {
        timestamp,
        timestampMs: Date.parse(timestamp),
        panel_id: orderedNodes[0]?.panel_id ?? 'PANEL_A',
        nodes: orderedNodes
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.timestampMs - b.timestampMs);
}

export class CsvSimulator {
  constructor({ io, mlService }) {
    this.io = io;
    this.mlService = mlService;
    this.frames = [];
    this.currentIndex = 0;
    this.running = false;
    this.speed = 5;
    this.timer = null;
    this.lastError = '';
    this.seekVersion = 0;
  }

  load() {
    if (!fs.existsSync(datasetPath)) {
      this.lastError = `CSV not found at ${datasetPath}`;
      throw new Error(this.lastError);
    }

    const csv = fs.readFileSync(datasetPath, 'utf8');
    this.frames = createFrames(parseCsv(csv));
    if (!this.frames.length) {
      this.lastError = 'CSV loaded, but no complete 16-node frames were found.';
      throw new Error(this.lastError);
    }
  }

  get totalTimestamps() {
    return this.frames.length;
  }

  get currentFrame() {
    return this.frames[this.currentIndex] ?? null;
  }

  getStatus() {
    return {
      running: this.running,
      speed: this.speed,
      currentIndex: this.currentIndex,
      totalTimestamps: this.totalTimestamps,
      timestamp: this.currentFrame?.timestamp ?? null,
      error: this.lastError
    };
  }

  emitStatus() {
    this.io.emit('simulation:status', this.getStatus());
  }

  async buildFrame() {
    const frameIndex = this.currentIndex;
    const frame = this.frames[frameIndex] ?? null;
    if (!frame) return null;

    const mlConnected = await this.mlService.health();
    const nodes = await Promise.all(
      frame.nodes.map(async (node) => {
        try {
          const aiPrediction = mlConnected ? await this.mlService.predictNode(node) : this.mlService.offlinePrediction();
          return { ...node, ai_prediction: aiPrediction };
        } catch {
          return { ...node, ai_prediction: this.mlService.offlinePrediction() };
        }
      })
    );

    return {
      timestamp: frame.timestamp,
      panel_id: frame.panel_id,
      mlService: mlConnected,
      currentIndex: frameIndex,
      totalTimestamps: this.totalTimestamps,
      nodes
    };
  }

  async emitFrame() {
    try {
      const frame = await this.buildFrame();
      if (frame) this.io.emit('simulation:frame', frame);
      this.emitStatus();
    } catch (error) {
      this.io.emit('simulation:error', { message: error.message });
    }
  }

  scheduleNext() {
    clearTimeout(this.timer);
    if (!this.running) return;

    this.timer = setTimeout(async () => {
      if (this.currentIndex < this.totalTimestamps - 1) {
        this.currentIndex += 1;
      } else {
        this.running = false;
      }
      await this.emitFrame();
      this.scheduleNext();
    }, frameDelayBySpeed[this.speed]);
  }

  async start() {
    this.seekVersion += 1;
    this.running = true;
    await this.emitFrame();
    this.scheduleNext();
  }

  async pause() {
    this.running = false;
    clearTimeout(this.timer);
    this.emitStatus();
  }

  async reset() {
    this.running = false;
    clearTimeout(this.timer);
    this.seekVersion += 1;
    this.currentIndex = 0;
    await this.emitFrame();
  }

  async seek(index) {
    const nextIndex = Number(index);
    if (!Number.isInteger(nextIndex) || nextIndex < 0 || nextIndex >= this.totalTimestamps) {
      throw new Error(`Index must be between 0 and ${Math.max(this.totalTimestamps - 1, 0)}.`);
    }

    this.running = false;
    clearTimeout(this.timer);
    this.currentIndex = nextIndex;
    const seekVersion = ++this.seekVersion;
    this.emitStatus();
    const frame = await this.buildFrame();
    if (seekVersion !== this.seekVersion) return;
    if (frame) this.io.emit('simulation:frame', frame);
    this.emitStatus();
  }

  async seekToDay(day) {
    const targetDay = Number(day);
    if (!Number.isInteger(targetDay)) throw new Error('Day must be an integer.');

    const index = this.frames.findIndex((frame) => new Date(frame.timestamp).getUTCDate() === targetDay);
    if (index === -1) throw new Error(`No timestamp found for day ${targetDay}.`);
    await this.seek(index);
  }

  async setSpeed(speed) {
    const nextSpeed = Number(speed);
    if (!validSpeeds.has(nextSpeed)) {
      throw new Error('Speed must be one of 1, 5, 10, 30.');
    }
    this.speed = nextSpeed;
    this.emitStatus();
    this.scheduleNext();
  }
}
