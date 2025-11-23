import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { songsRouter } from './routes/songs';
import { initDatabase } from './db/database';

const app = express();
const PORT = parseInt(process.env.PORT || '3001', 10);
const upload = multer({ dest: 'uploads/' });

// Middleware
// CORS configuration - allows both development and production origins
const allowedOrigins = [
  // Development origins
  'http://localhost:8081',
  'http://localhost:19006',
  'http://localhost:3000',
  'http://localhost:19000',
  'http://127.0.0.1:8081',
  'http://127.0.0.1:19006',
  'http://127.0.0.1:3000',
  'http://127.0.0.1:19000',
  'http://192.168.5.24:8081',
  'http://192.168.5.24:19006',
  'http://192.168.5.24:3000',
  'http://192.168.5.24:19000',
  // Production origins from environment variable
  ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  // Allow all localhost origins for development
  /^http:\/\/localhost:\d+$/,
  /^http:\/\/127\.0\.0\.1:\d+$/,
  // Allow all local network IPs for Android devices
  /^http:\/\/192\.168\.\d+\.\d+:\d+$/,
  /^http:\/\/10\.\d+\.\d+\.\d+:\d+$/,
  // Allow Railway domains (HTTPS)
  /^https:\/\/.*\.railway\.app$/,
  // Allow custom domains (if set)
  ...(process.env.CUSTOM_DOMAIN ? [process.env.CUSTOM_DOMAIN] : []),
];

// In production, allow all origins if FRONTEND_URL is not set (for flexibility)
// In development, use the specific list
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' && !process.env.FRONTEND_URL
    ? true // Allow all origins in production if FRONTEND_URL not set
    : (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
        // Allow requests with no origin (mobile apps, Postman, etc.)
        if (!origin) return callback(null, true);
        
        // Check if origin matches any allowed pattern
        const isAllowed = allowedOrigins.some(allowed => {
          if (typeof allowed === 'string') {
            return origin === allowed;
          } else if (allowed instanceof RegExp) {
            return allowed.test(origin);
          }
          return false;
        });
        
        callback(null, isAllowed);
      },
  credentials: true,
};

app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database
initDatabase();

// API Info endpoint
app.get('/api/info', (req, res) => {
  res.json({
    name: 'My Songbook API',
    version: '1.0.2',
    status: 'running',
    timestamp: new Date().toISOString(),
    endpoints: {
      health: '/health',
      songs: '/api/songs',
      ocr: '/api/ocr',
      info: '/api/info'
    }
  });
});

// Routes
app.use('/api/songs', songsRouter);

// OCR endpoint
app.post('/api/ocr', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file provided' });
    }

    const { ocrService } = await import('./services/ocrService');
    const extractedText = await ocrService.extractText(req.file.path, req.file.mimetype);

    res.json({ text: extractedText });
  } catch (error) {
    console.error('OCR error:', error);
    res.status(500).json({ error: 'Failed to extract text' });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok',
    version: '1.0.2',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    }
  });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server running on http://0.0.0.0:${PORT}`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`   Accessible at http://localhost:${PORT}`);
    console.log(`   Accessible at http://192.168.5.24:${PORT}`);
  } else {
    console.log(`   Production mode - accessible via Railway domain`);
  }
});

