// Type definitions (matching Prisma schema)
export type ProviderCategory =
  | 'CATERING'
  | 'MUSIC'
  | 'PHOTOGRAPHY'
  | 'DECORATION'
  | 'VENUE'
  | 'ENTERTAINMENT'
  | 'VIDEOGRAPHY'
  | 'TRANSPORT'
  | 'ACCOMMODATION'
  | 'SECURITY'
  | 'SANITARY'
  | 'CAKE'
  | 'FLOWERS'
  | 'MC'
  | 'OTHER';

export type EventType = 'WEDDING' | 'BIRTHDAY' | 'CORPORATE' | 'FESTIVAL' | 'CUSTOM';

export type SlotStatus = 'EMPTY' | 'SEARCHING' | 'QUOTES_REQUESTED' | 'QUOTES_RECEIVED' | 'BOOKED';

export type EventStatus = 'PLANNING' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED';

// Category Icons mapping
export const categoryIcons: Record<ProviderCategory, string> = {
  CATERING: '🍽️',
  MUSIC: '🎵',
  PHOTOGRAPHY: '📸',
  DECORATION: '✨',
  VENUE: '🏛️',
  ENTERTAINMENT: '🎭',
  VIDEOGRAPHY: '🎬',
  TRANSPORT: '🚗',
  ACCOMMODATION: '🏨',
  SECURITY: '🛡️',
  SANITARY: '🚽',
  CAKE: '🎂',
  FLOWERS: '💐',
  MC: '🎤',
  OTHER: '📦',
};

// Category Names in Dutch
export const categoryNames: Record<ProviderCategory, string> = {
  CATERING: 'Catering',
  MUSIC: 'Muziek & DJ',
  PHOTOGRAPHY: 'Fotografie',
  DECORATION: 'Decoratie',
  VENUE: 'Locatie',
  ENTERTAINMENT: 'Entertainment',
  VIDEOGRAPHY: 'Videografie',
  TRANSPORT: 'Vervoer',
  ACCOMMODATION: 'Accommodatie',
  SECURITY: 'Beveiliging',
  SANITARY: 'Sanitair',
  CAKE: 'Taart',
  FLOWERS: 'Bloemen',
  MC: 'Ceremoniemeester',
  OTHER: 'Overig',
};

// Event Type Icons
export const eventTypeIcons: Record<EventType, string> = {
  WEDDING: '💒',
  BIRTHDAY: '🎂',
  CORPORATE: '🏢',
  FESTIVAL: '🎉',
  CUSTOM: '📋',
};

// Event Type Names in Dutch
export const eventTypeNames: Record<EventType, string> = {
  WEDDING: 'Bruiloft',
  BIRTHDAY: 'Verjaardag',
  CORPORATE: 'Zakelijk Event',
  FESTIVAL: 'Festival',
  CUSTOM: 'Eigen samenstelling',
};

// Event Type Descriptions
export const eventTypeDescriptions: Record<EventType, string> = {
  WEDDING: 'Plan je perfecte bruiloft met alle essentiële leveranciers',
  BIRTHDAY: 'Maak van elke verjaardag een onvergetelijk feest',
  CORPORATE: 'Professionele evenementen voor je bedrijf',
  FESTIVAL: 'Organiseer een groots festival of openbaar evenement',
  CUSTOM: 'Stel je eigen event samen vanaf nul',
};

// Slot Status Configuration
export const slotStatusConfig: Record<SlotStatus, { label: string; className: string; bgColor: string }> = {
  EMPTY: {
    label: 'Nog in te vullen',
    className: 'bg-gray-100 text-gray-600',
    bgColor: 'bg-gray-50',
  },
  SEARCHING: {
    label: 'Zoeken...',
    className: 'bg-blue-100 text-blue-800',
    bgColor: 'bg-blue-50',
  },
  QUOTES_REQUESTED: {
    label: 'Wacht op offertes',
    className: 'bg-yellow-100 text-yellow-800',
    bgColor: 'bg-yellow-50',
  },
  QUOTES_RECEIVED: {
    label: 'Offertes ontvangen',
    className: 'bg-purple-100 text-purple-800',
    bgColor: 'bg-purple-50',
  },
  BOOKED: {
    label: 'Geboekt',
    className: 'bg-green-100 text-green-800',
    bgColor: 'bg-green-50',
  },
};

// Event Status Configuration
export const eventStatusConfig: Record<EventStatus, { label: string; className: string }> = {
  PLANNING: {
    label: 'In planning',
    className: 'bg-blue-100 text-blue-800',
  },
  ACTIVE: {
    label: 'Actief',
    className: 'bg-green-100 text-green-800',
  },
  COMPLETED: {
    label: 'Voltooid',
    className: 'bg-gray-100 text-gray-800',
  },
  CANCELLED: {
    label: 'Geannuleerd',
    className: 'bg-red-100 text-red-800',
  },
};

