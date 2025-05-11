import { Router } from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = Router();

// GET /api/tags - pobieranie wszystkich tagów
router.get('/', async (req, res) => {
  try {
    const tags = await prisma.tag.findMany({
      include: { _count: { select: { bookmarks: true } } }
    });
    res.json(tags);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tags - tworzenie nowego tagu
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    const tag = await prisma.tag.create({
      data: { name }
    });
    res.status(201).json(tag);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// PUT /api/tags/:id - aktualizacja tagu
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const tag = await prisma.tag.update({
      where: { id: Number(id) },
      data: { name }
    });
    res.json(tag);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/tags/:id - usuwanie tagu
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.tag.delete({
      where: { id: Number(id) }
    });
    res.status(204).send();
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

export default router; 