# Monetization Build Plan — Eventiphy Betalingsflow

> **Status:** Ontwerp / Klaar voor implementatie  
> **Versie:** 1.0 — April 2026

---

## Context & Probleemstelling

De boeking-infrastructuur is al gedeeltelijk aanwezig: wanneer een klant een offerte accepteert, maakt het systeem automatisch een `Booking`-record aan met `status: CONFIRMED` en `payment_status: UNPAID`. In het klantdashboard (`/dashboard`, tab "Boekingen") verschijnt al een knop **"Betaling afmaken"**, maar die doet momenteel niets.

Dit document beschrijft de volledige implementatie van:
- Een juridisch correcte bevestigingspopup (**Dienstverleningsovereenkomst**)
- Een checkoutpagina met drie Belgische betaalmethoden
- Volledige back-end betalingsverwerking met webhooks
- Beveiliging op alle lagen

---

## Betaalgateway: Mollie (aanbevolen)

### Waarom Mollie?

| Methode | Mollie | Stripe |
|---------|--------|--------|
| Bancontact | ✅ Native | ✅ Native |
| Payconiq by Bancontact | ✅ Native | ❌ Niet beschikbaar |
| Kredietkaart | ✅ Visa/MC/Amex | ✅ Volledig |
| Belgische markt | ✅ Geoptimaliseerd | Generiek |
| GDPR / BE-regulering | ✅ Volledig | ✅ Volledig |

Mollie is een gereguleerde Nederlandse/Belgische PSP die alle drie gevraagde betaalmethoden ondersteunt via één API. Stripe ondersteunt Payconiq niet en vereist een aparte integratie.

### Installatie

```bash
npm install @mollie/api-client
```

### Benodigde omgevingsvariabelen (`.env.local`)

```env
MOLLIE_API_KEY=live_xxxxxxxxxxxxxxxxxxxxxxx
# Gebruik test_xxx voor lokale ontwikkeling
NEXT_PUBLIC_APP_URL=https://eventiphy.be
```

---

## Gebruikersflow (volledig)

```
Klant accepteert offerte
        │
        ▼
Booking aangemaakt: status=CONFIRMED, payment_status=UNPAID
        │
        ▼
Dashboard → tab "Boekingen" → knop "Betaling afmaken"
        │
        ▼
┌─────────────────────────────────┐
│  DIENSTVERLENINGSOVEREENKOMST   │  ← Pop-up modal
│  (bevestigingspopup)            │
│  • Samenvatting dienstverlening │
│  • Totaalbedrag                 │
│  • Checkbox: akkoord met AV     │
│    → link naar /voorwaarden     │
│  • Knop "Ga naar betaling"      │
│    (uitgeschakeld tot checkbox) │
└─────────────────────────────────┘
        │ akkoord geven
        ▼
/checkout/[bookingId]
        │
        ▼
Kies betaalmethode:
  ○ Bancontact
  ○ Payconiq by Bancontact
  ○ Kredietkaart (Visa/Mastercard)
        │
        ▼
POST /api/payments/create
  → Mollie payment aangemaakt
  → Redirect naar Mollie hosted checkout
        │
        ▼
[Mollie betaalomgeving]
        │
        ▼
Terugkeer → /checkout/[bookingId]/result
  + Mollie webhook → /api/payments/webhook
        │
        ▼
Booking.payment_status = "PAID"
Bevestigingspagina getoond
```

---

## Database Schema Wijzigingen

**Bestand:** `prisma/schema.prisma`

### Nieuw: `PaymentStatus` enum

```prisma
enum PaymentStatus {
  PENDING
  OPEN
  PAID
  FAILED
  CANCELLED
  EXPIRED
  REFUNDED
}
```

### Nieuw: `Payment` model

```prisma
model Payment {
  id                String        @id @default(cuid())
  booking_id        String
  mollie_payment_id String?       @unique
  amount            Float
  currency          String        @default("EUR")
  method            String?       // "bancontact" | "payconiq" | "creditcard"
  status            PaymentStatus @default(PENDING)
  terms_accepted_at DateTime?     // tijdstip akkoord Dienstverleningsovereenkomst
  checkout_url      String?
  created_at        DateTime      @default(now())
  updated_at        DateTime      @updatedAt

  booking Booking @relation(fields: [booking_id], references: [id], onDelete: Cascade)

  @@index([booking_id])
  @@map("payments")
}
```

