import { Router } from 'express';
import { isDatabaseConnected } from '../config/database.js';
import { SensorReading } from '../models/SensorReading.js';
import { Prediction } from '../models/Prediction.js';
import { Alert } from '../models/Alert.js';
import { Node } from '../models/Node.js';

const MAX_LIMIT = 100;

function requireDatabase(_request, response, next) {
  if (!isDatabaseConnected()) {
    response.status(503).json({ error: 'MongoDB is temporarily unavailable.' });
    return;
  }
  next();
}

function listRoute(Model) {
  return async (request, response, next) => {
    try {
      const parsedLimit = Number(request.query.limit ?? 50);
      if (!Number.isInteger(parsedLimit) || parsedLimit < 1 || parsedLimit > MAX_LIMIT) {
        response.status(400).json({ error: `limit must be an integer between 1 and ${MAX_LIMIT}.` });
        return;
      }

      const query = {};
      if (request.query.nodeId) query.nodeId = request.query.nodeId;
      const records = await Model.find(query).sort({ timestamp: -1, createdAt: -1 }).limit(parsedLimit).lean();
      response.json(records);
    } catch (error) {
      next(error);
    }
  };
}

function createRoute(Model) {
  return async (request, response, next) => {
    try {
      const record = await Model.create(request.body);
      response.status(201).json(record);
    } catch (error) {
      if (error.name === 'ValidationError' || error.name === 'CastError') {
        response.status(400).json({ error: error.message });
        return;
      }
      next(error);
    }
  };
}

export function createDataRouter() {
  const router = Router();
  router.use(requireDatabase);
  router.get('/nodes', listRoute(Node));
  router.get('/readings', listRoute(SensorReading));
  router.get('/predictions', listRoute(Prediction));
  router.get('/alerts', listRoute(Alert));
  router.post('/readings', createRoute(SensorReading));
  router.post('/predictions', createRoute(Prediction));
  router.post('/alerts', createRoute(Alert));
  return router;
}
