


# 🎨 Eventiphy Design Guide  
**Versie 1.0 — 2025**

Deze gids beschrijft de visuele en structurele richtlijnen van het Eventiphy-platform.  
Het doel: **één consistente, schaalbare en futureproof UI/UX**, zodat alle toekomstige pagina’s en functies automatisch coherent blijven.

---

## 🧭 1. Merkidentiteit & Ervaring

### Kernwaarden
- **Licht & vriendelijk** — toegankelijk, niet te zakelijk.  
- **Premium eenvoud** — moderne elegantie zonder overdaad.  
- **Vertrouwen** — veilige omgeving om diensten te boeken.  
- **Consistentie** — alles voelt als één ecosysteem.

### Ontwerptaal
- Zachte **gradients**, **ronde vormen**, **veel witruimte**.
- Visuele hiërarchie via **typografie en spacing**, niet via harde kleuren.
- **Transparantie**: toon prijzen, status, reviews duidelijk.

---

## 🧱 2. Layout, Grid & Spacing

### Containers
```tsx
<div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">


* Maximale breedte: `max-w-7xl`
* Gecentreerd met automatische marge.
* Padding:

  * Horizontaal: `px-4 sm:px-6 lg:px-8`
  * Verticaal: `py-12` (secties: `py-20`)

### Spacing

* Tussen secties: `py-20`
* Tussen headings & content: 16–24px
* Grid gaps: `gap-6` tot `gap-8`

### Grid patronen

| Pagina type       | Grid example class                                     |
| ----------------- | ------------------------------------------------------ |
| Home / Marketing  | `grid grid-cols-2 md:grid-cols-3 gap-6`                |
| Browse / Results  | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6` |
| Dashboard / Stats | `grid grid-cols-1 md:grid-cols-4 gap-6`                |

---

## 🌈 3. Kleurenpalet

### Brand gradient

```
from-purple-600 via-purple-500 to-amber-500
```

Gebruik dit als **primaire identiteit**:

* Hero headings
* CTA-knoppen
* Icon backgrounds
* Highlight secties

### Achtergrond & oppervlakken

| Type                 | Gradient / kleur                         |
| -------------------- | ---------------------------------------- |
| Hero / Marketing     | `from-purple-100 via-white to-amber-100` |
| Feature secties      | `from-purple-50 to-amber-50`             |
| Kaarten / dashboards | `from-gray-50 to-white`                  |

### Tekstkleuren

* Primair: `text-gray-900`
* Secundair: `text-gray-600`
* Op donkere vlakken: `text-white` of `text-purple-100`

### Statuskleuren

| Status             | Classes                                                   |
| ------------------ | --------------------------------------------------------- |
| Success / Verified | `bg-green-500 text-white` / `bg-green-100 text-green-800` |
| Info               | `bg-blue-100 text-blue-800`                               |
| Warning            | `bg-yellow-100 text-yellow-800`                           |
| Error              | `bg-red-100 text-red-800`                                 |
| Secondary          | `bg-purple-100 text-purple-700`                           |

**Regel:** statuskleuren blijven identiek over **alle pagina’s** (Requests, Quotes, Bookings, Admin).

---

## ✍️ 4. Typografie

### Fontstijl

* Sans-serif, clean en modern (bijv. **Inter**, **Poppins** of **Plus Jakarta Sans**)
* Gebruik slechts 2–3 gewichten (400, 600, 700)

### Hiërarchie

| Element         | Tailwind style                        |
| --------------- | ------------------------------------- |
| Hero title      | `text-5xl md:text-7xl font-bold`      |
| Sectietitel     | `text-4xl font-bold`                  |
| Subtitel / lead | `text-xl md:text-2xl text-gray-600`   |
| Card title      | `text-xl font-semibold text-gray-900` |
| Body tekst      | `text-base text-gray-600`             |
| Meta / label    | `text-sm text-gray-500`               |

### Gradients in tekst

```tsx
<span className="bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
  Jouw Droomfeest
</span>
```

### Tone of voice

* Nederlands, **jij-vorm**, vriendelijk en actief.
* Korte zinnen, nooit jargon.

---

## 🧩 5. Iconografie

### Library

* **Lucide-react**
  → consistent, dunne lijnen, moderne stijl.

### Maten

* Hero/feature icons: `w-8 h-8`
* Inline icons (buttons, badges): `w-4 h-4`

### Gebruik

* Functioneel, niet decoratief.
* 8px spacing tussen icon & tekst.
* Gradient achtergrond alleen voor key categories of features.

---

## 🧺 6. Cards & Component Surfaces

### Basisstijl

```tsx
<Card className="bg-white border-2 border-gray-100 rounded-3xl shadow-lg p-6 hover:shadow-2xl transition">
```

### Hover states

* Zachte schaal of verticale lift:

  * `hover:-translate-y-1`, `hover:scale-105`
* Nooit te felle schaduw.

### Voorbeelden

| Type               | Kenmerken                                          |
| ------------------ | -------------------------------------------------- |
| **Category Card**  | Grote gradient-icon, titel, beschrijving, klikbaar |
| **Provider Card**  | Foto, naam, locatie, rating, verified badge        |
| **Detail Card**    | Titel, locatie, beschrijving, contactinfo          |
| **Stats Card**     | Label, waarde, ronde icon, border                  |
| **Dashboard Card** | Compact, consistente paddings & iconpositie        |

---

## 🧾 7. Forms & Inputs

### Stijl

```tsx
<Input className="rounded-xl border-2 border-gray-100 h-12" />
<SelectTrigger className="rounded-xl border-2 border-gray-100" />
<Textarea className="rounded-xl border-2 border-gray-100 resize-none" />
```

