import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import helmet from 'helmet';
import bookmarksRouter from './routes/bookmarks';
import tagsRouter from './routes/tags';
import foldersRouter from './routes/folders';

dotenv.config();

const app = express();

// Improved CORS configuration
const allowedOrigins = [
  'https://bookmarks.twoja-domena.com',
  'http://localhost:3000',
  'http://localhost:5173' // Vite dev server
];

app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) === -1) {
      const msg = `The CORS policy for this site does not allow access from the specified origin: ${origin}`;
      return callback(new Error(msg), false);
    }
    return callback(null, true);
  },
  credentials: true
}));

// Add security middleware
app.use(helmet());

// Increase JSON payload limit for larger bookmarks
app.use(express.json({ limit: '2mb' }));

// Routery
app.use('/api/bookmarks', bookmarksRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/folders', foldersRouter);

// Podstawowy endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Bookmark API',
    version: '1.0.0',
    endpoints: [
      '/api/bookmarks',
      '/api/tags',
      '/api/folders'
    ]
  });
});

export default app; 