# 🚀 Eventiphy Deployment Guide - Render + Neon

Complete handleiding voor het deployen van Eventiphy naar Render met Neon PostgreSQL.

---

## 📋 Voorvereisten

- [x] GitHub account met Eventiphy repository
- [x] Render account (https://render.com)
- [x] Neon account (https://neon.tech)
- [x] Domein: eventiphy.site (geregistreerd)

---

## 🗄️ Stap 1: Database Setup op Neon

### 1.1 Maak Neon Project aan
1. Ga naar https://console.neon.tech
2. Klik op **"New Project"**
3. Vul in:
   - **Project Name**: `Eventiphy`
   - **Database Name**: `Eventiphy-postgress`
   - **Region**: Frankfurt (dichtst bij Nederland)
   - **Postgres Version**: 16
4. Klik op **"Create Project"**

### 1.2 Kopieer Connection String
1. In je Neon dashboard, klik op **"Connection Details"**
2. Selecteer **"Pooled connection"** (aanbevolen voor productie)
3. Kopieer de connection string:
   ```
   postgresql://[user]:[password]@[host]/Eventiphy-postgress?sslmode=require
   ```
4. **Bewaar deze veilig!** Je hebt hem nodig voor Render.

### 1.3 Migreer Database Schema (vanaf lokaal)
```bash
# Zet DATABASE_URL naar je Neon connection string
$env:DATABASE_URL="postgresql://[user]:[password]@[host]/Eventiphy-postgress?sslmode=require"

# Run Prisma migrations
npx prisma migrate deploy

# (Optioneel) Seed database met test data
npx prisma db seed
```

---

## 🐳 Stap 2: Docker Image Testen (Lokaal)

### 2.1 Build Docker Image
```powershell
docker build -t Eventiphy:latest .
```

### 2.2 Test Lokaal
```powershell
# Met Neon database
docker run -p 3000:3000 `
  -e DATABASE_URL="postgresql://[user]:[password]@[host]/Eventiphy-postgress?sslmode=require" `
  -e NEXTAUTH_URL="http://localhost:3000" `
  -e NEXTAUTH_SECRET="test-secret-change-in-production" `
  Eventiphy:latest

# Of met docker-compose (lokale PostgreSQL)
docker-compose up
```

### 2.3 Verifieer
- Open browser: http://localhost:3000
- Check health: http://localhost:3000/api/health

---

## 🌐 Stap 3: Deployment op Render

### 3.1 Connect GitHub Repository
1. Ga naar https://dashboard.render.com
2. Klik op **"New +"** → **"Web Service"**
3. Selecteer **"Connect a repository"**
4. Autoriseer GitHub en selecteer **Eventiphy repository**

### 3.2 Configureer Service

**Basic Settings:**
- **Name**: `Eventiphy`
- **Region**: Frankfurt (of dichtst bij jouw doelgroep)
- **Branch**: `main`
- **Runtime**: Docker
- **Plan**: Starter ($7/maand) of Free voor testing

**Build Settings:**
- **Dockerfile Path**: `./Dockerfile`
- **Docker Context**: `.` (root)
- Auto-Deploy: ✅ Enabled

**Environment Variables:**
Klik op **"Advanced"** → **"Add Environment Variable"**

```bash
NODE_ENV=production
NEXTAUTH_URL=https://eventiphy.site
NEXTAUTH_SECRET=[genereer-met: openssl rand -base64 32]
DATABASE_URL=[plak-je-neon-connection-string-hier]
NEXT_TELEMETRY_DISABLED=1
PORT=3000
```

⚠️ **Belangrijk**: 
- Gebruik de **Pooled connection string** van Neon
- `NEXTAUTH_SECRET` moet een sterke random string zijn
- Sla alle environment variables op als **"Secret"**

### 3.3 Deploy
1. Klik op **"Create Web Service"**
2. Render begint automatisch met bouwen
3. Wacht tot status **"Live"** is (5-10 minuten eerste keer)
4. Noteer je Render URL: `https://Eventiphy-xxxxx.onrender.com`

---

## 🌍 Stap 4: Domein Configuratie (eventiphy.site)

### 4.1 In Render Dashboard
1. Ga naar je Eventiphy service
2. Klik op **"Settings"** → **"Custom Domain"**
3. Voeg toe:
   - `eventiphy.site`
   - `www.eventiphy.site`

### 4.2 Bij je Domain Registrar
Voeg deze DNS records toe:

**Voor root domein (eventiphy.site):**
- Type: `A`
- Name: `@`
- Value: `[IP van Render - zie dashboard]`
- TTL: 3600

**Voor www subdomain:**
- Type: `CNAME`
- Name: `www`
- Value: `Eventiphy-xxxxx.onrender.com`
- TTL: 3600

**Of gebruik ALIAS/ANAME record:**
- Type: `ALIAS` of `ANAME`
- Name: `@`
- Value: `Eventiphy-xxxxx.onrender.com`
- TTL: 3600

### 4.3 SSL Certificaat
- Render genereert automatisch een Let's Encrypt SSL certificaat
- Dit gebeurt zodra DNS records correct zijn ingesteld
- Duurt 5-15 minuten na DNS propagatie

### 4.4 Update Environment Variables
```bash
NEXTAUTH_URL=https://eventiphy.site
```

---

## ✅ Stap 5: Verificatie & Testing

### 5.1 Health Check
```bash
curl https://eventiphy.site/api/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-10T...",
  "database": "connected"
}
```

### 5.2 Test Critical Flows
- [ ] Homepage laadt correct
- [ ] Gebruiker kan registreren
- [ ] Gebruiker kan inloggen
- [ ] Browse providers werkt
- [ ] Provider dashboard toegankelijk
- [ ] Admin panel werkt
- [ ] Quote aanvraag systeem functioneert

### 5.3 Performance Check
```bash
# Gebruik Lighthouse of WebPageTest
npx lighthouse https://eventiphy.site --view
```

---

## 🔄 Stap 6: Continuous Deployment

### Auto-Deploy Setup
Elke push naar `main` branch triggert automatisch een nieuwe deployment:

```bash
git add .
git commit -m "feat: nieuwe feature"
git push origin main
```

Render detecteert de push en start automatisch een nieuwe build.

### Manual Deploy
In Render dashboard:
1. Ga naar je service
2. Klik op **"Manual Deploy"** → **"Deploy latest commit"**

---

## 🛠️ Maintenance & Monitoring

### Logs Bekijken
```bash
# In Render dashboard
Settings → Logs (real-time)

# Of via CLI (installeer Render CLI)
render logs -s Eventiphy
```

### Database Maintenance
```bash
# Neon dashboard: Monitoring tab
# Bekijk:
# - Connection count
# - Query performance
# - Storage usage
```

### Backups
Neon maakt automatisch backups:
- Continuous backup (point-in-time recovery)
- Beheer in Neon dashboard → Backups tab

### Updates & Migrations
```bash
# 1. Test lokaal
npm run dev

# 2. Maak nieuwe migration
npx prisma migrate dev --name description_of_change

# 3. Push naar git
git add .
git commit -m "feat: nieuwe database changes"
git push origin main

# 4. Render deploy automatisch
# 5. Migrations runnen automatisch via Dockerfile
```

---

## 📊 Monitoring & Analytics

### Render Metrics
Dashboard toont automatisch:
- Request count
- Response times
- Memory usage
- CPU usage
- Error rates

### Custom Monitoring
Overweeg toevoegen van:
- **Sentry** voor error tracking
- **LogRocket** voor session replay
- **Google Analytics** voor user metrics
- **Uptime Robot** voor availability monitoring

---

## 🔒 Security Checklist

- [x] DATABASE_URL is secret
- [x] NEXTAUTH_SECRET is sterk en uniek
- [x] HTTPS geforceerd via Render
- [x] Environment variables zijn encrypted
- [x] Neon SSL mode enabled
- [x] Docker image draait als non-root user
- [x] Health check endpoint exposed
- [ ] Rate limiting geïmplementeerd
- [ ] CORS configuratie voor productie
- [ ] Security headers (CSP, HSTS, etc.)

---

## 🐛 Troubleshooting

### "Database connection failed"
```bash
# Check Neon status
https://neonstatus.com

# Verify connection string
echo $DATABASE_URL

# Test connection
npx prisma db push
```

### "Build failed on Render"
```bash
# Check logs in Render dashboard
# Common issues:
# - Missing environment variables
# - Syntax errors
# - Dependencies not installed

# Fix en push
git push origin main
```

### "SSL Certificate not generated"
```bash
# 1. Verify DNS propagation
nslookup eventiphy.site

# 2. Check DNS records in Render dashboard
# 3. Wait 15 minutes for propagation
# 4. Contact Render support if issue persists
```

### "500 Error on production"
```bash
# Check Render logs
# Common causes:
# - Database connection issues
# - Missing environment variables
# - NEXTAUTH_URL mismatch

# Enable debug logging
NODE_ENV=production
DEBUG=*
```

---

## 💰 Cost Estimation

### Neon (Database)
- **Free Tier**: 0.5 GB storage, 10 hours compute/month
- **Pro**: $19/maand - 10 GB storage, always-on compute
- **Aanbevolen voor productie**: Pro

### Render (Hosting)
- **Free**: $0 - spindown na 15 min inactiviteit
- **Starter**: $7/maand - always on, 512 MB RAM
- **Standard**: $25/maand - 2 GB RAM, auto-scaling
- **Aanbevolen voor productie**: Starter of Standard

**Total**: ~$26-44/maand voor productie-ready setup

---

## 📞 Support & Resources

### Documentation
- [Render Docs](https://render.com/docs)
- [Neon Docs](https://neon.tech/docs)
- [Next.js Deployment](https://nextjs.org/docs/deployment)
- [Prisma Deployment](https://www.prisma.io/docs/guides/deployment)

### Community
- Render Discord: https://render.com/discord
- Neon Discord: https://neon.tech/discord
- Next.js Discord: https://nextjs.org/discord

---

## 🎉 Volgende Stappen

Na succesvolle deployment:
1. ✅ Setup monitoring en alerts
2. ✅ Configureer error tracking (Sentry)
3. ✅ Implementeer rate limiting
4. ✅ Setup CI/CD tests
5. ✅ Documenteer API endpoints
6. ✅ Maak backup strategie
7. ✅ Setup staging environment
8. ✅ Configureer analytics
9. ✅ Optimaliseer SEO
10. ✅ Load testing

---

**Gemaakt door Eventiphy Team**  
Laatste update: November 2025
