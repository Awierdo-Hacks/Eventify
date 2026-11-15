import type { Metadata } from 'next';
import { site } from '@/config/site';
import { LEGAL_DOCUMENTS } from '@/features/legal/documents';
import { CompanyIdentity, LegalLink, LegalPage, LegalSection, Mail } from '@/features/legal/legal-page';

const doc = LEGAL_DOCUMENTS.privacy;

export const metadata: Metadata = {
  title: 'Privacyverklaring',
  description:
    'Welke persoonsgegevens Eventiphy verwerkt, waarom, hoe lang we ze bewaren, met wie we ze delen en welke rechten je hebt.',
  alternates: { canonical: '/privacy' },
};

const SECTIONS = [
  { id: 'wie', title: '1. Wie is verantwoordelijk?' },
  { id: 'gegevens', title: '2. Welke gegevens verwerken we?' },
  { id: 'doelen', title: '3. Waarvoor en op welke grond?' },
  { id: 'delen', title: '4. Met wie delen we gegevens?' },
  { id: 'doorgifte', title: '5. Gegevens buiten Europa' },
  { id: 'bewaren', title: '6. Hoe lang bewaren we gegevens?' },
  { id: 'beveiliging', title: '7. Beveiliging' },
  { id: 'rechten', title: '8. Jouw rechten' },
  { id: 'besluiten', title: '9. Geautomatiseerde beslissingen' },
  { id: 'minderjarigen', title: '10. Minderjarigen' },
  { id: 'cookies', title: '11. Cookies' },
  { id: 'wijzigingen', title: '12. Wijzigingen' },
  { id: 'klacht', title: '13. Klacht indienen' },
];

