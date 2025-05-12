import { Router, Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { analyzeBookmarkWithLLM } from '../services/llm';
import { exportBookmarks } from '../services/export';
import rateLimit from 'express-rate-limit';

const prisma = new PrismaClient();
const router = Router();

// Rate limiting for quick bookmarks
const quickBookmarkLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // max 50 requests per windowMs
  message: 'Too many bookmark requests, please try again later'
});

// POST /api/bookmarks/quick - Quick bookmark endpoint for mobile
router.post('/quick', quickBookmarkLimiter, async (req: Request, res: Response) => {
  try {
    console.log('Quick bookmark received:', {
      ...req.body,
      ip: req.ip,
      userAgent: req.headers['user-agent']
    });
    
    const { url, title, source = 'android', text } = req.body;
    
    // Validation
    if (!url) {
      return res.status(400).json({ 
        error: 'URL is required',
        code: 'MISSING_URL' 
      });
    }
    
    // Normalize URL
    let normalizedUrl = url;
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      normalizedUrl = `https://${url}`;
    }
    
    // Validate URL
    try {
      new URL(normalizedUrl);
    } catch (e) {
      return res.status(400).json({ 
        error: 'Invalid URL format',
        code: 'INVALID_URL' 
      });
    }
    
    // Prepare data for analysis
    const bookmarkData = {
      link: normalizedUrl,
      title: title || text || normalizedUrl,
      source: source,
      timestamp: new Date().toISOString()
    };
    
    // Analyze with LLM
    const analyzed = await analyzeBookmarkWithLLM(bookmarkData);
    
    // Save bookmark
    const bookmark = await prisma.bookmark.create({
      data: {
        title: analyzed.title || bookmarkData.title,
        category: analyzed.category || 'Uncategorized',
        group: analyzed.group,
        status: analyzed.status || 'Do przeczytania',
        link: analyzed.link || normalizedUrl,
        summary: analyzed.summary || '',
        dateAdded: new Date(),
        tags: {
          connectOrCreate: (analyzed.tags || []).map((tag: string) => ({
            where: { name: tag },
            create: { name: tag }
          }))
        },
        folder: analyzed.suggestedFolder ? {
          connectOrCreate: {
            where: { name: analyzed.suggestedFolder },
            create: { name: analyzed.suggestedFolder }
          }
        } : undefined
      },
      include: {
        tags: true,
        folder: true
      }
    });
    
    // Return success with additional information
    res.status(201).json({ 
      success: true,
      message: 'Bookmark saved successfully',
      bookmark: {
        id: bookmark.id,
        title: bookmark.title,
        url: bookmark.link,
        category: bookmark.category,
        tags: bookmark.tags.map(t => t.name)
      }
    });
  } catch (err: any) {
    console.error('Error in quick bookmark:', err);
    
    // More detailed error handling
    if (err.code === 'P2002') {
      return res.status(409).json({ 
        error: 'Bookmark already exists',
        code: 'DUPLICATE_BOOKMARK' 
      });
    }
    
    res.status(500).json({ 
      error: err.message || 'Internal server error',
      code: 'SERVER_ERROR'
    });
  }
});

// POST /api/bookmarks - dodawanie zakładki
router.post('/', async (req, res) => {
  try {
    console.log('Received data:', JSON.stringify(req.body, null, 2));
    
    let { tags, folder, ...bookmarkData } = req.body;
    
    // Przygotuj obiekt z danymi do utworzenia zakładki
    const createData: any = { ...bookmarkData };
    
    // Jeśli podano folder, znajdź go lub utwórz
    if (folder) {
      // Obsługa różnych formatów folderu
      if (typeof folder === 'string') {
        createData.folder = {
          connectOrCreate: {
            where: { name: folder },
            create: { name: folder }
          }
        };
      } else if (folder && typeof folder === 'object' && folder.name) {
        createData.folder = {
          connectOrCreate: {
            where: { name: folder.name },
            create: { name: folder.name }
          }
        };
      }
    }
    
    // Jeśli podano tagi, znajdź je lub utwórz
    if (tags) {
      // Obsługa różnych formatów tagów (tablica obiektów lub tablica stringów)
      if (Array.isArray(tags)) {
        // Przekształć dane do właściwego formatu
        const tagNames = tags.map(tag => {
          if (typeof tag === 'string') {
            return tag;
          } else if (typeof tag === 'object' && tag.name) {
            return tag.name;
          }
          return null;
        }).filter(tag => tag !== null);
        
        createData.tags = {
          connectOrCreate: tagNames.map((tagName: string) => ({
            where: { name: tagName },
            create: { name: tagName }
          }))
        };
      }
    }
    
    console.log('Processed data:', JSON.stringify(createData, null, 2));
    
    const bookmark = await prisma.bookmark.create({
      data: createData,
      include: {
        tags: true,
        folder: true
      }
    });
    
    res.status(201).json(bookmark);
  } catch (err: any) {
    console.error('Error creating bookmark:', err.message);
    res.status(400).json({ error: err.message });
  }
});