### Aanpassing `Booking` model

Voeg toe:
```prisma
payments Payment[]
```

### Migratie uitvoeren

```bash
npx prisma migrate dev --name add_payment_model
```

---

## Pre-Payment Popup: Dienstverleningsovereenkomst

### Wat is een Dienstverleningsovereenkomst?

Een **Dienstverleningsovereenkomst** is het juridisch bindende contract tussen de klant (opdrachtgever) en de dienstverlener (opdrachtnemer). Eventiphy treedt op als **bemiddelend platform** en is geen partij in de overeenkomst zelf — dit is beschreven in de bestaande Algemene Voorwaarden op [/voorwaarden](/voorwaarden) (Artikel 4).

De popup fungeert als de digitale ondertekening van dit contract. Door akkoord te gaan, bevestigt de klant:
1. De dienst, het bedrag en de voorwaarden van de dienstverlener
2. Akkoord met de Algemene Voorwaarden van Eventiphy
3. Begrip van de rol van Eventiphy als bemiddelaar

### Component

**Nieuw bestand:** `components/payment/DienstverleningModal.tsx`

**Hergebruikt van:**
- `components/ui/dialog.tsx` — Radix UI dialoogbasis
- `components/ui/confirmation-dialog.tsx` — `DialogButton`, `DialogActions`, `DialogWarning`

**Inhoud van de popup:**

```
┌──────────────────────────────────────────────────────┐
│  📋 Bevestiging & Dienstverleningsovereenkomst        │
├──────────────────────────────────────────────────────┤
│  Dienstverlener:  [Naam provider]                    │
│  Dienst:          [Inbegrepen diensten lijst]         │
│  Evenementdatum:  [event_date]                       │
│  Locatie:         [event_location]                   │
│  Aantal gasten:   [guest_count]                      │
├──────────────────────────────────────────────────────┤
│  Totaalbedrag:    € [final_price]                    │
├──────────────────────────────────────────────────────┤
│  ⚠️  Door verder te gaan sluit u een bindende        │
│  Dienstverleningsovereenkomst af met bovenstaande    │
│  dienstverlener. Eventiphy treedt op als             │
│  bemiddelaar conform Artikel 4 van de Algemene       │
│  Voorwaarden en is geen contractpartij.              │
│                                                      │
│  ☐  Ik heb de Algemene Voorwaarden en               │
│     Privacyverklaring gelezen en ga ermee akkoord.  │
│     → /voorwaarden                                   │
├──────────────────────────────────────────────────────┤
│  [Annuleren]              [Ga naar betaling →]       │
│                           (uitgeschakeld tot ✓)      │
└──────────────────────────────────────────────────────┘
```

**Gedrag:**
- Knop "Ga naar betaling" is `disabled` zolang checkbox niet aangevinkt
- Bij akkoord: timestamp (`terms_accepted_at`) meesturen naar betalings-API
- Redirect naar `/checkout/[bookingId]`

---

## Checkout Pagina

**Nieuw bestand:** `app/checkout/[bookingId]/page.tsx`

### Layout

```
┌──────────────────────────────────────────┐
│  ← Terug naar dashboard                  │
│                                          │
│  Afrekenen                               │
├──────────────────────────────────────────┤
│  Bestelling:                             │
│  ┌────────────────────────────────────┐  │
│  │ [Provider naam]                    │  │
│  │ [Diensten]           €[bedrag]     │  │
│  │ [Datum] · [Locatie]                │  │
│  └────────────────────────────────────┘  │
├──────────────────────────────────────────┤
│  Kies betaalmethode:                     │
│                                          │
│  ┌──────────────────────────────────┐    │
│  │ ○  [Bancontact logo]  Bancontact │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │ ○  [Payconiq logo]   Payconiq   │    │
│  └──────────────────────────────────┘    │
│  ┌──────────────────────────────────┐    │
│  │ ○  [Visa/MC logo]    Kredietkaart│    │
│  └──────────────────────────────────┘    │
├──────────────────────────────────────────┤
│         [  Betaal € XX,XX  ]             │
│    🔒 Beveiligde verbinding via Mollie   │
└──────────────────────────────────────────┘
```