* Labels: boven veld, `text-sm font-medium text-gray-700`
* Plaatsbeschrijving: helder en menselijk (“Bijv. 50 gasten”)
* Groepen: gebruik `space-y-6` voor verticale ritme

### Buttons

| Type      | Voorbeeld                                                                                                         |
| --------- | ----------------------------------------------------------------------------------------------------------------- |
| Primary   | `bg-gradient-to-r from-purple-600 to-amber-500 hover:from-purple-700 hover:to-amber-600 text-white font-semibold` |
| Secondary | `variant="outline"` of `bg-white border text-gray-700 hover:bg-gray-50`                                           |
| Ghost     | Voor terug / cancel-acties                                                                                        |

### Regels

* Altijd **één primaire CTA** per formulier.
* Gebruik consistent validatiegedrag (rood voor fouten, subtiele tekstfeedback).

---

## ⚙️ 8. Navigatie & Paginastructuur

### Topbar

* Links: Eventiphy-logo
* Midden: Hoofdlinks (Home, Browse, Dashboard)
* Rechts: User avatar + dropdown
* `bg-white shadow-sm sticky top-0 z-50`

### Paginapatroon

1. **Hero / Header**
2. **Filters of Statistieken (optioneel)**
3. **Hoofdcontent (Cards / Lists / Tables)**
4. **CTA of samenvatting**

Nieuwe pagina’s moeten deze logica behouden.

---

## 🌀 9. Motion & Interactie

### Framework

* **Framer Motion**

### Standaardanimaties

```tsx
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  transition={{ delay: 0.1 }}
>
```

### Hover-interactie

* Cards: lichte lift (`y: -4`, `scale: 1.02`)
* Buttons: subtiele kleurshift, geen springende effecten
* Afbeeldingen: `scale-110` bij hover

### Richtlijn

> Animatie ondersteunt de ervaring, nooit afleiden.

---

## 📱 10. Responsiveness

| Breakpoint | Beschrijving                             |
| ---------- | ---------------------------------------- |
| `sm:`      | Compact mobiel (één kolom)               |
| `md:`      | Tablet (2 kolommen of tabs naast elkaar) |
| `lg:`      | Desktop (volledige grid, sticky sidebar) |
| `xl:`      | Extra spacing, max 1280px contentbreedte |

Gebruik Tailwind responsive prefixes (`sm: md: lg:`) consequent.

---

## 🧮 11. Pagina Templates

### 1. **Home / Marketing**

* Hero met gradient heading
* Centrale zoekbalk in card
* Categorie grid
* CTA-sectie onderaan

### 2. **Browse / Discovery**

* Filtercard boven
* Grid met provider cards
* Empty + loading states

### 3. **Detail (ProviderDetail)**

* Hero image gallery
* Linkerkolom info, rechter sidebar sticky
* Reviews-sectie onderin

### 4. **Form Flow (RequestQuote)**

* Eén card, grote titel
* Formuliervelden met duidelijke labels
* Onder: primaire en secundaire button

### 5. **User Dashboard**

* Header met gradient tekst
* Stats grid (4 cards)
* Tabs (Aanvragen, Offertes, Boekingen)
* Lists → cards met statusbadges

### 6. **Provider Dashboard**

* Zelfde layout als user dashboard
* Tabs: Aanvragen / Offertes / Boekingen
* Offerte pop-up via dialog

### 7. **Admin Dashboard**

* Stats cards bovenaan
* Tabs: Overzicht, Providers, Gebruikers, Reviews
* Tabellen met badges & actieknoppen

**Toekomstige pagina’s** (Berichten, Analytics, Payouts, etc.) volgen één van deze patronen.

---

## 🧱 12. Component Library (samenvatting)

| Component                           | Doel                        |
| ----------------------------------- | --------------------------- |
| `<Button>`                          | Acties / CTA’s              |
| `<Card>`                            | Basiscontainer voor content |
| `<Badge>`                           | Status / label              |
| `<Input>`, `<Select>`, `<Textarea>` | Forms                       |
| `<Tabs>`, `<TabsTrigger>`           | Subpagina’s                 |
| `<Skeleton>`                        | Loading states              |
| `<EmptyState>`                      | Geen resultaten             |
| `<Dialog>`                          | Modals / pop-ups            |
| `<Table>`                           | Dataoverzichten (Admin)     |

**Componentregels**

* Gebruik bestaande componenten voor nieuwe features.
* Maak variaties binnen deze stijlen, nooit compleet nieuwe visuele patronen.

---

## 🧩 13. Consistentieprincipes

1. **Herhaal, niet heruitvinden** – elk design bouwt voort op bestaande patronen.
2. **Gebruik kleur & animatie als accent**, niet als decoratie.
3. **Elk scherm heeft een duidelijk doel & CTA.**
4. **Whitespace is een design element.**
5. **Mobiel-first denken** — elke feature werkt perfect op mobiel.

---

## ✅ 14. Toekomstbestendig uitbreiden

Nieuwe modules (zoals berichten, notificaties, betalingen, analytics)
moeten deze kernprincipes volgen:

* Zelfde containers, spacing en gradient CTA’s.
* Zelfde statusbadges / kleurcodes.
* Zelfde cardstructuur of tablelayout.
* Zelfde motion presets.

**Zo blijft Eventiphy visueel één merk — ongeacht hoeveel features worden toegevoegd.**

---

*© 2025 Eventiphy Design System — versie 1.0*
*Ontworpen met Next.js, Tailwind, Shadcn/UI & Framer Motion.*

