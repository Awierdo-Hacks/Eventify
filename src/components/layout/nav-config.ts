import type { Role } from '@/lib/session-token';

export type NavIcon =
  | 'overview'
  | 'events'
  | 'requests'
  | 'quotes'
  | 'bookings'
  | 'messages'
  | 'agenda'
  | 'profile'
  | 'providers'
  | 'users'
  | 'waitlist'
  | 'reports'
  | 'discover';

export interface NavItem {
  href: string;
  label: string;
  icon: NavIcon;
  /** Match only the exact path (for section roots). */
  exact?: boolean;
  /** Shows the unread-messages badge. */
  unread?: boolean;
}

const MESSAGES: NavItem = { href: '/messages', label: 'Berichten', icon: 'messages', unread: true };

/** Navigation per role. The first four items also form the mobile tab bar. */
export const NAVIGATION: Record<Role, NavItem[]> = {
  CUSTOMER: [
    { href: '/dashboard', label: 'Overzicht', icon: 'overview', exact: true },
    { href: '/dashboard/events', label: 'Events', icon: 'events' },
    { href: '/dashboard/requests', label: 'Offertes', icon: 'quotes' },
    MESSAGES,
    { href: '/dashboard/bookings', label: 'Boekingen', icon: 'bookings' },
    { href: '/browse', label: 'Ontdekken', icon: 'discover' },
  ],
  PROVIDER: [
    { href: '/provider-dashboard', label: 'Overzicht', icon: 'overview', exact: true },
    { href: '/provider-dashboard/requests', label: 'Aanvragen', icon: 'requests' },
    { href: '/provider-dashboard/agenda', label: 'Agenda', icon: 'agenda' },
    MESSAGES,
    { href: '/provider-dashboard/quotes', label: 'Offertes', icon: 'quotes' },
    { href: '/provider-dashboard/bookings', label: 'Boekingen', icon: 'bookings' },
    { href: '/provider-dashboard/profile', label: 'Profiel', icon: 'profile' },
  ],
  ADMIN: [
    { href: '/admin', label: 'Overzicht', icon: 'overview', exact: true },
    { href: '/admin/providers', label: 'Dienstverleners', icon: 'providers' },
    { href: '/admin/users', label: 'Gebruikers', icon: 'users' },
    { href: '/admin/reports', label: 'Meldingen', icon: 'reports' },
    { href: '/admin/waitlist', label: 'Wachtlijst', icon: 'waitlist' },
    MESSAGES,
  ],
};
