import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { io } from 'socket.io-client';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5001';
const SEEK_DEBOUNCE_MS = 60;
const SEEK_CONFIRM_TIMEOUT_MS = 1500; // safety valve: unblock frames even if backend never confirms the seek

function statusFromGroundTruth(label) {
  const normalized = String(label ?? '').toLowerCase();
  if (normalized === 'sensor_fault' || normalized.includes('fault')) return 'Sensor Fault';
  if (normalized === 'active_subsidence' || normalized.includes('active')) return 'Active Subsidence';
  if (normalized === 'early_subsidence' || normalized.includes('early')) return 'Early Subsidence';
  return 'Normal';
}

function adaptNode(node) {
  const sensor = node.sensor_data ?? {};
  return {
    id: node.node_id,
    node_id: node.node_id,
    x: node.x_m,
    y: node.y_m,
    x_m: node.x_m,
    y_m: node.y_m,
    sensor_data: sensor,
    groundTruth: node.ground_truth,
    ground_truth: node.ground_truth,
    status: statusFromGroundTruth(node.ground_truth),
    aiPrediction: node.ai_prediction ?? null,
    tilt_roll_deg: sensor.tilt_roll_deg,
    tilt_pitch_deg: sensor.tilt_pitch_deg,
    tilt_magnitude_deg: sensor.tilt_magnitude_deg,
    tilt_rate_deg_per_min: sensor.tilt_rate_deg_per_min,
    vibration_rms_g: sensor.vibration_rms_g,
    dominant_frequency_hz: sensor.dominant_frequency_hz,
    displacement_mm: sensor.displacement_mm,
    displacement_rate_mm_per_min: sensor.displacement_rate_mm_per_min,
    crack_event: sensor.crack_event,
    crack_opening_mm: sensor.crack_opening_mm,
    battery_v: sensor.battery_v,
    rssi_dbm: sensor.rssi_dbm,
    packet_loss_rate: sensor.packet_loss_rate,
    displacement: sensor.displacement_mm,
    displacementRate: sensor.displacement_rate_mm_per_min,
    tilt: sensor.tilt_magnitude_deg,
    tiltRate: sensor.tilt_rate_deg_per_min,
    vibration: sensor.vibration_rms_g,
    dominantFrequency: sensor.dominant_frequency_hz,
    crackEvent: sensor.crack_event,
    crackOpening: sensor.crack_opening_mm,
    battery: sensor.battery_v,
    rssi: sensor.rssi_dbm,
    packetLoss: sensor.packet_loss_rate
  };
}

function historyPoint(timestamp, node) {
  return {
    time: new Date(timestamp).toLocaleString([], {
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }),
    displacement: node.displacement,
    vibration: node.vibration,
    tilt: node.tilt,
    crack: node.crackOpening
  };
}

