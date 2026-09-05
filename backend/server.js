import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'node:http';
import { Server } from 'socket.io';
import { createHealthRouter } from './routes/health.js';
import { CsvSimulator } from './services/csvSimulator.js';
import { MlService } from './services/mlService.js';
import { connectDatabase } from './config/database.js';
import { createDataRouter } from './routes/data.js';

const PORT = Number(process.env.PORT || 5001);
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:8001';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: [FRONTEND_URL, 'http://127.0.0.1:5173'],
    methods: ['GET', 'POST']
  }
});

app.use(cors({ origin: [FRONTEND_URL, 'http://127.0.0.1:5173'] }));
app.use(express.json());

const mlService = new MlService(ML_SERVICE_URL);
const simulator = new CsvSimulator({ io, mlService });

try {
  simulator.load();
} catch (error) {
  console.error(error.message);
}

app.use('/api', createHealthRouter(mlService));
app.use('/api', createDataRouter());

app.get('/api/simulation/status', (_request, response) => {
  response.json(simulator.getStatus());
});

app.post('/api/simulation/start', async (_request, response) => {
  await simulator.start();
  response.json(simulator.getStatus());
});

app.post('/api/simulation/pause', async (_request, response) => {
  await simulator.pause();
  response.json(simulator.getStatus());
});

app.post('/api/simulation/reset', async (_request, response) => {
  await simulator.reset();
  response.json(simulator.getStatus());
});

app.post('/api/simulation/seek', async (request, response) => {
  try {
    await simulator.seek(request.body?.index);
    response.json(simulator.getStatus());
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

app.post('/api/simulation/speed', async (request, response) => {
  try {
    await simulator.setSpeed(request.body?.speed);
    response.json(simulator.getStatus());
  } catch (error) {
    response.status(400).json({ error: error.message });
  }
});

io.on('connection', async (socket) => {
  socket.emit('simulation:status', simulator.getStatus());
  const frame = await simulator.buildFrame();
  if (frame) socket.emit('simulation:frame', frame);

  socket.on('simulation:start', async (index) => {
    try {
      if (index !== undefined && index !== null) {
        await simulator.seek(index);
      }
      await simulator.start();
    } catch (error) {
      socket.emit('simulation:error', { message: error.message });
    }
  });
  socket.on('simulation:pause', () => simulator.pause());
  socket.on('simulation:reset', () => simulator.reset());
  socket.on('simulation:seek', (index) => {
    simulator.seek(index).catch((error) => socket.emit('simulation:error', { message: error.message }));
  });
  socket.on('simulation:jump-day', (day) => {
    simulator.seekToDay(day).catch((error) => socket.emit('simulation:error', { message: error.message }));
  });
  socket.on('simulation:speed', (speed) => {
    simulator.setSpeed(speed).catch((error) => socket.emit('simulation:error', { message: error.message }));
  });
});

app.use((error, _request, response, _next) => {
  console.error(`Request failed: ${error.message}`);
  response.status(500).json({ error: 'Internal server error.' });
});

void connectDatabase();

httpServer.listen(PORT, () => {
  console.log(`mine-subsidence-backend listening on http://localhost:${PORT}`);
});
