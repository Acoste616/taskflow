# Uruchamianie aplikacji przez Cloudflare Tunnel

Ten przewodnik opisuje jak uruchomić aplikację z wykorzystaniem Cloudflare Tunnel, aby była dostępna z zewnątrz.

## Przygotowanie

1. Upewnij się, że masz zainstalowany `cloudflared`:
   ```powershell
   # Sprawdź instalację
   cloudflared --version
   
   # Jeśli nie jest zainstalowany, dodaj do PATH:
   $env:Path += ";C:\Program Files (x86)\cloudflared"
   ```

2. Upewnij się, że konfiguracja Vite zawiera odpowiednie ustawienia dla Cloudflare:
   - W pliku `taskflow/vite.config.ts` powinny być ustawienia:
     ```javascript
     server: {
       host: true,
       port: 5173,
       cors: true,
       hmr: {
         clientPort: 443,
         port: 5173
       },
     }
     ```

## Uruchomienie aplikacji

1. **Uruchom backend**:
   ```powershell
   cd backend
   npm run dev
   ```

2. **Uruchom Cloudflare Tunnel** (w nowym oknie terminala):
   ```powershell
   # Uruchom tunel wskazujący na backend
   cloudflared tunnel --url http://localhost:3001
   ```
   
   Po uruchomieniu, zapisz wygenerowany URL (np. `https://random-string.trycloudflare.com`)

3. **Skonfiguruj zmienną środowiskową dla frontendu**:
   ```powershell
   # Utwórz lub zaktualizuj plik .env (zamień URL na ten z poprzedniego kroku)
   echo "VITE_API_URL=https://random-string.trycloudflare.com/api" > taskflow/.env
   ```

4. **Uruchom frontend** (w nowym oknie terminala):
   ```powershell
   cd taskflow
   npm run dev
   ```

5. **Uruchom LM Studio** (jeśli jest używane)

## Testowanie

1. Frontend będzie dostępny lokalnie pod adresem: `http://localhost:5173`
2. API będzie dostępne przez Cloudflare pod adresem: `https://random-string.trycloudflare.com/api`

## Rozwiązywanie problemów

1. **Problemy z WebSocket**:
   - Jeśli występują problemy z połączeniem WebSocket (HMR), upewnij się, że konfiguracja HMR w `vite.config.ts` jest poprawna
   - Możesz spróbować uruchomić frontend z wyłączonym HMR: `npm run dev -- --no-hmr`

2. **Problemy z CORS**:
   - Upewnij się, że domena Cloudflare jest dodana do dozwolonych origin w pliku `backend/src/app.ts`

3. **Problemy z połączeniem do API**:
   - Sprawdź czy zmienna `VITE_API_URL` w pliku `.env` wskazuje na poprawny URL z Cloudflare
   - Upewnij się, że backend jest uruchomiony i dostępny na porcie 3001 