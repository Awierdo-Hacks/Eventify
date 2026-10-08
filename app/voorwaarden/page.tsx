import type { Metadata } from 'next';
import Link from 'next/link';
import { Container, PageHeader, Section } from '@/components/layout';
import { FileText, ShieldCheck } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Algemene Voorwaarden & Privacyverklaring',
  description:
    'Lees de algemene voorwaarden en het privacybeleid van Eventiphy. Transparantie en bescherming voor klanten en dienstverleners.',
  alternates: {
    canonical: 'https://eventiphy.be/voorwaarden',
  },
};

export default function VoorwaardenPage() {
  return (
    <main className="min-h-screen">
      <Section background="gradient-hero" className="py-10 md:py-14">
        <Container className="py-0">
          <PageHeader
            title="Voorwaarden & Privacy"
            subtitle="Transparantie en bescherming staan centraal bij Eventiphy. Hieronder vind je onze algemene voorwaarden en ons privacybeleid."
            gradient
            className="mb-0"
          />
        </Container>
      </Section>

      {/* Fixed navigatie tussen secties — blijft altijd onderaan in beeld */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 bg-white/95 backdrop-blur-md border border-gray-200 shadow-eventiphy-lg rounded-2xl px-4 py-2.5">
        <div className="flex flex-row items-center justify-center gap-2 sm:gap-3">
          <a
            href="#algemene-voorwaarden"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 h-9 sm:h-10 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors font-medium text-xs sm:text-sm"
          >
            <FileText className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Algemene </span>Voorwaarden
          </a>
          <a
            href="#privacyverklaring"
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 h-9 sm:h-10 rounded-xl border-2 border-purple-200 text-purple-700 hover:bg-purple-50 transition-colors font-medium text-xs sm:text-sm"
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Privacy
          </a>
        </div>
      </div>

      {/* ==================== ALGEMENE VOORWAARDEN ==================== */}
      <div id="algemene-voorwaarden" className="scroll-mt-4" />
      <Section className="py-8 md:py-12">
        <Container className="py-0">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8">
              Algemene <span className="gradient-text">Voorwaarden</span>
            </h2>
            <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: maart 2026</p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* Artikel 1 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 1 — Identiteit van de onderneming</h3>
                <p>
                  Eventiphy is een digitaal platform beheerd door Eventiphy, met maatschappelijke zetel te Antwerpen, België.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>E-mail: eventiphy@gmail.com</li>
                  <li>Telefoon: +32 486 71 47 88</li>
                  <li>Website: www.eventiphy.be</li>
                </ul>
              </section>

              {/* Artikel 2 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 2 — Definities</h3>
                <ul className="list-disc pl-6 space-y-2">
                  <li><strong>Platform:</strong> de website en eventuele mobiele applicatie van Eventiphy waarop dienstverleners en klanten met elkaar in contact komen.</li>
                  <li><strong>Klant (Gebruiker):</strong> elke natuurlijke of rechtspersoon die zich registreert op het Platform om diensten te zoeken, offertes aan te vragen en boekingen te plaatsen.</li>
                  <li><strong>Provider (Dienstverlener):</strong> elke natuurlijke of rechtspersoon die zich registreert op het Platform om diensten aan te bieden aan klanten, waaronder maar niet beperkt tot DJ&apos;s, fotografen, cateraars, decorateurs en zaalverhuurders.</li>
                  <li><strong>Boeking:</strong> een bevestigde overeenkomst tussen een Klant en een Provider voor het leveren van een dienst op een bepaalde datum, tot stand gekomen via het Platform.</li>
                  <li><strong>Offerte:</strong> een prijsvoorstel van een Provider aan een Klant voor een specifieke dienst, opgesteld en verstuurd via het Platform.</li>
                  <li><strong>Commissie:</strong> het percentage dat Eventiphy aanrekent op elke succesvolle boeking als vergoeding voor de platformdiensten.</li>
                  <li><strong>Betalingsbescherming:</strong> het mechanisme waarbij het bedrag van een Boeking wordt vastgehouden door de betalingsprovider totdat de dienst daadwerkelijk is geleverd (bevestigd via check-in).</li>
                </ul>
              </section>

              {/* Artikel 3 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 3 — Toepassingsgebied</h3>
                <p>
                  Deze Algemene Voorwaarden zijn van toepassing op elk gebruik van het Platform, elke registratie, elke offerte-aanvraag, elke boeking en elke transactie die via Eventiphy plaatsvindt. Door het aanmaken van een account of het gebruik van het Platform aanvaardt de gebruiker deze voorwaarden uitdrukkelijk.
                </p>
                <p className="mt-2">
                  Eventiphy behoudt zich het recht voor om deze voorwaarden te allen tijde te wijzigen. Wijzigingen worden meegedeeld via het Platform en treden in werking 30 dagen na publicatie, tenzij anders vermeld.
                </p>
              </section>

              {/* Artikel 4 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 4 — Rol van Eventiphy</h3>
                <p>
                  Eventiphy treedt op als <strong>tussenpersoon</strong> en facilitator. Het Platform brengt Klanten en Providers samen, maar is zelf geen partij bij de dienstverleningsovereenkomst tussen Klant en Provider. Eventiphy is niet verantwoordelijk voor de kwaliteit, uitvoering of het resultaat van de diensten die door Providers worden geleverd.
                </p>
                <p className="mt-2">
                  Eventiphy biedt wel een betalingsbeschermingssysteem, een verificatieproces voor Providers en een beoordelingssysteem om het vertrouwen en de kwaliteit op het Platform te waarborgen.
                </p>
              </section>

              {/* Artikel 5 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 5 — Registratie en accounts</h3>
                <p>Om gebruik te maken van het Platform dient de gebruiker een account aan te maken. Bij registratie verklaart de gebruiker dat:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>de verstrekte gegevens juist, volledig en actueel zijn;</li>
                  <li>hij/zij minstens 18 jaar oud is of handelt met toestemming van een wettelijke vertegenwoordiger;</li>
                  <li>hij/zij de enige gebruiker is van het account en verantwoordelijk is voor de vertrouwelijkheid van de inloggegevens.</li>
                </ul>
                <p className="mt-2">
                  Providers verklaren bij registratie dat zij over alle vereiste vergunningen en verzekeringen beschikken die nodig zijn voor het uitoefenen van hun activiteit (o.a. FAVV-registratie voor catering, SABAM-licentie voor muziek).
                </p>
              </section>

              {/* Artikel 6 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 6 — Boekingsproces en offertes</h3>
                <ol className="list-decimal pl-6 space-y-2">
                  <li>Een Klant plaatst een aanvraag via het Platform, met vermelding van het type dienst, de gewenste datum, locatie en budget.</li>
                  <li>Providers kunnen hierop reageren met een Offerte, waarin zij hun prijs, beschikbaarheid en voorwaarden vermelden.</li>
                  <li>De Klant kan een Offerte aanvaarden, waardoor een Boeking tot stand komt.</li>
                  <li>Een aanvaarde Offerte is bindend voor beide partijen, onder voorbehoud van het annulatiebeleid (Artikel 9).</li>
                </ol>
              </section>

              {/* Artikel 7 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 7 — Prijzen en commissie</h3>
                <p>
                  De prijzen die op het Platform worden weergegeven, worden bepaald door de Providers. Eventiphy heeft geen invloed op de prijszetting van individuele diensten.
                </p>
                <p className="mt-2">
                  Op elke succesvolle Boeking rekent Eventiphy een commissie van <strong>8%</strong> van het totale boekingsbedrag aan de Provider. Dit percentage wordt vooraf duidelijk gecommuniceerd en automatisch verrekend bij de uitbetaling.
                </p>
                <p className="mt-2">
                  Alle prijzen op het Platform zijn inclusief BTW, tenzij uitdrukkelijk anders vermeld.
                </p>
              </section>

              {/* Artikel 8 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 8 — Betalingen en betalingsbescherming</h3>
                <p>
                  Betalingen verlopen via een externe, erkende betalingsprovider. Eventiphy ontvangt of bewaart zelf geen gelden van Klanten.
                </p>
                <p className="mt-2">
                  Het <strong>betalingsbeschermingssysteem</strong> werkt als volgt:
                </p>
                <ol className="list-decimal pl-6 mt-2 space-y-1">
                  <li>Bij het bevestigen van een Boeking betaalt de Klant het volledige bedrag. Dit bedrag wordt vastgehouden door de betalingsprovider.</li>
                  <li>Op de dag van het evenement bevestigt de Provider zijn aanwezigheid via een check-in (QR-code scan).</li>
                  <li>Na bevestiging van de check-in wordt het bedrag (minus de commissie van Eventiphy) vrijgegeven en uitbetaald aan de Provider.</li>
                </ol>
                <p className="mt-2">
                  Dit systeem beschermt Klanten tegen no-shows en geeft Providers zekerheid over betaling na geleverde dienst.
                </p>
              </section>

              {/* Artikel 9 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 9 — Annulatie en terugbetaling</h3>
                <p>Bij annulatie door de <strong>Klant</strong> gelden de volgende voorwaarden:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Meer dan 7 dagen vóór het evenement: volledige terugbetaling.</li>
                  <li>Tussen 3 en 7 dagen vóór het evenement: 50% terugbetaling.</li>
                  <li>Minder dan 3 dagen vóór het evenement: geen terugbetaling.</li>
                </ul>
                <p className="mt-3">Bij annulatie door de <strong>Provider</strong>:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>De Klant ontvangt een volledige terugbetaling, ongeacht het tijdstip van annulatie.</li>
                  <li>Bij herhaalde annulaties kan de Provider worden gesanctioneerd (waarschuwing, opschorting of verwijdering van het Platform).</li>
                </ul>
                <p className="mt-3">Bij <strong>no-show van de Provider</strong> (geen check-in op de dag van het evenement):</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>De Klant ontvangt een volledige terugbetaling.</li>
                  <li>De Provider ontvangt een sanctie conform het sanctiebeleid van Eventiphy.</li>
                </ul>
              </section>

              {/* Artikel 10 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 10 — Herroepingsrecht</h3>
                <p>
                  Overeenkomstig Boek VI van het Wetboek van Economisch Recht (WER) heeft de Klant in principe een herroepingsrecht van 14 dagen bij overeenkomsten op afstand.
                </p>
                <p className="mt-2">
                  Dit herroepingsrecht is <strong>niet van toepassing</strong> op boekingen voor diensten die op een specifieke datum of tijdens een specifieke periode moeten worden uitgevoerd (artikel VI.53, 12° WER), wat geldt voor het merendeel van de diensten op Eventiphy (evenementen op een vaste datum).
                </p>
                <p className="mt-2">
                  In dat geval geldt het annulatiebeleid zoals beschreven in Artikel 9.
                </p>
              </section>

              {/* Artikel 11 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 11 — Aansprakelijkheid</h3>
                <p>
                  Eventiphy spant zich in om een betrouwbaar en beschikbaar Platform aan te bieden, maar kan niet garanderen dat het Platform te allen tijde foutloos of ononderbroken functioneert.
                </p>
                <p className="mt-2">Eventiphy is <strong>niet aansprakelijk</strong> voor:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>de kwaliteit, uitvoering of het resultaat van diensten geleverd door Providers;</li>
                  <li>schade voortvloeiend uit onjuiste of onvolledige informatie verstrekt door gebruikers;</li>
                  <li>indirecte of gevolgschade, waaronder gederfde winst, gemiste kansen of reputatieschade;</li>
                  <li>tijdelijke onbeschikbaarheid van het Platform door onderhoud, technische storingen of overmacht.</li>
                </ul>
                <p className="mt-2">
                  De totale aansprakelijkheid van Eventiphy is in elk geval beperkt tot het bedrag van de commissie die Eventiphy heeft ontvangen voor de betreffende Boeking.
                </p>
              </section>

              {/* Artikel 12 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 12 — Reviews en gebruikerscontent</h3>
                <p>
                  Na afloop van een evenement kan de Klant een beoordeling (review) achterlaten over de Provider. Reviews dienen eerlijk, feitelijk en respectvol te zijn.
                </p>
                <p className="mt-2">Eventiphy behoudt zich het recht voor om reviews te verwijderen die:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>beledigend, discriminerend of lasterlijk zijn;</li>
                  <li>geen verband houden met een daadwerkelijke boeking;</li>
                  <li>persoonsgegevens van derden bevatten;</li>
                  <li>duidelijk nep of gemanipuleerd zijn.</li>
                </ul>
                <p className="mt-2">
                  Door content (tekst, foto&apos;s, reviews) te plaatsen op het Platform verleent de gebruiker aan Eventiphy een niet-exclusief, royaltyvrij en wereldwijd recht om deze content te gebruiken, weer te geven en te promoten in het kader van de platformdiensten.
                </p>
              </section>

              {/* Artikel 13 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 13 — Intellectueel eigendom</h3>
                <p>
                  Alle intellectuele eigendomsrechten met betrekking tot het Platform — waaronder de software, het ontwerp, de teksten, afbeeldingen, logo&apos;s en merknamen — behoren toe aan Eventiphy of haar licentiegevers.
                </p>
                <p className="mt-2">
                  Het is niet toegestaan om zonder voorafgaande schriftelijke toestemming van Eventiphy enig onderdeel van het Platform te kopiëren, reproduceren, verspreiden of op andere wijze te gebruiken.
                </p>
              </section>

              {/* Artikel 14 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 14 — Account-opschorting en beëindiging</h3>
                <p>
                  Eventiphy behoudt zich het recht voor om een account tijdelijk op te schorten of permanent te beëindigen indien:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>de gebruiker deze Algemene Voorwaarden schendt;</li>
                  <li>er sprake is van frauduleus, misleidend of onrechtmatig gedrag;</li>
                  <li>de gebruiker herhaaldelijk negatieve beoordelingen ontvangt die wijzen op structurele kwaliteitsproblemen (Providers);</li>
                  <li>de gebruiker het Platform gebruikt op een manier die schadelijk is voor andere gebruikers of voor Eventiphy.</li>
                </ul>
                <p className="mt-2">
                  Gebruikers kunnen hun account op elk moment verwijderen via hun accountinstellingen of door contact op te nemen met Eventiphy. Openstaande boekingen en financiële verplichtingen blijven van kracht na verwijdering.
                </p>
              </section>

              {/* Artikel 15 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 15 — Klachten en geschillen</h3>
                <p>
                  Bij klachten over een Boeking of het Platform kan de gebruiker contact opnemen via eventiphy@gmail.com. Eventiphy streeft ernaar elke klacht binnen 14 werkdagen te behandelen.
                </p>
                <p className="mt-2">
                  Indien een geschil niet in onderling overleg kan worden opgelost, kan de consument gebruik maken van het Europees platform voor online geschillenbeslechting (ODR): <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-800 underline">https://ec.europa.eu/consumers/odr</a>.
                </p>
              </section>

              {/* Artikel 16 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 16 — Overmacht</h3>
                <p>
                  Eventiphy is niet aansprakelijk voor het niet of niet-tijdig nakomen van verplichtingen als gevolg van overmacht, waaronder maar niet beperkt tot: natuurrampen, pandemieën, stakingen, overheidsmaatregelen, internetuitval of storingen bij externe dienstverleners.
                </p>
              </section>

              {/* Artikel 17 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">Artikel 17 — Toepasselijk recht en bevoegde rechtbank</h3>
                <p>
                  Op deze Algemene Voorwaarden en alle overeenkomsten die via het Platform tot stand komen, is het <strong>Belgische recht</strong> van toepassing.
                </p>
                <p className="mt-2">
                  In geval van geschillen die niet via het ODR-platform of onderling overleg kunnen worden opgelost, zijn de rechtbanken van het arrondissement Antwerpen bevoegd.
                </p>
              </section>
            </div>
          </div>
        </Container>
      </Section>

      {/* Visuele scheiding */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <hr className="border-gray-200" />
      </div>

      {/* ==================== PRIVACYVERKLARING ==================== */}
      <div id="privacyverklaring" className="scroll-mt-4" />
      <Section className="py-8 md:py-12">
        <Container className="py-0">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-8">
              Privacy<span className="gradient-text">verklaring</span>
            </h2>
            <p className="text-sm text-gray-500 mb-8">Laatst bijgewerkt: maart 2026</p>

            <div className="space-y-8 text-gray-700 leading-relaxed">
              {/* Artikel 1 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">1. Verwerkingsverantwoordelijke</h3>
                <p>
                  Eventiphy is verantwoordelijk voor de verwerking van uw persoonsgegevens zoals beschreven in deze privacyverklaring.
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Naam: Eventiphy</li>
                  <li>Adres: Antwerpen, België</li>
                  <li>E-mail: eventiphy@gmail.com</li>
                  <li>Telefoon: +32 486 71 47 88</li>
                </ul>
              </section>

              {/* Artikel 2 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">2. Welke gegevens verzamelen wij?</h3>
                <p>Wij verzamelen en verwerken de volgende categorieën persoonsgegevens:</p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">Accountgegevens</h4>
                <p>Naam, e-mailadres, telefoonnummer, wachtwoord (versleuteld opgeslagen). Deze gegevens zijn noodzakelijk voor het aanmaken en beheren van uw account.</p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">Profielgegevens van Providers</h4>
                <p>Bedrijfsnaam, BTW-nummer, adres, beschrijving van diensten, portfolio (foto&apos;s), prijsinformatie. Deze gegevens worden weergegeven op het Platform om Klanten te informeren.</p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">Boekings- en transactiegegevens</h4>
                <p>Details van offertes, boekingen, prijzen, data, locaties, betalingsstatussen en transactie-identificatienummers. Deze zijn noodzakelijk voor het uitvoeren van boekingen en het betalingsbeschermingssysteem.</p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">Communicatiegegevens</h4>
                <p>Berichten uitgewisseld tussen Klanten en Providers via het berichtensysteem van het Platform. Deze worden bewaard voor geschillenbeslechting en kwaliteitscontrole.</p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">Gebruiksgegevens</h4>
                <p>Informatie over hoe u het Platform gebruikt, zoals zoekgedrag, bekeken pagina&apos;s, tijdstip van gebruik en type apparaat. Deze gegevens worden gebruikt om het Platform te verbeteren.</p>

                <h4 className="font-semibold text-gray-800 mt-4 mb-2">Technische gegevens</h4>
                <p>IP-adres, browsertype, besturingssysteem en apparaatinformatie. Deze worden automatisch verzameld bij het gebruik van het Platform.</p>
              </section>

              {/* Artikel 3 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">3. Rechtsgrond en doeleinden</h3>
                <p>Wij verwerken uw persoonsgegevens op basis van de volgende rechtsgronden (artikel 6 AVG/GDPR):</p>

                <div className="mt-3 space-y-3">
                  <div>
                    <p><strong>Uitvoering van de overeenkomst (Art. 6.1.b):</strong></p>
                    <p className="text-gray-600">Het aanmaken van uw account, het verwerken van boekingen, het faciliteren van communicatie tussen Klanten en Providers, en het uitvoeren van betalingen en terugbetalingen.</p>
                  </div>
                  <div>
                    <p><strong>Wettelijke verplichting (Art. 6.1.c):</strong></p>
                    <p className="text-gray-600">Het bijhouden van boekhoudkundige en fiscale gegevens (facturen, transactieoverzichten) conform de Belgische wetgeving.</p>
                  </div>
                  <div>
                    <p><strong>Gerechtvaardigd belang (Art. 6.1.f):</strong></p>
                    <p className="text-gray-600">Het verbeteren van het Platform, het voorkomen van fraude, het waarborgen van de veiligheid van het Platform, en het beheren van het beoordelingssysteem.</p>
                  </div>
                  <div>
                    <p><strong>Toestemming (Art. 6.1.a):</strong></p>
                    <p className="text-gray-600">Het plaatsen van niet-essentiële cookies, het verzenden van marketingcommunicatie en eventuele toekomstige verwerking van gegevens voor analytische doeleinden ten behoeve van derden.</p>
                  </div>
                </div>
              </section>

              {/* Artikel 4 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">4. Ontvangers en derden</h3>
                <p>Uw persoonsgegevens kunnen worden gedeeld met de volgende categorieën ontvangers:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Betalingsprovider:</strong> Onze betalingsprovider verwerkt uw betalingsgegevens ten behoeve van het betalingsbeschermingssysteem. Deze partij beschikt over een eigen vergunning als betalingsdienstaanbieder (PSD2).</li>
                  <li><strong>Hostingprovider:</strong> Het Platform wordt gehost op beveiligde servers. De hostingprovider verwerkt gegevens uitsluitend in opdracht van Eventiphy.</li>
                  <li><strong>Klanten en Providers:</strong> Bij een Boeking worden relevante contactgegevens gedeeld tussen de betrokken Klant en Provider, voor zover noodzakelijk voor de uitvoering van de dienst.</li>
                  <li><strong>Overheidsinstanties:</strong> Indien wettelijk verplicht, kunnen gegevens worden gedeeld met bevoegde autoriteiten (bijv. fiscale gegevens met de FOD Financiën).</li>
                </ul>
                <p className="mt-2">
                  Eventiphy verkoopt geen persoonsgegevens aan derden. Indien wij in de toekomst geanonimiseerde en geaggregeerde marktdata ter beschikking stellen, zal dit uitsluitend data betreffen die op geen enkele wijze tot individuele personen herleidbaar is.
                </p>
              </section>

              {/* Artikel 5 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">5. Doorgifte buiten de EU</h3>
                <p>
                  Sommige van onze dienstverleners (waaronder onze betalingsprovider en hostingpartners) kunnen gegevens verwerken buiten de Europese Economische Ruimte (EER). In dat geval zorgen wij ervoor dat passende waarborgen worden getroffen, zoals:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>Standard Contractual Clauses (SCC&apos;s) goedgekeurd door de Europese Commissie;</li>
                  <li>een adequaatheidsbesluit van de Europese Commissie voor het betrokken land;</li>
                  <li>andere passende waarborgen conform artikel 46 AVG/GDPR.</li>
                </ul>
              </section>

              {/* Artikel 6 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">6. Bewaartermijnen</h3>
                <p>Wij bewaren uw persoonsgegevens niet langer dan noodzakelijk voor de doeleinden waarvoor zij zijn verzameld:</p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li><strong>Accountgegevens:</strong> tot 1 jaar na verwijdering van het account.</li>
                  <li><strong>Boekings- en transactiegegevens:</strong> 7 jaar na de transactie (wettelijke boekhoudverplichting).</li>
                  <li><strong>Communicatiegegevens:</strong> tot 2 jaar na de laatste activiteit in het gesprek.</li>
                  <li><strong>Gebruiks- en technische gegevens:</strong> maximaal 26 maanden.</li>
                  <li><strong>Contracten:</strong> 10 jaar (wettelijke bewaartermijn).</li>
                </ul>
              </section>

              {/* Artikel 7 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">7. Uw rechten</h3>
                <p>Als betrokkene heeft u de volgende rechten onder de AVG/GDPR:</p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Recht op inzage:</strong> U kunt opvragen welke persoonsgegevens wij van u verwerken.</li>
                  <li><strong>Recht op correctie:</strong> U kunt onjuiste of onvolledige gegevens laten verbeteren.</li>
                  <li><strong>Recht op verwijdering:</strong> U kunt verzoeken om verwijdering van uw persoonsgegevens, tenzij een wettelijke bewaarplicht van toepassing is.</li>
                  <li><strong>Recht op beperking:</strong> U kunt verzoeken om de verwerking van uw gegevens tijdelijk te beperken.</li>
                  <li><strong>Recht op overdraagbaarheid:</strong> U kunt vragen om uw gegevens in een gestructureerd, gangbaar en machineleesbaar formaat te ontvangen.</li>
                  <li><strong>Recht van bezwaar:</strong> U kunt bezwaar maken tegen verwerking op basis van gerechtvaardigd belang.</li>
                  <li><strong>Recht om toestemming in te trekken:</strong> Waar de verwerking is gebaseerd op toestemming, kunt u deze op elk moment intrekken.</li>
                </ul>
                <p className="mt-2">
                  U kunt deze rechten uitoefenen door contact op te nemen via <a href="mailto:eventiphy@gmail.com" className="text-purple-700 hover:text-purple-800 underline">eventiphy@gmail.com</a>. Wij reageren binnen 30 dagen op uw verzoek.
                </p>
              </section>

              {/* Artikel 8 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">8. Cookies</h3>
                <p>
                  Het Platform maakt gebruik van cookies en vergelijkbare technologieën. Wij onderscheiden de volgende categorieën:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-2">
                  <li><strong>Strikt noodzakelijke cookies:</strong> Essentieel voor het functioneren van het Platform (bijv. sessie- en authenticatiecookies). Hiervoor is geen toestemming vereist.</li>
                  <li><strong>Analytische cookies:</strong> Helpen ons te begrijpen hoe het Platform wordt gebruikt, zodat wij het kunnen verbeteren. Worden alleen geplaatst met uw toestemming.</li>
                  <li><strong>Marketingcookies:</strong> Worden gebruikt om relevante advertenties te tonen. Worden alleen geplaatst met uw uitdrukkelijke toestemming.</li>
                </ul>
                <p className="mt-2">
                  U kunt uw cookie-voorkeuren op elk moment aanpassen via de cookie-instellingen op het Platform of via uw browserinstellingen.
                </p>
              </section>

              {/* Artikel 9 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">9. Beveiliging</h3>
                <p>
                  Eventiphy neemt passende technische en organisatorische maatregelen om uw persoonsgegevens te beschermen tegen ongeoorloofde toegang, verlies, vernietiging of wijziging. Dit omvat onder meer:
                </p>
                <ul className="list-disc pl-6 mt-2 space-y-1">
                  <li>versleutelde opslag van wachtwoorden (bcrypt hashing);</li>
                  <li>beveiligde verbindingen (HTTPS/SSL);</li>
                  <li>toegangscontrole op basis van rollen;</li>
                  <li>regelmatige beveiligingsupdates van het Platform.</li>
                </ul>
              </section>

              {/* Artikel 10 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">10. Wijzigingen aan deze privacyverklaring</h3>
                <p>
                  Eventiphy kan deze privacyverklaring van tijd tot tijd bijwerken om wijzigingen in onze praktijken of wettelijke vereisten weer te geven. De meest recente versie is steeds beschikbaar op het Platform. Bij substantiële wijzigingen informeren wij u via e-mail of een melding op het Platform.
                </p>
              </section>

              {/* Artikel 11 */}
              <section>
                <h3 className="text-xl font-semibold text-gray-900 mb-3">11. Klacht indienen</h3>
                <p>
                  Indien u van mening bent dat Eventiphy uw persoonsgegevens niet correct verwerkt, kunt u een klacht indienen bij:
                </p>
                <div className="mt-2 p-4 bg-gray-50 rounded-xl">
                  <p className="font-semibold text-gray-900">Gegevensbeschermingsautoriteit (GBA)</p>
                  <p>Drukpersstraat 35, 1000 Brussel</p>
                  <p>Telefoon: +32 2 274 48 00</p>
                  <p>E-mail: contact@apd-gba.be</p>
                  <p>
                    Website:{' '}
                    <a href="https://www.gegevensbeschermingsautoriteit.be" target="_blank" rel="noopener noreferrer" className="text-purple-700 hover:text-purple-800 underline">
                      www.gegevensbeschermingsautoriteit.be
                    </a>
                  </p>
                </div>
              </section>
            </div>
          </div>
        </Container>
      </Section>

      {/* Terug naar Over Ons */}
      <Section className="py-6 md:py-8">
        <Container className="py-0">
          <div className="flex justify-center">
            <Link
              href="/about"
              className="text-purple-700 hover:text-purple-800 font-medium underline underline-offset-4"
            >
              Terug naar Over Ons
            </Link>
          </div>
        </Container>
      </Section>
    </main>
  );
}
