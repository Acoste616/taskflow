# Bookmark Backend API

Modularne API do zarządzania zakładkami, analizowania ich przez lokalny LLM (np. Qwen-3, LLaMA 2 w LM Studio) oraz eksportu do różnych formatów.

## Wymagania
- Node.js >= 18
- SQLite (domyślnie, łatwa migracja do PostgreSQL)
- LM Studio z uruchomionym lokalnym modelem LLM

## Instalacja
```bash
npm install
npx prisma migrate dev --name init
npm run dev
```

## Endpointy
- POST `/api/bookmarks` – dodawanie zakładki
- GET `/api/bookmarks` – pobieranie listy zakładek
- POST `/api/bookmarks/analyze` – analiza zakładki przez LLM
- GET `/api/bookmarks/export` – eksport do JSON/CSV

## Konfiguracja
Zmień ustawienia w pliku `.env` jeśli chcesz użyć innej bazy lub portu LM Studio. 