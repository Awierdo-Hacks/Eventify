# 📖 Eventiphy# 📖 Eventiphy Documentatie



**Event Planning Platform** - Verbind organisatoren met dienstverlenersVolledige technische documentatie en product blueprint  

🌐 **Live:** [eventiphy.site](https://eventiphy.site)  

🌐 **Live:** [eventiphy.site](https://eventiphy.site)  🐳 **Docker Ready** | 🚀 **Render Deployment**

🐳 **Docker Ready** | 🚀 **Production Deployment**

---

---

## 🚀 Quick Start

## 🚀 Quick Start

### Lokale Development

### Prerequisites

- Node.js 20+ **Optie 1: PostgreSQL via Docker (Aanbevolen)**

- PostgreSQL 16```bash

- npm/pnpmdocker run --name eventiphy-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres

docker exec -it eventiphy-postgres psql -U postgres -c "CREATE DATABASE eventiphy;"

### Local Development```



```bash**Optie 2: Lokale PostgreSQL Installatie**

# 1. Install dependencies1. Download PostgreSQL van https://www.postgresql.org/download/

npm install2. Installeer en start de service

3. Maak een database aan: `CREATE DATABASE eventiphy;`

# 2. Setup environment variables4. Update `.env` met jouw credentials

cp .env.example .env

# Edit .env with your DATABASE_URL and secrets### Project Setup

```bash

# 3. Initialize database# Installeer dependencies

npx prisma migrate devnpm install

npx prisma db seed

# Setup database schema

# 4. Start development servernpx prisma migrate dev --name init

npm run dev

```# Seed database met demo data

npx prisma db seed

Open [http://localhost:3000](http://localhost:3000)

# Start development server

---npm run dev

```

## 🐳 Docker Development

### Docker Development

```bash```bash

# Start with Docker Compose (includes PostgreSQL)# Met Docker Compose (incl. PostgreSQL)

docker-compose updocker-compose up



# Or build manually# Of bouw image handmatig

docker build -t eventiphy:latest .docker build -t eventiphy:latest .

docker run -p 3000:3000 eventiphy:latestdocker run -p 3000:3000 eventiphy:latest

``````



------



## 📁 Project Structure## 🐳 Production Deployment



```**Complete Docker setup voor Render + Neon PostgreSQL**

eventiphy/

├── app/                      # Next.js App Router📚 **Zie volledige handleiding:** [DEPLOYMENT.md](./DEPLOYMENT.md)

│   ├── api/                  # API routes

│   ├── (pages)/              # Application pages**Snelle deploy:**

│   └── globals.css           # Global styles1. Maak Neon database aan → [console.neon.tech](https://console.neon.tech)

├── components/               # React components2. Push naar GitHub

│   ├── layout/               # Layout components3. Connect Render → [dashboard.render.com](https://dashboard.render.com)

│   ├── providers/            # Context providers4. Deploy! 🚀

│   └── ui/                   # UI components (shadcn/ui)

├── lib/                      # Utilities & configs**Deployment docs:**

│   ├── auth.ts               # Authentication logic- 📘 [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete step-by-step guide

│   ├── prisma.ts             # Prisma client- 📗 [QUICK_START.md](./QUICK_START.md) - Handige commando's

│   └── utils.ts              # Helper functions- 📙 [DOCKER_SETUP_COMPLETE.md](./DOCKER_SETUP_COMPLETE.md) - Setup overzicht

├── prisma/                   # Database

│   ├── schema.prisma         # Database schema---

│   ├── seed.ts               # Seed data

│   └── migrations/           # Database migrations## �📌 Overzicht

├── scripts/                  # Utility scripts- **Tech Stack**

│   ├── dev/                  # Development & testing scripts- **Architectuur**

│   └── utils/                # Utility scripts- **Features**

├── types/                    # TypeScript definitions- **User Flows**

├── docs/                     # Documentation- **PRD**

│   ├── DEPLOYMENT.md         # Deployment guide

│   ├── QUICK_START.md        # Quick reference---

│   └── DESIGN_GUIDE.md       # Design system

├── public/                   # Static assets## ⚛️ Frontend

├── .env                      # Local environment variables- **React** – UI Framework voor component-based development  

├── .env.production           # Production environment template- **Next.js** – Full-stack React framework met ingebouwde routing, API routes en server-side rendering  

├── docker-compose.yml        # Docker Compose config- **TypeScript** – Type-safe development voor frontend en backend  

├── Dockerfile                # Docker build config- **Tailwind CSS** – Utility-first CSS framework voor styling  

├── next.config.ts            # Next.js configuration- **Framer Motion** – Animatie library voor smooth transitions  

├── tailwind.config.ts        # Tailwind CSS config- **Shadcn/ui** – Herbruikbare UI componenten  

├── tsconfig.json             # TypeScript config- **Lucide React** – Icon library  

└── package.json              # Dependencies & scripts- **React Router** – Client-side routing (alleen indien nodig naast Next.js routing)  

```- **React Query** – Data fetching en caching (voor client-side data management waar gewenst)  



------



## ⚛️ Tech Stack## 🔧 Backend

- **Next.js API Routes & Server Actions** – Ingebouwde backendlaag voor business logica en API endpoints  

### Frontend- **TypeScript** – End-to-end type safety  

- **Next.js 16** - React framework met App Router- **PostgreSQL** – Relationele database voor consistente en schaalbare data-opslag  

- **TypeScript** - Type-safe development- **Prisma** – ORM voor type-veilige database interacties en migrations  

- **Tailwind CSS** - Utility-first styling- **Auth.js (NextAuth)** – Authenticatie en sessiebeheer met ondersteuning voor meerdere providers  

- **Shadcn/ui** - Component library- **JWT / Secure Sessions** – Veilige authenticatie en autorisatie  

- **Framer Motion** - Animations- **Bestandsopslag (S3-compatibel, bv. Cloudflare R2 / Supabase Storage)** – Image & document hosting via eigen API-routes  

- **RESTful API** – API architectuur voor interne en externe integraties  

### Backend

- **Next.js API Routes** - Backend endpoints---

- **Prisma** - ORM & database migrations

- **PostgreSQL** - Relational database## 🔗 Integrations

- **NextAuth.js** - Authentication- **Stripe Connect** – Betalingsverwerking (toekomstig)  

- **JWT** - Secure sessions- **Email Service** – Transactionele emails  

- **File Storage** – Image & document hosting  

### DevOps- **LLM Integration** – AI-powered features  

- **Docker** - Containerization

- **GitHub Actions** - CI/CD---

- **Render** - Hosting platform

- **render** - PostgreSQL hosting## 🗂️ Data Model & Entities



---### ServiceProvider

- `business_name`  

## 🗄️ Database Schema- `category`  

- `location`  

### Core Entities- `price_range`  

- **User** - Customers, Providers, Admins- `images`  

- **ServiceProvider** - Business profiles- `verified`  

- **ServiceRequest** - Event booking requests

- **Quote** - Price offers from providers### ServiceRequest

- **Booking** - Confirmed reservations- `customer_email`  

- **Review** - Customer feedback- `provider_id`  

- **Message** - Communication between parties- `event_type`  

- `event_date`  

---- `guest_count`  

- `budget`  

## 🔐 Authentication & Authorization

### Quote

### User Roles- `request_id`  

- **Customer** - Browse & book services- `provider_id`  

- **Provider** - Offer services & manage bookings- `amount`  

- **Admin** - Platform management- `description`  

- `valid_until`  

### Features

- Secure password hashing (bcrypt)### Booking

- JWT-based sessions- `quote_id`  

- Role-based access control (RBAC)- `customer_email`  

- Protected API routes- `provider_id`  

- `amount`  

---- `payment_status`  



## 📦 Available Scripts### Review

- `provider_id`  

```bash- `customer_email`  

# Development- `rating`  

npm run dev          # Start dev server (localhost:3000)- `title`  

- `comment`  

# Building

npm run build        # Build for production### Message

npm start            # Start production server- `request_id`  

- `from_email`  

# Database- `to_email`  

npx prisma studio    # Open Prisma Studio (DB GUI)- `message`  

npx prisma migrate dev    # Create & apply migration

npx prisma db seed   # Seed database with demo data### User

- `email`  

# Code Quality- `full_name`  

npm run lint         # Run ESLint- `role`  

- `user_type`  

# Utilities (see scripts/ folder)

.\scripts\utils\generate-secret.ps1    # Generate NEXTAUTH_SECRET---

```

## 👥 User Flows

---

### Klant Flow

## 🚀 Deployment1. Browse dienstverleners op categorie/locatie  

2. Bekijk provider profielen en reviews  

### Production Deployment (Render + Neon)3. Vraag offerte aan met event details  

4. Ontvang en vergelijk offertes  

See detailed guide: [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)5. Accepteer offerte → Boeking  

6. Event vindt plaats  

**Quick Steps:**7. Schrijf review  

1. Create Neon PostgreSQL database

2. Push code to GitHub### Provider Flow

3. Connect Render to repository1. Registreer als dienstverlener  

4. Configure environment variables2. Maak bedrijfsprofiel aan  

5. Deploy!3. Wacht op admin verificatie  

4. Ontvang aanvragen  

### Environment Variables5. Verstuur gepersonaliseerde offertes  

6. Beheer boekingen  

Required environment variables:7. Ontvang betaling & reviews  



```env### Admin Flow

# Database1. Monitor platform statistieken  

DATABASE_URL=postgresql://user:password@host:5432/dbname2. Verifieer nieuwe providers  

3. Beheer gebruikers en content  

# Auth4. Modereer reviews  

NEXTAUTH_URL=https://yourdomain.com5. Los geschillen op  

NEXTAUTH_SECRET=your-secret-key-here6. Analyseer platform groei  



# App---

NODE_ENV=production

```## 🚀 Features

- User authenticatie (customer, provider, admin)  

---- Provider zoeken en filteren  

- Gedetailleerde provider profielen  

## 🎯 Features- Offerte aanvraag systeem  

- Quote management  

### For Customers- Booking systeem  

- ✅ Browse service providers by category- Review & rating systeem  

- ✅ View detailed profiles & portfolios- Dashboards voor klanten & providers  

- ✅ Request custom quotes- Admin panel voor moderatie  

- ✅ Compare offers- Realtime chat tussen klant en provider  

- ✅ Book services- Email notificaties  

- ✅ Write reviews- Stripe betalingsintegratie  

- Kalender synchronisatie  

### For Providers- Geavanceerde zoekfilters  

- ✅ Create business profile- Favorieten systeem  

- ✅ Receive booking requests- Portfolio galerij uitbreidingen  

- ✅ Send personalized quotes- AI-powered matching algoritme  

- ✅ Manage bookings- Meertalige ondersteuning (EN/NL)  

- ✅ Build reputation via reviews- Mobile app (React Native)  

- Premium provider subscripties  

### For Admins- Analytics dashboard  

- ✅ User management- Rapportage tools  

- ✅ Provider verification- API voor third-party integraties  

- ✅ Platform statistics

- ✅ Content moderation---



---## 📖 Project Overzicht



## 📚 Documentation### Wat is Eventiphy?

Eventiphy is een digitaal platform dat het organiseren van evenementen vereenvoudigt door gebruikers te verbinden met dienstverleners zoals cateraars, DJ's, decorateurs, fotografen en locaties. Gebruikers kunnen hun evenement plannen, leveranciers vergelijken, offertes aanvragen, en direct boeken — allemaal binnen één omgeving.

- [Deployment Guide](docs/DEPLOYMENT.md) - Complete deployment walkthrough

- [Quick Start](docs/QUICK_START.md) - Handy commands & troubleshooting### Voor Klanten

- [Design Guide](docs/DESIGN_GUIDE.md) - UI/UX guidelines- Vind binnen 5 minuten de perfecte dienstverleners voor jouw event  



---### Voor Providers

- Bereik nieuwe klanten en beheer boekingen efficiënt  

## 🛠️ Development Guidelines

### Veilig & Betrouwbaar

### Code Style- Geverifieerde professionals en transparante prijzen  

- Use TypeScript for all files

- Follow ESLint & Prettier configurations---

- Use functional components with hooks

- Keep components small and focused## 🛠️ Kernfunctionaliteit

- Geavanceerde zoek- en filteropties  

### Git Workflow- Provider profielen met portfolio's  

- Create feature branches from `main`- Offerte aanvraag systeem  

- Write descriptive commit messages- Quote & booking management  

- Test before pushing- Review & rating systeem  

- Create pull requests for review- Role-based dashboards  

- Admin moderatie tools  

### Testing- Responsive design  

- Test locally before deployment

- Verify Docker build works---

- Check database migrations

- Test on multiple devices## 📊 Project Status

- **MVP Fase 1** – ✓ Voltooid  

---  Alle kernfunctionaliteit is geïmplementeerd en klaar voor gebruik  

- **Fase 2 - Optimalisatie** – Gepland  

## 🔧 Troubleshooting- **Fase 3 - Groei Features** – Gepland  



### Common Issues---



**Database Connection Issues**## ❓ Waarom Deze Stack?

```bash

# Check DATABASE_URL format### Modern & Schaalbaar

echo $env:DATABASE_URLNext.js met TypeScript en React zorgt voor een snelle, betrouwbare en schaalbare full-stack architectuur. Door frontend en backend in één framework te combineren, blijft de codebase compact en onderhoudbaar. PostgreSQL in combinatie met Prisma biedt een stabiele, futureproof basis voor relationele data zoals boekingen, offertes en reviews.



# Test connection### Developer Experience

npx prisma db pushTailwind CSS en Shadcn/ui maken het mogelijk om snel mooie, consistente UI's te bouwen. TypeScript end-to-end en Prisma zorgen voor sterke type safety en minder bugs. De integratie met Next.js API Routes en Auth.js geeft een duidelijke structuur voor authenticatie en business logica.

```

### Performance & SEO

**Build Failures**Server-side rendering en statische generatie via Next.js verbeteren performance en SEO voor de marketplace. Optimalisaties zoals caching, lazy loading en code splitting zijn first-class ondersteund.

```bash

# Clear Next.js cache---

Remove-Item -Recurse -Force .next

## 🏗️ Systeem Architectuur – 3-Tier

# Reinstall dependencies

Remove-Item -Recurse -Force node_modules1. **Presentation Layer (Frontend)**  

npm install   Next.js/React applicatie met Tailwind CSS en Shadcn/ui voor UI. Client communiceert met eigen Next.js API routes en server actions.  

```

2. **Business Logic Layer (Backend)**  

**Docker Issues**   Next.js API Routes en server actions handelen authenticatie, autorisatie, data validatie en business rules (offertes, boekingen, reviews, provider-verificatie).  

```bash

# Rebuild image3. **Data Layer (Database)**  

docker-compose down   PostgreSQL database voor gestructureerde en consistente opslag van gebruikers, providers, aanvragen, offertes, boekingen en reviews. Prisma verzorgt type-veilige queries en migrations. Bestanden (images/documenten) worden opgeslagen via S3-compatibele storage.  

docker-compose build --no-cache

docker-compose up---

```

## 🔒 Security Features

---- JWT-based authenticatie of secure sessions via Auth.js  

- Role-based access control (RBAC)  

## 📞 Support- HTTPS/TLS encryptie  

- Input validatie & sanitization  

- 📧 Email: support@eventiphy.site- CORS policy (indien nodig voor externe integraties)  

- 📖 Docs: [docs/](docs/)- Rate limiting  

- 🐛 Issues: [GitHub Issues](https://github.com/Awierdo-Hacks/Eventiphy/issues)- XSS & CSRF protectie  

- Secure password hashing  

---

---

## 📄 License

## 📑 Product Requirements Document (PRD)

ISC License - See LICENSE file for details

**Versie 1.0 – 27 Oktober 2025**

---

### 1. Productoverzicht

## 🙏 AcknowledgmentsEventiphy is een digitaal platform (web + mobiel) dat het organiseren van evenementen vereenvoudigt door gebruikers te verbinden met dienstverleners zoals cateraars, DJ's, decorateurs, fotografen en locaties. Gebruikers kunnen hun evenement plannen, leveranciers vergelijken, offertes aanvragen, en direct boeken — allemaal binnen één omgeving.



Built with:### 2. Doelgroep

- [Next.js](https://nextjs.org/)- **Gebruikers (Consumenten)**  

- [Prisma](https://www.prisma.io/)  Mensen (25-45 jaar) die bruiloften, verjaardagen of bedrijfsfeesten plannen.  

- [Tailwind CSS](https://tailwindcss.com/)  Doel: Snel betrouwbare leveranciers vinden, prijzen vergelijken, veilig boeken.  

- [Shadcn/ui](https://ui.shadcn.com/)

- **Dienstverleners (Aanbieders)**  

---  DJ's, cateraars, decorateurs, fotografen, eventlocaties.  

  Doel: Klantenwerving, reviews opbouwen, eenvoudig factureren.  

**Made with ❤️ for the event planning community**

- **Admin (Eventiphy-team)**  
  Beheerders van het platform.  
  Doel: Overzicht, moderatie, betalingen beheren, support.  

### 3. Doelstellingen & KPI's
| Doelstelling | KPI |
|--------------|-----|
| Snelle matching tussen klant en aanbieder | 80% binnen 24u beantwoord |
| Hoge conversie van aanvraag → boeking | >20% |
| Gebruikerstevredenheid | Gem. rating >