### Logica

1. Server Component: laad booking via `prisma.booking.findUnique()`
2. Valideer: `booking.customer_id === session.user.id` + `payment_status === "UNPAID"`
3. Client Component: betaalmethode selectie + submit
4. Submit → `POST /api/payments/create` → ontvang `checkoutUrl` → `router.push(checkoutUrl)`

---

## API Routes

### `POST /api/payments/create`

**Bestand:** `app/api/payments/create/route.ts`

```typescript
// Veiligheidslogica (volgorde verplicht):
// 1. Session check
// 2. bookingId + termsAcceptedAt uit request body
// 3. Booking ophalen uit DB (bedrag NOOIT van client!)
// 4. Verify booking.customer_id === session.user.id
// 5. Verify booking.payment_status === "UNPAID"
// 6. Check geen open payment bestaat (idempotentie)
// 7. Mollie payment aanmaken:
//    - amount: { value: price.toFixed(2), currency: "EUR" }
//    - method: geselecteerde methode
//    - redirectUrl: /checkout/[bookingId]/result
//    - webhookUrl: /api/payments/webhook
// 8. Payment record opslaan in DB
// 9. Return { checkoutUrl }
```

### `POST /api/payments/webhook`

**Bestand:** `app/api/payments/webhook/route.ts`

```typescript
// Mollie stuurt POST { id: "tr_xxxxx" }
// NOOIT de webhook body vertrouwen — altijd ophalen bij Mollie:
// 1. Haal payment op via mollieClient.payments.get(id)
// 2. Zoek Payment in DB via mollie_payment_id
// 3. Update Payment.status
// 4. Als status === "paid":
//    - Booking.payment_status = "PAID"
//    - (optioneel) bevestigingsmail sturen
// 5. Return Response 200 (Mollie verwacht dit!)
```

### `GET /api/payments/status/[paymentId]`

**Bestand:** `app/api/payments/status/[paymentId]/route.ts`

```typescript
// Gepolled door result-pagina na terugkeer van Mollie
// 1. Auth check
// 2. Payment ophalen via mollie_payment_id
// 3. Eigenaarschap verifiëren
// 4. Return { status, bookingId }
```

---

## Result Pagina

**Bestand:** `app/checkout/[bookingId]/result/page.tsx`

- Leest `?payment=tr_xxxx` query param
- Poll `/api/payments/status/[paymentId]` elke 2s (max 30s)
- Toont:

| Status | Weergave |
|--------|----------|
| `paid` | ✅ "Uw boeking is bevestigd! Bedankt voor uw betaling." + knop "Naar dashboard" |
| `failed` | ❌ "Betaling niet gelukt. Probeer het opnieuw." + knop "Terug naar afrekenen" |
| `cancelled` | ℹ️ "Betaling geannuleerd." + knop "Terug naar afrekenen" |
| Polling | ⏳ Spinner "Betaling wordt verwerkt..." |

---

## Beveiliging

| Maatregel | Implementatie |
|-----------|---------------|
| **Bedrag nooit van client** | `final_price` altijd uit DB in `/api/payments/create` |
| **Authenticatie** | `getServerSession()` op élk payment endpoint |
| **Eigenaarschapscheck** | `booking.customer_id === session.user.id` verplicht |
| **Idempotentie** | Blokkeer nieuwe payment als al `OPEN` payment bestaat |
| **Webhook-validatie** | Payment ophalen bij Mollie API, niet vertrouwen op POST body |
| **Dubbele betaling blokkeren** | Checkout rendeert 403 als `payment_status === "PAID"` |
| **Rate limiting** | Next.js middleware op `/api/payments/*` (bijv. 5 req/min per user) |
| **HTTPS** | Standaard via host (Vercel/Netlify) |
| **Audit trail** | `Payment` model met timestamps + `terms_accepted_at` |
| **Test mode** | `MOLLIE_API_KEY=test_xxx` voor veilig testen zonder echte transacties |

