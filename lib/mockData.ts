export const categories = [
  { id: 'catering', name: 'Catering', icon: '🍽️', count: 120 },
  { id: 'dj', name: 'DJ & Muziek', icon: '🎵', count: 85 },
  { id: 'photography', name: 'Fotografie', icon: '📸', count: 95 },
  { id: 'decoration', name: 'Decoratie', icon: '✨', count: 70 },
  { id: 'venues', name: 'Locaties', icon: '🏛️', count: 45 },
  { id: 'entertainment', name: 'Entertainment', icon: '🎭', count: 60 },
];

export const locations = [
  'Amsterdam',
  'Rotterdam',
  'Den Haag',
  'Utrecht',
  'Eindhoven',
  'Groningen',
  'Tilburg',
  'Almere',
  'Breda',
  'Nijmegen',
];

export interface Provider {
  id: string;
  business_name: string;
  category: string;
  location: string;
  price_range: '€' | '€€' | '€€€' | '€€€€';
  rating: number;
  review_count: number;
  verified: boolean;
  image: string;
  images: string[];
  description: string;
  services: string[];
  availability: string;
  min_guests: number;
  max_guests: number;
  response_time: string;
}

export const mockProviders: Provider[] = [
  {
    id: '1',
    business_name: 'Culinaire Creaties',
    category: 'catering',
    location: 'Amsterdam',
    price_range: '€€€',
    rating: 4.8,
    review_count: 127,
    verified: true,
    image: 'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1555244162-803834f70033?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=600&fit=crop',
    ],
    description: 'Specialist in exclusieve catering voor bruiloften en zakelijke evenementen. Wij bieden een breed scala aan menu\'s, van traditioneel Nederlands tot internationale fusion.',
    services: ['Buffet', 'Diner', 'Walking dinner', 'Fingerfood', 'Drankservice'],
    availability: 'Beschikbaar weekends',
    min_guests: 25,
    max_guests: 500,
    response_time: 'Binnen 2 uur',
  },
  {
    id: '2',
    business_name: 'DJ Mike Productions',
    category: 'dj',
    location: 'Rotterdam',
    price_range: '€€',
    rating: 4.9,
    review_count: 89,
    verified: true,
    image: 'https://images.unsplash.com/photo-1571266028243-d220c6e2e3e5?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1571266028243-d220c6e2e3e5?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&h=600&fit=crop',
    ],
    description: 'Professionele DJ met 15 jaar ervaring in bruiloften, bedrijfsfeesten en privé events. Breed repertoire van dance tot lounge muziek.',
    services: ['DJ set', 'Geluid & Licht', 'MC diensten', 'Playlist op maat'],
    availability: 'Beschikbaar alle dagen',
    min_guests: 50,
    max_guests: 1000,
    response_time: 'Binnen 1 uur',
  },
  {
    id: '3',
    business_name: 'Lens & Moments',
    category: 'photography',
    location: 'Utrecht',
    price_range: '€€€',
    rating: 5.0,
    review_count: 64,
    verified: true,
    image: 'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1519741497674-611481863552?w=800&h=600&fit=crop',
    ],
    description: 'Award-winning fotografie studio gespecialiseerd in bruiloftsfotografie en event coverage. Creatieve en natuurlijke stijl.',
    services: ['Fotografie', 'Videografie', 'Drone opnames', 'Fotoboek', 'Online gallery'],
    availability: 'Beschikbaar op aanvraag',
    min_guests: 1,
    max_guests: 500,
    response_time: 'Binnen 3 uur',
  },
  {
    id: '4',
    business_name: 'Bloemen & Stijl',
    category: 'decoration',
    location: 'Amsterdam',
    price_range: '€€',
    rating: 4.7,
    review_count: 112,
    verified: true,
    image: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1478146896981-b80fe463b330?w=800&h=600&fit=crop',
    ],
    description: 'Complete styling en decoratie voor elk type evenement. Van bloemen tot compleet interieurontwerp.',
    services: ['Bloemstukken', 'Tafeldecoratie', 'Verlichting', 'Styling', 'Opbouw & Afbouw'],
    availability: 'Beschikbaar alle dagen',
    min_guests: 10,
    max_guests: 500,
    response_time: 'Binnen 4 uur',
  },
  {
    id: '5',
    business_name: 'Grand Estate',
    category: 'venues',
    location: 'Den Haag',
    price_range: '€€€€',
    rating: 4.9,
    review_count: 78,
    verified: true,
    image: 'https://images.unsplash.com/photo-1519167758481-83f29da8a3e0?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1519167758481-83f29da8a3e0?w=800&h=600&fit=crop',
      'https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?w=800&h=600&fit=crop',
    ],
    description: 'Luxe evenementenlocatie in monumentaal pand. Ideaal voor bruiloften, galas en zakelijke events.',
    services: ['Zaalverhuur', 'Catering mogelijk', 'A/V apparatuur', 'Parking', 'Overnachting'],
    availability: 'Beschikbaar vrijdag-zondag',
    min_guests: 50,
    max_guests: 300,
    response_time: 'Binnen 24 uur',
  },
  {
    id: '6',
    business_name: 'Magic Acts NL',
    category: 'entertainment',
    location: 'Eindhoven',
    price_range: '€€',
    rating: 4.8,
    review_count: 56,
    verified: false,
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
    images: [
      'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&h=600&fit=crop',
    ],
    description: 'Close-up magie en illusionisme voor elk type evenement. Unieke entertainment ervaring voor uw gasten.',
    services: ['Close-up magie', 'Stage show', 'Kindershow', 'Workshops'],
    availability: 'Beschikbaar alle dagen',
    min_guests: 20,
    max_guests: 500,
    response_time: 'Binnen 6 uur',
  },
];

export interface Review {
  id: string;
  provider_id: string;
  customer_name: string;
  rating: number;
  title: string;
  comment: string;
  event_type: string;
  event_date: string;
  created_at: string;
}

export const mockReviews: Review[] = [
  {
    id: '1',
    provider_id: '1',
    customer_name: 'Sarah & Tom',
    rating: 5,
    title: 'Fantastische catering voor onze bruiloft!',
    comment: 'Het eten was absoluut heerlijk en prachtig gepresenteerd. Alle gasten waren onder de indruk. Het team was professioneel en flexibel. Aanrader!',
    event_type: 'Bruiloft',
    event_date: '2024-06-15',
    created_at: '2024-06-20',
  },
  {
    id: '2',
    provider_id: '1',
    customer_name: 'Mark van Dijk',
    rating: 4,
    title: 'Goede ervaring',
    comment: 'Prima catering voor ons bedrijfsevent. Enige minpunt was dat de opbouw iets langer duurde dan verwacht.',
    event_type: 'Bedrijfsfeest',
    event_date: '2024-05-10',
    created_at: '2024-05-15',
  },
  {
    id: '3',
    provider_id: '2',
    customer_name: 'Lisa Jansen',
    rating: 5,
    title: 'Beste DJ ever!',
    comment: 'Mike heeft ons feest tot een geweldig succes gemaakt. Perfect gevoel voor sfeer en timing. Iedereen heeft de hele avond gedanst!',
    event_type: 'Verjaardag',
    event_date: '2024-07-22',
    created_at: '2024-07-25',
  },
];
