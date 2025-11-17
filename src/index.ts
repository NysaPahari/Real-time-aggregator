// src/index.ts

import express from 'express';
import http from 'http';
import { Server as SocketIOServer } from 'socket.io'; 
import {
  getAggregatedTokens,
  startPolling,
  initAggregationService, // Import the new init function
} from './services/aggregation';
import { applyFilters, applyPagination } from './services/filtering';

const app = express();
const server = http.createServer(app);

const io: SocketIOServer = new SocketIOServer(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST'],
  },
});

const PORT = process.env.PORT || 3001;

// --- NEW ---
// Initialize the aggregation service with the io instance
// This must be done *before* we start polling.
initAggregationService(io);

// Middleware
app.use(express.json());

// --- API Endpoints ---

app.get('/', (req, res) => {
  res.send('Real-time Data Aggregation Service is running!');
});

app.get('/tokens', async (req, res) => {
  try {
    let tokens = await getAggregatedTokens();
    tokens = applyFilters(tokens, req.query as any);
    const paginatedResponse = applyPagination(tokens, req.query as any);
    res.json(paginatedResponse);
  } catch (error) {
    console.error('[Server] Error fetching /tokens:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// --- WebSocket Connection ---

io.on('connection', (socket) => {
  console.log(`[Socket.IO] User connected: ${socket.id}`);

  socket.on('disconnect', () => {
    console.log(`[Socket.IO] User disconnected: ${socket.id}`);
  });
});

// --- Server Startup ---

server.listen(PORT, () => {
  console.log(`[Server] Running on http://localhost:${PORT}`);

  // Now start the background polling
  startPolling();
});

// We no longer need to export 'io'