// GET /api/bookmarks - pobieranie listy zakładek
router.get('/', async (req, res) => {
  try {
    const { tag, folder, status, search } = req.query;
    
    // Przygotuj obiekt filtrów
    const where: any = {};
    
    // Filtrowanie po statusie
    if (status) {
      where.status = status;
    }
    
    // Filtrowanie po folderze
    if (folder) {
      where.folder = { name: folder };
    }
    
    // Filtrowanie po tagu
    if (tag) {
      where.tags = { some: { name: tag } };
    }
    
    // Wyszukiwanie
    if (search) {
      where.OR = [
        { title: { contains: search as string } },
        { summary: { contains: search as string } },
        { category: { contains: search as string } },
        { group: { contains: search as string } }
      ];
    }
    
    const bookmarks = await prisma.bookmark.findMany({
      where,
      orderBy: { dateAdded: 'desc' },
      include: {
        tags: true,
        folder: true
      }
    });
    
    res.json(bookmarks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// WAŻNE: Ścieżki z pełnymi nazwami muszą być zdefiniowane PRZED :id
// Inaczej Express będzie próbował dopasować "export" jako :id

// GET /api/bookmarks/export?format=json|csv - eksport zakładek
router.get('/export', async (req, res) => {
  try {
    const format = req.query.format === 'csv' ? 'csv' : 'json';
    const exported = await exportBookmarks(format);
    if (format === 'csv') {
      res.header('Content-Type', 'text/csv');
      res.attachment('bookmarks.csv');
      res.send(exported);
    } else {
      res.header('Content-Type', 'application/json');
      res.attachment('bookmarks.json');
      res.send(exported);
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/bookmarks/analyze - analiza zakładki przez LLM
router.post('/analyze', async (req, res) => {
  try {
    const analyzed = await analyzeBookmarkWithLLM(req.body);
    res.json(analyzed);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// DOPIERO PO PEŁNYCH ŚCIEŻKACH definiujemy endpointy z :id

// GET /api/bookmarks/:id - pobieranie pojedynczej zakładki
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: Number(id) },
      include: {
        tags: true,
        folder: true
      }
    });
    
    if (!bookmark) {
      return res.status(404).json({ error: 'Zakładka nie została znaleziona' });
    }
    
    res.json(bookmark);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/bookmarks/:id - aktualizacja zakładki
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { tags, folder, ...bookmarkData } = req.body;
    
    // Przygotuj obiekt z danymi do aktualizacji
    const updateData: any = { ...bookmarkData };
    
    // Jeśli podano folder, znajdź go lub utwórz
    if (folder) {
      updateData.folder = {
        connectOrCreate: {
          where: { name: folder },
          create: { name: folder }
        }
      };
    } else if (folder === null) {
      // Jeśli folder to null, odłącz folder
      updateData.folder = { disconnect: true };
    }
    
    // Jeśli podano tagi, zaktualizuj je
    if (tags && Array.isArray(tags)) {
      // Najpierw odłącz wszystkie tagi
      await prisma.bookmark.update({
        where: { id: Number(id) },
        data: {
          tags: {
            set: []
          }
        }
      });
      
      // Następnie połącz lub utwórz nowe tagi
      updateData.tags = {
        connectOrCreate: tags.map((tag: string) => ({
          where: { name: tag },
          create: { name: tag }
        }))
      };
    }
    
    const bookmark = await prisma.bookmark.update({
      where: { id: Number(id) },
      data: updateData,
      include: {
        tags: true,
        folder: true
      }
    });
    
    res.json(bookmark);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/bookmarks/:id - usuwanie zakładki
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // Sprawdź czy zakładka istnieje
    const bookmark = await prisma.bookmark.findUnique({
      where: { id: Number(id) },
      include: {
        tags: true
      }
    });

    if (!bookmark) {
      return res.status(404).json({ error: 'Bookmark not found' });
    }

    // Użyj transakcji do bezpiecznego usunięcia
    await prisma.$transaction(async (tx) => {
      // Najpierw odłącz wszystkie tagi
      await tx.bookmark.update({
        where: { id: Number(id) },
        data: {
          tags: {
            set: []
          }
        }
      });

      // Usuń zakładkę
      await tx.bookmark.delete({
        where: { id: Number(id) }
      });
    });

    res.status(204).send();
  } catch (err: any) {
    console.error('Error deleting bookmark:', err);
    
    // Obsługa różnych typów błędów
    if (err.code === 'P2025') {
      return res.status(404).json({ error: 'Bookmark not found' });
    }
    
    if (err.code === 'P2003') {
      return res.status(400).json({ error: 'Cannot delete bookmark due to existing references' });
    }
    
    res.status(500).json({ 
      error: 'Failed to delete bookmark',
      details: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
});

export default router; 