---

## Aanpassing Bestaand Dashboard

**Bestand:** `app/dashboard/page.tsx`

**Wijziging:** De "Betaling afmaken" knop triggert nu de `DienstverleningModal` in plaats van direct te navigeren.

```typescript
// State toevoegen:
const [paymentModalBooking, setPaymentModalBooking] = useState<Booking | null>(null)

// Knop onClick:
onClick={() => setPaymentModalBooking(booking)}

// Modal renderen:
<DienstverleningModal
  booking={paymentModalBooking}
  open={!!paymentModalBooking}
  onClose={() => setPaymentModalBooking(null)}
  onAccept={(bookingId) => router.push(`/checkout/${bookingId}`)}
/>
```

---

## Bestandsoverzicht

### Nieuwe bestanden

```
app/
  checkout/
    [bookingId]/
      page.tsx                    ← Checkoutpagina (methode keuze)
      result/
        page.tsx                  ← Betaalresultaat pagina
  api/
    payments/
      create/
        route.ts                  ← Mollie payment aanmaken
      webhook/
        route.ts                  ← Mollie webhook handler
      status/
        [paymentId]/
          route.ts                ← Status polling endpoint

components/
  payment/
    DienstverleningModal.tsx      ← Pre-payment popup (DVOvereenkomst)
```

### Gewijzigde bestanden

```
prisma/schema.prisma              ← Payment model + PaymentStatus enum
app/dashboard/page.tsx            ← Knop koppelen aan modal
```

### Hergebruikte bestanden (geen wijzigingen)

```
components/ui/dialog.tsx          ← Basis Radix UI dialog
components/ui/confirmation-dialog.tsx  ← DialogButton, DialogActions, DialogWarning
app/voorwaarden/page.tsx          ← Verwezen vanuit modal checkbox (Artikel 4 AV)
lib/prisma.ts                     ← Prisma client
lib/auth.ts                       ← Session helpers
```

---

## Verwijzing naar Juridische Documenten

De bestaande pagina `/voorwaarden` bevat:
- **Algemene Voorwaarden** (17 artikelen, incl. Artikel 4 over Eventiphy als bemiddelaar en Artikel 7 over de 8% commissie)
- **Privacyverklaring** (GDPR-compliant)

De `DienstverleningModal` verwijst expliciet naar deze pagina via een `<a href="/voorwaarden" target="_blank">` link in de checkbox-tekst.

---

## Uitvoervolgorde

1. **Schema** — `Payment` model + `PaymentStatus` enum toevoegen + migreren
2. **DienstverleningModal** — component bouwen, hergebruik bestaande UI
3. **Dashboard** — knop koppelen aan modal
4. **`/api/payments/create`** — Mollie integratie
5. **`/api/payments/webhook`** — webhook handler
6. **Checkout pagina** — `/checkout/[bookingId]`
7. **Result pagina** — `/checkout/[bookingId]/result`
8. **`/api/payments/status`** — polling endpoint
9. **Testen** — Mollie test mode, ngrok voor webhooks lokaal

---

## Verificatie Checklist

- [ ] "Betaling afmaken" opent `DienstverleningModal`
- [ ] Checkbox is verplicht voor "Ga naar betaling"
- [ ] Link naar `/voorwaarden` opent in nieuw tabblad
- [ ] Checkout toont correct bedrag uit DB (niet van client)
- [ ] Betaalmethode keuze werkt (Bancontact / Payconiq / Kaart)
- [ ] Redirect naar Mollie checkout werkt
- [ ] Terugkeer na betaling: result pagina toont correcte status
- [ ] Mollie webhook updatet `payment_status` naar `PAID`
- [ ] Dubbele betaling geblokkeerd (idempotentie)
- [ ] Niet-eigenaar kan checkout niet bereiken (→ redirect of 403)
- [ ] Test mode werkt met `test_xxx` API key