export function useSocketSimulation() {
  const socketRef = useRef(null);
  const seekDebounceTimerRef = useRef(null);
  const seekConfirmTimerRef = useRef(null);
  const pendingSeekIndexRef = useRef(null);
  const [socketConnected, setSocketConnected] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState({
    running: false,
    speed: 5,
    currentIndex: 0,
    totalTimestamps: 0,
    timestamp: null
  });
  const [frame, setFrame] = useState(null);
  const [historyByNode, setHistoryByNode] = useState({});
  const statusRef = useRef(status);

  useEffect(() => {
    statusRef.current = status;
  }, [status]);

  // Clears the "waiting for backend to confirm this seek" lock, with or without
  // a matching frame having arrived. Without this, a single lost/mismatched
  // confirmation would permanently block every future frame update.
  const clearPendingSeek = useCallback(() => {
    pendingSeekIndexRef.current = null;
    clearTimeout(seekConfirmTimerRef.current);
    seekConfirmTimerRef.current = null;
  }, []);

  useEffect(() => {
    const socket = io(BACKEND_URL, {
      transports: ['websocket', 'polling']
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setSocketConnected(true);
      setError('');
    });

    socket.on('disconnect', () => {
      setSocketConnected(false);
      setError('Socket.IO disconnected. CSV replay will resume when Node.js is reachable.');
    });

    socket.on('simulation:status', (nextStatus) => {
      const pendingIndex = pendingSeekIndexRef.current;
      const nextState = pendingIndex === null
        ? nextStatus
        : { ...nextStatus, running: false, currentIndex: pendingIndex };
      statusRef.current = nextState;
      setStatus(nextState);
    });

    socket.on('simulation:error', (payload) => {
      setError(payload?.message ?? 'Simulation error');
    });

    socket.on('simulation:frame', (nextFrame) => {
      const pendingIndex = pendingSeekIndexRef.current;
      if (pendingIndex !== null && nextFrame.currentIndex !== pendingIndex) return;

      const nodes = (nextFrame.nodes ?? []).map(adaptNode);
      const adaptedFrame = { ...nextFrame, nodes };
      setFrame(adaptedFrame);
      setStatus((current) => ({
        ...current,
        currentIndex: nextFrame.currentIndex ?? current.currentIndex,
        totalTimestamps: nextFrame.totalTimestamps ?? current.totalTimestamps,
        timestamp: nextFrame.timestamp ?? current.timestamp
      }));
      statusRef.current = {
        ...statusRef.current,
        currentIndex: nextFrame.currentIndex ?? statusRef.current.currentIndex,
        totalTimestamps: nextFrame.totalTimestamps ?? statusRef.current.totalTimestamps,
        timestamp: nextFrame.timestamp ?? statusRef.current.timestamp
      };

      if (pendingIndex !== null && nextFrame.currentIndex === pendingIndex) {
        clearPendingSeek();
      }

      setHistoryByNode((current) => {
        const next = { ...current };
        nodes.forEach((node) => {
          next[node.id] = [...(next[node.id] ?? []), historyPoint(nextFrame.timestamp, node)].slice(-120);
        });
        return next;
      });
    });

    return () => {
      clearTimeout(seekDebounceTimerRef.current);
      clearTimeout(seekConfirmTimerRef.current);
      socket.disconnect();
    };
  }, [clearPendingSeek]);

  const controls = useMemo(
    () => ({
      start: () => {
        clearTimeout(seekDebounceTimerRef.current);
        const startIndex =
          pendingSeekIndexRef.current === null ? statusRef.current.currentIndex : pendingSeekIndexRef.current;
        clearPendingSeek();
        socketRef.current?.emit('simulation:start', startIndex);
      },
      pause: () => socketRef.current?.emit('simulation:pause'),
      reset: () => {
        clearTimeout(seekDebounceTimerRef.current);
        clearPendingSeek();
        setHistoryByNode({});
        socketRef.current?.emit('simulation:reset');
      },
      setSpeed: (speed) => socketRef.current?.emit('simulation:speed', speed),
      setCurrentIndex: (index) => {
        const nextIndex = Math.max(0, Math.min(Number(index), Math.max(statusRef.current.totalTimestamps - 1, 0)));

        pendingSeekIndexRef.current = nextIndex;

        if (statusRef.current.running) {
          socketRef.current?.emit('simulation:pause');
          statusRef.current = { ...statusRef.current, running: false };
        }

        // Optimistic local update so the slider itself is always instantly responsive,
        // regardless of round-trip time to the backend.
        statusRef.current = { ...statusRef.current, currentIndex: nextIndex };
        setStatus((current) => ({
          ...current,
          running: false,
          currentIndex: nextIndex
        }));

        clearTimeout(seekDebounceTimerRef.current);
        seekDebounceTimerRef.current = setTimeout(() => {
          socketRef.current?.emit('simulation:seek', nextIndex);

          // Safety valve: if the backend never sends back a frame matching this
          // exact index (lost message, off-by-one, dropped while paused, or a
          // newer drag superseded it), stop blocking future frames after a timeout
          // instead of freezing forever.
          clearTimeout(seekConfirmTimerRef.current);
          seekConfirmTimerRef.current = setTimeout(() => {
            if (pendingSeekIndexRef.current === nextIndex) {
              clearPendingSeek();
            }
          }, SEEK_CONFIRM_TIMEOUT_MS);
        }, SEEK_DEBOUNCE_MS);
      },
      jumpToDay: (day) => socketRef.current?.emit('simulation:jump-day', day)
    }),
    [clearPendingSeek]
  );

  const getNodeHistory = useCallback((nodeId) => historyByNode[nodeId] ?? [], [historyByNode]);

  return {
    socketConnected,
    error,
    currentFrame: frame,
    currentIndex: status.currentIndex,
    frameCount: status.totalTimestamps,
    isPlaying: status.running,
    speed: status.speed,
    metadata: {
      frameCount: status.totalTimestamps,
      nodeCount: frame?.nodes?.length ?? 0,
      readingCount: status.totalTimestamps * 16,
      panelId: frame?.panel_id ?? 'PANEL_A'
    },
    mlConnected: Boolean(frame?.mlService),
    controls,
    getNodeHistory
  };
}