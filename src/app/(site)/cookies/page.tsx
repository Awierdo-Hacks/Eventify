import type { Metadata } from 'next';
import { CookieSettingsButton } from '@/features/consent/consent-provider';
import { COOKIE_POLICY } from '@/features/legal/documents';
import { LegalLink, LegalPage, LegalSection, Mail } from '@/features/legal/legal-page';
import { site } from '@/config/site';

export const metadata: Metadata = {
  title: 'Cookiebeleid',
  description: 'Welke cookies Eventiphy gebruikt, waarvoor, hoe lang ze bewaard worden en hoe je je keuze aanpast.',
  alternates: { canonical: '/cookies' },
};

const SECTIONS = [
  { id: 'wat', title: '1. Wat zijn cookies?' },
  { id: 'welke', title: '2. Welke cookies gebruiken we?' },
  { id: 'toestemming', title: '3. Jouw keuze' },
  { id: 'browser', title: '4. Cookies beheren in je browser' },
  { id: 'contact', title: '5. Vragen' },
];

export default function CookiePolicyPage() {
  return (
    <LegalPage
      title="Cookiebeleid"
      intro="We houden het bij wat nodig is. Zonder jouw toestemming plaatsen we alleen cookies die de website laten werken."
      updated={COOKIE_POLICY.updatedLabel}
      sections={SECTIONS}
    >
      <LegalSection id="wat" title="1. Wat zijn cookies?">
        <p>
          Cookies zijn kleine tekstbestanden die een website op je toestel bewaart. Ze onthouden bijvoorbeeld dat je
          bent ingelogd. Wat we hier over cookies zeggen geldt ook voor vergelijkbare technieken, zoals opslag in je
          browser.
        </p>
      </LegalSection>

      <LegalSection id="welke" title="2. Welke cookies gebruiken we?">
        <h3>Noodzakelijke cookies</h3>
        <p>
          Deze zijn nodig om de dienst te leveren waar je om vraagt. Hiervoor is volgens de wet geen toestemming nodig.
        </p>
        <div className="overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Naam</th>
                <th scope="col">Doel</th>
                <th scope="col">Bewaartermijn</th>
                <th scope="col">Van wie</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td><code>session</code></td>
                <td>Houdt je ingelogd en beveiligt je account. Niet leesbaar voor scripts.</td>
                <td>7 dagen, of tot je uitlogt</td>
                <td>{site.name}</td>
              </tr>
              <tr>
                <td><code>ev_consent</code></td>
                <td>Onthoudt je cookiekeuze, zodat we die niet telkens opnieuw vragen.</td>
                <td>6 maanden</td>
                <td>{site.name}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <h3>Statistieken</h3>
        <p>
          Op dit moment gebruiken we geen cookies voor statistieken. Als we dat in de toekomst doen, gebeurt dat alleen
          nadat je er toestemming voor gaf, en vullen we deze lijst eerst aan.
        </p>

        <h3>Marketing</h3>
        <p>
          Op dit moment gebruiken we geen marketingcookies en delen we geen gegevens met advertentienetwerken. Ook
          hiervoor geldt: alleen met jouw toestemming, en pas nadat deze lijst is bijgewerkt.
        </p>

        <h3>Wat we niet doen</h3>
        <ul>
          <li>We laden geen lettertypes, kaarten of video’s van andere partijen die je kunnen volgen.</li>
          <li>We gebruiken geen technieken om je toestel te herkennen zonder cookies (“fingerprinting”).</li>
        </ul>
      </LegalSection>

      <LegalSection id="toestemming" title="3. Jouw keuze">
        <p>
          Bij je eerste bezoek vragen we welke cookies je toestaat. Weigeren is even eenvoudig als accepteren en heeft
          geen gevolgen voor wat je op Eventiphy kunt doen. Je keuze geldt zes maanden; daarna vragen we het opnieuw.
        </p>
        <p>
          Je kunt je keuze op elk moment wijzigen of intrekken:{' '}
          <CookieSettingsButton className="font-semibold text-brand-700 underline underline-offset-[3px]" />.
        </p>
        <p>
          Om te kunnen aantonen welke keuze er gemaakt is, bewaren we die keuze met een willekeurig kenmerk en het
          tijdstip. We bewaren daarbij geen IP-adres.
        </p>
      </LegalSection>

      <LegalSection id="browser" title="4. Cookies beheren in je browser">
        <p>
          Je kunt cookies ook wissen of blokkeren via de instellingen van je browser. Blokkeer je de noodzakelijke
          cookies, dan kun je niet meer inloggen.
        </p>
      </LegalSection>

      <LegalSection id="contact" title="5. Vragen">
        <p>
          Meer over hoe we met je gegevens omgaan lees je in onze <LegalLink href="/privacy">privacyverklaring</LegalLink>.
          Vragen? Mail naar <Mail to={site.contact.privacyEmail} />.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
