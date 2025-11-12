# 📖 Eventify Documentatie

Volledige technische documentatie en product blueprint  
🌐 **Live:** [eventiphy.site](https://eventiphy.site)  
🐳 **Docker Ready** | 🚀 **Render Deployment**

---

## 🚀 Quick Start

### Lokale Development

**Optie 1: PostgreSQL via Docker (Aanbevolen)**
```bash
docker run --name eventify-postgres -e POSTGRES_PASSWORD=postgres -p 5432:5432 -d postgres
docker exec -it eventify-postgres psql -U postgres -c "CREATE DATABASE eventify;"
```

**Optie 2: Lokale PostgreSQL Installatie**
1. Download PostgreSQL van https://www.postgresql.org/download/
2. Installeer en start de service
3. Maak een database aan: `CREATE DATABASE eventify;`
4. Update `.env` met jouw credentials

### Project Setup
```bash
# Installeer dependencies
npm install

# Setup database schema
npx prisma migrate dev --name init

# Seed database met demo data
npx prisma db seed

# Start development server
npm run dev
```

### Docker Development
```bash
# Met Docker Compose (incl. PostgreSQL)
docker-compose up

# Of bouw image handmatig
docker build -t eventify:latest .
docker run -p 3000:3000 eventify:latest
```

---

## 🐳 Production Deployment

**Complete Docker setup voor Render + Neon PostgreSQL**

📚 **Zie volledige handleiding:** [DEPLOYMENT.md](./DEPLOYMENT.md)

**Snelle deploy:**
1. Maak Neon database aan → [console.neon.tech](https://console.neon.tech)
2. Push naar GitHub
3. Connect Render → [dashboard.render.com](https://dashboard.render.com)
4. Deploy! 🚀

**Deployment docs:**
- 📘 [DEPLOYMENT.md](./DEPLOYMENT.md) - Complete step-by-step guide
- 📗 [QUICK_START.md](./QUICK_START.md) - Handige commando's
- 📙 [DOCKER_SETUP_COMPLETE.md](./DOCKER_SETUP_COMPLETE.md) - Setup overzicht

---

## �📌 Overzicht
- **Tech Stack**
- **Architectuur**
- **Features**
- **User Flows**
- **PRD**

---

## ⚛️ Frontend
- **React** – UI Framework voor component-based development  
- **Next.js** – Full-stack React framework met ingebouwde routing, API routes en server-side rendering  
- **TypeScript** – Type-safe development voor frontend en backend  
- **Tailwind CSS** – Utility-first CSS framework voor styling  
- **Framer Motion** – Animatie library voor smooth transitions  
- **Shadcn/ui** – Herbruikbare UI componenten  
- **Lucide React** – Icon library  
- **React Router** – Client-side routing (alleen indien nodig naast Next.js routing)  
- **React Query** – Data fetching en caching (voor client-side data management waar gewenst)  

---

## 🔧 Backend
- **Next.js API Routes & Server Actions** – Ingebouwde backendlaag voor business logica en API endpoints  
- **TypeScript** – End-to-end type safety  
- **PostgreSQL** – Relationele database voor consistente en schaalbare data-opslag  
- **Prisma** – ORM voor type-veilige database interacties en migrations  
- **Auth.js (NextAuth)** – Authenticatie en sessiebeheer met ondersteuning voor meerdere providers  
- **JWT / Secure Sessions** – Veilige authenticatie en autorisatie  
- **Bestandsopslag (S3-compatibel, bv. Cloudflare R2 / Supabase Storage)** – Image & document hosting via eigen API-routes  
- **RESTful API** – API architectuur voor interne en externe integraties  

---

## 🔗 Integrations
- **Stripe Connect** – Betalingsverwerking (toekomstig)  
- **Email Service** – Transactionele emails  
- **File Storage** – Image & document hosting  
- **LLM Integration** – AI-powered features  

---

## 🗂️ Data Model & Entities

### ServiceProvider
- `business_name`  
- `category`  
- `location`  
- `price_range`  
- `images`  
- `verified`  

### ServiceRequest
- `customer_email`  
- `provider_id`  
- `event_type`  
- `event_date`  
- `guest_count`  
- `budget`  

### Quote
- `request_id`  
- `provider_id`  
- `amount`  
- `description`  
- `valid_until`  

### Booking
- `quote_id`  
- `customer_email`  
- `provider_id`  
- `amount`  
- `payment_status`  

### Review
- `provider_id`  
- `customer_email`  
- `rating`  
- `title`  
- `comment`  

### Message
- `request_id`  
- `from_email`  
- `to_email`  
- `message`  

### User
- `email`  
- `full_name`  
- `role`  
- `user_type`  

---

## 👥 User Flows

### Klant Flow
1. Browse dienstverleners op categorie/locatie  
2. Bekijk provider profielen en reviews  
3. Vraag offerte aan met event details  
4. Ontvang en vergelijk offertes  
5. Accepteer offerte → Boeking  
6. Event vindt plaats  
7. Schrijf review  

### Provider Flow
1. Registreer als dienstverlener  
2. Maak bedrijfsprofiel aan  
3. Wacht op admin verificatie  
4. Ontvang aanvragen  
5. Verstuur gepersonaliseerde offertes  
6. Beheer boekingen  
7. Ontvang betaling & reviews  

### Admin Flow
1. Monitor platform statistieken  
2. Verifieer nieuwe providers  
3. Beheer gebruikers en content  
4. Modereer reviews  
5. Los geschillen op  
6. Analyseer platform groei  

---

## 🚀 Features
- User authenticatie (customer, provider, admin)  
- Provider zoeken en filteren  
- Gedetailleerde provider profielen  
- Offerte aanvraag systeem  
- Quote management  
- Booking systeem  
- Review & rating systeem  
- Dashboards voor klanten & providers  
- Admin panel voor moderatie  
- Realtime chat tussen klant en provider  
- Email notificaties  
- Stripe betalingsintegratie  
- Kalender synchronisatie  
- Geavanceerde zoekfilters  
- Favorieten systeem  
- Portfolio galerij uitbreidingen  
- AI-powered matching algoritme  
- Meertalige ondersteuning (EN/NL)  
- Mobile app (React Native)  
- Premium provider subscripties  
- Analytics dashboard  
- Rapportage tools  
- API voor third-party integraties  

---

## 📖 Project Overzicht

### Wat is Eventify?
Eventify is een digitaal platform dat het organiseren van evenementen vereenvoudigt door gebruikers te verbinden met dienstverleners zoals cateraars, DJ's, decorateurs, fotografen en locaties. Gebruikers kunnen hun evenement plannen, leveranciers vergelijken, offertes aanvragen, en direct boeken — allemaal binnen één omgeving.

### Voor Klanten
- Vind binnen 5 minuten de perfecte dienstverleners voor jouw event  

### Voor Providers
- Bereik nieuwe klanten en beheer boekingen efficiënt  

### Veilig & Betrouwbaar
- Geverifieerde professionals en transparante prijzen  

---

## 🛠️ Kernfunctionaliteit
- Geavanceerde zoek- en filteropties  
- Provider profielen met portfolio's  
- Offerte aanvraag systeem  
- Quote & booking management  
- Review & rating systeem  
- Role-based dashboards  
- Admin moderatie tools  
- Responsive design  

---

## 📊 Project Status
- **MVP Fase 1** – ✓ Voltooid  
  Alle kernfunctionaliteit is geïmplementeerd en klaar voor gebruik  
- **Fase 2 - Optimalisatie** – Gepland  
- **Fase 3 - Groei Features** – Gepland  

---

## ❓ Waarom Deze Stack?

### Modern & Schaalbaar
Next.js met TypeScript en React zorgt voor een snelle, betrouwbare en schaalbare full-stack architectuur. Door frontend en backend in één framework te combineren, blijft de codebase compact en onderhoudbaar. PostgreSQL in combinatie met Prisma biedt een stabiele, futureproof basis voor relationele data zoals boekingen, offertes en reviews.

### Developer Experience
Tailwind CSS en Shadcn/ui maken het mogelijk om snel mooie, consistente UI's te bouwen. TypeScript end-to-end en Prisma zorgen voor sterke type safety en minder bugs. De integratie met Next.js API Routes en Auth.js geeft een duidelijke structuur voor authenticatie en business logica.

### Performance & SEO
Server-side rendering en statische generatie via Next.js verbeteren performance en SEO voor de marketplace. Optimalisaties zoals caching, lazy loading en code splitting zijn first-class ondersteund.

---

## 🏗️ Systeem Architectuur – 3-Tier

1. **Presentation Layer (Frontend)**  
   Next.js/React applicatie met Tailwind CSS en Shadcn/ui voor UI. Client communiceert met eigen Next.js API routes en server actions.  

2. **Business Logic Layer (Backend)**  
   Next.js API Routes en server actions handelen authenticatie, autorisatie, data validatie en business rules (offertes, boekingen, reviews, provider-verificatie).  

3. **Data Layer (Database)**  
   PostgreSQL database voor gestructureerde en consistente opslag van gebruikers, providers, aanvragen, offertes, boekingen en reviews. Prisma verzorgt type-veilige queries en migrations. Bestanden (images/documenten) worden opgeslagen via S3-compatibele storage.  

---

## 🔒 Security Features
- JWT-based authenticatie of secure sessions via Auth.js  
- Role-based access control (RBAC)  
- HTTPS/TLS encryptie  
- Input validatie & sanitization  
- CORS policy (indien nodig voor externe integraties)  
- Rate limiting  
- XSS & CSRF protectie  
- Secure password hashing  

---

## 📑 Product Requirements Document (PRD)

**Versie 1.0 – 27 Oktober 2025**

### 1. Productoverzicht
Eventify is een digitaal platform (web + mobiel) dat het organiseren van evenementen vereenvoudigt door gebruikers te verbinden met dienstverleners zoals cateraars, DJ's, decorateurs, fotografen en locaties. Gebruikers kunnen hun evenement plannen, leveranciers vergelijken, offertes aanvragen, en direct boeken — allemaal binnen één omgeving.

### 2. Doelgroep
- **Gebruikers (Consumenten)**  
  Mensen (25-45 jaar) die bruiloften, verjaardagen of bedrijfsfeesten plannen.  
  Doel: Snel betrouwbare leveranciers vinden, prijzen vergelijken, veilig boeken.  

- **Dienstverleners (Aanbieders)**  
  DJ's, cateraars, decorateurs, fotografen, eventlocaties.  
  Doel: Klantenwerving, reviews opbouwen, eenvoudig factureren.  

- **Admin (Eventify-team)**  
  Beheerders van het platform.  
  Doel: Overzicht, moderatie, betalingen beheren, support.  

### 3. Doelstellingen & KPI's
| Doelstelling | KPI |
|--------------|-----|
| Snelle matching tussen klant en aanbieder | 80% binnen 24u beantwoord |
| Hoge conversie van aanvraag → boeking | >20% |
| Gebruikerstevredenheid | Gem. rating >
