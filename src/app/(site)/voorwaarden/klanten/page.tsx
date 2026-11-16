import type { Metadata } from 'next';
import { site } from '@/config/site';
import { LEGAL_DOCUMENTS } from '@/features/legal/documents';
import {
  CompanyIdentity,
  LegalLink,
  LegalPage,
  LegalSection,
  Mail,
} from '@/features/legal/legal-page';

const doc = LEGAL_DOCUMENTS['terms-customer'];

export const metadata: Metadata = {
  title: doc.title,
  description:
    'De afspraken die gelden wanneer je als klant Eventiphy gebruikt om dienstverleners voor je event te vinden.',
  alternates: { canonical: doc.href },
};

const SECTIONS = [
  { id: 'wie', title: '1. Wie zijn wij?' },
  { id: 'dienst', title: '2. Wat Eventiphy doet' },
  { id: 'account', title: '3. Je account' },
  { id: 'boeken', title: '4. Aanvragen, offertes en boekingen' },
  { id: 'prijzen', title: '5. Prijzen en betalen' },
  { id: 'annuleren', title: '6. Annuleren en herroepen' },
  { id: 'beoordelingen', title: '7. Beoordelingen' },
  { id: 'volgorde', title: '8. Volgorde van zoekresultaten' },
  { id: 'regels', title: '9. Wat we van je verwachten' },
  { id: 'ingrijpen', title: '10. Wanneer we ingrijpen' },
  { id: 'aansprakelijkheid', title: '11. Aansprakelijkheid' },
  { id: 'eigendom', title: '12. Inhoud en intellectuele eigendom' },
  { id: 'stoppen', title: '13. Stoppen' },
  { id: 'wijzigingen', title: '14. Wijzigingen' },
  { id: 'klachten', title: '15. Klachten en geschillen' },
];

