# 🏗️ Bouwplan: Event Groepering & Planning Systeem

## Document Informatie

| Item | Waarde |
|------|--------|
| **Project** | Eventify - Klanten Flow Verbetering |
| **Versie** | 1.0 |
| **Datum** | 27 januari 2026 |
| **Doel** | Implementatie Event Shell systeem met offerte-groepering |
| **Auteur** | Product Team |
| **Voor** | Software Architect |

---

## 📋 Inhoudsopgave

1. [Overzicht & Context](#1-overzicht--context)
2. [Database Wijzigingen](#2-database-wijzigingen)
3. [API Routes](#3-api-routes)
4. [Frontend Wijzigingen](#4-frontend-wijzigingen)
5. [Nieuwe Componenten](#5-nieuwe-componenten)
6. [Design Specificaties](#6-design-specificaties)
7. [Implementatie Volgorde](#7-implementatie-volgorde)

---

## 1. Overzicht & Context

### 1.1 Huidige Situatie

De klant kan momenteel:
- Providers browsen via `/app/browse/page.tsx`
- Offertes aanvragen via `/app/request-quote/[id]/page.tsx`
- Offertes/aanvragen bekijken in `/app/dashboard/page.tsx`

**Probleem:** Offertes staan los van elkaar. Bij meerdere providers voor één event (bijv. bruiloft) is er geen overzicht of groepering.

### 1.2 Gewenste Situatie

- Klant maakt eerst een **Event** aan (eenmalige actie)
- Event bevat **Slots** (provider-categorieën zoals Catering, Muziek, etc.)
- Offertes worden gekoppeld aan een Event Slot
- Dashboard toont events met hun voortgang

### 1.3 Kernprincipes

| Principe | Betekenis |
|----------|-----------|
| **Event = Shell** | Event aanmaken is structuur bepalen, niet direct offertes versturen |
| **Graduele Invulling** | Klant vult slots in op eigen tempo via Dashboard |
| **Scheiding** | "Nieuw Event" wizard ≠ Dashboard beheer |

---

## 2. Database Wijzigingen

### 2.1 Nieuwe Models Toevoegen

**Locatie:** `prisma/schema.prisma`

Voeg de volgende models toe **NA** het bestaande `Message` model:

#### Nieuwe Enums

```prisma
enum EventType {
  WEDDING
  BIRTHDAY
  CORPORATE
  FESTIVAL
  CUSTOM
}

enum EventStatus {
  PLANNING
  ACTIVE
  COMPLETED
  CANCELLED
}

enum SlotStatus {
  EMPTY
  SEARCHING
  QUOTES_REQUESTED
  QUOTES_RECEIVED
  BOOKED
}

enum ProviderCategory {
  CATERING
  MUSIC
  PHOTOGRAPHY
  DECORATION
  VENUE
  ENTERTAINMENT
  VIDEOGRAPHY
  TRANSPORT
  ACCOMMODATION
  SECURITY
  SANITARY
  CAKE
  FLOWERS
  MC
  OTHER
}
```

#### Model: Event

```prisma
model Event {
  id              String       @id @default(cuid())
  customer_id     String
  name            String
  event_type      EventType
  event_date      DateTime?
  location        String?
  guest_count     Int?
  budget_min      Float?
  budget_max      Float?
  status          EventStatus  @default(PLANNING)
  created_at      DateTime     @default(now())
  updated_at      DateTime     @updatedAt

  // Relations
  customer        User         @relation(fields: [customer_id], references: [id], onDelete: Cascade)
  slots           EventSlot[]

  @@map("events")
}
```

#### Model: EventSlot

```prisma
model EventSlot {
  id               String           @id @default(cuid())
  event_id         String
  category         ProviderCategory
  custom_name      String?          // Voor custom slots
  is_required      Boolean          @default(true)
  display_order    Int              @default(0)
  status           SlotStatus       @default(EMPTY)
  booked_quote_id  String?          @unique
  created_at       DateTime         @default(now())
  updated_at       DateTime         @updatedAt

  // Relations
  event            Event            @relation(fields: [event_id], references: [id], onDelete: Cascade)
  quotes           Quote[]          @relation("SlotQuotes")
  booked_quote     Quote?           @relation("BookedQuote", fields: [booked_quote_id], references: [id])

  @@map("event_slots")
}
```

### 2.2 Bestaande Models Aanpassen

#### User Model - Toevoegen relatie

**In:** `prisma/schema.prisma` - Model `User`

Voeg toe aan relations:
```prisma
events           Event[]
```

#### Quote Model - Toevoegen optionele slot koppeling

**In:** `prisma/schema.prisma` - Model `Quote`

Voeg toe:
```prisma
event_slot_id    String?

// Toevoegen aan relations:
event_slot       EventSlot?       @relation("SlotQuotes", fields: [event_slot_id], references: [id], onDelete: SetNull)
booked_for_slot  EventSlot?       @relation("BookedQuote")
```

### 2.3 Migratie Uitvoeren

Na aanpassingen:
```bash
npx prisma migrate dev --name add_event_system
```

---

## 3. API Routes

### 3.1 Nieuwe Route: Events CRUD

**Locatie:** Maak aan `app/api/events/route.ts`

#### GET - Lijst events van klant
- Haal `customer_id` uit sessie via bestaande `getSession()` uit `lib/auth.ts`
- Include: `slots` met hun `quotes` count en `status`
- Sorteer op `created_at` desc

#### POST - Nieuw event aanmaken
**Request body:**
```typescript
{
  name: string;
  eventType: EventType;
  eventDate?: string;
  location?: string;
  guestCount?: number;
  budgetMin?: number;
  budgetMax?: number;
  slots: Array<{
    category: ProviderCategory;
    isRequired: boolean;
    displayOrder: number;
  }>;
}
```

**Let op:** Gebruik bestaande authenticatie pattern uit `app/api/requests/route.ts`

### 3.2 Nieuwe Route: Event Detail

**Locatie:** Maak aan `app/api/events/[id]/route.ts`

#### GET - Event met slots en quotes
- Valideer dat user eigenaar is van event
- Include: `slots` → `quotes` → `provider`
- Bereken per slot: aantal quotes, totaal bedrag range

#### PATCH - Update event
- Alleen basis info (name, date, location, guestCount, budget)
- Structuur wijzigen via aparte route

#### DELETE - Event verwijderen
- Soft delete via status = CANCELLED
- Quotes blijven bestaan maar worden ontkoppeld

### 3.3 Nieuwe Route: Event Slots

**Locatie:** Maak aan `app/api/events/[id]/slots/route.ts`

#### POST - Slot toevoegen aan event
```typescript
{
  category: ProviderCategory;
  customName?: string;
  isRequired: boolean;
}
```

#### DELETE - Slot verwijderen
- Via `app/api/events/[id]/slots/[slotId]/route.ts`
- Check: als slot geboekte quote heeft → error
- Ontkoppel quotes (zet `event_slot_id` naar null)

### 3.4 Bestaande Route Aanpassen: Quotes

**Locatie:** `app/api/quotes/route.ts`

#### Toevoegen aan POST:
- Optionele `eventSlotId` parameter
- Als meegegeven: koppel quote aan slot, update slot status naar `QUOTES_REQUESTED`

**Locatie:** `app/api/quotes/[id]/route.ts`

#### Toevoegen aan PATCH (action: 'accept'):
- Als quote gekoppeld aan slot: update slot `booked_quote_id` en status naar `BOOKED`

### 3.5 Nieuwe Route: Quote-Slot Koppeling

**Locatie:** Maak aan `app/api/quotes/[id]/link/route.ts`

#### POST - Koppel bestaande quote aan slot
```typescript
{
  eventSlotId: string;
}
```
- Valideer: quote is van dezelfde customer
- Valideer: slot categorie matcht quote provider categorie
- Update quote `event_slot_id`

#### DELETE - Ontkoppel quote van slot
- Zet `event_slot_id` naar null

### 3.6 Nieuwe Route: Event Templates

**Locatie:** Maak aan `app/api/events/templates/route.ts`

#### GET - Lijst beschikbare templates
Return statische data:

```typescript
const templates = {
  WEDDING: {
    name: 'Bruiloft',
    icon: '💒',
    requiredSlots: ['VENUE', 'CATERING', 'MUSIC', 'PHOTOGRAPHY', 'DECORATION'],
    optionalSlots: ['MC', 'VIDEOGRAPHY', 'TRANSPORT', 'ACCOMMODATION', 'FLOWERS', 'CAKE']
  },
  BIRTHDAY: {
    name: 'Verjaardag',
    icon: '🎂',
    requiredSlots: ['VENUE', 'CATERING', 'ENTERTAINMENT'],
    optionalSlots: ['DECORATION', 'PHOTOGRAPHY', 'CAKE']
  },
  CORPORATE: {
    name: 'Zakelijk Event',
    icon: '🏢',
    requiredSlots: ['VENUE', 'CATERING'],
    optionalSlots: ['PHOTOGRAPHY', 'ENTERTAINMENT']
  },
  FESTIVAL: {
    name: 'Festival',
    icon: '🎉',
    requiredSlots: ['VENUE', 'MUSIC', 'SECURITY', 'CATERING'],
    optionalSlots: ['DECORATION', 'SANITARY']
  },
  CUSTOM: {
    name: 'Eigen samenstelling',
    icon: '📋',
    requiredSlots: [],
    optionalSlots: []
  }
};
```

---

## 4. Frontend Wijzigingen

### 4.1 Navigatie Aanpassen

**Locatie:** `components/layout/Navigation.tsx`

**Huidige situatie (regel 9-13):**
```typescript
const navigation = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Browse', href: '/browse', icon: Search },
  { name: 'Documentatie', href: '/docs', icon: FileText },
];
```

**Instructie:**
1. Voeg nieuwe navigatie-item toe ALLEEN voor ingelogde CUSTOMER users
2. Positie: na "Browse", voor "Documentatie"
3. Of beter: als prominente knop rechts naast "Dashboard" knop

**Alternatief (aanbevolen):**
In het rechter gedeelte van de navigatie (rond regel 75-85), voeg een extra knop toe **voor** de Dashboard knop wanneer user role === 'CUSTOMER':

```
[+ Nieuw Event]  [Dashboard]  [User info]
```

**Styling:**
- Gebruik `variant="outline"` met paarse border
- Icon: `Plus` uit lucide-react
- Tekst: "+ Nieuw Event"

### 4.2 Dashboard Pagina Herstructureren

**Locatie:** `app/dashboard/page.tsx`

**Dit is een groot bestand (798 regels). Volg deze stappen:**

#### Stap 1: State toevoegen

Rond regel 90-95, voeg toe:
```typescript
const [events, setEvents] = useState<Event[]>([]);
```

#### Stap 2: Data fetchen

In de `fetchDashboardData` functie (rond regel 115), voeg toe aan de Promise.all:
```typescript
fetch('/api/events')
```

En verwerk de response.

#### Stap 3: Tabs uitbreiden

**Huidige tabs (rond regel 410):**
- Overzicht
- Aanvragen
- Offertes
- Boekingen

**Nieuwe structuur:**
- **Mijn Events** (NIEUW - wordt default tab)
- Ongekoppelde Offertes (was: Offertes, maar gefilterd op quotes zonder event_slot_id)
- Boekingen

**Let op:** De huidige "Aanvragen" tab kan vervallen of worden samengevoegd, omdat aanvragen nu via Events lopen.

#### Stap 4: Stats aanpassen

**Huidige stats (regel 291-320):**
- Actieve Aanvragen
- Ontvangen Offertes
- Bevestigde Boekingen
- Totaal Uitgegeven

**Nieuwe stats:**
- Actieve Events
- Open Slots (slots met status EMPTY of SEARCHING)
- Ontvangen Offertes
- Totaal Geboekt (€)

### 4.3 Browse Pagina Aanpassen

**Locatie:** `app/browse/page.tsx`

**Geen grote wijzigingen nodig.** De browse pagina blijft functioneren zoals nu.

**Kleine toevoeging:**
Bij de provider cards, de "Offerte aanvragen" link houdt al rekening met redirect naar `/request-quote/[id]`. Dit blijft werken.

### 4.4 Request Quote Pagina Aanpassen

**Locatie:** `app/request-quote/[id]/page.tsx`

#### Toevoegen: Event/Slot selectie

Na het laden van de provider data, voeg een sectie toe:

**Positie:** Boven het formulier (rond regel 150+)

**Functionaliteit:**
1. Fetch user's events: `GET /api/events`
2. Toon dropdown/cards: "Koppel aan event"
3. Opties:
   - Lijst van bestaande events (toon alleen events waar provider categorie past bij een slot)
   - "Nieuw event aanmaken" → redirect naar `/events/new?provider={id}`
   - "Later koppelen" → quote wordt aangemaakt zonder event_slot_id

**UI Pattern:** 
Gebruik bestaande Card component met radio-achtige selectie (vergelijkbaar met budget_range selectie in het formulier).

#### Aanpassen: Form submit

In `handleSubmit` (rond regel 90):
- Voeg `eventSlotId` toe aan request body als geselecteerd
- Update API call naar `/api/requests`

---

## 5. Nieuwe Componenten

### 5.1 Event Creation Wizard

**Locatie:** Maak aan `app/events/new/page.tsx`

**Structuur:** Multi-step wizard (3 stappen)

#### Stap 1: Event Type Selectie
- Grid van 5 cards (Wedding, Birthday, Corporate, Festival, Custom)
- Elke card: icon, naam, korte beschrijving
- Klik → ga naar stap 2

#### Stap 2: Slots Configureren
- Toon template slots voor gekozen type
- Required slots: aangevinkt, kan uitgevinkt worden (met bevestiging)
- Optional slots: uitgevinkt, kan aangevinkt worden
- Custom: lege lijst met "Voeg categorie toe" dropdown
- Onderaan: "Voeg eigen categorie toe" optie

#### Stap 3: Event Details
- Naam (verplicht)
- Datum (optioneel)
- Locatie (optioneel)
- Aantal gasten (optioneel)
- Budget range (optioneel)
- Submit → redirect naar dashboard met nieuwe event open

**Design:** Volg wizard/stepper pattern uit `docs/DESIGN_GUIDE.md`:
- Minimale UI
- Lineair proces
- "Volgende →" buttons
- Progress indicator bovenaan

### 5.2 Event Card Component

**Locatie:** Maak aan `components/events/EventCard.tsx`

**Props:**
```typescript
interface EventCardProps {
  event: {
    id: string;
    name: string;
    eventType: EventType;
    eventDate?: string;
    location?: string;
    status: EventStatus;
    slots: Array<{
      id: string;
      category: ProviderCategory;
      status: SlotStatus;
      quotesCount: number;
      bookedProvider?: string;
    }>;
  };
  onOpenEvent: (id: string) => void;
}
```

**Visuele elementen:**
- Event naam + type icon
- Datum (indien ingevuld)
- Progress bar (X van Y slots ingevuld)
- Slots als horizontale badges met status kleuren
- "Beheer Event →" knop

**Styling:** Gebruik bestaande Card component styling uit `docs/DESIGN_GUIDE.md`:
```tsx
<Card className="bg-white border-2 border-gray-100 rounded-3xl shadow-lg p-6 hover:shadow-2xl transition">
```

### 5.3 Event Detail View Component

**Locatie:** Maak aan `components/events/EventDetailView.tsx`

Dit component wordt getoond in het Dashboard wanneer een event geselecteerd is.

**Structuur:**
```
┌─────────────────────────────────────────────────────────────────┐
│ [← Terug]  Event Naam                           [Bewerk] [...]  │
├─────────────────────────────────────────────────────────────────┤
│ 📅 Datum | 📍 Locatie | 👥 Gasten | 💰 Budget                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  Slot Cards (grid 2-3 kolommen)                                │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐            │
│  │ 🍽️ Catering  │ │ 🎵 Muziek    │ │ 🌸 Decoratie │            │
│  │ [Geboekt]    │ │ [2 offertes] │ │ [Zoek →]     │            │
│  └──────────────┘ └──────────────┘ └──────────────┘            │
│                                                                 │
│  [+ Slot toevoegen]                                            │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│ Kostenoverszicht                                               │
│ ────────────────                                               │
│ Catering (geboekt)        €4.500                               │
│ Muziek (hoogste offerte)  €800 - €1.200                        │
│ ─────────────────────────────────────────────                  │
│ Geschat totaal:           €5.300 - €5.700                      │
└─────────────────────────────────────────────────────────────────┘
```

### 5.4 Slot Card Component

**Locatie:** Maak aan `components/events/SlotCard.tsx`

**Props:**
```typescript
interface SlotCardProps {
  slot: {
    id: string;
    category: ProviderCategory;
    customName?: string;
    status: SlotStatus;
    quotes: Quote[];
    bookedQuote?: Quote;
  };
  onFindProviders: (slotId: string, category: string) => void;
  onViewQuotes: (slotId: string) => void;
  onRemoveSlot: (slotId: string) => void;
}
```

**Status weergave:**
| Status | Weergave |
|--------|----------|
| EMPTY | Grijze card, "Zoek providers →" knop |
| SEARCHING | Blauwe tint, "Zoeken..." indicator |
| QUOTES_REQUESTED | Gele tint, "Wacht op offertes" |
| QUOTES_RECEIVED | Paarse tint, "X offertes" badge, "Bekijk →" knop |
| BOOKED | Groene tint, Provider naam, "✓ Geboekt" |

**Let op:** Hergebruik de bestaande `getStatusBadge` functie uit `app/dashboard/page.tsx` (regel 261-278) als basis voor status kleuren.

### 5.5 Ongekoppelde Offertes Component

**Locatie:** Maak aan `components/events/UnlinkedQuotes.tsx`

Toont quotes die geen `event_slot_id` hebben.

**Per quote tonen:**
- Provider naam
- Bedrag
- Aanvraag datum
- "Koppel aan event" dropdown

**Dropdown opties:**
- Lijst events van user
- Per event: alleen slots tonen waar categorie matcht
- Na selectie: call `POST /api/quotes/[id]/link`

---

## 6. Design Specificaties

### 6.1 Referentie naar Design Guide

Alle componenten MOETEN de richtlijnen volgen uit `docs/DESIGN_GUIDE.md`.

**Key references:**

| Element | Specificatie |
|---------|--------------|
| Cards | `border-2 border-gray-100 rounded-3xl shadow-lg` |
| Primary Button | `gradient-brand` class (al gedefinieerd in project) |
| Status kleuren | Zie sectie 3 "Kleurenpalet" in Design Guide |
| Spacing | `gap-6` tussen cards, `p-6` padding in cards |
| Typography | Gradient text voor headings: `gradient-text` class |

### 6.2 Nieuwe Status Kleuren voor Slots

Voeg toe aan bestaand systeem (consistent met Design Guide):

| Slot Status | Classes |
|-------------|---------|
| EMPTY | `bg-gray-100 text-gray-600` |
| SEARCHING | `bg-blue-100 text-blue-800` |
| QUOTES_REQUESTED | `bg-yellow-100 text-yellow-800` |
| QUOTES_RECEIVED | `bg-purple-100 text-purple-800` |
| BOOKED | `bg-green-100 text-green-800` |

### 6.3 Category Icons Mapping

Maak een helper in `lib/eventHelpers.ts`:

```typescript
export const categoryIcons: Record<ProviderCategory, string> = {
  CATERING: '🍽️',
  MUSIC: '🎵',
  PHOTOGRAPHY: '📸',
  DECORATION: '✨',
  VENUE: '🏛️',
  ENTERTAINMENT: '🎭',
  VIDEOGRAPHY: '🎬',
  TRANSPORT: '🚗',
  ACCOMMODATION: '🏨',
  SECURITY: '🛡️',
  SANITARY: '🚽',
  CAKE: '🎂',
  FLOWERS: '💐',
  MC: '🎤',
  OTHER: '📦',
};

export const categoryNames: Record<ProviderCategory, string> = {
  CATERING: 'Catering',
  MUSIC: 'Muziek & DJ',
  PHOTOGRAPHY: 'Fotografie',
  DECORATION: 'Decoratie',
  VENUE: 'Locatie',
  ENTERTAINMENT: 'Entertainment',
  VIDEOGRAPHY: 'Videografie',
  TRANSPORT: 'Vervoer',
  ACCOMMODATION: 'Accommodatie',
  SECURITY: 'Beveiliging',
  SANITARY: 'Sanitair',
  CAKE: 'Taart',
  FLOWERS: 'Bloemen',
  MC: 'Ceremoniemeester',
  OTHER: 'Overig',
};
```

**Let op:** De bestaande `categories` in `lib/mockData.ts` (regel 1-8) gebruiken vergelijkbare icons. Zorg voor consistentie.

### 6.4 Animaties

Volg Framer Motion patterns uit bestaande code:

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: index * 0.1 }}
>
```

Dit pattern is al in gebruik in `app/dashboard/page.tsx` (regel 395-405).

---

## 7. Implementatie Volgorde

### Fase 1: Database & API Basis (Week 1)

| # | Taak | Afhankelijkheid |
|---|------|-----------------|
| 1.1 | Prisma schema uitbreiden | - |
| 1.2 | Migratie uitvoeren | 1.1 |
| 1.3 | API: `/api/events/templates` | 1.2 |
| 1.4 | API: `/api/events` (GET, POST) | 1.2 |
| 1.5 | API: `/api/events/[id]` (GET, PATCH, DELETE) | 1.4 |
| 1.6 | API: `/api/events/[id]/slots` | 1.5 |

### Fase 2: Event Creation Flow (Week 2)

| # | Taak | Afhankelijkheid |
|---|------|-----------------|
| 2.1 | Helper functies `lib/eventHelpers.ts` | - |
| 2.2 | Event Creation Wizard `/app/events/new/page.tsx` | 1.4, 2.1 |
| 2.3 | Navigatie knop "+ Nieuw Event" toevoegen | 2.2 |
| 2.4 | Test: volledig event aanmaken | 2.3 |

### Fase 3: Dashboard Refactor (Week 3)

| # | Taak | Afhankelijkheid |
|---|------|-----------------|
| 3.1 | EventCard component | 2.1 |
| 3.2 | SlotCard component | 2.1 |
| 3.3 | EventDetailView component | 3.1, 3.2 |
| 3.4 | Dashboard: events state & fetching | 1.4 |
| 3.5 | Dashboard: tabs herstructureren | 3.4 |
| 3.6 | Dashboard: stats aanpassen | 3.4 |
| 3.7 | Test: event bekijken in dashboard | 3.5 |

### Fase 4: Quote-Event Koppeling (Week 4)

| # | Taak | Afhankelijkheid |
|---|------|-----------------|
| 4.1 | API: quote link endpoint | 1.2 |
| 4.2 | API: quotes route aanpassen (eventSlotId) | 4.1 |
| 4.3 | UnlinkedQuotes component | 4.1 |
| 4.4 | Request Quote pagina: event selectie | 4.2 |
| 4.5 | SlotCard: "Zoek providers" flow | 3.2, 4.4 |
| 4.6 | Test: complete flow van event → offerte → boeking | 4.5 |

### Fase 5: Polish & Edge Cases (Week 5)

| # | Taak | Afhankelijkheid |
|---|------|-----------------|
| 5.1 | Empty states voor alle nieuwe views | 4.6 |
| 5.2 | Loading states | 4.6 |
| 5.3 | Error handling | 4.6 |
| 5.4 | Mobile responsive check | 4.6 |
| 5.5 | E2E testing volledige flow | 5.4 |

---

## 8. Checklist voor Software Architect

### Voordat je begint:

- [ ] Lees `docs/DESIGN_GUIDE.md` volledig door
- [ ] Bekijk bestaande dashboard code in `app/dashboard/page.tsx`
- [ ] Bekijk bestaande API patterns in `app/api/requests/route.ts`
- [ ] Bekijk authenticatie helper in `lib/auth.ts`

### Tijdens implementatie:

- [ ] Hergebruik bestaande componenten uit `components/ui/`
- [ ] Hergebruik bestaande layout componenten uit `components/layout/`
- [ ] Volg bestaande TypeScript patterns
- [ ] Zorg dat alle API responses consistente formatting hebben (camelCase)
- [ ] Test elke API route met Postman/Insomnia voordat je frontend bouwt

### Code consistentie:

- [ ] Gebruik `getSession()` uit `lib/auth.ts` voor authenticatie
- [ ] Gebruik `prisma` client uit `lib/prisma.ts`
- [ ] Gebruik Nederlandse teksten in UI (consistent met bestaande app)
- [ ] Gebruik `gradient-text` class voor page headings
- [ ] Gebruik `gradient-brand` class voor primary buttons

---

## 9. Vragen & Onduidelijkheden

Neem contact op met Product Team bij:

1. Onduidelijkheid over business logic
2. Edge cases die niet beschreven zijn
3. Performance concerns bij grote datasets
4. Conflicten met bestaande functionaliteit

---

**Document Einde**

*Laatste update: 27 januari 2026*
