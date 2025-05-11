import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/folders - pobieranie wszystkich folderów
router.get('/', async (req, res) => {
  try {
    const folders = await prisma.folder.findMany({
      include: { _count: { select: { bookmarks: true } } }
    });
    res.json(folders);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/folders/:id/bookmarks - pobieranie zakładek z danego folderu
router.get('/:id/bookmarks', async (req, res) => {
  try {
    const { id } = req.params;
    const bookmarks = await prisma.bookmark.findMany({
      where: { folderId: Number(id) },
      include: { tags: true }
    });
    res.json(bookmarks);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/folders - tworzenie nowego folderu
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const folder = await prisma.folder.create({
      data: { name }
    });
    res.status(201).json(folder);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/folders/:id - aktualizacja folderu
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const folder = await prisma.folder.update({
      where: { id: Number(id) },
      data: { name }
    });
    res.json(folder);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/folders/:id - usuwanie folderu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // Zaktualizuj wszystkie zakładki w tym folderze, aby nie miały przypisanego folderu
    await prisma.bookmark.updateMany({
      where: { folderId: Number(id) },
      data: { folderId: null }
    });
    // Usuń folder
    await prisma.folder.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router; 