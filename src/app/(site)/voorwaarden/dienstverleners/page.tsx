import type { Metadata } from 'next';
import { site } from '@/config/site';
import { LEGAL_DOCUMENTS } from '@/features/legal/documents';
import { CompanyIdentity, LegalLink, LegalPage, LegalSection, Mail } from '@/features/legal/legal-page';

const doc = LEGAL_DOCUMENTS['terms-provider'];

export const metadata: Metadata = {
  title: doc.title,
  description: 'De afspraken tussen Eventiphy en de ondernemingen die via het platform hun diensten voor evenementen aanbieden.',
  alternates: { canonical: doc.href },
};

const SECTIONS = [
  { id: 'wie', title: '1. Wie zijn wij?' },
  { id: 'dienst', title: '2. Wat Eventiphy doet' },
  { id: 'toelating', title: '3. Wie kan dienstverlener worden?' },
  { id: 'profiel', title: '4. Je profiel en je inhoud' },
  { id: 'boekingen', title: '5. Aanvragen, offertes en boekingen' },
  { id: 'kosten', title: '6. Kosten' },
  { id: 'volgorde', title: '7. Volgorde van zoekresultaten' },
  { id: 'gelijk', title: '8. Gelijke behandeling' },
  { id: 'gegevens', title: '9. Toegang tot gegevens' },
  { id: 'beoordelingen', title: '10. Beoordelingen' },
  { id: 'beperking', title: '11. Beperken, schorsen en beëindigen' },
  { id: 'opzeggen', title: '12. Zelf stoppen' },
  { id: 'wijzigingen', title: '13. Wijzigingen' },
  { id: 'klachten', title: '14. Klachten en bemiddeling' },
  { id: 'aansprakelijkheid', title: '15. Aansprakelijkheid en vrijwaring' },
  { id: 'eigendom', title: '16. Intellectuele eigendom' },
  { id: 'recht', title: '17. Toepasselijk recht' },
];

