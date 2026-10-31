// End-to-end API test of the booking flow (request → quote → booking → review)
// against a dev server running on a LOCAL, SEEDED database. Never point this at production:
// it creates, cancels and completes bookings.
//
//   npx prisma dev --name eventiphy-local --detach          # local Postgres
//   DATABASE_URL=<local url> npx prisma migrate deploy && npx tsx prisma/seed.ts
//   DATABASE_URL=<local url> DATABASE_POOL_MAX=1 CRON_SECRET=testcron npx next dev -p 3124
//   node scripts/dev/e2e-booking-flow.mjs http://localhost:3124 "<local url>"
import pg from 'pg';

const BASE = process.argv[2];
if (!BASE || !process.argv[3] || !/localhost|127\.0\.0\.1/.test(process.argv[3])) {
  console.error('Usage: node scripts/dev/e2e-booking-flow.mjs <base url> <LOCAL postgres url>');
  process.exit(2);
}
const db = new pg.Client({ connectionString: process.argv[3] });
await db.connect();

let failures = 0;
const check = (name, cond, extra = '') => {
  console.log(`${cond ? 'PASS' : 'FAIL'}  ${name}${extra ? `  (${extra})` : ''}`);
  if (!cond) failures++;
};

function client() {
  let cookie = '';
  return async (path, { method = 'GET', body, headers = {} } = {}) => {
    const res = await fetch(BASE + path, {
      method,
      headers: { 'content-type': 'application/json', ...(cookie ? { cookie } : {}), ...headers },
      body: body ? JSON.stringify(body) : undefined,
      redirect: 'manual',
    });
    const setCookie = res.headers.get('set-cookie');
    if (setCookie && setCookie.startsWith('session=')) cookie = setCookie.split(';')[0];
    let json = null;
    try { json = await res.json(); } catch {}
    return { status: res.status, json };
  };
}

const day = (offset) => new Date(Date.now() + offset * 86400000).toISOString().split('T')[0];
const q1 = async (sql, params) => (await db.query(sql, params)).rows[0];

const customer = client();
const provider = client();
const anon = client();

check('customer login', (await customer('/api/auth/login', { method: 'POST', body: { email: 'Sarah.Jansen@example.com', password: 'password123' } })).status === 200, 'mixed-case email');
check('provider login', (await provider('/api/auth/login', { method: 'POST', body: { email: 'info@culinairecreatiesamsterdam.nl', password: 'password123' } })).status === 200);

const prov = await q1(`select sp.id, sp.category::text as category, sp.user_id from service_providers sp join users u on u.id = sp.user_id where u.email = 'info@culinairecreatiesamsterdam.nl'`);
check('seed provider category is enum', prov.category === 'CATERING', prov.category);

// --- event with a catering and a videography slot
const eventDate = day(60);
let r = await customer('/api/events', { method: 'POST', body: { name: 'E2E Bruiloft', eventType: 'WEDDING', eventDate, location: 'Gent', guestCount: 120, slots: [{ category: 'CATERING' }, { category: 'VIDEOGRAPHY' }] } });
check('create event', r.status === 200 || r.status === 201, String(r.status));
const event = await q1(`select id from events where name = 'E2E Bruiloft' order by created_at desc limit 1`);
const cateringSlot = await q1(`select id from event_slots where event_id = $1 and category = 'CATERING'`, [event.id]);
const videoSlot = await q1(`select id from event_slots where event_id = $1 and category = 'VIDEOGRAPHY'`, [event.id]);

// --- wrong category slot is refused
r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventSlotId: videoSlot.id, eventType: 'WEDDING', eventDate, eventLocation: 'Gent', guestCount: 120 } });
check('request for slot of other category refused', r.status === 400, r.json?.error);

// --- blocked date refused with 409
const blocked = day(61);
await provider('/api/providers/me/blocked-dates', { method: 'POST', body: { dates: [blocked], reason: 'E2E' } });
r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventType: 'WEDDING', eventDate: blocked, eventLocation: 'Gent', guestCount: 50 } });
check('request on blocked date -> 409', r.status === 409, r.json?.error);

// --- past date refused
r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventType: 'WEDDING', eventDate: day(-3), eventLocation: 'Gent', guestCount: 50 } });
check('request in the past refused', r.status === 400, r.json?.error);

// --- golden path: request linked to slot
r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventSlotId: cateringSlot.id, eventType: 'WEDDING', eventDate, eventLocation: 'Gent', guestCount: 120, budgetRange: 'HIGH', description: 'Indiase bruiloft' } });
check('create slot-linked request', r.status === 200, r.json?.error);
const requestId = r.json?.request?.id;
check('slot -> QUOTES_REQUESTED', (await q1(`select status::text from event_slots where id=$1`, [cateringSlot.id])).status === 'QUOTES_REQUESTED');

