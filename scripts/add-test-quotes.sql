-- Script om test quotes toe te voegen aan de database
-- Gebruik dit om quotes te maken voor bestaande service requests

-- Eerst, check welke service requests er zijn:
-- SELECT id, event_type, customer_id, provider_id FROM service_requests WHERE status = 'PENDING';

-- Dan, voeg quotes toe (vervang de IDs met echte IDs uit je database):

-- Voorbeeld: Quote van een provider naar een service request
INSERT INTO quotes (
  id,
  request_id,
  provider_id,
  total_price,
  included_services,
  terms,
  valid_until,
  message,
  accepted,
  created_at,
  updated_at
) VALUES (
  'test_quote_1',
  'SERVICE_REQUEST_ID_HIER',  -- Vervang met echte service request ID
  'PROVIDER_ID_HIER',          -- Vervang met echte provider ID
  2500.00,
  ARRAY['Volledige catering', 'Servies en bestek', 'Professionele bediening', '3-gangen menu'],
  'Prijs is inclusief BTW. Aanbetaling van 30% vereist.',
  NOW() + INTERVAL '30 days',
  'Premium Catering Pakket',
  false,
  NOW(),
  NOW()
);

-- Nog een quote voorbeeld:
INSERT INTO quotes (
  id,
  request_id,
  provider_id,
  total_price,
  included_services,
  terms,
  valid_until,
  message,
  accepted,
  created_at,
  updated_at
) VALUES (
  'test_quote_2',
  'SERVICE_REQUEST_ID_HIER',  -- Vervang met echte service request ID
  'PROVIDER_ID_HIER',          -- Vervang met echte provider ID
  1800.00,
  ARRAY['DJ set 4 uur', 'Professionele audio apparatuur', 'Lichtshow', 'Muziek op aanvraag'],
  'Prijs is exclusief reiskosten boven 50km.',
  NOW() + INTERVAL '30 days',
  'DJ Entertainment Pakket',
  false,
  NOW(),
  NOW()
);
