/**
 * End-to-end smoke test of the main flows, driven through a real browser.
 *
 * Covers: registration (customer + provider) with terms acceptance, event
 * creation, quote request, quote, acceptance → booking, chat both ways, quote
 * from chat, agenda blocking and availability, data export, account deletion
 * guard, access control, waitlist, content report, cookie consent, and the
 * admin flows (verify, reports, CSV export, suspension).
 *
 * Requirements:
 *   - a LOCAL database with the demo data:  npm run db:deploy && npm run db:seed
 *   - the app running on http://localhost:3000 (npm run dev, or build + start)
 *   - Playwright:  npm install --no-save playwright && npx playwright install chromium
 *
 * Run:  node tests/e2e-smoke.cjs
 *
 * It creates a few accounts with unique e-mail addresses on every run; only
 * ever point it at a local database.
 */
const { chromium } = require('playwright');
const BASE = process.env.BASE_URL || 'http://localhost:3000';
let PID = process.argv[2];
const stamp = Date.now();
const customerEmail = `e2e.klant.${stamp}@example.com`;
const providerEmail = `e2e.zaak.${stamp}@example.com`;
const results = [];
const ok = (name, pass, extra = '') => {
  results.push({ name, pass });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${extra ? '  — ' + extra : ''}`);
};

async function newContext(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 900 } });
  await ctx.addCookies([
    {
      name: 'ev_consent',
      value: encodeURIComponent(
        JSON.stringify({
          version: '2026-11',
          analytics: false,
          marketing: false,
          visitorId: 'e2e',
          decidedAt: Date.now(),
        })
      ),
      domain: 'localhost',
      path: '/',
    },
  ]);
  const page = await ctx.newPage();
  page.on('pageerror', (e) => console.log('   PAGEERROR', e.message.slice(0, 200)));
  page.on('console', (m) => {
    if (m.type() === 'error' && !m.text().includes('Failed to load resource'))
      console.log('   CONSOLE', m.text().slice(0, 200));
  });
  return { ctx, page };
}
async function login(page, email, password = 'password123') {
  await page.goto(BASE + '/login', { waitUntil: 'networkidle' });
  await page.fill('#email', email);
  await page.fill('#password', password);
  await page.click('button[type=submit]');
  await page.waitForURL((u) => !u.pathname.startsWith('/login'), { timeout: 30000 });
  const gate = page.getByRole('button', { name: 'Ik ga akkoord' });
  if (await gate.isVisible().catch(() => false)) {
    await gate.click();
    await page.waitForTimeout(1500);
  }
}
// Pick free days in a month that differs per run, so reruns never collide.
const MONTHS_AHEAD = 2 + (stamp % 9);
let bookedDay = '',
  blockedDay = '';
async function goMonths(page) {
  for (let i = 0; i < MONTHS_AHEAD; i++)
    await page.getByRole('button', { name: 'Volgende maand' }).click();
}
async function freeDays(page) {
  return page
    .locator('[role=gridcell] button:not([disabled])')
    .evaluateAll((nodes) =>
      nodes.map((n) => n.textContent.trim()).filter((d) => Number(d) >= 8 && Number(d) <= 24)
    );
}
const dayButton = (page, day) =>
  page.locator('[role=gridcell] button').filter({ hasText: new RegExp(`^${day}$`) });
const step = async (name, fn) => {
  try {
    await fn();
  } catch (e) {
    ok(name, false, String(e.message).split('\n')[0].slice(0, 160));
  }
};

(async () => {
  const browser = await chromium.launch();

  if (!PID) {
    // The demo provider whose account the test logs in with further down.
    const probe = await newContext(browser);
    const query = encodeURIComponent(process.env.E2E_PROVIDER_NAME || 'Culinaire Creaties');
    await probe.page.goto(`${BASE}/browse?q=${query}`, { waitUntil: 'networkidle' });
    const href = await probe.page.locator('a[href^="/providers/"]').first().getAttribute('href');
    PID = href.split('/')[2].split('?')[0];
    await probe.ctx.close();
  }

  // ── 1. Customer registers ───────────────────────────────────────────────
  const c = await newContext(browser);
  await step('customer: registration requires accepting terms', async () => {
    await c.page.goto(BASE + '/register', { waitUntil: 'networkidle' });
    await c.page.fill('#firstName', 'Eva');
    await c.page.fill('#lastName', 'Testers');
    await c.page.fill('#email', customerEmail);
    await c.page.fill('#dateOfBirth', '1990-05-12');
    await c.page.fill('#password', 'geheim-wachtwoord-1');
    await c.page.click('button[type=submit]');
    await c.page.waitForSelector('#acceptTerms-error', { timeout: 15000 });
    ok('customer: registration requires accepting terms', c.page.url().includes('/register'));
  });
  await step('customer: registers and lands on dashboard', async () => {
    await c.page.check('#acceptTerms');
    await c.page.click('button[type=submit]');
    await c.page.waitForURL('**/dashboard?welkom=1', { timeout: 30000 });
    ok(
      'customer: registers and lands on dashboard',
      await c.page.getByText('Welkom bij Eventiphy!').isVisible()
    );
  });

  // ── 2. Create event ─────────────────────────────────────────────────────
  let eventUrl = '';
  await step('customer: creates an event from the wedding template', async () => {
    await c.page.goto(BASE + '/dashboard/events/new', { waitUntil: 'networkidle' });
    await c.page.getByText('Bruiloft', { exact: true }).click();
    await c.page.fill('#name', 'E2E Bruiloft');
    await c.page.fill('#location', 'Antwerpen');
    await c.page.fill('#guestCount', '90');
    await c.page.fill('#budgetMax', '20000');
    await c.page.getByRole('button', { name: 'Event aanmaken' }).click();
    await c.page.waitForURL(/\/dashboard\/events\/c[a-z0-9]{12,}$/, { timeout: 30000 });
    eventUrl = c.page.url();
    const slots = await c.page.locator('h3').count();
    ok('customer: creates an event from the wedding template', slots >= 5, `${slots} onderdelen`);
  });

  // ── 3. Request a quote ──────────────────────────────────────────────────
  await step('customer: requests a quote (unavailable days disabled)', async () => {
    await c.page.goto(`${BASE}/request-quote/${PID}`, { waitUntil: 'networkidle' });
    await c.page.selectOption('#eventType', 'Bruiloft');
    await c.page.fill('#guestCount', '90');
    await c.page.fill('#eventLocation', 'Antwerpen');
    await goMonths(c.page);
    [bookedDay, blockedDay] = await freeDays(c.page);
    await dayButton(c.page, bookedDay).click();
    await c.page.fill('#customerPhone', '+32 470 12 34 56');
    await c.page.fill('#description', 'Graag een walking dinner voor 90 gasten.');
    await c.page.getByRole('button', { name: 'Offerte aanvragen' }).click();
    await c.page.waitForURL('**/dashboard/requests?verstuurd=1', { timeout: 30000 });
    ok(
      'customer: requests a quote (unavailable days disabled)',
      await c.page.getByText('Je aanvraag is verstuurd').isVisible()
    );
  });

  // ── 4. Provider sends a quote ───────────────────────────────────────────
  const p = await newContext(browser);
  await step('provider: sees the request and sends a quote', async () => {
    await login(p.page, process.env.E2E_PROVIDER_EMAIL || 'info@culinairecreatiesamsterdam.nl');
    await p.page.goto(BASE + '/provider-dashboard/requests', { waitUntil: 'networkidle' });
    const card = p.page.locator('li', { hasText: 'Eva Testers' }).first();
    await card.getByRole('button', { name: 'Offerte maken' }).click();
    await p.page.fill('#quote-title', 'Walking dinner 90 gasten');
    await p.page.fill('#quote-price', '4250');
    await p.page.getByLabel('Inbegrepen dienst 1').fill('8 gerechten');
    await p.page.getByRole('button', { name: 'Regel toevoegen' }).click();
    await p.page.getByLabel('Inbegrepen dienst 2').fill('Bediening');
    await p.page.getByRole('button', { name: 'Offerte versturen' }).click();
    await p.page.getByText('Offerte verstuurd.').first().waitFor({ timeout: 20000 });
    ok('provider: sees the request and sends a quote', true);
  });

  // ── 5. Customer accepts ─────────────────────────────────────────────────
  await step('customer: accepts the quote → booking created', async () => {
    await c.page.goto(BASE + '/dashboard/requests', { waitUntil: 'networkidle' });
    await c.page.getByRole('button', { name: 'Accepteren' }).first().click();
    await c.page.getByRole('button', { name: 'Ja, accepteren' }).click();
    await c.page.getByText('Offerte geaccepteerd').first().waitFor({ timeout: 20000 });
    await c.page.goto(BASE + '/dashboard/bookings', { waitUntil: 'networkidle' });
    ok(
      'customer: accepts the quote → booking created',
      await c.page.getByText('Vastgelegd').first().isVisible()
    );
  });

  // ── 6. Chat both ways ───────────────────────────────────────────────────
  let conversationUrl = '';
  await step('chat: customer sends, provider receives via polling', async () => {
    await c.page.getByRole('button', { name: 'Bericht' }).first().click();
    await c.page.waitForURL(/\/messages\/[a-z0-9]+$/, { timeout: 30000 });
    conversationUrl = c.page.url();
    await p.page.goto(conversationUrl, { waitUntil: 'networkidle' });
    await c.page.fill('#message-input', 'Hallo, bedankt voor de offerte!');
    await c.page.keyboard.press('Enter');
    await c.page.getByText('Hallo, bedankt voor de offerte!').first().waitFor({ timeout: 15000 });
    await p.page
      .getByRole('log')
      .getByText('Hallo, bedankt voor de offerte!')
      .waitFor({ timeout: 15000 });
    ok('chat: customer sends, provider receives via polling', true);
  });
  await step('chat: provider sends a quote in the conversation', async () => {
    await p.page.getByRole('button', { name: /Offerte/ }).click();
    await p.page.fill('#quote-title', 'Extra dessertbuffet');
    await p.page.fill('#quote-price', '600');
    await p.page.getByLabel('Inbegrepen dienst 1').fill('Dessertbuffet');
    await p.page.getByRole('button', { name: 'Offerte versturen' }).click();
    await p.page.getByRole('log').getByText('Extra dessertbuffet').waitFor({ timeout: 20000 });
    await c.page.getByRole('log').getByText('Extra dessertbuffet').waitFor({ timeout: 15000 });
    ok(
      'chat: provider sends a quote in the conversation',
      await c.page.getByRole('log').getByRole('button', { name: 'Accepteren' }).isVisible()
    );
  });

  // ── 7. Provider agenda ──────────────────────────────────────────────────
  await step('provider: blocks a day in the agenda', async () => {
    await p.page.goto(BASE + '/provider-dashboard/agenda', { waitUntil: 'networkidle' });
    await goMonths(p.page);
    const booked = await p.page
      .getByRole('button', { name: new RegExp(`^${bookedDay} .*Geboekt door Eva`) })
      .count();
    await dayButton(p.page, blockedDay).click();
    await p.page.getByRole('button', { name: 'Dag blokkeren' }).click();
    await p.page.getByText('Dag geblokkeerd.').first().waitFor({ timeout: 15000 });
    ok('provider: blocks a day in the agenda', booked === 1, `geboekte dag zichtbaar: ${booked}`);
  });
  await step('availability: blocked and booked days are disabled for customers', async () => {
    await c.page.goto(`${BASE}/request-quote/${PID}`, { waitUntil: 'networkidle' });
    await goMonths(c.page);
    const a = await dayButton(c.page, bookedDay).isDisabled();
    const b = await dayButton(c.page, blockedDay).isDisabled();
    ok(
      'availability: blocked and booked days are disabled for customers',
      a && b,
      `geboekt ${bookedDay}:${a} geblokkeerd ${blockedDay}:${b}`
    );
  });

  // ── 8. Privacy tools ────────────────────────────────────────────────────
  await step('account: data export downloads JSON', async () => {
    const res = await c.ctx.request.get(BASE + '/api/account/export');
    const body = await res.json();
    ok(
      'account: data export downloads JSON',
      res.status() === 200 &&
        body.account.email === customerEmail &&
        body.bookings.length === 1 &&
        !('password_hash' in body.account)
    );
  });
  await step('account: deletion is blocked while a booking is upcoming', async () => {
    await c.page.goto(BASE + '/account', { waitUntil: 'networkidle' });
    await c.page.getByRole('button', { name: 'Account verwijderen' }).click();
    await c.page.fill('#delete-password', 'geheim-wachtwoord-1');
    await c.page.getByRole('button', { name: 'Definitief verwijderen' }).click();
    await c.page.getByText('Er staan nog boekingen gepland').waitFor({ timeout: 15000 });
    ok('account: deletion is blocked while a booking is upcoming', true);
  });

  // ── 9. Access control ───────────────────────────────────────────────────
  await step('security: customer cannot open provider or admin areas', async () => {
    await c.page.goto(BASE + '/admin', { waitUntil: 'networkidle' });
    const a = new URL(c.page.url()).pathname;
    await c.page.goto(BASE + '/provider-dashboard', { waitUntil: 'networkidle' });
    const b = new URL(c.page.url()).pathname;
    const exp = await c.ctx.request.get(BASE + '/api/admin/waitlist/export');
    ok(
      'security: customer cannot open provider or admin areas',
      a === '/dashboard' && b === '/dashboard' && exp.status() === 403,
      `${a} ${b} ${exp.status()}`
    );
  });
  await step('security: other customer cannot read this conversation', async () => {
    const o = await newContext(browser);
    await login(o.page, 'mark.vandijk@example.com');
    const res = await o.page.goto(conversationUrl, { waitUntil: 'networkidle' });
    const api = await o.ctx.request.get(
      conversationUrl.replace('/messages/', '/api/conversations/') +
        '/messages?after=2000-01-01T00:00:00Z'
    );
    // Pages with a streamed loading state answer 200 before the lookup finishes,
    // so judge by what is shown rather than by the status code.
    await o.page.goto(eventUrl, { waitUntil: 'networkidle' });
    const leaked = (await o.page.getByText('E2E Bruiloft').count()) > 0;
    const notFound = await o.page.getByText('Deze pagina bestaat niet').isVisible();
    ok(
      'security: other customer cannot read this conversation or event',
      res.status() === 404 && api.status() === 403 && !leaked && notFound,
      `gesprek ${res.status()}, api ${api.status()}, event gelekt:${leaked}, 404-pagina:${notFound}`
    );
    await o.ctx.close();
  });
  await step('security: signed-out visitor is sent to login', async () => {
    const a = await newContext(browser);
    await a.page.goto(BASE + '/dashboard/events', { waitUntil: 'networkidle' });
    const url = new URL(a.page.url());
    const api = await a.ctx.request.get(BASE + '/api/account/export');
    ok(
      'security: signed-out visitor is sent to login',
      url.pathname === '/login' &&
        url.searchParams.get('redirect') === '/dashboard/events' &&
        api.status() === 401
    );
    await a.ctx.close();
  });

  // ── 10. Provider registration ───────────────────────────────────────────
  const np = await newContext(browser);
  let newProviderProfile = '';
  await step('provider: registers; profile stays hidden until verified', async () => {
    await np.page.goto(BASE + '/register?type=provider', { waitUntil: 'networkidle' });
    await np.page.fill('#businessName', 'E2E Bloemenatelier');
    await np.page.selectOption('#category', 'flowers');
    await np.page.fill('#location', 'Gent');
    await np.page.fill(
      '#description',
      'Wij maken bruidsboeketten en bloemdecoratie op maat voor elk evenement in Oost-Vlaanderen.'
    );
    await np.page.fill('#contactName', 'Fien Bloem');
    await np.page.fill('#email', providerEmail);
    await np.page.fill('#phone', '+32 9 123 45 67');
    await np.page.fill('#password', 'nog-een-geheim-2');
    await np.page.check('#confirmProfessional');
    await np.page.check('#acceptTerms');
    await np.page.getByRole('button', { name: 'Profiel aanmaken' }).click();
    await np.page.waitForURL('**/provider-dashboard/profile?welkom=1', { timeout: 30000 });
    newProviderProfile = await np.page
      .getByRole('link', { name: 'Voorbeeld' })
      .getAttribute('href');
    const anon = await newContext(browser);
    const res = await anon.page.goto(BASE + newProviderProfile, { waitUntil: 'networkidle' });
    const own = await np.page.goto(BASE + newProviderProfile, { waitUntil: 'networkidle' });
    ok(
      'provider: registers; profile stays hidden until verified',
      res.status() === 404 && own.status() === 200,
      `anon ${res.status()} / eigen ${own.status()}`
    );
    await anon.ctx.close();
  });

  // ── 11. Public forms ────────────────────────────────────────────────────
  const v = await newContext(browser);
  await step('public: waitlist signup', async () => {
    await v.page.goto(BASE + '/waitlist', { waitUntil: 'networkidle' });
    await v.page.fill('#name', 'Wim Wachter');
    await v.page.fill('#email', `wim.${stamp}@example.com`);
    await v.page.getByRole('button', { name: 'Zet me op de wachtlijst' }).click();
    await v.page.getByText('Je staat op de lijst').waitFor({ timeout: 15000 });
    ok('public: waitlist signup', true);
  });
  await step('public: report content without an account', async () => {
    await v.page.goto(`${BASE}/melden?type=PROVIDER&id=${PID}`, { waitUntil: 'networkidle' });
    await v.page.selectOption('#reason', 'FAKE');
    await v.page.fill('#details', 'Dit is een testmelding om de procedure te controleren.');
    await v.page.fill('#email', `melder.${stamp}@example.com`);
    await v.page.check('#goodFaith');
    await v.page.getByRole('button', { name: 'Melding versturen' }).click();
    await v.page.getByText('Bedankt voor je melding').waitFor({ timeout: 15000 });
    ok('public: report content without an account', true);
  });
  await step('public: cookie banner — refuse stores proof, no banner after', async () => {
    const f = await browser.newContext();
    const page = await f.newPage();
    await page.goto(BASE + '/', { waitUntil: 'networkidle' });
    const refuse = page.getByRole('button', { name: 'Alles weigeren' });
    const accept = page.getByRole('button', { name: 'Alles accepteren' });
    const sameStyle = (await refuse.getAttribute('class')) === (await accept.getAttribute('class'));
    await refuse.click();
    await page.waitForTimeout(1500);
    const cookies = await f.cookies();
    const consent = cookies.find((c) => c.name === 'ev_consent');
    const parsed = consent
      ? JSON.parse(decodeURIComponent(decodeURIComponent(consent.value)))
      : null;
    await page.reload({ waitUntil: 'networkidle' });
    const bannerGone = (await page.getByRole('button', { name: 'Alles weigeren' }).count()) === 0;
    const onlyOurs = cookies.every((c) => ['ev_consent', 'session'].includes(c.name));
    ok(
      'public: cookie banner — refuse stores proof, no banner after',
      sameStyle && parsed && parsed.analytics === false && bannerGone && onlyOurs,
      `gelijke knoppen:${sameStyle} cookies:${cookies.map((c) => c.name).join(',')}`
    );
    await f.close();
  });

  // ── 12. Admin ───────────────────────────────────────────────────────────
  const ad = await newContext(browser);
  await step('admin: verifies the new provider → profile becomes public', async () => {
    await login(ad.page, 'admin@eventiphy.nl');
    await ad.page.goto(BASE + '/admin/providers?status=pending', { waitUntil: 'networkidle' });
    const card = ad.page.locator('li', { hasText: 'E2E Bloemenatelier' }).first();
    await card.getByRole('button', { name: 'Verifiëren' }).click();
    await ad.page.getByText('Dienstverlener geverifieerd.').first().waitFor({ timeout: 15000 });
    const anon = await newContext(browser);
    const res = await anon.page.goto(BASE + newProviderProfile, { waitUntil: 'networkidle' });
    const inBrowse = await anon.page
      .goto(BASE + '/browse?category=flowers', { waitUntil: 'networkidle' })
      .then(() => anon.page.getByText('E2E Bloemenatelier').count());
    ok(
      'admin: verifies the new provider → profile becomes public',
      res.status() === 200 && inBrowse > 0,
      `profiel ${res.status()}, in zoekresultaten: ${inBrowse}`
    );
    await anon.ctx.close();
  });
  await step('admin: pages load, report is in the queue, CSV export works', async () => {
    const statuses = [];
    for (const path of ['/admin', '/admin/users', '/admin/waitlist', '/admin/reports'])
      statuses.push((await ad.page.goto(BASE + path, { waitUntil: 'networkidle' })).status());
    const hasReport = await ad.page
      .getByText('Vals profiel of valse beoordeling')
      .first()
      .isVisible();
    const csv = await ad.ctx.request.get(BASE + '/api/admin/waitlist/export');
    const text = await csv.text();
    ok(
      'admin: pages load, report is in the queue, CSV export works',
      statuses.every((s) => s === 200) &&
        hasReport &&
        csv.status() === 200 &&
        text.includes('Wim Wachter'),
      statuses.join(',')
    );
  });
  await step('admin: suspending a user ends their session immediately', async () => {
    await ad.page.goto(BASE + '/admin/users?q=' + encodeURIComponent(providerEmail), {
      waitUntil: 'networkidle',
    });
    await ad.page
      .getByRole('button', { name: /Acties voor/ })
      .first()
      .click();
    await ad.page.getByRole('menuitem', { name: 'Schorsen' }).click();
    await ad.page.getByRole('button', { name: 'Schorsen' }).click();
    await ad.page.getByText('Account geschorst.').first().waitFor({ timeout: 15000 });
    await np.page.goto(BASE + '/provider-dashboard', { waitUntil: 'networkidle' });
    const after = new URL(np.page.url());
    const cookieGone = !(await np.ctx.cookies()).some((cookie) => cookie.name === 'session');
    await np.page.fill('#email', providerEmail);
    await np.page.fill('#password', 'nog-een-geheim-2');
    await np.page.click('button[type=submit]');
    const blocked = await np.page
      .getByText('tijdelijk geschorst')
      .isVisible({ timeout: 15000 })
      .catch(() => false);
    await np.page
      .getByText('tijdelijk geschorst')
      .waitFor({ timeout: 15000 })
      .catch(() => {});
    ok(
      'admin: suspending a user ends their session immediately',
      after.pathname === '/login' &&
        cookieGone &&
        (blocked || (await np.page.getByText('tijdelijk geschorst').isVisible())),
      `${after.pathname} cookie gewist:${cookieGone}`
    );
  });

  await browser.close();
  const failed = results.filter((r) => !r.pass).length;
  console.log(`\n${results.length - failed}/${results.length} passed`);
  process.exit(failed ? 1 : 0);
})();
