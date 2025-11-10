# Eventify - Docker Deployment Setup ✅

## 📦 Wat is er aangemaakt?

Ik heb een complete Docker-setup gemaakt voor deployment op Render met Neon PostgreSQL:

### 1. **Dockerfile** (Multi-stage build)
   - ✅ Geoptimaliseerd voor productie
   - ✅ Multi-stage build voor kleine image size
   - ✅ Non-root user voor security
   - ✅ Health check ingebouwd
   - ✅ Prisma Client generation

### 2. **.dockerignore**
   - ✅ Exclude onnodige bestanden van Docker image
   - ✅ Kleinere build size

### 3. **docker-compose.yml**
   - ✅ Lokale development met PostgreSQL
   - ✅ Easy testing van Docker setup

### 4. **render.yaml**
   - ✅ Infrastructure as Code voor Render
   - ✅ Automatische deployment configuratie
   - ✅ Environment variables setup

### 5. **Health Check Endpoint** (`/api/health`)
   - ✅ Monitor application status
   - ✅ Database connection check
   - ✅ Gebruikt door Docker en Render

### 6. **next.config.ts** (Updated)
   - ✅ Standalone output voor Docker
   - ✅ Image optimization
   - ✅ Production optimizations

### 7. **Deployment Documentatie**
   - ✅ **DEPLOYMENT.md** - Complete step-by-step guide
   - ✅ **QUICK_START.md** - Handige commando's
   - ✅ **.env.production.example** - Environment variables template

---

## 🚀 Volgende Stappen

### Stap 1: Test Docker Lokaal

```powershell
# Build image
docker build -t eventify:latest .

# Test met docker-compose (lokale PostgreSQL)
docker-compose up
```

Ga naar: http://localhost:3000

### Stap 2: Setup Neon Database

1. Ga naar https://console.neon.tech
2. Maak nieuw project: **Eventify**
3. Database naam: **eventify-postgress**
4. Regio: **Frankfurt**
5. Kopieer connection string (Pooled)

### Stap 3: Migreer Database

```powershell
# Set DATABASE_URL naar Neon
$env:DATABASE_URL="postgresql://[user]:[password]@[host]/eventify-postgress?sslmode=require"

# Run migrations
npx prisma migrate deploy

# Seed data (optioneel)
npx prisma db seed
```

### Stap 4: Deploy naar Render

1. Push code naar GitHub:
```powershell
git add .
git commit -m "feat: add Docker deployment setup"
git push origin main
```

2. Ga naar https://dashboard.render.com
3. New Web Service → Connect GitHub repo
4. Configuratie:
   - **Runtime**: Docker
   - **Region**: Frankfurt
   - **Dockerfile Path**: `./Dockerfile`

5. Environment Variables toevoegen:
```
DATABASE_URL=[neon-connection-string]
NEXTAUTH_URL=https://eventiphy.site
NEXTAUTH_SECRET=[genereer-random-string]
NODE_ENV=production
```

6. Deploy! 🚀

### Stap 5: Configureer Domein

1. In Render: Settings → Custom Domain → Add **eventiphy.site**
2. Bij domain registrar:
   ```
   Type: A
   Name: @
   Value: [Render IP]
   
   Type: CNAME
   Name: www
   Value: eventify-xxxxx.onrender.com
   ```

3. SSL certificaat wordt automatisch gegenereerd

---

## 📚 Documentatie

- **DEPLOYMENT.md** - Volledige deployment handleiding
- **QUICK_START.md** - Handige commando's en tips
- **.env.production.example** - Environment variables template

---

## ✅ Checklist voor Deployment

- [ ] Docker image lokaal testen
- [ ] Neon database aangemaakt
- [ ] Migrations naar Neon database gedraaid
- [ ] Code gepushed naar GitHub
- [ ] Render service aangemaakt
- [ ] Environment variables ingesteld
- [ ] Domein geconfigureerd
- [ ] SSL certificaat actief
- [ ] Health check werkt
- [ ] Application draait op eventiphy.site

---

## 🔒 Security Notes

- ✅ Multi-stage Docker build
- ✅ Non-root user in container
- ✅ Environment variables als secrets
- ✅ SSL/TLS via Render
- ✅ Neon SSL mode enabled
- ✅ Health check voor monitoring

---

## 💰 Geschatte Kosten

**Neon (Database)**:
- Free: €0 (beperkt)
- Pro: €19/maand (aanbevolen)

**Render (Hosting)**:
- Free: €0 (spindown na inactiviteit)
- Starter: €7/maand (always-on)
- Standard: €25/maand (meer resources)

**Totaal**: ~€26-44/maand voor productie-ready setup

---

## 🆘 Hulp nodig?

Lees de uitgebreide **DEPLOYMENT.md** voor:
- Troubleshooting guide
- Performance optimization tips
- Monitoring setup
- Security best practices
- Backup strategie

Veel succes met de deployment! 🎉
