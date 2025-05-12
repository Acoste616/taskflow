# Cloudflare Tunnel Setup for Bookmark App

This guide will help you set up a Cloudflare Tunnel to securely expose your local backend to the internet without opening ports on your router.

## Prerequisites

- A free Cloudflare account
- A domain registered with Cloudflare (for DNS management)
- Your backend running on your local machine

## Installation Steps

### 1. Install Cloudflared CLI

#### On Windows:

```powershell
# Download the installer
Invoke-WebRequest -Uri https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-windows-amd64.msi -OutFile cloudflared.msi

# Run the installer
Start-Process msiexec.exe -ArgumentList '/i', 'cloudflared.msi', '/quiet' -Wait
```

#### Verify installation:

```powershell
cloudflared --version
```

### 2. Login to Cloudflare

```powershell
cloudflared tunnel login
```

This will open a browser window for you to authenticate with your Cloudflare account. 
Authorize the cert and it will be saved on your machine.

### 3. Create a Tunnel

```powershell
cloudflared tunnel create taskflow-bookmarks
```

This will create a tunnel and generate a credentials file (usually saved in `%USERPROFILE%\.cloudflared\`).

### 4. Create a Configuration File

Create a file named `config.yml` in `%USERPROFILE%\.cloudflared\` with the following content:

```yaml
tunnel: taskflow-bookmarks
credentials-file: C:\Users\YourUsername\.cloudflared\<UUID>.json

ingress:
  - hostname: bookmarks.twoja-domena.com
    service: http://localhost:3001
  - service: http_status:404
```

Replace `YourUsername` with your Windows username and `twoja-domena.com` with your domain registered on Cloudflare.

### 5. Set up DNS

```powershell
cloudflared tunnel route dns taskflow-bookmarks bookmarks.twoja-domena.com
```

This will create a CNAME record pointing to your tunnel.

### 6. Run the Tunnel

```powershell
# Standardowe uruchomienie
cloudflared tunnel run taskflow-bookmarks

# Jeśli cloudflared nie jest w PATH, dodaj tymczasowo ścieżkę
$env:Path += ";C:\Program Files (x86)\cloudflared"
cloudflared tunnel run taskflow-bookmarks

# Lub użyj bezpośrednio pełnej ścieżki
$cloudflaredPath = "C:\Program Files (x86)\cloudflared\cloudflared.exe"
& $cloudflaredPath tunnel run taskflow-bookmarks
```

### 7. Run as a Windows Service (Optional)

To make the tunnel start automatically when your computer boots:

```powershell
cloudflared service install
```

## Testing

1. Make sure your backend is running on port 3001
2. Start the tunnel if not already running
3. Visit `https://bookmarks.twoja-domena.com` in your browser

## Troubleshooting

### Check Tunnel Status

```powershell
cloudflared tunnel info taskflow-bookmarks
```

### View Logs

```powershell
cloudflared tunnel info taskflow-bookmarks
```
### Delete Tunnel (if needed)

```powershell
cloudflared tunnel delete taskflow-bookmarks
```

## Security Considerations

- The Cloudflare Tunnel creates a secure outbound-only connection, so no ports need to be opened on your router
- All traffic is encrypted between Cloudflare and your local machine
- Cloudflare provides additional security features like DDoS protection, Web Application Firewall, and Bot Management 