r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventSlotId: cateringSlot.id, eventType: 'WEDDING', eventDate, eventLocation: 'Gent', guestCount: 120 } });
check('duplicate request for same slot refused', r.status === 400, r.json?.error);

// --- provider quotes
r = await provider('/api/quotes', { method: 'POST', body: { requestId, totalPrice: 4800, message: 'Indiaas buffet', includedServices: ['Buffet', 'Bediening'], validUntil: day(14) } });
check('provider creates quote', r.status === 200, r.json?.error);
const quoteId = r.json?.quote?.id;
const quoteRow = await q1(`select event_slot_id from quotes where id=$1`, [quoteId]);
check('quote auto-linked to slot', quoteRow.event_slot_id === cateringSlot.id);
check('slot -> QUOTES_RECEIVED', (await q1(`select status::text from event_slots where id=$1`, [cateringSlot.id])).status === 'QUOTES_RECEIVED');

r = await provider('/api/quotes', { method: 'POST', body: { requestId, totalPrice: 5000, message: 'Dubbel', includedServices: ['x'] } });
check('second open quote refused', r.status === 400);

r = await provider(`/api/quotes/${quoteId}`, { method: 'PATCH', body: { action: 'update', totalPrice: 4600 } });
check('provider edits open quote', r.status === 200, r.json?.error);

r = await customer('/api/quotes');
const listed = r.json?.quotes?.find((q) => q.id === quoteId);
check('customer sees quote with canAccept + rating', listed?.canAccept === true && typeof listed?.provider?.rating === 'number' && listed?.totalPrice === 4600);

// --- review before completion refused
r = await customer('/api/quotes/' + quoteId, { method: 'PATCH', body: { action: 'accept' } });
check('customer accepts quote', r.status === 200, r.json?.error);
const bookingId = r.json?.booking?.id;
check('slot -> BOOKED', (await q1(`select status::text, booked_quote_id from event_slots where id=$1`, [cateringSlot.id])).status === 'BOOKED');
check('event -> ACTIVE', (await q1(`select status::text from events where id=$1`, [event.id])).status === 'ACTIVE');
check('request -> ACCEPTED', (await q1(`select status::text from service_requests where id=$1`, [requestId])).status === 'ACCEPTED');
const sys = await q1(`select count(*)::int as n from messages where message_type = 'SYSTEM' and content like '%geaccepteerd%' and created_at > now() - interval '5 minutes'`);
check('system message posted in chat', sys.n >= 1);

r = await customer(`/api/quotes/${quoteId}`, { method: 'PATCH', body: { action: 'reject' } });
check('reject after accept refused', r.status === 400, r.json?.error);

r = await customer('/api/reviews', { method: 'POST', body: { bookingId, rating: 5, title: 'Top', comment: 'Heel lekker eten, aanrader!' } });
check('review before completion -> 403', r.status === 403, r.json?.error);

r = await provider(`/api/bookings/${bookingId}`, { method: 'PATCH', body: { action: 'complete' } });
check('complete before event day refused', r.status === 400, r.json?.error);

r = await customer(`/api/bookings/${bookingId}`, { method: 'PATCH', body: { action: 'setPaymentStatus', paymentStatus: 'PAID' } });
check('customer cannot set payment status', r.status === 403);

// availability now blocks the booked day
r = await anon(`/api/providers/${prov.id}/availability`);
check('booked day shows as unavailable', r.json?.unavailableDates?.includes(eventDate));

// --- cancel booking frees slot and agenda
r = await customer(`/api/bookings/${bookingId}`, { method: 'PATCH', body: { action: 'cancel', reason: 'Datum verschoven' } });
check('customer cancels booking', r.status === 200, r.json?.error);
const slotAfter = await q1(`select status::text, booked_quote_id from event_slots where id=$1`, [cateringSlot.id]);
check('slot freed after cancel', slotAfter.booked_quote_id === null && slotAfter.status !== 'BOOKED', slotAfter.status);
check('event back to PLANNING', (await q1(`select status::text from events where id=$1`, [event.id])).status === 'PLANNING');
r = await anon(`/api/providers/${prov.id}/availability`);
check('agenda date free again', !r.json?.unavailableDates?.includes(eventDate));

// --- expired quote cannot be accepted
r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventSlotId: cateringSlot.id, eventType: 'WEDDING', eventDate, eventLocation: 'Gent', guestCount: 120 } });
const req2 = r.json?.request?.id;
r = await provider('/api/quotes', { method: 'POST', body: { requestId: req2, totalPrice: 3000, message: 'Basis', includedServices: ['Buffet'] } });
const quote2 = r.json?.quote?.id;
await db.query(`update quotes set valid_until = now() - interval '3 days' where id = $1`, [quote2]);
r = await customer(`/api/quotes/${quote2}`, { method: 'PATCH', body: { action: 'accept' } });
check('expired quote accept refused', r.status === 400, r.json?.error);

