require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db');
const feedRoutes = require('./routes/feed');

const app = express();
const server = http.createServer(app);

// ─── Socket.IO setup ──────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  'http://localhost:3000',
];

const io = new Server(server, {
  cors: {
    origin: (origin, cb) => {
      // allow requests with no origin (curl, Postman) or matching origin
      if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    methods: ['GET', 'POST'],
  },
  // Prevent duplicate events: client-side dedup by event ID recommended
  connectionStateRecovery: {
    maxDisconnectionDuration: 2 * 60 * 1000, // 2 min recovery window
    skipMiddlewares: true,
  },
});

// Track connected clients count (optional: expose via health endpoint)
let connectedClients = 0;

io.on('connection', (socket) => {
  connectedClients++;
  console.log(`🔌 Client connected [${socket.id}] — Total: ${connectedClients}`);

  socket.on('disconnect', (reason) => {
    connectedClients--;
    console.log(`🔌 Client disconnected [${socket.id}] reason: ${reason} — Total: ${connectedClients}`);
  });

  // Heartbeat ping/pong to detect stale connections
  socket.on('ping_server', () => {
    socket.emit('pong_server', { ts: Date.now() });
  });
});

// Make io accessible in route handlers via req.app.get('io')
app.set('io', io);

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
}));
app.use(express.json());

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/feed', feedRoutes);

app.get('/health', (req, res) => {
  res.json({ status: 'ok', clients: connectedClients, time: new Date().toISOString() });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({ success: false, message: 'Internal server error' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(`🚀 SyncUp backend running on http://localhost:${PORT}`);
  });
});
