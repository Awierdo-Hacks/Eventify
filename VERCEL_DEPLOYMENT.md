# 🚀 Eventify - Vercel Deployment Guide

## Prerequisites

1. **GitHub Repository** - Push je code naar GitHub
2. **Vercel Account** - Gratis op [vercel.com](https://vercel.com)
3. **PostgreSQL Database** - Gebruik een van deze opties:
   - [Neon](https://neon.tech) - Gratis PostgreSQL (recommended)
   - [Supabase](https://supabase.com) - Gratis PostgreSQL + extras
   - [Railway](https://railway.app) - Gratis PostgreSQL

---

## 📝 Stap 1: Database Setup

### Optie A: Neon (Recommended - Gratis)

1. Ga naar [neon.tech](https://neon.tech)
2. Maak een gratis account
3. Create new project → Kies "Amsterdam" region
4. Copy de connection string (lijkt op: `postgresql://user:password@host/dbname`)
5. Bewaar deze voor stap 3

### Optie B: Supabase

1. Ga naar [supabase.com](https://supabase.com)
2. Create new project
3. Ga naar Settings → Database
4. Copy "Connection string" (Transaction mode)
5. Replace `[YOUR-PASSWORD]` met je database password

---

## 🔗 Stap 2: Import Project in Vercel

1. **Login op Vercel**
   - Ga naar [vercel.com](https://vercel.com)
   - Login met GitHub

2. **Import Repository**
   - Click "Add New..." → "Project"
   - Selecteer je GitHub repository
   - Click "Import"

3. **Project Configuration**
   - Framework Preset: **Next.js** (auto-detected)
   - Root Directory: `.` (leave default)
   - Build Command: `npm run build` (auto-detected)
   - Output Directory: `.next` (auto-detected)

---

## 🔐 Stap 3: Environment Variables

Voeg de volgende environment variables toe in Vercel:

### Required Variables

| Variable | Value | How to Get |
|----------|-------|------------|
| `DATABASE_URL` | `postgresql://...` | Van je database provider (Neon/Supabase/Railway) |
| `NEXTAUTH_SECRET` | Random string | Run: `openssl rand -base64 32` in terminal |
| `NEXTAUTH_URL` | `https://your-domain.vercel.app` | Je Vercel domain (vul in na deployment) |

### How to Add in Vercel:

1. In Vercel project settings → "Environment Variables"
2. Add each variable:
   - Name: `DATABASE_URL`
   - Value: `postgresql://user:pass@host/db`
   - Environments: **Production, Preview, Development** (check all)
3. Click "Add"
4. Repeat voor `NEXTAUTH_SECRET` en `NEXTAUTH_URL`

---

## 🗄️ Stap 4: Database Migrations

Na eerste deployment moet je de database schema aanmaken:

### Via Vercel CLI (Recommended)

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project
vercel link

# Run migrations
vercel env pull .env.local
npx prisma migrate deploy
npx prisma db seed
```

### Alternatief: Via Build Script

Add to `package.json`:
```json
{
  "scripts": {
    "vercel-build": "prisma generate && prisma migrate deploy && next build"
  }
}
```

---

## 🎯 Stap 5: Deploy!

1. Click **"Deploy"** in Vercel
2. Wacht 2-3 minuten voor build
3. ✅ Je app is live!

---

## 🔄 Database Seeding (Demo Data)

Om test data toe te voegen:

```bash
# Lokaal met production database
DATABASE_URL="postgresql://..." npx prisma db seed
```

**Demo Accounts na seeding:**
- Admin: `admin@eventify.nl` / `password123`
- Customer: `sarah.jansen@example.com` / `password123`
- Provider: `info@culinairecreatiesamsterdam.nl` / `password123`

---

## 🌍 Custom Domain (Optioneel)

1. Ga naar Vercel Project → Settings → Domains
2. Add je eigen domain: `eventify.nl`
3. Update DNS records zoals aangegeven
4. Update `NEXTAUTH_URL` naar je nieuwe domain

---

## 🔍 Troubleshooting

### Build Fails

**Error**: "Cannot find module '@prisma/client'"
```bash
# Solution: Add to package.json
"scripts": {
  "postinstall": "prisma generate"
}
```

**Error**: "DATABASE_URL is not defined"
- Check Environment Variables in Vercel
- Make sure all 3 environments checked (Production, Preview, Development)

### Database Connection Fails

**Error**: "Can't reach database server"
- Check DATABASE_URL format
- Verify database is running
- Check firewall/allowlist (allow Vercel IPs)

### Authentication Issues

**Error**: "JWT secret not found"
- Verify `NEXTAUTH_SECRET` is set
- Regenerate: `openssl rand -base64 32`

**Error**: "Callback URL mismatch"
- Update `NEXTAUTH_URL` to match your actual domain
- Include https:// prefix
- No trailing slash

---

## 📊 Post-Deployment Checklist

- [ ] ✅ App loads without errors
- [ ] ✅ Login werkt met demo accounts
- [ ] ✅ Customer dashboard accessible
- [ ] ✅ Provider dashboard accessible
- [ ] ✅ Admin dashboard accessible (only for admin role)
- [ ] ✅ Browse providers page loads
- [ ] ✅ Provider detail pages load
- [ ] ✅ Service requests can be created
- [ ] ✅ Quotes can be created and accepted
- [ ] ✅ All API endpoints respond

---

## 🎉 Success!

Je Eventify app draait nu op Vercel! 

**Next Steps:**
1. Test all critical flows
2. Invite beta users
3. Monitor Vercel Analytics
4. Setup error tracking (Sentry)
5. Configure custom domain

**Support:**
- Vercel Docs: https://vercel.com/docs
- Next.js Docs: https://nextjs.org/docs
- Prisma Docs: https://www.prisma.io/docs

---

**Built with ❤️ using Next.js, TypeScript, Prisma & Vercel**
