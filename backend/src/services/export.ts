import { PrismaClient } from '@prisma/client';
import { Parser } from 'json2csv';

const prisma = new PrismaClient();

interface Tag {
  name: string;
}

interface Folder {
  name: string | null;
}

interface BookmarkWithRelations {
  tags: Tag[];
  folder: Folder | null;
  [key: string]: any;
}

export async function exportBookmarks(format: 'json' | 'csv' = 'json') {
  try {
    // Pobierz wszystkie zakładki wraz z tagami i folderami
    const bookmarks = await prisma.bookmark.findMany({
      include: {
        tags: true,
        folder: true
      }
    });

    // Przygotuj dane do eksportu - przekształć relacje na płaskie dane
    const exportData = bookmarks.map((bookmark: BookmarkWithRelations) => {
      const { tags, folder, ...rest } = bookmark;
      return {
        ...rest,
        tags: tags.map((tag: Tag) => tag.name).join(', '),
        folder: folder ? folder.name : null
      };
    });

    if (format === 'csv') {
      const parser = new Parser();
      return parser.parse(exportData);
    } else {
      return JSON.stringify(exportData, null, 2);
    }
  } catch (error) {
    console.error('Błąd podczas eksportu zakładek:', error);
    if (format === 'csv') {
      return 'Error during export';
    } else {
      return JSON.stringify({ error: 'Failed to export bookmarks' });
    }
  }
} 