export default function ProviderTermsPage() {
  const { supportEmail } = site.contact;
  return (
    <LegalPage
      title={doc.title}
      intro="Deze voorwaarden gelden tussen Eventiphy en de ondernemingen die via het platform hun diensten aanbieden. Ze zijn opgesteld volgens de Europese regels voor eerlijke onlineplatformen."
      updated={doc.updatedLabel}
      version={doc.version}
      sections={SECTIONS}
    >
      <LegalSection id="wie" title="1. Wie zijn wij?">
        <p>Eventiphy wordt aangeboden door:</p>
        <CompanyIdentity />
        <p>
          In deze voorwaarden noemen we onszelf “Eventiphy” of “wij”. “Je” bent de onderneming die een profiel als
          dienstverlener aanmaakt. Een “klant” is wie via Eventiphy een dienstverlener zoekt.
        </p>
      </LegalSection>

      <LegalSection id="dienst" title="2. Wat Eventiphy doet">
        <p>
          Eventiphy is een online platform dat klanten en dienstverleners met elkaar in contact brengt. Je krijgt een
          publiek profiel, ontvangt aanvragen, verstuurt offertes, overlegt met klanten en beheert je agenda.
        </p>
        <p>
          <strong>Wij zijn een tussenpersoon.</strong> De overeenkomst over je dienst komt rechtstreeks tot stand
          tussen jou en de klant. Eventiphy is daarbij geen partij en treedt niet op als je agent of werkgever.
        </p>
        <p>
          Om je vindbaar te maken kunnen we je publieke profiel ook tonen in zoekmachines en in onze eigen
          communicatie, zoals sociale media en nieuwsbrieven.
        </p>
      </LegalSection>

      <LegalSection id="toelating" title="3. Wie kan dienstverlener worden?">
        <ul>
          <li>Je handelt als onderneming (professional) en bent ingeschreven in de Kruispuntbank van Ondernemingen of het vergelijkbare register van je land.</li>
          <li>
            Je beschikt over de vergunningen, registraties en verzekeringen die voor je activiteit nodig zijn,
            bijvoorbeeld een registratie bij het FAVV voor catering.
          </li>
          <li>De gegevens die je opgeeft zijn juist en volledig, en je houdt ze actueel.</li>
        </ul>
        <p>
          <strong>Verificatie.</strong> We kijken elk nieuw profiel na voordat het zichtbaar wordt, en kunnen daarvoor
          bijkomende informatie of documenten opvragen. We kunnen een profiel weigeren als de gegevens niet kloppen of
          de dienst niet op het platform past; je hoort dan waarom.
        </p>
      </LegalSection>

      <LegalSection id="profiel" title="4. Je profiel en je inhoud">
        <ul>
          <li>Je bent verantwoordelijk voor alles wat je op je profiel zet: teksten, foto’s, diensten en prijzen.</li>
          <li>Je inhoud is waarheidsgetrouw en niet misleidend. Je gebruikt alleen foto’s en teksten waarvoor je de rechten hebt, en waarop herkenbare personen daarmee instemden.</li>
          <li>Richtprijzen zijn realistisch. Tegenover consumenten vermeld je prijzen inclusief btw.</li>
          <li>Je houdt je agenda bij, zodat klanten geen aanvraag doen voor een dag waarop je niet kunt.</li>
        </ul>
      </LegalSection>

      <LegalSection id="boekingen" title="5. Aanvragen, offertes en boekingen">
        <ul>
          <li>Je beantwoordt aanvragen binnen een redelijke termijn, ook als je niet beschikbaar bent.</li>
          <li>
            <strong>Een offerte is een bindend aanbod</strong> tijdens de geldigheidsduur die je kiest. Ze vermeldt de
            totaalprijs, wat inbegrepen is en je voorwaarden, waaronder je annuleringsregeling.
          </li>
          <li>
            Zodra de klant je offerte accepteert, is er een overeenkomst tussen jou en de klant en voer je de dienst uit
            zoals afgesproken.
          </li>
          <li>
            Je leeft tegenover klanten de wet na, in het bijzonder het consumentenrecht: correcte informatie vóór de
            overeenkomst (ook over het al dan niet bestaan van een herroepingsrecht), een factuur waar dat verplicht is,
            en een correcte afhandeling van klachten.
          </li>
          <li>Moet je uitzonderlijk een boeking annuleren, dan verwittig je de klant meteen en annuleer je de boeking ook op Eventiphy.</li>
          <li>Na het event rond je de boeking af op Eventiphy, zodat de klant een beoordeling kan schrijven.</li>
        </ul>
        <p>Betalingen regel je rechtstreeks met de klant. Eventiphy int geen betalingen.</p>
      </LegalSection>

      <LegalSection id="kosten" title="6. Kosten">
        <p>
          <strong>Het gebruik van Eventiphy is momenteel gratis.</strong> We rekenen geen inschrijvingsgeld, abonnement
          of commissie aan.
        </p>
        <p>
          Als we in de toekomst een vergoeding invoeren, laten we je dat minstens 30 dagen vooraf weten op een
          duurzame drager (per e-mail), met de precieze tarieven. Die vergoeding geldt pas nadat je ze uitdrukkelijk
          hebt aanvaard, en nooit voor boekingen die al waren vastgelegd. Ga je niet akkoord, dan kun je kosteloos
          stoppen.
        </p>
      </LegalSection>

      <LegalSection id="volgorde" title="7. Volgorde van zoekresultaten">
        <p>De belangrijkste parameters die de volgorde bepalen, in volgorde van gewicht:</p>
        <ol>
          <li><strong>Gemiddelde beoordeling</strong> door klanten.</li>
          <li><strong>Aantal beoordelingen</strong>, bij een gelijke gemiddelde score.</li>
          <li><strong>Datum van aanmaak</strong> van het profiel, bij een gelijk aantal.</li>
        </ol>
        <p>
          Klanten kunnen daarnaast zelf sorteren op beoordeling of op nieuwste, en filteren op categorie, regio en
          prijsklasse. We kozen voor beoordelingen als hoofdparameter omdat ze de ervaring van echte klanten weergeven.
        </p>
        <p>
          <strong>Je kunt de volgorde niet beïnvloeden door te betalen</strong>, rechtstreeks of onrechtstreeks.
          Alleen geverifieerde, zichtbare profielen worden getoond. Als we de parameters wijzigen, passen we dit artikel
          vooraf aan volgens artikel 13.
        </p>
      </LegalSection>

      <LegalSection id="gelijk" title="8. Gelijke behandeling">
        <p>
          Eventiphy biedt zelf geen diensten voor evenementen aan en heeft geen eigen dienstverleners op het platform.
          We behandelen alle dienstverleners volgens dezelfde regels en geven niemand een voorkeursbehandeling.
        </p>
      </LegalSection>

      <LegalSection id="gegevens" title="9. Toegang tot gegevens">
        <ul>
          <li>
            <strong>Wat jij krijgt:</strong> van klanten die je een aanvraag sturen of je boeken: naam, e-mailadres,
            telefoonnummer en de details van hun event; de berichten die jullie uitwisselen; en je eigen aanvragen,
            offertes, boekingen en beoordelingen.
          </li>
          <li>
            <strong>Wat wij hebben:</strong> de gegevens die jij en klanten op het platform invoeren en de gegevens die
            door het gebruik ontstaan. We gebruiken ze om het platform te laten werken en te verbeteren.
          </li>
          <li>
            <strong>Wat anderen krijgen:</strong> we geven je gegevens niet door aan derden voor hun eigen doeleinden.
            Andere dienstverleners krijgen geen toegang tot jouw aanvragen, offertes of klanten.
          </li>
          <li>
            <strong>Na het einde:</strong> je kunt je eigen gegevens op elk moment downloaden via Account &amp; privacy,
            ook vlak voor je stopt.
          </li>
        </ul>
        <p>
          <strong>Jouw verantwoordelijkheid voor klantgegevens.</strong> Voor de persoonsgegevens van klanten die je via
          Eventiphy ontvangt ben je zelf verwerkingsverantwoordelijke. Je gebruikt ze alleen om de aanvraag te
          beantwoorden en de afspraak uit te voeren, niet voor reclame zonder toestemming van de klant, en je leeft de
          AVG na. Meer in onze <LegalLink href="/privacy">privacyverklaring</LegalLink>.
        </p>
      </LegalSection>

      <LegalSection id="beoordelingen" title="10. Beoordelingen">
        <ul>
          <li>Alleen klanten met een afgeronde boeking bij jou kunnen je beoordelen, één keer per boeking.</li>
          <li>Je probeert beoordelingen niet te beïnvloeden met voordelen, druk of valse beoordelingen.</li>
          <li>We passen beoordelingen niet aan en verwijderen ze niet op verzoek, tenzij ze onwettig zijn of niet over een echte ervaring gaan. Dat kun je melden via <LegalLink href="/melden">Inhoud melden</LegalLink>.</li>
        </ul>
      </LegalSection>

      <LegalSection id="beperking" title="11. Beperken, schorsen en beëindigen">
        <p>We kunnen je profiel verbergen, je verificatie intrekken of je account schorsen of beëindigen als:</p>
        <ul>
          <li>je deze voorwaarden of de wet overtreedt;</li>
          <li>je gegevens onjuist blijken of je niet langer aan artikel 3 voldoet;</li>
          <li>je herhaaldelijk boekingen niet nakomt of er ernstige, gegronde klachten van klanten zijn;</li>
          <li>dat nodig is om klanten of het platform te beschermen.</li>
        </ul>
        <p><strong>Zo gaan we daarbij te werk:</strong></p>
        <ul>
          <li>
            <strong>Je krijgt altijd een motivering.</strong> Vóór of op het moment dat een beperking of schorsing
            ingaat, sturen we je per e-mail de concrete feiten en de bepaling waarop we ons baseren.
          </li>
          <li>
            <strong>Volledige beëindiging kondigen we minstens 30 dagen vooraf aan</strong>, met de motivering. Die
            termijn geldt niet als de wet ons tot onmiddellijke beëindiging verplicht, of bij herhaalde of ernstige
            overtredingen; ook dan krijg je de motivering.
          </li>
          <li>
            <strong>Je kunt je standpunt toelichten</strong> via de klachtenprocedure van artikel 14. Blijkt de
            maatregel onterecht, dan herstellen we je profiel zonder onnodige vertraging.
          </li>
        </ul>
        <p>Boekingen die al waren vastgelegd blijven afspraken tussen jou en de klant; je bent verantwoordelijk voor de verdere afhandeling.</p>
      </LegalSection>

      <LegalSection id="opzeggen" title="12. Zelf stoppen">
        <p>
          Je kunt op elk moment stoppen door je account te verwijderen via Account &amp; privacy, zonder opzegtermijn of
          kosten. Staan er nog boekingen gepland, dan vragen we je die eerst uit te voeren of in overleg met de klant te
          annuleren.
        </p>
      </LegalSection>

      <LegalSection id="wijzigingen" title="13. Wijzigingen">
        <p>
          We kunnen deze voorwaarden aanpassen. We laten je elke wijziging <strong>minstens 15 dagen vooraf</strong>{' '}
          weten per e-mail. Vraagt een wijziging technische of commerciële aanpassingen van jou, dan geven we je meer
          tijd. Tijdens die termijn kun je kosteloos stoppen. Blijf je het platform na de termijn gebruiken en bevestig
          je de nieuwe versie bij het inloggen, dan gelden de nieuwe voorwaarden.
        </p>
        <p>
          De termijn geldt niet wanneer een wijziging nodig is om aan een wettelijke verplichting te voldoen of om een
          onvoorzien en dreigend gevaar voor het platform of zijn gebruikers af te wenden.
        </p>
      </LegalSection>

      <LegalSection id="klachten" title="14. Klachten en bemiddeling">
        <p>
          <strong>Interne klachtenbehandeling.</strong> Heb je een klacht over een beslissing van ons, over een
          technisch probleem of over hoe we deze voorwaarden toepassen? Mail naar <Mail to={supportEmail} /> met een
          beschrijving. De procedure is gratis. We bevestigen je klacht binnen vijf werkdagen, behandelen ze zorgvuldig
          en laten je binnen dertig dagen de uitkomst weten, met een motivering in gewone taal.
        </p>
        <p>
          <strong>Bemiddeling.</strong> Komen we er samen niet uit, dan zijn we bereid het geschil voor te leggen aan
          een erkend bemiddelaar in België voordat een van ons naar de rechter stapt. Een poging tot bemiddeling doet
          geen afbreuk aan ieders recht om een gerechtelijke procedure te starten.
        </p>
      </LegalSection>

      <LegalSection id="aansprakelijkheid" title="15. Aansprakelijkheid en vrijwaring">
        <ul>
          <li>
            We doen ons best om het platform beschikbaar en veilig te houden, maar garanderen geen ononderbroken
            werking en geen bepaald aantal aanvragen of boekingen.
          </li>
          <li>
            We zijn niet aansprakelijk voor de handelingen van klanten, voor onrechtstreekse schade of voor gederfde
            winst.
          </li>
          <li>
            Voor het overige is onze aansprakelijkheid tegenover jou beperkt tot de vergoedingen die je ons in de twaalf
            maanden vóór het schadegeval betaalde, met een minimum van 500 euro.
          </li>
          <li>Deze beperkingen gelden niet bij opzet, zware fout of waar de wet ze verbiedt.</li>
          <li>
            Je vrijwaart ons voor aanspraken van klanten en derden die het gevolg zijn van je dienst, je inhoud of een
            overtreding van deze voorwaarden of de wet door jou.
          </li>
        </ul>
      </LegalSection>

      <LegalSection id="eigendom" title="16. Intellectuele eigendom">
        <p>
          Je inhoud blijft van jou. Je geeft ons een niet-exclusief, kosteloos recht om je profiel en je foto’s te
          tonen op Eventiphy en in de kanalen uit artikel 2, zolang je profiel bestaat. Het platform, het merk
          Eventiphy en onze teksten en ontwerpen blijven van ons.
        </p>
      </LegalSection>

      <LegalSection id="recht" title="17. Toepasselijk recht">
        <p>
          Op deze voorwaarden is het Belgische recht van toepassing. Geschillen die niet via de klachtenprocedure of
          bemiddeling worden opgelost, worden voorgelegd aan de rechtbanken van het arrondissement{' '}
          {site.company.courtDistrict}.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
