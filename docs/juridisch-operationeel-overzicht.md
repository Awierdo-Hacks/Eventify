
> Intern referentiedocument — Laatste update: maart 2026
> Dit document bevat alle juridische, financiële en operationele vereisten om Eventiphy volledig officieel te lanceren in België.

---

## Inhoudsopgave

1. [Juridische Structuur & Oprichting](#1-juridische-structuur--oprichting)
   - [1.1 Rechtsvorm kiezen](#11-rechtsvorm-kiezen)
   - [1.2 KBO, BTW & Ondernemingsnummer](#12-kbo-btw--ondernemingsnummer)
   - [1.3 Bankrekening & Boekhouder](#13-bankrekening--boekhouder)
   - [1.4 Studentenonderneming vs BV](#14-studentenonderneming-vs-bv)
2. [Vergunningen & Licenties](#2-vergunningen--licenties)
   - [2.1 Basiskennis Bedrijfsbeheer](#21-basiskennis-bedrijfsbeheer)
   - [2.2 Betalingsdiensten (PSD2 / NBB)](#22-betalingsdiensten-psd2--nbb)
   - [2.3 Verzekeringstussenpersoon (FSMA)](#23-verzekeringstussenpersoon-fsma)
   - [2.4 Sectorale Vergunningen](#24-sectorale-vergunningen)
   - [2.5 GDPR-registratie bij GBA](#25-gdpr-registratie-bij-gba)
3. [Automatische Contracten](#3-automatische-contracten)
   - [3.1 Twee contracttypes](#31-twee-contracttypes)
   - [3.2 Verplichte inhoud van een contract](#32-verplichte-inhoud-van-een-contract)
   - [3.3 Algemene Voorwaarden (AV)](#33-algemene-voorwaarden-av)
   - [3.4 Digitale aanvaarding & elektronische handtekening](#34-digitale-aanvaarding--elektronische-handtekening)
   - [3.5 Technische implementatie](#35-technische-implementatie)
4. [Boekhouding & Betaalmethodes](#4-boekhouding--betaalmethodes)
   - [4.1 Boekhoudverplichtingen](#41-boekhoudverplichtingen)
   - [4.2 BTW-regime](#42-btw-regime)
   - [4.3 Factuurvereisten](#43-factuurvereisten)
   - [4.4 Betaalmethodes vergelijking](#44-betaalmethodes-vergelijking)
   - [4.5 Impact transactiekosten op commissiemodel](#45-impact-transactiekosten-op-commissiemodel)
   - [4.6 Boekhoudsoftware](#46-boekhoudsoftware)
5. [Escrow Model](#5-escrow-model)
   - [5.1 Juridisch kader](#51-juridisch-kader)
   - [5.2 PSD2-vrijstelling](#52-psd2-vrijstelling)
   - [5.3 Technische flow](#53-technische-flow)
   - [5.4 Stripe Connect als oplossing](#54-stripe-connect-als-oplossing)
   - [5.5 Risico's & geschillen](#55-risicos--geschillen)
   - [5.6 Tijdlijn geldstroom](#56-tijdlijn-geldstroom)
6. [Data Verzameling & Monetisatie](#6-data-verzameling--monetisatie)
   - [6.1 Interne dataverwerking](#61-interne-dataverwerking)
   - [6.2 Verkoop aan derden](#62-verkoop-aan-derden)
   - [6.3 Privacyverklaring & Cookiebeleid](#63-privacyverklaring--cookiebeleid)
   - [6.4 GBA-registratie](#64-gba-registratie)
   - [6.5 Data Processing Agreement (DPA)](#65-data-processing-agreement-dpa)
   - [6.6 ePrivacy & Cookies](#66-eprivacy--cookies)
   - [6.7 Risico's & Boetes](#67-risicos--boetes)
7. [Lancerings-Checklist](#7-lancerings-checklist)
   - [7.1 Juridisch](#71-juridisch)
   - [7.2 Technisch](#72-technisch)
   - [7.3 Financieel](#73-financieel)
   - [7.4 Compliance](#74-compliance)

---

## 1. Juridische Structuur & Oprichting

### 1.1 Rechtsvorm kiezen

| Rechtsvorm | Voordelen | Nadelen | Geschikt voor Eventiphy? |
|---|---|---|---|
| **Eenmanszaak** | Eenvoudig, goedkoop, snel op te starten | Onbeperkte persoonlijke aansprakelijkheid, moeilijk om meerdere vennoten op te nemen | Nee — 5 oprichters |
| **VOF (Vennootschap onder Firma)** | Geen minimumkapitaal, eenvoudige oprichting (onderhandse akte mogelijk) | Onbeperkte en hoofdelijke aansprakelijkheid van alle vennoten | Risicovol bij escrow/betalingen |
| **BV (Besloten Vennootschap)** | Beperkte aansprakelijkheid, flexibel qua aandelen­verdeling, professioneel imago | Notariële akte vereist (~€1.500–€2.500), financieel plan verplicht, dubbele boekhouding | **Aanbevolen** |
| **Comm.V** | Combinatie stille + actieve vennoten, geen notaris nodig | Minstens 1 onbeperkt aansprakelijke vennoot | Mogelijk maar minder transparant |

**Aanbeveling:** Een **BV** is de beste keuze voor Eventiphy:
- Beperkte aansprakelijkheid beschermt de oprichters persoonlijk (cruciaal bij escrow en betalingsverkeer)
- Flexibele aandelenverdeling tussen de 5 oprichters (CEO, COO, CTO, CMO, CFO)
- Vereist voor het openen van een professionele betaalrekening en het afsluiten van contracten als rechtspersoon
- Professioneel imago richting providers en klanten

**Oprichtingsvereisten BV:**
- Notariële akte (oprichtingsakte + statuten)
- Financieel plan (verplicht, wordt bewaard door notaris)
- Geen wettelijk minimumkapitaal meer sinds het WVV (Wetboek van Vennootschappen en Verenigingen, 2019), maar het ingebracht vermogen moet **toereikend** zijn voor de geplande activiteiten
- Neerlegging bij griffie van de Ondernemingsrechtbank
- Publicatie in het Belgisch Staatsblad

### 1.2 KBO, BTW & Ondernemingsnummer

Na oprichting van de BV moeten de volgende stappen doorlopen worden:

| Stap | Wat | Waar | Kost |
|---|---|---|---|
| **Ondernemingsnummer** | Wordt automatisch toegekend bij inschrijving | KBO (Kruispuntbank van Ondernemingen) via erkend ondernemingsloket | €100–€150 |
| **BTW-activatie** | Ondernemingsnummer activeren als BTW-nummer | FOD Financiën (via ondernemingsloket) | Gratis |
| **NACE-codes** | Juiste activiteitencodes registreren | Via ondernemingsloket | Inbegrepen |

**Relevante NACE-codes voor Eventiphy:**
- 63.120 — Webportalen
- 62.010 — Ontwerpen en programmeren van computerprogramma's
- 74.909 — Overige professionele, wetenschappelijke en technische activiteiten n.e.g.
- 82.300 — Organisatie van congressen en beurzen (optioneel)

### 1.3 Bankrekening & Boekhouder

**Bankrekening:**
- Een BV is verplicht een **aparte professionele bankrekening** te openen
- Aanbevolen banken voor startups: KBC Business, BNP Paribas Fortis, of fintechs zoals Qonto of Finom
- Nodig voor: BTW-aangiftes, betalingsverkeer, Stripe Connect-koppeling

**Boekhouder:**
- Een BV moet een **dubbele boekhouding** voeren
- Jaarrekening neerleggen bij de Nationale Bank van België
- Budget: €500–€1.500/maand afhankelijk van transactievolume
- Het businessplan voorziet €500/maand vanaf Fase 3 (maand 12+)
- Aanbeveling: zoek een boekhouder met ervaring in **digitale platformen en e-commerce** (commissiemodel, escrow, buitenlandse betalingsproviders)

### 1.4 Studentenonderneming vs BV

Aangezien het team uit studenten bestaat, is het relevant om de opties af te wegen:

| Criterium | Studentenonderneming | BV |
|---|---|---|
| **Oprichting** | Gratis, via ondernemingsloket | Notariële akte (~€2.000) |
| **Aansprakelijkheid** | Onbeperkt persoonlijk | Beperkt tot inbreng |
| **Omzetlimiet** | Max €8.860,48/jaar belastingvrij (2025) | Geen limiet |
| **BTW** | Vrijstellingsregeling mogelijk tot €25.000/jaar | Standaard BTW-plichtig |
| **Meerdere personen** | Slechts 1 persoon | Meerdere vennoten |
| **Escrow/betalingen** | Problematisch (persoonlijke aansprakelijkheid) | Geschikt |
| **Contracten sluiten** | Op persoonlijke naam | Als rechtspersoon |

**Conclusie:** Een studentenonderneming is **ongeschikt** voor Eventiphy vanwege:
- 5 oprichters (studentenonderneming = 1 persoon)
- Escrow-model vereist beperkte aansprakelijkheid
- Verwachte omzet overschrijdt snel de drempels
- Contracten met providers vereisen een rechtspersoon

**Overgangsstrategie:** Start direct met een BV. De oprichtingskosten (~€2.000) zijn een eenmalige investering die bescherming en geloofwaardigheid biedt.

---

## 2. Vergunningen & Licenties

### 2.1 Basiskennis Bedrijfsbeheer

De verplichting van het **attest basiskennis bedrijfsbeheer** is **afgeschaft in Vlaanderen sinds 1 januari 2023**. Dit geldt voor alle nieuwe ondernemingen. Er is dus geen attest meer nodig om een onderneming te starten.

> Let op: In het Brussels Hoofdstedelijk Gewest en Wallonië gelden mogelijk nog andere regels. Controleer dit als Eventiphy daar een vestiging opent.

### 2.2 Betalingsdiensten (PSD2 / NBB)

Eventiphy int geld van klanten en betaalt dit (minus commissie) uit aan providers. Dit is een **betalingsdienst** die normaal een vergunning vereist van de NBB (Nationale Bank van België).

**Wanneer is een vergunning nodig?**
- Als je zelf gelden van klanten ontvangt, vasthoudt en doorbetaalt
- Als je optreedt als betaalinstelling of e-geldinstelling

**Wanneer is een vergunning NIET nodig?**
- Als je een **gelicentieerde payment service provider** (PSP) zoals **Stripe Connect**, **Mollie Connect** of **Mangopay** gebruikt
- Deze PSP's hebben zelf een PSD2-vergunning en handelen de geldstromen af
- Eventiphy treedt dan op als **platform** (marketplace), niet als betaaldienst

**Aanbeveling:** Gebruik **Stripe Connect** (zie [sectie 5.4](#54-stripe-connect-als-oplossing)). Hierdoor:
- Draagt Stripe de PSD2-vergunning
- Wordt het geld nooit op de rekening van Eventiphy gehouden
- Zijn KYC-verplichtingen (Know Your Customer) voor providers gedelegeerd aan Stripe
- Is er geen eigen NBB-vergunning nodig

### 2.3 Verzekeringstussenpersoon (FSMA)

Het businessplan noemt een "verzekerings- en check-in systeem". Dit vereist verduidelijking:

**Als Eventiphy zelf verzekeringen aanbiedt of bemiddelt:**
- Vergunning nodig als **verzekeringstussenpersoon** bij de FSMA
- Vereist: inschrijving in het FSMA-register, beroepsaansprakelijkheids­verzekering, opleiding

**Als Eventiphy het woord "verzekering" gebruikt als marketingterm voor het escrow/QR-systeem:**
- Geen FSMA-vergunning nodig
- **Maar**: het gebruik van het woord "verzekering" is **wettelijk beschermd** — gebruik het niet zonder daadwerkelijk een verzekeringsproduct aan te bieden
- **Aanbeveling:** Vervang "verzekering" door termen als **"betalingsbescherming"**, **"boekingsgarantie"** of **"no-show bescherming"**

**Op termijn (toekomstvisie):**
Als Eventiphy later een eigen verzekeringssysteem wil lanceren, zijn er twee opties:
1. Samenwerken met een erkende verzekeraar (geen eigen vergunning nodig)
2. Eigen verzekeringsproduct opzetten (FSMA-vergunning vereist — complex en duur)

### 2.4 Sectorale Vergunningen

Eventiphy zelf heeft als platformbeheerder geen sectorale vergunningen nodig, maar de **providers** op het platform wel. Eventiphy moet dit verifiëren:

| Sector | Vergunning/Vereiste | Verantwoordelijke |
|---|---|---|
| **Catering** | Registratie bij FAVV (Federaal Agentschap voor de Veiligheid van de Voedselketen) | Provider |
| **Muziek/DJ** | SABAM-licentie voor het afspelen van beschermde muziek | Klant of provider (afhankelijk van locatie) |
| **Fotografie** | Geen specifieke vergunning, wel portretrecht (GDPR) | Provider |
| **Decoratie** | Geen specifieke vergunning | — |
| **Venues/Zalen** | Brandveiligheidsattest, horecavergunning indien drank | Provider/locatie-eigenaar |

**Eventiphy's rol:**
- Bij provider-onboarding: checklist of vereiste documenten opvragen
- In de Algemene Voorwaarden: providers verklaren dat ze over alle nodige vergunningen beschikken
- Op termijn: kopie van vergunningen opslaan als onderdeel van het verificatieproces

### 2.5 GDPR-registratie bij GBA

Als **verwerkingsverantwoordelijke** moet Eventiphy:
- Een **verwerkingsregister** bijhouden (verplicht onder GDPR Art. 30)
- Een **Data Protection Officer (DPO)** aanstellen als grootschalige verwerking plaatsvindt (bij data-verkoop aan derden is dit zeer waarschijnlijk vereist)
- Registratie bij de GBA is niet verplicht, maar een **Data Protection Impact Assessment (DPIA)** is vereist voor:
  - Escrow/betalingsverwerking
  - Profilering voor data-verkoop
  - Grootschalige verwerking van persoonsgegevens

Zie [sectie 6](#6-data-verzameling--monetisatie) voor details.

---

## 3. Automatische Contracten

### 3.1 Twee contracttypes

Eventiphy heeft twee afzonderlijke contractuele relaties:

**Contract A — Provider ↔ Eventiphy (Samenwerkingsovereenkomst)**
- Wordt éénmalig afgesloten bij registratie als provider
- Regelt: commissie, betalingsvoorwaarden, verplichtingen, aansprakelijkheid, beëindiging
- Blijft geldig zolang de provider actief is op het platform

**Contract B — Klant ↔ Provider (via Eventiphy als tussenpersoon)**
- Wordt automatisch opgesteld bij elke bevestigde boeking
- Regelt: dienstomschrijving, prijs, datum, annulatiebeleid, escrow-voorwaarden
- Eventiphy treedt op als facilitator, niet als contractpartij van de dienst zelf

Daarnaast gelden voor alle gebruikers:
- **Algemene Voorwaarden** (bij registratie)
- **Privacyverklaring** (bij registratie)

### 3.2 Verplichte inhoud van een contract

Volgens Belgisch recht (Boek 5 Burgerlijk Wetboek) en de Wet Marktpraktijken moet een contract minstens bevatten:

**Contract A (Provider-overeenkomst):**
- Identiteit van beide partijen (naam, adres, ondernemingsnummer)
- Voorwerp van de overeenkomst (platformdiensten)
- Commissiepercentage (8%) en berekeningswijze
- Betalingsvoorwaarden en -termijnen (uitbetaling na QR-check-in)
- Verantwoordelijkheden van de provider (vergunningen, kwaliteit, no-show beleid)
- Verantwoordelijkheden van Eventiphy (platformbeschikbaarheid, escrow, support)
- Aansprakelijkheidsbeperkingen
- Duur en beëindigingsvoorwaarden
- Geschillenregeling en toepasselijk recht
- Intellectuele eigendomsrechten (foto's, content op platform)

**Contract B (Boekingsovereenkomst):**
- Identiteit klant en provider
- Beschrijving van de dienst (uit de geaccepteerde offerte)
- Prijs (totaalbedrag incl. BTW)
- Datum, tijdstip en locatie van het event
- Annulatiebeleid en terugbetalingsvoorwaarden
- Escrow-voorwaarden (betaling wordt vastgehouden tot QR-check-in)
- Herroepingsrecht (14 dagen voor diensten op afstand, tenzij uitgezonderd)
- Klachtenprocedure

### 3.3 Algemene Voorwaarden (AV)

De AV vormen de juridische basis van het platform. Ze moeten beschikbaar zijn vóór registratie en actief aanvaard worden.

**Verplichte elementen (B2C — Boek VI WER):**
- Identiteit onderneming (naam, adres, ondernemingsnummer, BTW-nummer)
- Contactgegevens (e-mail, telefoon)
- Beschrijving van de dienst
- Prijs inclusief alle belastingen
- Betalingswijze
- Herroepingsrecht (of uitsluiting ervan met motivering)
- Klachtenbeleid en buitengerechtelijke geschillenbeslechting (ODR-platform EU)
- Toepasselijk recht (Belgisch recht)

**Aanvullend voor Eventiphy:**
- Rol van Eventiphy als tussenpersoon (geen partij bij de dienstverlening zelf)
- Commissiestructuur
- Escrow-mechanisme uitleg
- Reviewbeleid
- Account-suspensie en -verwijdering
- Intellectueel eigendom
- Overmacht

### 3.4 Digitale aanvaarding & elektronische handtekening

**Digitale aanvaarding (voldoende voor AV en standaard contracten):**
- Checkbox "Ik ga akkoord met de Algemene Voorwaarden" + link naar AV
- Opslaan van: timestamp, IP-adres, versie van de AV, user-ID
- Juridisch geldig onder Belgisch recht als bewijs van aanvaarding

**Elektronische handtekening (eIDAS-verordening):**

| Type | Beschrijving | Juridische waarde | Wanneer gebruiken |
|---|---|---|---|
| **Gewone e-handtekening** | Checkbox, typed name, click-to-sign | Bewijswaarde, maar betwistbaar | AV-aanvaarding, standaard boekingen |
| **Geavanceerde e-handtekening** | Uniek gekoppeld aan ondertekenaar, detecteert wijzigingen | Sterke bewijswaarde | Provider-overeenkomst |
| **Gekwalificeerde e-handtekening** | Via eID-kaartlezer of itsme® | Gelijkgesteld aan handgeschreven handtekening | Niet nodig voor Eventiphy |

**Aanbeveling:**
- **AV + boekingsovereenkomst:** gewone digitale aanvaarding (checkbox + timestamp)
- **Provider-overeenkomst:** geavanceerde e-handtekening (bijv. via itsme® of een dienst als Connective/SignHere)

### 3.5 Technische implementatie

**Stap-voor-stap aanpak:**

1. **Contract-templates maken** (Markdown of HTML)
   - Variabelen: `{{provider_naam}}`, `{{klant_naam}}`, `{{dienst_omschrijving}}`, `{{prijs}}`, `{{datum}}`, `{{commissie_percentage}}`, etc.
   - Versienummer bijhouden per template

2. **Automatische invulling bij boeking**
   - Bij acceptatie van een offerte: contract B automatisch genereren
   - Data ophalen uit: Quote, Booking, User, ServiceProvider modellen (reeds aanwezig in Prisma schema)

3. **PDF-generatie**
   - Libraries: `@react-pdf/renderer`, `puppeteer`, of `pdf-lib`
   - PDF opslaan in cloud storage (bijv. Supabase Storage of AWS S3)
   - Link naar PDF beschikbaar in dashboard van klant en provider

4. **Opslag & Audit Trail**
   - Nieuw Prisma-model: `Contract` met velden voor type, versie, PDF-URL, ondertekening-timestamp, IP-adres
   - Contracten mogen **nooit verwijderd** worden (wettelijke bewaartermijn: 10 jaar)

5. **Digitale aanvaarding opslaan**
   - Bij registratie: versie AV + timestamp + user-ID opslaan
   - Bij elke boeking: boekingsovereenkomst-ID + aanvaarding-timestamp

---

## 4. Boekhouding & Betaalmethodes

### 4.1 Boekhoudverplichtingen

Als BV is Eventiphy verplicht tot:

| Verplichting | Detail |
|---|---|
| **Dubbele boekhouding** | Verplicht voor alle vennootschappen |
| **Jaarrekening** | Neerleggen bij Nationale Bank van België (NBB) |
| **Verkort schema** | Toegestaan als "kleine vennootschap" (< 2 van 3 criteria: 50 werknemers, €9M omzet, €4,5M balanstotaal) |
| **Bewaartermijn** | Boekhoudkundige stukken: **7 jaar**, contracten: **10 jaar** |
| **BTW-aangiftes** | Maandelijks of kwartaal (kwartaal als omzet < €2,5M) |

### 4.2 BTW-regime

**Eventiphy's dienst = elektronische bemiddeling (commissie)**

| Aspect | BTW-behandeling |
|---|---|
| **Commissie (8%)** | 21% BTW op de commissie die Eventiphy aanrekent |
| **Dienst provider → klant** | BTW-verantwoordelijkheid van de provider (niet Eventiphy) |
| **Escrow-doorstorting** | Geen BTW (doorgifte van gelden is geen dienst) |

**Voorbeeld:**
- Klant betaalt €500 voor een DJ-boeking
- Eventiphy houdt 8% commissie = €40 + €8,40 BTW = **€48,40**
- Provider ontvangt €500 - €48,40 = **€451,60**
- Eventiphy factureert €48,40 aan de provider (commissiefactuur)

> Let op: Als provider BTW-plichtig is, kan deze de BTW op de commissie terugvorderen. Als provider in BTW-vrijstellingsregeling zit, is dit een kost.

### 4.3 Factuurvereisten

Elke factuur van Eventiphy aan een provider moet bevatten (Art. 5 KB nr. 1 BTW):

- Datum van uitreiking
- Volgnummer (doorlopend)
- Naam, adres en BTW-nummer van Eventiphy
- Naam, adres en BTW-nummer (indien van toepassing) van de provider
- Omschrijving van de dienst ("Platformcommissie op boeking #12345")
- Datum van de dienst
- Maatstaf van heffing (bedrag excl. BTW)
- BTW-tarief en BTW-bedrag
- Totaal incl. BTW
- Betalingsvoorwaarden

**Automatisering:** Facturen automatisch genereren bij elke uitbetaling aan een provider. Bewaren als PDF in het systeem.

### 4.4 Betaalmethodes vergelijking

| Criterium | Stripe | Mollie | Payconiq by Bancontact |
|---|---|---|---|
| **Marketplace-support** | Stripe Connect (uitstekend) | Mollie Connect (goed) | Niet beschikbaar |
| **Escrow/split payments** | Ja, native | Ja, via Connect | Nee |
| **Belgische betaalmethodes** | Bancontact, iDEAL, kaart | Bancontact, iDEAL, kaart, KBC, Belfius | Alleen Payconiq/Bancontact |
| **Transactiekosten (kaart)** | 1,5% + €0,25 (EU) | 1,8% + €0,25 | €0,06 per transactie |
| **Transactiekosten (Bancontact)** | €0,25 per transactie | €0,39 per transactie | €0,06 per transactie |
| **KYC voor providers** | Automatisch via Connect | Automatisch via Connect | N.v.t. |
| **PSD2-vergunning** | Stripe heeft deze | Mollie heeft deze | Bancontact Payconiq Co. heeft deze |
| **Uitbetalingssnelheid** | 2–7 werkdagen | 1–2 werkdagen | Direct |
| **Dashboard & API** | Uitstekend | Goed | Beperkt |
| **Aanbeveling** | **Primair** | Alternatief | Aanvullend (later) |

**Aanbeveling:** Start met **Stripe Connect** als primaire betaalprovider. Voeg later **Payconiq** toe als extra betaalmethode voor Belgische gebruikers (populair bij jongere doelgroep).

### 4.5 Impact transactiekosten op commissiemodel

Bij een 8% commissie op een typische boeking:

| Boekingsbedrag | Commissie (8%) | Stripe-kost (Bancontact) | Stripe-kost (kaart 1,5%+€0,25) | Netto voor Eventiphy |
|---|---|---|---|---|
| €200 | €16,00 | €0,25 | €3,25 | €12,75 – €15,75 |
| €500 | €40,00 | €0,25 | €7,75 | €32,25 – €39,75 |
| €1.000 | €80,00 | €0,25 | €15,25 | €64,75 – €79,75 |

> De Stripe-kosten worden idealiter afgetrokken van de commissie, niet doorberekend aan de klant. Dit houdt het platform transparant en eenvoudig.

### 4.6 Boekhoudsoftware

| Software | Prijs/maand | Geschikt voor | Opmerking |
|---|---|---|---|
| **Dexxter** | €15–€30 | Zelfstandigen, kleine BV's | Belgisch, eenvoudig, automatische BTW-aangifte |
| **Yuki** | €30–€60 | Groeiende bedrijven | Automatische verwerking, boekhouder-integratie |
| **Exact Online** | €50–€100 | Middelgrote bedrijven | Volledig, maar complexer |
| **Accountable** | €10–€25 | Freelancers/startups | Belgisch, mobiel, AI-gebaseerd |

**Aanbeveling:** Start met **Dexxter** of **Accountable** in de beginfase. Schakel over naar **Yuki** bij groei.

---

## 5. Escrow Model

### 5.1 Juridisch kader

Het escrow-model van Eventiphy werkt als volgt: de klant betaalt bij boeking, het geld wordt vastgehouden, en pas na QR-check-in van de provider wordt het geld vrijgegeven. Dit is juridisch een vorm van **betalingsbemiddeling**.

**Belangrijk onderscheid:**
- **Als Eventiphy zelf het geld vasthoudt:** Dit is een betalingsdienst → NBB-vergunning vereist
- **Als een PSP het geld vasthoudt:** Geen NBB-vergunning nodig voor Eventiphy

### 5.2 PSD2-vrijstelling

Er zijn twee routes om zonder eigen vergunning te opereren:

**Route 1 — Handelsagent-uitzondering (Art. 3(b) PSD2):**
- Van toepassing als Eventiphy optreedt als agent namens de klant OF de provider
- Problematisch bij tweezijdige marktplaatsen (je vertegenwoordigt beide kanten)
- **Niet aanbevolen** — juridisch onzeker

**Route 2 — Gelicentieerde PSP gebruiken (aanbevolen):**
- Stripe Connect, Mollie Connect of Mangopay
- De PSP handelt alle geldstromen af
- Eventiphy geeft alleen instructies aan de PSP (bijv. "betaal provider X uit na check-in")
- **Geen eigen vergunning nodig**

### 5.3 Technische flow

```
KLANT                    EVENTIPHY                  STRIPE CONNECT              PROVIDER
  |                          |                            |                        |
  |-- 1. Boekt dienst ------>|                            |                        |
  |                          |-- 2. Creëer Payment ------>|                        |
  |<-- 3. Betaallink --------|<---------------------------|                        |
  |-- 4. Betaalt ----------->|--------------------------->|                        |
  |                          |   (Geld in escrow bij      |                        |
  |                          |    Stripe)                  |                        |
  |                          |                            |                        |
  |        [DAG VAN EVENT]   |                            |                        |
  |                          |                            |                        |
  |-- 5. Toont QR-code ----->|                            |                        |
  |                          |<-- 6. Provider scant QR ---|------------------------|
  |                          |-- 7. Bevestig check-in --->|                        |
  |                          |                            |-- 8. Uitbetaling ----->|
  |                          |                            |   (minus 8% commissie) |
  |                          |<-- 9. Commissie ----------|                        |
  |                          |   (op Eventiphy-account)   |                        |
```

**Stappen in detail:**
1. Klant accepteert offerte → boeking wordt aangemaakt
2. Eventiphy creëert een Payment Intent via Stripe Connect met `transfer_data` naar provider's connected account
3. Klant ontvangt betaallink (Bancontact, kaart, etc.)
4. Klant betaalt → geld wordt vastgehouden door Stripe (niet door Eventiphy)
5. Op de dag van het event toont de klant een QR-code (uniek per boeking)
6. Provider scant de QR-code via het platform
7. Eventiphy bevestigt de check-in en stuurt een release-instructie naar Stripe
8. Stripe betaalt de provider uit (minus commissie)
9. Commissie wordt op het Eventiphy Stripe-account gestort

### 5.4 Stripe Connect als oplossing

**Waarom Stripe Connect?**
- Stripe heeft een PSD2-vergunning (via Stripe Payments Europe Ltd, Ierland)
- Native ondersteuning voor marketplace-escrow
- Automatische KYC/onboarding van providers (identiteitsverificatie, bankgegevens)
- Split payments: automatisch commissie aftrekken bij uitbetaling
- Belgische betaalmethodes ondersteund (Bancontact, kaart)

**Stripe Connect account types:**

| Type | KYC | Dashboard | Geschikt? |
|---|---|---|---|
| **Standard** | Stripe handelt alles af | Provider krijgt eigen Stripe dashboard | Meest geschikt voor Eventiphy |
| **Express** | Stripe handelt af, Eventiphy branded | Beperkt dashboard | Goed alternatief |
| **Custom** | Eventiphy handelt af | Geen dashboard voor provider | Te complex |

**Aanbeveling:** Start met **Express** accounts voor providers. Dit biedt de beste balans tussen gebruiksgemak (provider hoeft geen eigen Stripe account) en controle (Eventiphy bepaalt uitbetalingsmoment).

### 5.5 Risico's & geschillen

| Risico | Oplossing |
|---|---|
| **Klant annuleert na betaling** | Duidelijk annulatiebeleid met staffel (bijv. >7 dagen: 100% terug, 3-7 dagen: 50%, <3 dagen: geen terugbetaling) |
| **Provider verschijnt niet (no-show)** | Automatische terugbetaling klant + sanctie provider (waarschuwing → suspensie) |
| **Klant verschijnt niet** | Provider wordt uitbetaald (dienst was beschikbaar). QR-code niet gescand = geen automatische uitbetaling → handmatige review na X uur |
| **Geschil over kwaliteit** | Geschillenprocedure: klant dient klacht in → Eventiphy medieert → indien onopgelost: gedeeltelijke terugbetaling of externe geschillenbeslechting |
| **Chargebacks (Stripe)** | Stripe biedt chargeback protection. Eventiphy bewaart bewijs (contract, QR-scan, communicatie) |
| **Fraude** | Stripe Radar voor fraudedetectie. KYC bij provider-onboarding. Verificatie van providers |

### 5.6 Tijdlijn geldstroom

| Moment | Actie | Wie houdt het geld? |
|---|---|---|
| **Boeking bevestigd** | Klant betaalt | Stripe (escrow) |
| **Tussen boeking en event** | Geld in escrow | Stripe |
| **Dag van event — QR-scan** | Check-in bevestigd | Stripe → vrijgave geïnitieerd |
| **+2 werkdagen na check-in** | Uitbetaling provider | Provider's bankrekening |
| **Geen QR-scan na event + 24u** | Automatische review | Eventiphy support team |
| **Annulatie vóór event** | Terugbetaling volgens beleid | Stripe → klant |

---

## 6. Data Verzameling & Monetisatie

### 6.1 Interne dataverwerking

**Welke data verzamelt Eventiphy?**

| Categorie | Data | Doel | Rechtsgrond (GDPR Art. 6) |
|---|---|---|---|
| **Accountgegevens** | Naam, e-mail, wachtwoord (gehasht), telefoon | Accountbeheer, communicatie | Uitvoering overeenkomst (Art. 6.1.b) |
| **Profielgegevens provider** | Bedrijfsnaam, BTW-nummer, adres, portfolio, prijzen | Dienstverlening op platform | Uitvoering overeenkomst (Art. 6.1.b) |
| **Boekingsgegevens** | Offerte, prijs, datum, locatie, status, betalingsstatus | Uitvoering boeking | Uitvoering overeenkomst (Art. 6.1.b) |
| **Communicatie** | Berichten tussen klant en provider | Geschillenbeslechting, kwaliteitscontrole | Gerechtvaardigd belang (Art. 6.1.f) |
| **Betalingsgegevens** | Transactie-ID's, bedragen, betalingsmethode | Boekhouding, escrow | Wettelijke verplichting (Art. 6.1.c) |
| **Reviews** | Score, tekst, datum | Vertrouwen opbouwen | Gerechtvaardigd belang (Art. 6.1.f) |
| **Gebruiksdata** | Zoekgedrag, klikgedrag, tijdstip, apparaat | Platformverbetering | Gerechtvaardigd belang (Art. 6.1.f) of toestemming (Art. 6.1.a) |
| **Locatiegegevens** | IP-adres, opgegeven locatie | Matchmaking klant-provider | Uitvoering overeenkomst (Art. 6.1.b) |

### 6.2 Verkoop aan derden

Het businessplan noemt de verkoop van geanonimiseerde marktdata aan analyse- en advertentiebedrijven. Dit is juridisch complex:

**Voorwaarden voor dataverkoop:**

1. **Anonimisering vs Pseudonimisering**
   - **Geanonimiseerde data** (onmogelijk te herleiden tot persoon): valt **buiten de GDPR** — vrij verhandelbaar
   - **Gepseudonimiseerde data** (herleidbaar met extra info): valt **binnen de GDPR** — toestemming nodig
   - Let op: echte anonimisering is moeilijker dan het lijkt. De GBA en EDPB stellen strenge eisen

2. **Wat mag je verkopen (geanonimiseerd)?**
   - Markttrends: "In Antwerpen steeg de vraag naar DJ's met 30% in juni"
   - Prijsgemiddelden per categorie per regio
   - Seizoenspatronen
   - Populaire dienstcombinaties
   - **Nooit**: individuele boekingsgegevens, zelfs niet gepseudonimiseerd, zonder expliciete toestemming

3. **Expliciete toestemming (Art. 6.1.a GDPR)**
   - Als je persoonsgegevens (ook gepseudonimiseerd) wilt delen met derden
   - Toestemming moet: vrij, specifiek, geïnformeerd en ondubbelzinnig zijn
   - Mag NIET vereist zijn om het platform te gebruiken (koppelingsverbod)
   - Gebruiker moet toestemming op elk moment kunnen intrekken

4. **Transparantie**
   - In de privacyverklaring exact vermelden: welke data, aan wie, waarvoor
   - Namen of categorieën van ontvangers noemen

**Businessmodel voor data-monetisatie:**

| Model | GDPR-risico | Aanbeveling |
|---|---|---|
| Verkoop van echt geanonimiseerde, geaggregeerde statistieken | Laag | Aanbevolen als eerste stap |
| Verkoop van gepseudonimiseerde data met toestemming | Middel | Alleen met opt-in en DPA |
| Verkoop van persoonsgegevens zonder toestemming | **Illegaal** | Nooit |
| Advertentie-inkomsten op platform (niet data-gebaseerd) | Laag | Veilig alternatief |
| Gerichte advertenties op basis van gebruikersgedrag | Middel-Hoog | Vereist toestemming + ePrivacy-naleving |

### 6.3 Privacyverklaring & Cookiebeleid

**Privacyverklaring (verplicht — GDPR Art. 13/14):**

Moet minstens bevatten:
- Identiteit en contactgegevens verwerkingsverantwoordelijke (Eventiphy BV)
- Contactgegevens DPO (indien aangesteld)
- Doeleinden en rechtsgrond per verwerking
- Ontvangers of categorieën van ontvangers (incl. Stripe, eventuele data-kopers)
- Doorgifte naar derde landen (bijv. als Stripe data opslaat in de VS — Privacy Shield / SCC's)
- Bewaartermijnen per datacategorie
- Rechten van betrokkenen (inzage, correctie, verwijdering, overdraagbaarheid, bezwaar)
- Recht om klacht in te dienen bij GBA
- Of verstrekking verplicht is en gevolgen van niet-verstrekking
- Bestaan van geautomatiseerde besluitvorming/profilering

**Cookiebeleid (verplicht — ePrivacy-richtlijn):**
- Overzicht van alle cookies (functioneel, analytisch, marketing)
- Doel per cookie
- Bewaartermijn per cookie
- Cookie-banner met echte keuze (niet alleen "accepteer alles")

### 6.4 GBA-registratie

- Er is **geen verplichte registratie** bij de GBA als verwerkingsverantwoordelijke (het oude register van de Privacy Commissie is afgeschaft)
- Wél verplicht: een **intern verwerkingsregister** bijhouden (Art. 30 GDPR)
- Een **DPO** is verplicht als Eventiphy:
  - Op grote schaal persoonsgegevens verwerkt
  - Systematisch en grootschalig gebruikers monitort
  - Bijzondere categorieën data verwerkt

Bij data-verkoop aan derden is een DPO **zeer waarschijnlijk verplicht**.

### 6.5 Data Processing Agreement (DPA)

Een DPA (verwerkersovereenkomst) is **verplicht** met elke partij die namens Eventiphy persoonsgegevens verwerkt:

| Partij | Rol | DPA nodig? |
|---|---|---|
| **Stripe** | Verwerker (betalingsgegevens) | Ja — Stripe biedt standaard DPA |
| **Vercel** | Verwerker (hosting, logs) | Ja — Vercel biedt standaard DPA |
| **Render** | Verwerker (database hosting) | Ja — DPA opvragen |
| **Data-kopers** | Ontvanger / gezamenlijk verwerkingsverantwoordelijke | Ja — op maat, met strenge voorwaarden |
| **E-mailprovider** | Verwerker (communicatie) | Ja |

**Inhoud DPA (Art. 28 GDPR):**
- Onderwerp en duur van verwerking
- Aard en doel van verwerking
- Type persoonsgegevens en categorieën betrokkenen
- Verplichtingen en rechten van verwerkingsverantwoordelijke
- Technische en organisatorische beveiligingsmaatregelen
- Inschakeling van sub-verwerkers
- Bijstand bij rechten van betrokkenen
- Meldplicht bij datalekken

### 6.6 ePrivacy & Cookies

De Belgische wet van 13 juni 2005 (omzetting ePrivacy-richtlijn) vereist:

- **Functionele cookies:** Geen toestemming nodig (strikt noodzakelijk)
- **Analytische cookies (first-party, geanonimiseerd):** Mogelijk zonder toestemming als ze de privacy niet significant aantasten
- **Tracking/marketing cookies:** Expliciete toestemming vereist (opt-in)
- **Third-party cookies:** Expliciete toestemming vereist

**Implementatie:**
- Cookie-banner met granulaire keuze (niet alleen "alles accepteren")
- Cookie-instellingen op elk moment aanpasbaar
- Consent Management Platform (CMP) overwegen: Cookiebot, CookieYes, of open-source Orejime
- Consent-log bewaren als bewijs

### 6.7 Risico's & Boetes

| Overtreding | Maximale boete |
|---|---|
| Schending GDPR-beginselen (Art. 5, 6) | Tot €20M of 4% wereldwijde jaaromzet |
| Geen geldige toestemming voor dataverkoop | Tot €20M of 4% wereldwijde jaaromzet |
| Ontbreken verwerkingsregister | Tot €10M of 2% wereldwijde jaaromzet |
| Ontbreken DPA met verwerkers | Tot €10M of 2% wereldwijde jaaromzet |
| Cookie-inbreuk (ePrivacy) | Tot €30.000 (België) + GDPR-boete |
| Geen privacyverklaring | Tot €20M of 4% wereldwijde jaaromzet |

> De GBA is actief in handhaving. In 2024 werden meerdere Belgische bedrijven beboet voor cookie-inbreuken en ontoereikende privacyverklaringen.

**Risicobeperking:**
- Investeer in juridisch advies bij het opzetten van het data-monetisatiemodel
- Laat de privacyverklaring en AV opstellen/controleren door een gespecialiseerde advocaat
- Voer een DPIA uit vóór lancering
- Stel een DPO aan (kan extern)

---

## 7. Lancerings-Checklist

### 7.1 Juridisch

- [ ] BV oprichten (notariële akte + financieel plan)
- [ ] Inschrijven bij KBO via ondernemingsloket
- [ ] BTW-nummer activeren
- [ ] NACE-codes correct registreren
- [ ] Professionele bankrekening openen
- [ ] Algemene Voorwaarden laten opstellen door advocaat
- [ ] Privacyverklaring laten opstellen door advocaat / DPO
- [ ] Cookiebeleid opstellen
- [ ] Provider-samenwerkingsovereenkomst (Contract A) laten opstellen
- [ ] Boekingsovereenkomst-template (Contract B) laten opstellen
- [ ] Annulatiebeleid en terugbetalingsbeleid vastleggen
- [ ] Geschillenprocedure definiëren
- [ ] Term "verzekering" vervangen door "betalingsbescherming" / "boekingsgarantie"

### 7.2 Technisch

- [ ] Stripe Connect integreren (Express accounts voor providers)
- [ ] Escrow-flow implementeren (Payment Intent → hold → release na QR-scan)
- [ ] QR-code generatie per boeking implementeren
- [ ] QR-scanner functionaliteit voor providers bouwen
- [ ] Automatische contractgeneratie (PDF) bij boeking
- [ ] Automatische factuurgeratie bij uitbetaling
- [ ] AV-aanvaarding met checkbox + timestamp opslaan
- [ ] Cookie-banner implementeren (CMP)
- [ ] Privacyverklaring-pagina toevoegen (`/privacy`)
- [ ] Algemene Voorwaarden-pagina toevoegen (`/voorwaarden`)
- [ ] Annulatiebeleid-pagina toevoegen
- [ ] GDPR-tools: data-export, account-verwijdering, toestemming-beheer
- [ ] Verwerkingsregister documenteren (intern)
- [ ] Contract-model toevoegen aan Prisma schema
- [ ] Audit trail voor contracten en betalingen

### 7.3 Financieel

- [ ] Boekhouder aanstellen (ervaring met digitale platformen)
- [ ] Boekhoudsoftware kiezen en opzetten
- [ ] BTW-aangifteplanning (kwartaal)
- [ ] Commissie-berekening en factuurflow testen
- [ ] Financieel plan actualiseren met reële Stripe-transactiekosten
- [ ] Startkapitaal bepalen en inbrengen in BV

### 7.4 Compliance

- [ ] DPIA uitvoeren (escrow, data-verwerking, profilering)
- [ ] DPO aanstellen (intern of extern) — verplicht bij data-monetisatie
- [ ] DPA's afsluiten met alle verwerkers (Stripe, Vercel, Render, e-mailprovider)
- [ ] Verwerkingsregister opstellen en bijhouden
- [ ] Cookie consent-logs bewaren
- [ ] Provider-verificatieproces inrichten (FAVV, vergunningen)
- [ ] KYC-flow via Stripe Connect activeren voor providers
- [ ] Datalekprocedure opstellen (72-uur meldplicht bij GBA)
- [ ] Regelmatige GDPR-audit plannen (jaarlijks)

---

> **Disclaimer:** Dit document is een intern referentiedocument en vormt geen juridisch advies. Raadpleeg altijd een gespecialiseerde advocaat voor juridische beslissingen, in het bijzonder rond de BV-oprichting, contracten, GDPR-compliance en het escrow-model.
