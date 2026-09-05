import mongoose from 'mongoose';

let connectionState = 'disconnected';

mongoose.connection.on('connecting', () => {
  connectionState = 'connecting';
});

mongoose.connection.on('connected', () => {
  connectionState = 'connected';
  console.log('MongoDB connected');
});

mongoose.connection.on('disconnected', () => {
  connectionState = 'disconnected';
  console.warn('MongoDB disconnected; database APIs are temporarily unavailable.');
});

mongoose.connection.on('error', (error) => {
  connectionState = 'error';
  console.error(`MongoDB connection error: ${error.message}`);
});

export function getDatabaseStatus() {
  return {
    configured: Boolean(process.env.MONGODB_URI),
    connected: mongoose.connection.readyState === 1,
    state: connectionState
  };
}

export async function connectDatabase() {
  if (!process.env.MONGODB_URI) {
    console.warn('MONGODB_URI is not configured; starting without MongoDB.');
    return false;
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 5000
    });
    return true;
  } catch (error) {
    connectionState = 'error';
    console.error(`MongoDB startup connection failed: ${error.message}`);
    return false;
  }
}

export function isDatabaseConnected() {
  return mongoose.connection.readyState === 1;
}
