# Konfiguracja tymczasowej subdomeny Cloudflare

Jeśli nie posiadasz własnej domeny, możesz skorzystać z darmowej subdomeny udostępnianej przez Cloudflare dla tuneli. Oto instrukcja konfiguracji:

## 1. Uruchom tunel z automatyczną subdomeną

### W Linuksie lub macOS:
```bash
# W terminalu wykonaj komendę:
cloudflared tunnel --url http://localhost:3001
```

### W Windows (PowerShell):
```powershell
# Dodaj ścieżkę cloudflared do zmiennej PATH (tylko dla bieżącej sesji)
$env:Path += ";C:\Program Files (x86)\cloudflared"

# Uruchom tunel
cloudflared tunnel --url http://localhost:3001

# Alternatywnie, możesz użyć pełnej ścieżki:
$cloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
& $cloudflaredPath tunnel --url http://localhost:3001
```

Po uruchomieniu tej komendy, Cloudflare wygeneruje dla Ciebie tymczasowy URL w formacie:
```
https://random-string.trycloudflare.com
```

Zanotuj ten URL, będzie potrzebny do konfiguracji frontendu.

## 2. Skonfiguruj frontend

W pliku `taskflow/.env` ustaw zmienną środowiskową na wygenerowany URL:

```
VITE_API_URL=https://random-string.trycloudflare.com/api
```

Zastąp `random-string.trycloudflare.com` otrzymanym URL.

## 3. Uruchom aplikację

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd taskflow
npm run dev

# Terminal 3 - LM Studio
# Uruchom LM Studio i załaduj model
```

## 4. Testowanie

Otwórz przeglądarkę i przejdź do wygenerowanego URL. Powinieneś teraz mieć dostęp do swojej aplikacji za pośrednictwem internetu, bez konieczności posiadania własnej domeny.

## Uwagi

1. Tymczasowy URL wygaśnie po zakończeniu sesji tunelu. Przy ponownym uruchomieniu otrzymasz nowy URL.
2. Dla bardziej stałego rozwiązania rozważ zakup własnej domeny i skonfigurowanie jej z Cloudflare zgodnie z instrukcją z pliku `backend/CLOUDFLARE-SETUP.md`.
3. Upewnij się, że twój backend jest poprawnie skonfigurowany, aby akceptować żądania CORS z tymczasowej domeny. 