import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import bookmarksRouter from './routes/bookmarks';
import tagsRouter from './routes/tags';
import foldersRouter from './routes/folders';

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

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