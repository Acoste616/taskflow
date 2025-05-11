import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { analyzeBookmarkWithLLM } from '../services/llm';
import { exportBookmarks } from '../services/export';

const prisma = new PrismaClient();
const router = Router();

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
    
    // Najpierw odłącz wszystkie tagi
    await prisma.bookmark.update({
      where: { id: Number(id) },
      data: {
        tags: {
          set: []
        }
      }
    });
    
    // Następnie usuń zakładkę
    await prisma.bookmark.delete({
      where: { id: Number(id) }
    });
    
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router; 