// --- provider declines a request
r = await provider(`/api/requests/${req2}`, { method: 'PATCH', body: { action: 'decline', reason: 'Volgeboekt' } });
check('provider declines request', r.status === 200, r.json?.error);
check('request -> REJECTED', (await q1(`select status::text from service_requests where id=$1`, [req2])).status === 'REJECTED');
r = await provider('/api/quotes', { method: 'POST', body: { requestId: req2, totalPrice: 1, message: 'x', includedServices: ['x'] } });
check('no quotes on declined request', r.status === 400);

// --- completion + review on a past confirmed booking (seed data)
const past = await q1(`select b.id from bookings b where b.provider_id = $1 and b.status = 'CONFIRMED' and b.event_date < now() order by b.event_date limit 1`, [prov.id]);
if (past) {
  r = await provider(`/api/bookings/${past.id}`, { method: 'PATCH', body: { action: 'complete' } });
  check('provider completes past booking', r.status === 200, r.json?.error);
  const before = await q1(`select review_count from service_providers where id=$1`, [prov.id]);
  r = await customer('/api/reviews', { method: 'POST', body: { bookingId: past.id, rating: 4, title: 'Goed', comment: 'Fijne samenwerking en lekker eten.' } });
  check('review after completion', r.status === 200, r.json?.error);
  const after = await q1(`select review_count from service_providers where id=$1`, [prov.id]);
  check('provider review count updated', after.review_count === before.review_count + 1, `${before.review_count} -> ${after.review_count}`);
  r = await customer('/api/reviews', { method: 'POST', body: { bookingId: past.id, rating: 5, title: 'Nog eens', comment: 'Tweede review mag niet.' } });
  check('second review same booking -> 409', r.status === 409, r.json?.error);
} else {
  check('seed has a past confirmed booking for provider', false);
}

// --- review without any booking
r = await customer('/api/reviews', { method: 'POST', body: { bookingId: 'does-not-exist', rating: 5, title: 'Nep', comment: 'Ik heb nooit geboekt maar toch.' } });
check('review without booking refused', r.status === 404);

// --- chat quote without event details refused
const conv = await q1(`select cp.conversation_id from conversation_participants cp join conversation_participants cp2 on cp2.conversation_id = cp.conversation_id where cp.user_id = $1 and cp2.user_id = (select id from users where email='sarah.jansen@example.com') limit 1`, [prov.user_id]);
r = await provider(`/api/conversations/${conv.conversation_id}/quote`, { method: 'POST', body: { totalPrice: 500, includedServices: ['x'], message: 'Chat offerte' } });
check('chat quote without date refused', r.status === 400, r.json?.error);
r = await provider(`/api/conversations/${conv.conversation_id}/quote`, { method: 'POST', body: { totalPrice: 500, includedServices: ['Hapjes'], message: 'Chat offerte', eventType: 'BIRTHDAY', eventDate: day(90), eventLocation: 'Antwerpen', guestCount: 40 } });
check('chat quote with real event details', r.status === 200, r.json?.error);
const chatReq = await q1(`select r.event_location, r.guest_count from quotes q join service_requests r on r.id = q.request_id where q.id = $1`, [r.json?.quote?.id]);
check('chat request stores real details', chatReq?.event_location === 'Antwerpen' && chatReq?.guest_count === 40);

// --- event cancellation cascades
r = await customer('/api/requests', { method: 'POST', body: { providerId: prov.id, eventSlotId: cateringSlot.id, eventType: 'WEDDING', eventDate, eventLocation: 'Gent', guestCount: 120 } });
const req3 = r.json?.request?.id;
r = await customer(`/api/events/${event.id}`, { method: 'DELETE' });
check('cancel event', r.status === 200, r.json?.error);
check('open request cancelled with event', (await q1(`select status::text from service_requests where id=$1`, [req3])).status === 'CANCELLED');

// --- legacy category slugs still work in browse
r = await anon('/api/providers?category=dj');
check('legacy ?category=dj finds MUSIC providers', (r.json?.providers ?? []).length > 0 && r.json.providers.every((p) => p.category === 'MUSIC'));

// --- cron
r = await anon('/api/cron/daily');
check('cron without secret -> 401', r.status === 401);
r = await anon('/api/cron/daily', { headers: { authorization: 'Bearer testcron' } });
check('cron with secret runs', r.status === 200 && r.json?.ok === true, JSON.stringify(r.json));

await db.end();
console.log(failures === 0 ? '\nALL CHECKS PASSED' : `\n${failures} CHECK(S) FAILED`);
process.exit(failures === 0 ? 0 : 1);