export default function CustomerTermsPage() {
  const { supportEmail } = site.contact;
  return (
    <LegalPage
      title={doc.title}
      intro="Deze voorwaarden gelden wanneer je Eventiphy gebruikt om dienstverleners voor je event te zoeken, offertes aan te vragen en afspraken vast te leggen."
      updated={doc.updatedLabel}
      version={doc.version}
      sections={SECTIONS}
    >
      <LegalSection id="wie" title="1. Wie zijn wij?">
        <p>Eventiphy wordt aangeboden door:</p>
        <CompanyIdentity />
        <p>
          In deze voorwaarden noemen we onszelf “Eventiphy” of “wij”. Met “dienstverlener” bedoelen
          we een onderneming die via Eventiphy diensten voor evenementen aanbiedt.
        </p>
      </LegalSection>

      <LegalSection id="dienst" title="2. Wat Eventiphy doet">
        <p>
          Eventiphy is een online platform dat klanten en dienstverleners met elkaar in contact
          brengt. Je kunt er profielen bekijken, offertes aanvragen en vergelijken, berichten sturen
          en je event plannen.
        </p>
        <p>
          <strong>Wij zijn een tussenpersoon.</strong> Accepteer je een offerte, dan sluit je een
          overeenkomst rechtstreeks met de dienstverlener. Eventiphy is geen partij bij die
          overeenkomst, voert de dienst niet uit en is er niet verantwoordelijk voor. De
          dienstverleners op Eventiphy handelen als professional; op je overeenkomst met hen is het
          consumentenrecht van toepassing.
        </p>
        <p>
          Wij controleren nieuwe dienstverleners voordat hun profiel zichtbaar wordt. Dat is een
          zorgvuldige controle van de opgegeven gegevens, geen garantie over de kwaliteit van hun
          werk.
        </p>
      </LegalSection>

      <LegalSection id="account" title="3. Je account">
        <ul>
          <li>Je moet minstens 18 jaar zijn om een account aan te maken.</li>
          <li>Je geeft juiste gegevens op en houdt ze actueel.</li>
          <li>
            Je account is persoonlijk. Houd je wachtwoord geheim en verwittig ons als je vermoedt
            dat iemand anders toegang heeft.
          </li>
          <li>Een account aanmaken en gebruiken is gratis.</li>
        </ul>
      </LegalSection>

      <LegalSection id="boeken" title="4. Aanvragen, offertes en boekingen">
        <ul>
          <li>
            <strong>Een aanvraag is vrijblijvend.</strong> Je vraagt een dienstverlener om een
            offerte; je zit nergens aan vast.
          </li>
          <li>
            <strong>Een offerte is een aanbod van de dienstverlener.</strong> Ze vermeldt de prijs,
            wat inbegrepen is, de voorwaarden en tot wanneer ze geldig is.
          </li>
          <li>
            <strong>Accepteren is bindend.</strong> Zodra je een offerte uitdrukkelijk accepteert,
            bestaat er een overeenkomst tussen jou en de dienstverlener. Op Eventiphy heet dat
            “vastgelegd”. Lees de offerte dus aandachtig voordat je accepteert.
          </li>
          <li>
            Na acceptatie maak je verdere praktische afspraken rechtstreeks met de dienstverlener,
            bijvoorbeeld via de chat.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="prijzen" title="5. Prijzen en betalen">
        <ul>
          <li>Het gebruik van Eventiphy kost je als klant niets.</li>
          <li>
            De prijs van een dienst wordt bepaald door de dienstverlener. Richtprijzen op een
            profiel zijn een indicatie; alleen de prijs in de offerte geldt.
          </li>
          <li>
            <strong>Betalen gebeurt rechtstreeks aan de dienstverlener</strong>, volgens wat jullie
            afspreken. Eventiphy int geen betalingen. “Vastgelegd” betekent dus niet “betaald”.
          </li>
          <li>
            Als we in de toekomst online betalen mogelijk maken, laten we je dat vooraf weten met de
            voorwaarden die daarbij horen.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="annuleren" title="6. Annuleren en herroepen">
        <p>
          <strong>Een boeking annuleren.</strong> Of en tegen welke voorwaarden je een vastgelegde
          afspraak kunt annuleren, hangt af van de voorwaarden van de dienstverlener in de offerte.
          Neem contact op met de dienstverlener om te annuleren of te wijzigen.
        </p>
        <p>
          <strong>Herroepingsrecht.</strong> Voor overeenkomsten op afstand heb je als consument
          normaal 14 dagen om je te bedenken. Dat recht geldt volgens de wet niet voor diensten voor
          vrijetijdsbesteding, catering, vervoer of accommodatie waarvoor een bepaalde datum of
          periode is afgesproken (artikel VI.53, 12° van het Wetboek van economisch recht). De
          meeste diensten voor een event op een afgesproken datum vallen daaronder. De
          dienstverlener moet je hierover informeren.
        </p>
        <p>
          <strong>Je Eventiphy-account</strong> is gratis en kun je op elk moment zonder reden
          opzeggen (zie artikel 13).
        </p>
      </LegalSection>

      <LegalSection id="beoordelingen" title="7. Beoordelingen">
        <ul>
          <li>
            Je kunt een dienstverlener alleen beoordelen na een afgeronde boeking bij die
            dienstverlener via Eventiphy, één keer per boeking. Zo weten we dat beoordelingen van
            echte klanten komen.
          </li>
          <li>Schrijf eerlijk over je eigen ervaring. We tonen bij je beoordeling je voornaam.</li>
          <li>
            We passen beoordelingen niet aan en tonen positieve en negatieve op dezelfde manier.
            Dienstverleners kunnen niet betalen om beoordelingen te laten verwijderen of te
            verbergen.
          </li>
          <li>
            We verwijderen een beoordeling alleen als ze onwettig is, niet over een echte ervaring
            gaat of tegen artikel 9 ingaat.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="volgorde" title="8. Volgorde van zoekresultaten">
        <p>
          Standaard (“Aanbevolen”) staan dienstverleners met de hoogste gemiddelde beoordeling
          bovenaan. Bij een gelijke score telt het aantal beoordelingen, en daarna hoe recent het
          profiel is aangemaakt. Je kunt ook sorteren op beoordeling of op nieuwste, en filteren op
          categorie, regio en prijsklasse.
        </p>
        <p>
          <strong>Dienstverleners kunnen niet betalen voor een hogere positie.</strong> Alleen
          profielen die wij hebben nagekeken worden getoond.
        </p>
      </LegalSection>

      <LegalSection id="regels" title="9. Wat we van je verwachten">
        <p>Je gebruikt Eventiphy niet om:</p>
        <ul>
          <li>
            iets te doen of te plaatsen dat onwettig, bedrieglijk, beledigend, discriminerend of
            intimiderend is;
          </li>
          <li>
            aanvragen te doen zonder echte interesse, of anderen lastig te vallen met ongewenste
            berichten;
          </li>
          <li>valse of misleidende beoordelingen te plaatsen;</li>
          <li>rechten van anderen te schenden, zoals auteursrecht of privacy;</li>
          <li>het platform te verstoren, te omzeilen of geautomatiseerd uit te lezen.</li>
        </ul>
        <p>
          De contactgegevens van dienstverleners die je via Eventiphy krijgt, gebruik je alleen voor
          je eigen event.
        </p>
      </LegalSection>

      <LegalSection id="ingrijpen" title="10. Wanneer we ingrijpen">
        <p>
          Als je deze voorwaarden of de wet overtreedt, kunnen we inhoud verwijderen of verbergen,
          je account tijdelijk schorsen of, bij ernstige of herhaalde overtredingen, afsluiten. We
          kijken daarbij naar de ernst, de herhaling en de gevolgen voor anderen. Zulke beslissingen
          worden door een medewerker genomen, niet automatisch.
        </p>
        <p>
          <strong>Je hoort altijd waarom.</strong> We laten je weten wat we beslissen, op welke
          grond en hoe je bezwaar maakt. Bezwaar maken is gratis en kan binnen zes maanden via{' '}
          <Mail to={supportEmail} />; een medewerker die niet bij de eerste beslissing betrokken was
          bekijkt je bezwaar.
        </p>
        <p>
          Iedereen kan inhoud melden die volgens hem onwettig is of tegen deze voorwaarden ingaat,
          via <LegalLink href="/melden">Inhoud melden</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="aansprakelijkheid" title="11. Aansprakelijkheid">
        <ul>
          <li>
            We doen ons best om Eventiphy beschikbaar, veilig en correct te houden, maar kunnen niet
            garanderen dat het platform altijd zonder onderbreking of fouten werkt.
          </li>
          <li>
            Voor de uitvoering van de diensten die je boekt, is de dienstverlener verantwoordelijk.
            Wij zijn niet aansprakelijk voor de kwaliteit, de uitvoering of het niet doorgaan van
            een dienst, noch voor de inhoud die dienstverleners of andere gebruikers plaatsen.
          </li>
          <li>
            We zijn wel aansprakelijk voor schade die het rechtstreekse gevolg is van onze eigen
            fout bij het aanbieden van het platform.
          </li>
          <li>
            Niets in deze voorwaarden beperkt onze aansprakelijkheid voor opzet, zware fout,
            overlijden of lichamelijk letsel, of de rechten die de wet jou als consument dwingend
            toekent.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="eigendom" title="12. Inhoud en intellectuele eigendom">
        <p>
          Het platform, het merk Eventiphy en onze teksten en ontwerpen zijn van ons. Je mag ze
          gebruiken waarvoor het platform bedoeld is.
        </p>
        <p>
          Wat je zelf plaatst (zoals beoordelingen) blijft van jou. Je geeft ons het recht om het op
          Eventiphy te tonen zolang het er staat. Je plaatst alleen inhoud waarvoor je de nodige
          rechten hebt.
        </p>
      </LegalSection>

      <LegalSection id="stoppen" title="13. Stoppen">
        <p>
          Je kunt je account op elk moment verwijderen via Account &amp; privacy. Staan er nog
          boekingen gepland, dan vragen we je die eerst af te ronden of in overleg met de
          dienstverlener te annuleren: afspraken die je hebt vastgelegd blijven immers bestaan, ook
          als je account verdwijnt. Wat er met je gegevens gebeurt lees je in de{' '}
          <LegalLink href="/privacy">privacyverklaring</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="wijzigingen" title="14. Wijzigingen">
        <p>
          We kunnen deze voorwaarden aanpassen, bijvoorbeeld wanneer de dienst of de wet verandert.
          We laten je dat minstens 15 dagen vooraf weten en vragen je akkoord wanneer je daarna
          inlogt. Ga je niet akkoord, dan kun je je account kosteloos verwijderen. Voor afspraken
          die je al hebt vastgelegd blijven de voorwaarden gelden van het moment waarop je ze
          vastlegde.
        </p>
      </LegalSection>

      <LegalSection id="klachten" title="15. Klachten en geschillen">
        <p>
          <strong>Een klacht over Eventiphy?</strong> Mail naar <Mail to={supportEmail} />. We
          bevestigen je klacht binnen vijf werkdagen en doen ons best om ze binnen dertig dagen op
          te lossen.
        </p>
        <p>
          <strong>Een klacht over een dienstverlener?</strong> Neem eerst contact op met de
          dienstverlener. Kom je er samen niet uit, laat het ons dan weten; we bemiddelen waar we
          kunnen.
        </p>
        <p>
          Als consument kun je ook terecht bij de Consumentenombudsdienst, North Gate II, Koning
          Albert II-laan 8 bus 1, 1000 Brussel,{' '}
          <a
            href="https://www.consumentenombudsdienst.be"
            rel="noopener noreferrer"
            target="_blank"
          >
            www.consumentenombudsdienst.be
          </a>
          .
        </p>
        <p>
          Op deze voorwaarden is het Belgische recht van toepassing. Woon je als consument in een
          ander land van de Europese Unie, dan behoud je de bescherming van de dwingende regels van
          dat land. Geschillen kun je voorleggen aan de rechtbank van je eigen woonplaats.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