export default function PrivacyPage() {
  const { privacyEmail } = site.contact;
  return (
    <LegalPage
      title="Privacyverklaring"
      intro="We verwerken alleen de gegevens die nodig zijn om Eventiphy te laten werken, en we verkopen ze niet. Hier lees je precies wat we doen."
      updated={doc.updatedLabel}
      version={doc.version}
      sections={SECTIONS}
    >
      <LegalSection id="wie" title="1. Wie is verantwoordelijk?">
        <p>De verwerkingsverantwoordelijke voor de gegevens die via Eventiphy worden verwerkt is:</p>
        <CompanyIdentity />
        <p>
          Voor alle vragen over privacy en om je rechten uit te oefenen: <Mail to={privacyEmail} />.
        </p>
        <p>
          <strong>Dienstverleners zijn zelf ook verantwoordelijk.</strong> Wanneer je als klant een offerte aanvraagt,
          ontvangt de dienstverlener je contactgegevens en de details van je event. Voor wat de dienstverlener daarna
          met die gegevens doet (bijvoorbeeld je factureren), is die dienstverlener zelf verwerkingsverantwoordelijke.
        </p>
      </LegalSection>

      <LegalSection id="gegevens" title="2. Welke gegevens verwerken we?">
        <h3>Gegevens die je zelf geeft</h3>
        <ul>
          <li>
            <strong>Account:</strong> naam, e-mailadres, wachtwoord (alleen versleuteld opgeslagen), telefoonnummer en,
            voor klanten, geboortedatum om te controleren dat je meerderjarig bent.
          </li>
          <li>
            <strong>Profiel van dienstverleners:</strong> bedrijfsnaam, categorie, regio, beschrijving, foto’s, diensten
            en richtprijzen, website, ondernemingsnummer. Het profiel is publiek zichtbaar, behalve het
            ondernemingsnummer en je e-mailadres.
          </li>
          <li>
            <strong>Events, aanvragen, offertes en boekingen:</strong> type event, datum, plaats, aantal gasten, budget,
            je toelichting, de inhoud en prijs van offertes en de status van boekingen.
          </li>
          <li>
            <strong>Berichten:</strong> de berichten en bijlagen die je via de chat verstuurt.
          </li>
          <li>
            <strong>Beoordelingen:</strong> je score en tekst. We tonen daarbij alleen je voornaam.
          </li>
          <li>
            <strong>Agenda van dienstverleners:</strong> dagen die je blokkeert. Koppel je een externe kalender, dan
            lezen we alleen op welke dagen je bezet bent, nooit de inhoud van je afspraken.
          </li>
          <li>
            <strong>Wachtlijst en meldingen:</strong> de gegevens die je in die formulieren invult.
          </li>
        </ul>
        <h3>Gegevens die automatisch ontstaan</h3>
        <ul>
          <li>
            <strong>Technische gegevens:</strong> IP-adres, type browser en tijdstip van verzoeken. Onze hostingpartner
            houdt die kort bij in logbestanden om de dienst te beveiligen en storingen op te lossen.
          </li>
          <li>
            <strong>Je cookiekeuze</strong> en, als je een account hebt, welke versie van de voorwaarden je wanneer
            aanvaardde.
          </li>
        </ul>
        <p>
          We verwerken geen bijzondere categorieën van persoonsgegevens (zoals gezondheid of geloofsovertuiging) en
          vragen je die niet te delen. Betaalgegevens verwerken we niet: betalen gebeurt rechtstreeks tussen klant en
          dienstverlener.
        </p>
      </LegalSection>

      <LegalSection id="doelen" title="3. Waarvoor en op welke grond?">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Doel</th>
                <th scope="col">Rechtsgrond (AVG art. 6)</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Je account aanmaken en beheren, je laten inloggen</td>
                <td>Uitvoering van de overeenkomst met jou</td>
              </tr>
              <tr>
                <td>
                  Aanvragen, offertes, boekingen en berichten mogelijk maken tussen klant en dienstverlener, en profielen
                  en beoordelingen tonen
                </td>
                <td>Uitvoering van de overeenkomst met jou</td>
              </tr>
              <tr>
                <td>Nieuwe dienstverleners controleren voordat hun profiel zichtbaar wordt</td>
                <td>Gerechtvaardigd belang: een betrouwbaar platform</td>
              </tr>
              <tr>
                <td>Misbruik en fraude voorkomen, het platform beveiligen, meldingen behandelen</td>
                <td>Gerechtvaardigd belang en wettelijke verplichting (Digitaledienstenverordening)</td>
              </tr>
              <tr>
                <td>Je op de hoogte houden als je je inschreef op de wachtlijst</td>
                <td>Jouw toestemming, die je altijd kunt intrekken</td>
              </tr>
              <tr>
                <td>Cookies voor statistieken of marketing, als we die ooit gebruiken</td>
                <td>Jouw toestemming, die je altijd kunt intrekken</td>
              </tr>
              <tr>
                <td>Bewijzen dat voorwaarden zijn aanvaard en welke cookiekeuze is gemaakt</td>
                <td>Wettelijke verplichting en gerechtvaardigd belang (bewijs)</td>
              </tr>
              <tr>
                <td>Vragen en klachten beantwoorden, geschillen behandelen</td>
                <td>Gerechtvaardigd belang en, waar van toepassing, wettelijke verplichting</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          Waar we ons op een gerechtvaardigd belang beroepen, hebben we dat afgewogen tegen jouw belangen. Je kunt
          tegen die verwerking bezwaar maken (zie <a href="#rechten">jouw rechten</a>).
        </p>
        <p>
          De gegevens met een sterretje in onze formulieren zijn nodig om de dienst te leveren. Geef je ze niet, dan
          kunnen we bijvoorbeeld geen account aanmaken of je aanvraag niet doorsturen.
        </p>
      </LegalSection>

      <LegalSection id="delen" title="4. Met wie delen we gegevens?">
        <p>
          <strong>We verkopen je gegevens niet</strong> en geven ze niet door voor reclame van anderen. We delen ze
          alleen in deze gevallen:
        </p>
        <ul>
          <li>
            <strong>Met de andere partij.</strong> Vraag je als klant een offerte aan, dan ziet die dienstverlener je
            naam, e-mailadres, telefoonnummer en de details van je event. Als dienstverlener zien klanten je publieke
            profiel en wat je hen stuurt.
          </li>
          <li>
            <strong>Met onze verwerkers.</strong> Bedrijven die in onze opdracht werken en je gegevens alleen volgens
            onze instructies mogen gebruiken: de hosting van de website, de database en de opslag van bestanden. Met elk
            van hen sluiten we een verwerkersovereenkomst.
          </li>
          <li>
            <strong>Met Google,</strong> alleen als je als dienstverlener zelf je Google Calendar koppelt. We vragen dan
            uitsluitend op wanneer je bezet bent. Je kunt de koppeling altijd verwijderen; we trekken dan onze toegang
            in en wissen wat we hadden overgenomen.
          </li>
          <li>
            <strong>Met autoriteiten,</strong> wanneer de wet ons daartoe verplicht of wanneer dat nodig is om onze
            rechten te verdedigen.
          </li>
        </ul>
        <p>Een actuele lijst van onze verwerkers krijg je op verzoek via <Mail to={privacyEmail} />.</p>
      </LegalSection>

      <LegalSection id="doorgifte" title="5. Gegevens buiten Europa">
        <p>
          We bewaren je gegevens bij voorkeur binnen de Europese Economische Ruimte. Sommige van onze verwerkers zijn
          gevestigd in, of maken deel uit van een groep uit, de Verenigde Staten. Als gegevens daardoor buiten de EER
          terechtkomen, gebeurt dat alleen op basis van een adequaatheidsbesluit van de Europese Commissie (zoals het
          EU-VS Data Privacy Framework) of de standaardcontractbepalingen van de Europese Commissie. Een kopie van die
          waarborgen kun je opvragen via <Mail to={privacyEmail} />.
        </p>
      </LegalSection>

      <LegalSection id="bewaren" title="6. Hoe lang bewaren we gegevens?">
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Gegevens</th>
                <th scope="col">Bewaartermijn</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Account, profiel, events, agenda</td>
                <td>Zolang je account bestaat. Verwijder je je account, dan wissen we deze gegevens meteen.</td>
              </tr>
              <tr>
                <td>Berichten</td>
                <td>
                  Zolang je account bestaat. Bij verwijdering wissen we de inhoud van jouw berichten en je bijlagen.
                </td>
              </tr>
              <tr>
                <td>Boekingen, offertes en beoordelingen</td>
                <td>
                  Na verwijdering van je account blijven ze bewaard zonder je naam of contactgegevens, omdat de andere
                  partij ze nodig heeft voor de eigen administratie en om afspraken te kunnen bewijzen.
                </td>
              </tr>
              <tr>
                <td>Bewijs van aanvaarde voorwaarden en van cookiekeuzes</td>
                <td>Tot vijf jaar na de aanvaarding of de keuze.</td>
              </tr>
              <tr>
                <td>Wachtlijst</td>
                <td>Tot je je uitschrijft, en uiterlijk twee jaar na je inschrijving.</td>
              </tr>
              <tr>
                <td>Meldingen van inhoud</td>
                <td>Zolang nodig om de melding te behandelen en dat te kunnen aantonen, uiterlijk vijf jaar.</td>
              </tr>
              <tr>
                <td>Technische logbestanden</td>
                <td>Maximaal dertig dagen, tenzij ze nodig zijn om een incident te onderzoeken.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>Waar de wet een langere bewaring oplegt, bijvoorbeeld voor boekhoudkundige stukken, volgen we die termijn.</p>
      </LegalSection>

      <LegalSection id="beveiliging" title="7. Beveiliging">
        <p>We nemen passende technische en organisatorische maatregelen, waaronder:</p>
        <ul>
          <li>versleutelde verbindingen (https) voor al het verkeer;</li>
          <li>wachtwoorden die alleen als onomkeerbare hash worden opgeslagen;</li>
          <li>versleutelde opslag van de toegangssleutels voor gekoppelde kalenders;</li>
          <li>toegang tot gegevens beperkt tot wie die nodig heeft, en controle op elke aanvraag of je bij de gegevens mag;</li>
          <li>beperkingen tegen geautomatiseerde aanvallen op inlog- en formulierpagina’s.</li>
        </ul>
        <p>
          Gaat er toch iets mis met je gegevens en houdt dat een risico in voor jou, dan melden we dat aan de
          Gegevensbeschermingsautoriteit en, waar nodig, aan jou.
        </p>
      </LegalSection>

      <LegalSection id="rechten" title="8. Jouw rechten">
        <p>Je hebt het recht om:</p>
        <ul>
          <li>
            <strong>je gegevens in te zien en mee te nemen</strong>: download ze zelf via Account &amp; privacy, in een
            gangbaar, leesbaar formaat;
          </li>
          <li>
            <strong>je gegevens te verbeteren</strong>: pas ze aan in je account of profiel;
          </li>
          <li>
            <strong>je gegevens te laten wissen</strong>: verwijder je account via Account &amp; privacy;
          </li>
          <li>
            <strong>de verwerking te laten beperken</strong> of er <strong>bezwaar tegen te maken</strong>, wanneer we
            ons op een gerechtvaardigd belang beroepen;
          </li>
          <li>
            <strong>je toestemming in te trekken</strong>, bijvoorbeeld voor cookies of de wachtlijst. Dat heeft geen
            gevolgen voor wat er vóór de intrekking gebeurde.
          </li>
        </ul>
        <p>
          Voor alles wat je niet zelf kunt regelen, mail je naar <Mail to={privacyEmail} />. We antwoorden binnen een
          maand. Als we twijfelen aan je identiteit, kunnen we om een bevestiging vragen. Het uitoefenen van je rechten
          is gratis.
        </p>
      </LegalSection>

      <LegalSection id="besluiten" title="9. Geautomatiseerde beslissingen">
        <p>
          We nemen geen beslissingen over jou die uitsluitend op geautomatiseerde verwerking berusten en die
          rechtsgevolgen voor je hebben of je op een vergelijkbare manier aanzienlijk treffen. De volgorde van
          zoekresultaten wordt wel automatisch bepaald, op basis van beoordelingen; hoe dat werkt lees je op de
          zoekpagina en in de voorwaarden. Beslissingen om een account te beperken worden altijd door een medewerker
          genomen.
        </p>
      </LegalSection>

      <LegalSection id="minderjarigen" title="10. Minderjarigen">
        <p>
          Eventiphy is bedoeld voor wie minstens 18 jaar is. We verwerken niet bewust gegevens van minderjarigen. Denk
          je dat een minderjarige een account heeft aangemaakt, laat het ons dan weten.
        </p>
      </LegalSection>

      <LegalSection id="cookies" title="11. Cookies">
        <p>
          Welke cookies we gebruiken en hoe je je keuze aanpast, lees je in ons{' '}
          <LegalLink href="/cookies">cookiebeleid</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="wijzigingen" title="12. Wijzigingen">
        <p>
          Als we deze verklaring aanpassen, zetten we de nieuwe versie hier met de datum erbij. Bij belangrijke
          wijzigingen brengen we je op de hoogte voordat ze ingaan.
        </p>
      </LegalSection>

      <LegalSection id="klacht" title="13. Klacht indienen">
        <p>
          Ben je het niet eens met hoe we met je gegevens omgaan? Laat het ons eerst weten, dan zoeken we een
          oplossing. Je hebt daarnaast altijd het recht om klacht in te dienen bij de toezichthouder:
        </p>
        <ul>
          <li>
            <strong>Gegevensbeschermingsautoriteit</strong>, Drukpersstraat 35, 1000 Brussel
          </li>
          <li>
            <a href="https://www.gegevensbeschermingsautoriteit.be" rel="noopener noreferrer" target="_blank">
              www.gegevensbeschermingsautoriteit.be
            </a>{' '}
            · contact@apd-gba.be · +32 2 274 48 00
          </li>
        </ul>
      </LegalSection>
    </LegalPage>
  );
}