// Event Templates with required and optional slots
export interface EventTemplate {
  name: string;
  icon: string;
  description: string;
  requiredSlots: ProviderCategory[];
  optionalSlots: ProviderCategory[];
}

export const eventTemplates: Record<EventType, EventTemplate> = {
  WEDDING: {
    name: 'Bruiloft',
    icon: '💒',
    description: 'Plan je perfecte bruiloft met alle essentiële leveranciers',
    requiredSlots: ['VENUE', 'CATERING', 'MUSIC', 'PHOTOGRAPHY', 'DECORATION'],
    optionalSlots: ['MC', 'VIDEOGRAPHY', 'TRANSPORT', 'ACCOMMODATION', 'FLOWERS', 'CAKE'],
  },
  BIRTHDAY: {
    name: 'Verjaardag',
    icon: '🎂',
    description: 'Maak van elke verjaardag een onvergetelijk feest',
    requiredSlots: ['VENUE', 'CATERING', 'ENTERTAINMENT'],
    optionalSlots: ['DECORATION', 'PHOTOGRAPHY', 'CAKE'],
  },
  CORPORATE: {
    name: 'Zakelijk Event',
    icon: '🏢',
    description: 'Professionele evenementen voor je bedrijf',
    requiredSlots: ['VENUE', 'CATERING'],
    optionalSlots: ['PHOTOGRAPHY', 'ENTERTAINMENT'],
  },
  FESTIVAL: {
    name: 'Festival',
    icon: '🎉',
    description: 'Organiseer een groots festival of openbaar evenement',
    requiredSlots: ['VENUE', 'MUSIC', 'SECURITY', 'CATERING'],
    optionalSlots: ['DECORATION', 'SANITARY'],
  },
  CUSTOM: {
    name: 'Eigen samenstelling',
    icon: '📋',
    description: 'Stel je eigen event samen vanaf nul',
    requiredSlots: [],
    optionalSlots: [],
  },
};

// Helper function to get all available categories
export const getAllCategories = (): { id: ProviderCategory; name: string; icon: string }[] => {
  return Object.entries(categoryNames).map(([id, name]) => ({
    id: id as ProviderCategory,
    name,
    icon: categoryIcons[id as ProviderCategory],
  }));
};

// Helper function to calculate event progress
// Progress counts slots that have quotes (QUOTES_RECEIVED) or are booked (BOOKED)
export const calculateEventProgress = (slots: { status: SlotStatus | string }[]): number => {
  if (slots.length === 0) return 0;
  const progressSlots = slots.filter(
    (slot) => slot.status === 'BOOKED' || slot.status === 'QUOTES_RECEIVED'
  ).length;
  return Math.round((progressSlots / slots.length) * 100);
};

// Helper function to calculate estimated cost range
export const calculateCostRange = (
  slots: { 
    status: SlotStatus; 
    quotes: { total_price: number }[];
    booked_quote?: { total_price: number } | null;
  }[]
): { min: number; max: number } => {
  let min = 0;
  let max = 0;

  slots.forEach((slot) => {
    if (slot.status === 'BOOKED' && slot.booked_quote) {
      min += slot.booked_quote.total_price;
      max += slot.booked_quote.total_price;
    } else if (slot.quotes.length > 0) {
      const prices = slot.quotes.map((q) => q.total_price);
      min += Math.min(...prices);
      max += Math.max(...prices);
    }
  });

  return { min, max };
};

// Map category string to ProviderCategory enum (for matching with existing providers)
export const mapCategoryToEnum = (category: string): ProviderCategory | null => {
  const categoryMap: Record<string, ProviderCategory> = {
    catering: 'CATERING',
    dj: 'MUSIC',
    music: 'MUSIC',
    photography: 'PHOTOGRAPHY',
    decoration: 'DECORATION',
    venues: 'VENUE',
    venue: 'VENUE',
    entertainment: 'ENTERTAINMENT',
    videography: 'VIDEOGRAPHY',
    transport: 'TRANSPORT',
    accommodation: 'ACCOMMODATION',
    security: 'SECURITY',
    sanitary: 'SANITARY',
    cake: 'CAKE',
    flowers: 'FLOWERS',
    mc: 'MC',
  };

  return categoryMap[category.toLowerCase()] || null;
};

// Map ProviderCategory enum to category string (for querying providers)
export const mapEnumToCategory = (category: ProviderCategory): string => {
  const enumMap: Record<ProviderCategory, string> = {
    CATERING: 'catering',
    MUSIC: 'dj',
    PHOTOGRAPHY: 'photography',
    DECORATION: 'decoration',
    VENUE: 'venues',
    ENTERTAINMENT: 'entertainment',
    VIDEOGRAPHY: 'videography',
    TRANSPORT: 'transport',
    ACCOMMODATION: 'accommodation',
    SECURITY: 'security',
    SANITARY: 'sanitary',
    CAKE: 'cake',
    FLOWERS: 'flowers',
    MC: 'mc',
    OTHER: 'other',
  };

  return enumMap[category];
};
