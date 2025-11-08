// Mock data voor dashboards
export interface ServiceRequest {
  id: string;
  provider_id: string;
  provider_name: string;
  category: string;
  event_type: string;
  event_date: string;
  guest_count: number;
  status: 'pending' | 'quotes_received' | 'accepted' | 'rejected';
  created_at: string;
  quotes_count: number;
}

export interface Quote {
  id: string;
  request_id: string;
  provider_id: string;
  provider_name: string;
  amount: number;
  description: string;
  valid_until: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  created_at: string;
}

export interface Booking {
  id: string;
  quote_id: string;
  provider_id: string;
  provider_name: string;
  category: string;
  event_date: string;
  amount: number;
  payment_status: 'pending' | 'paid' | 'refunded';
  status: 'confirmed' | 'completed' | 'cancelled';
  created_at: string;
}

export const mockRequests: ServiceRequest[] = [
  {
    id: 'req-1',
    provider_id: '1',
    provider_name: 'Culinaire Creaties',
    category: 'catering',
    event_type: 'Bruiloft',
    event_date: '2025-06-15',
    guest_count: 120,
    status: 'quotes_received',
    created_at: '2025-01-10',
    quotes_count: 2,
  },
  {
    id: 'req-2',
    provider_id: '2',
    provider_name: 'DJ Mike Productions',
    category: 'dj',
    event_type: 'Verjaardag',
    event_date: '2025-03-20',
    guest_count: 80,
    status: 'pending',
    created_at: '2025-01-08',
    quotes_count: 0,
  },
  {
    id: 'req-3',
    provider_id: '3',
    provider_name: 'Lens & Moments',
    category: 'photography',
    event_type: 'Bruiloft',
    event_date: '2025-06-15',
    guest_count: 120,
    status: 'accepted',
    created_at: '2024-12-15',
    quotes_count: 1,
  },
];

export const mockQuotes: Quote[] = [
  {
    id: 'quote-1',
    request_id: 'req-1',
    provider_id: '1',
    provider_name: 'Culinaire Creaties',
    amount: 4500,
    description: '3-gangen diner, inclusief drankservice en bediening voor 120 personen',
    valid_until: '2025-02-10',
    status: 'pending',
    created_at: '2025-01-11',
  },
  {
    id: 'quote-2',
    request_id: 'req-1',
    provider_id: '1',
    provider_name: 'Culinaire Creaties - Premium',
    amount: 6200,
    description: '5-gangen diner met wijnproeverij, champagne ontvangst en complete bediening',
    valid_until: '2025-02-10',
    status: 'pending',
    created_at: '2025-01-11',
  },
  {
    id: 'quote-3',
    request_id: 'req-3',
    provider_id: '3',
    provider_name: 'Lens & Moments',
    amount: 1800,
    description: 'Volledige dagdeel fotografie, 500+ bewerkte foto\'s, online gallery en fotoboek',
    valid_until: '2025-01-30',
    status: 'accepted',
    created_at: '2024-12-16',
  },
];

export const mockBookings: Booking[] = [
  {
    id: 'book-1',
    quote_id: 'quote-3',
    provider_id: '3',
    provider_name: 'Lens & Moments',
    category: 'photography',
    event_date: '2025-06-15',
    amount: 1800,
    payment_status: 'paid',
    status: 'confirmed',
    created_at: '2024-12-20',
  },
];
