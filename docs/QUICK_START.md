# Quick Start Commands voor Eventiphy Deployment

## Lokaal Docker Testen

### Build Docker Image
```powershell
docker build -t Eventiphy:latest .
```

### Run met Neon Database
```powershell
docker run -p 3000:3000 `
  -e DATABASE_URL="postgresql://[user]:[password]@[host]/Eventiphy-postgress?sslmode=require" `
  -e NEXTAUTH_URL="http://localhost:3000" `
  -e NEXTAUTH_SECRET="local-dev-secret-change-in-prod" `
  Eventiphy:latest
```

### Run met Docker Compose (lokale PostgreSQL)
```powershell
docker-compose up --build
```

### Stop alle containers
```powershell
docker-compose down
```

### Cleanup
```powershell
# Stop en verwijder containers
docker-compose down -v

# Verwijder image
docker rmi Eventiphy:latest
```

## Database Migrations

### Deploy migrations naar Neon
```powershell
# Set DATABASE_URL naar je Neon connection string
$env:DATABASE_URL="postgresql://[user]:[password]@[host]/Eventiphy-postgress?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Seed database (optioneel)
npx prisma db seed
```

### Create new migration
```powershell
npx prisma migrate dev --name description_of_change
```

## Render Deployment

### Via Git Push (Automatisch)
```powershell
git add .
git commit -m "feat: nieuwe feature"
git push origin main
```

### Manual Deploy via Render CLI
```powershell
# Installeer Render CLI
npm install -g @render-tools/render-cli

# Login
render login

# Deploy
render deploy -s Eventiphy
```

## Health Check

### Lokaal
```powershell
curl http://localhost:3000/api/health
```

### Productie
```powershell
curl https://eventiphy.site/api/health
```

## Logs bekijken

### Docker logs
```powershell
docker logs Eventiphy-app -f
```

### Render logs
```powershell
# Via CLI
render logs -s Eventiphy -f

# Of in browser
https://dashboard.render.com
```

## Secrets Genereren

### NEXTAUTH_SECRET
```powershell
# PowerShell
[Convert]::ToBase64String([System.Security.Cryptography.RandomNumberGenerator]::GetBytes(32))

# Of online
https://generate-secret.vercel.app/32
```

## Environment Variables Checklist

```bash
# Productie (Render)
DATABASE_URL="postgresql://[user]:[password]@[host]/Eventiphy-postgress?sslmode=require"
NEXTAUTH_URL="https://eventiphy.site"
NEXTAUTH_SECRET="[genereer-een-sterke-random-string]"
NODE_ENV="production"
NEXT_TELEMETRY_DISABLED="1"
PORT="3000"
```

## Troubleshooting

### Build fails
```powershell
# Clear node_modules en rebuild
Remove-Item -Recurse -Force node_modules
npm install
npm run build
```

### Database connection issues
```powershell
# Test Prisma connection
npx prisma db pull

# Verify DATABASE_URL
echo $env:DATABASE_URL
```

### Docker build issues
```powershell
# Build zonder cache
docker build --no-cache -t Eventiphy:latest .

# Check logs
docker logs Eventiphy-app
```

## Performance Testing

### Load test
```powershell
# Installeer artillery
npm install -g artillery

# Run load test
artillery quick --count 10 --num 50 https://eventiphy.site
```

### Lighthouse audit
```powershell
npx lighthouse https://eventiphy.site --view
```

## Backup & Restore

### Backup Neon Database
```powershell
# Via Neon dashboard: Settings → Backups → Create Backup

# Of via pg_dump
pg_dump $env:DATABASE_URL > backup.sql
```

### Restore from backup
```powershell
psql $env:DATABASE_URL < backup.sql
```

## Monitoring

### Setup Sentry (Error Tracking)
```powershell
npm install @sentry/nextjs

# Initialize
npx @sentry/wizard -i nextjs
```

### Setup Uptime Monitoring
1. Ga naar https://uptimerobot.com
2. Add Monitor: https://eventiphy.site/api/health
3. Alert interval: 5 minuten

## DNS Configuration

### Cloudflare (Aanbevolen)
```
Type: A
Name: @
Content: [Render IP]
Proxy: Enabled (orange cloud)

Type: CNAME
Name: www
Content: Eventiphy-xxxxx.onrender.com
Proxy: Enabled
```

### Direct DNS
```
Type: A
Name: @
Content: [Render IP]
TTL: 3600

Type: CNAME
Name: www
Content: Eventiphy-xxxxx.onrender.com
TTL: 3600
```

## Useful Links

- **Render Dashboard**: https://dashboard.render.com
- **Neon Console**: https://console.neon.tech
- **Domain Management**: [Your registrar]
- **Status Pages**:
  - Render: https://status.render.com
  - Neon: https://neonstatus.com

## Support

Problemen? Check:
1. DEPLOYMENT.md voor uitgebreide handleiding
2. Render logs in dashboard
3. Neon status page
4. GitHub Issues
