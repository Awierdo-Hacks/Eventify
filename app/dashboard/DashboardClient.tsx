'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { paymentsEnabled } from '@/lib/payments-mode';
import type { PageUser } from '@/lib/page-data';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Input } from '@/components/ui/input';
import {
  ConfirmationDialog,
  DialogQuoteInfo,
  DialogTextField,
  DialogActions,
  DialogButton,
} from '@/components/ui/confirmation-dialog';
import { EventCard } from '@/components/events/EventCard';
import { UnlinkedQuotes } from '@/components/events/UnlinkedQuotes';

// Lazy load – alleen ingeladen wanneer gebruiker een evenement selecteert (936 regels)
const EventDetailView = dynamic(
  () => import('@/components/events/EventDetailView').then((m) => ({ default: m.EventDetailView })),
  { ssr: false, loading: () => <Skeleton className="h-96 w-full rounded-3xl" /> }
);
import { categoryIcon, categoryLabel } from '@/lib/categories';
import { eventTypeLabel, formatEuro, paymentStatusLabel } from '@/lib/labels';
import { downloadIcs } from '@/lib/ics';
import { ReviewDialog } from '@/components/reviews/ReviewDialog';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Calendar,
  Euro,
  Users,
  AlertCircle,
  MapPin,
  PartyPopper,
  Plus,
  Star,
} from 'lucide-react';

interface ServiceRequest {
  id: string;
  category: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount: number;
  budgetRange: string | null;
  status: string;
  createdAt: string;
  declineReason?: string | null;
  eventName?: string | null;
  provider?: {
    id: string;
    businessName: string;
    category: string;
    location: string;
    userId: string;
  } | null;
  quotes: Array<{
    id: string;
    totalPrice: number;
    accepted?: boolean;
    rejected?: boolean;
    open?: boolean;
  }>;
}

interface Quote {
  id: string;
  totalPrice: number;
  packageName: string;
  packageDescription: string;
  includedServices: string[];
  validUntil: string;
  status: string;
  expired?: boolean;
  canAccept?: boolean;
  createdAt: string;
  eventSlotId?: string | null; // Added for filtering linked quotes
  eventSlot?: { id: string; category: string; eventId: string; eventName: string } | null;
  provider: {
    id: string;
    businessName: string;
    category: string;
    userId: string;
    rating?: number;
    reviewCount?: number;
    verified?: boolean;
  };
  serviceRequest: {
    id: string;
    status?: string;
    eventType: string;
    eventDate: string;
    eventLocation: string;
    guestCount?: number;
    customer: {
      name: string;
    };
  };
}

interface Booking {
  id: string;
  eventDate: string;
  eventLocation: string;
  guestCount: number;
  finalPrice: number;
  status: string;
  paymentStatus: string | null;
  createdAt: string;
  cancellationReason?: string | null;
  cancelledByMe?: boolean;
  review?: { id: string; rating: number } | null;
  request?: { id: string; eventType: string } | null;
  provider: {
    id: string;
    businessName: string;
    category: string;
    userId: string;
  };
  quote?: {
    id: string;
    packageName: string;
    includedServices: string[];
    terms: string | null;
  } | null;
}

interface EventSlotQuote {
  id: string;
  totalPrice: number;
  accepted: boolean;
  providerName: string;
  message?: string | null;
  includedServices?: string[];
  validUntil?: string;
  createdAt?: string;
  provider?: {
    id: string;
    businessName: string;
    category: string;
    location: string;
  };
}

interface EventSlot {
  id: string;
  category: string;
  status: string;
  isRequired?: boolean;
  displayOrder?: number;
  quotesCount?: number;
  quotes?: EventSlotQuote[];
  bookedQuote?: {
    id: string;
    totalPrice: number;
    providerName?: string;
    provider?: {
      id: string;
      businessName: string;
      category: string;
      location: string;
    };
  } | null;
}

interface Event {
  id: string;
  name: string;
  eventType: string;
  eventDate: string | null;
  location: string | null;
  guestCount: number | null;
  status: string;
  slots: EventSlot[];
  createdAt: string;
  updatedAt?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  description?: string | null;
}

interface DashboardInitialData {
  requests: ServiceRequest[];
  quotes: Quote[];
  bookings: Booking[];
  events: Event[];
  unreadCount: number;
}

interface DashboardClientProps {
  initialData: DashboardInitialData;
  initialUser: PageUser;
  initialTab?: string;
  initialSuccess?: string;
  initialEventId?: string;
}

const SUCCESS_MESSAGES: Record<string, string> = {
  true: 'Je aanvraag is verstuurd! De provider stuurt je een offerte; je vindt ze straks onder Offertes.',
  request: 'Je aanvraag is verstuurd! De provider stuurt je een offerte; je vindt ze straks onder Offertes.',
  created: 'Je event is aangemaakt. Zoek nu per onderdeel de juiste providers.',
};

function daysUntil(dateString: string): number {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

export default function DashboardClient({
  initialData,
  initialUser,
  initialTab = 'events',
  initialSuccess,
  initialEventId,
}: DashboardClientProps) {
  const router = useRouter();
  const user = initialUser;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialSuccess ? SUCCESS_MESSAGES[initialSuccess] ?? null : null
  );

  const [requests, setRequests] = useState<ServiceRequest[]>(initialData.requests);
  const [quotes, setQuotes] = useState<Quote[]>(initialData.quotes);
  const [bookings, setBookings] = useState<Booking[]>(initialData.bookings);
  const [events, setEvents] = useState<Event[]>(initialData.events);
  // Open the event that was just created in the event builder
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(
    () => (initialEventId ? initialData.events.find((e) => e.id === initialEventId) ?? null : null)
  );
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);
  const [rejectingQuote, setRejectingQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [unreadCount, setUnreadCount] = useState(initialData.unreadCount);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);
  const [cancellingRequest, setCancellingRequest] = useState<ServiceRequest | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [isCancelling, setIsCancelling] = useState(false);
  const [reviewingBooking, setReviewingBooking] = useState<Booking | null>(null);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 6000);
  };

  // Reload everything after a workflow action (statuses ripple across tabs)
  const refreshAll = async () => {
    const [requestsRes, quotesRes, bookingsRes, eventsRes] = await Promise.all([
      fetch('/api/requests'),
      fetch('/api/quotes'),
      fetch('/api/bookings'),
      fetch('/api/events'),
    ]);
    const [requestsData, quotesData, bookingsData, eventsData] = await Promise.all([
      requestsRes.json(),
      quotesRes.json(),
      bookingsRes.json(),
      eventsRes.json(),
    ]);
    setRequests(requestsData.requests || []);
    setQuotes(quotesData.quotes || []);
    setBookings(bookingsData.bookings || []);
    setEvents(eventsData.events || []);
    setSelectedEvent((current) =>
      current ? (eventsData.events || []).find((e: Event) => e.id === current.id) ?? null : null
    );
  };

  const handleCancelRequest = async () => {
    if (!cancellingRequest) return;
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/requests/${cancellingRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kon de aanvraag niet annuleren');
      await refreshAll();
      setCancellingRequest(null);
      setCancelReason('');
      showSuccess('Je aanvraag is geannuleerd. De provider is op de hoogte gebracht.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de aanvraag niet annuleren');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    if (cancelReason.trim().length < 3) {
      showError('Geef een korte reden voor de annulering');
      return;
    }
    setIsCancelling(true);
    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: cancelReason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kon de boeking niet annuleren');
      await refreshAll();
      setCancellingBooking(null);
      setCancelReason('');
      showSuccess('De boeking is geannuleerd. Het onderdeel van je event is weer vrij.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de boeking niet annuleren');
    } finally {
      setIsCancelling(false);
    }
  };

  // Poll for unread message count
  useEffect(() => {
    const fetchUnread = async () => {
      try {
        const res = await fetch('/api/conversations/unread');
        if (res.ok) {
          const data = await res.json();
          setUnreadCount(data.unreadCount || 0);
        }
      } catch { /* Silently fail */ }
    };
    const interval = setInterval(fetchUnread, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleAcceptQuote = async (quoteId: string) => {
    setAcceptingQuote(quoteId);
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'accept' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan');
      }

      await refreshAll();
      showSuccess('Offerte geaccepteerd! Je boeking is bevestigd. Je vindt ze onder Boekingen.');
    } catch (err) {
      console.error('Error accepting quote:', err);
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan bij het accepteren van de offerte');
      setTimeout(() => setError(null), 5000);
    } finally {
      setAcceptingQuote(null);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    setAcceptingQuote(quoteId); // Gebruik dezelfde loading state
    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          action: 'reject',
          reason: rejectionReason || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan');
      }

      await refreshAll();
      showSuccess('Offerte afgewezen. De provider is op de hoogte gebracht.');
      
      // Reset dialog
      setRejectingQuote(null);
      setRejectionReason('');
    } catch (err) {
      console.error('Error rejecting quote:', err);
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan bij het afwijzen van de offerte');
      setTimeout(() => setError(null), 5000);
    } finally {
      setAcceptingQuote(null);
    }
  };

  const handleDeleteEvent = async () => {
    if (!deletingEvent) return;
    setIsDeletingEvent(true);
    try {
      const res = await fetch(`/api/events/${deletingEvent.id}`, {
        method: 'DELETE',
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kon het event niet annuleren');

      setSelectedEvent(null);
      setDeletingEvent(null);
      await refreshAll();
      showSuccess('Het event is geannuleerd. Betrokken providers zijn op de hoogte gebracht.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Er is iets misgegaan bij het annuleren van het event');
    } finally {
      setIsDeletingEvent(false);
    }
  };

  const handleOpenChat = async (providerUserId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: providerUserId }),
      });
      if (!res.ok) throw new Error('Kon gesprek niet openen');
      const data = await res.json();
      router.push(`/messages/${data.conversation.id}`);
    } catch (err) {
      console.error('Error opening chat:', err);
      showError('Kon het gesprek niet openen');
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'Wacht op offerte', className: 'bg-blue-100 text-blue-800' },
      QUOTED: { label: 'Offerte ontvangen', className: 'bg-purple-100 text-purple-800' },
      ACCEPTED: { label: 'Geboekt', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Provider niet beschikbaar', className: 'bg-red-100 text-red-800' },
      CONFIRMED: { label: 'Bevestigd', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Voltooid', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Geannuleerd', className: 'bg-red-100 text-red-800' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  // "Geboekt" is not "betaald": the payment line is shown separately and honestly
  const getPaymentBadge = (status: string | null) => {
    const value = status || 'UNPAID';
    const className =
      value === 'PAID' ? 'bg-green-100 text-green-800' : value === 'REFUNDED' ? 'bg-gray-100 text-gray-700' : 'bg-amber-100 text-amber-800';
    return <Badge className={className}>{paymentStatusLabel(value)}</Badge>;
  };

  // Quotes grouped per event part (slot), or per category when not linked to an event
  const quoteGroups = (() => {
    const visible = quotes.filter((q) => q.status !== 'REJECTED');
    const groups = new Map<string, { title: string; subtitle: string; quotes: Quote[] }>();
    for (const quote of visible) {
      const key = quote.eventSlot ? `slot:${quote.eventSlot.id}` : `cat:${quote.provider.category}`;
      if (!groups.has(key)) {
        groups.set(key, {
          title: quote.eventSlot
            ? `${categoryIcon(quote.eventSlot.category)} ${categoryLabel(quote.eventSlot.category)}`
            : `${categoryIcon(quote.provider.category)} ${categoryLabel(quote.provider.category)}`,
          subtitle: quote.eventSlot ? quote.eventSlot.eventName : 'Niet gekoppeld aan een event',
          quotes: [],
        });
      }
      groups.get(key)!.quotes.push(quote);
    }
    return Array.from(groups.values()).map((group) => ({
      ...group,
      quotes: group.quotes.sort((a, b) => Number(b.status === 'ACCEPTED') - Number(a.status === 'ACCEPTED') || a.totalPrice - b.totalPrice),
    }));
  })();

  const openQuotesCount = quotes.filter((q) => q.canAccept).length;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-BE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const stats = [
    {
      label: 'Mijn Events',
      value: events.filter((e) => e.status === 'PLANNING' || e.status === 'ACTIVE').length,
      icon: PartyPopper,
      iconColor: 'text-pink-600',
      iconBg: 'bg-pink-100',
      borderColor: 'border-pink-400',
      onClick: () => setActiveTab('events'),
    },
    {
      label: 'Offertes te bekijken',
      value: openQuotesCount,
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      borderColor: 'border-blue-400',
      onClick: () => setActiveTab('quotes'),
    },
    {
      label: 'Ongelezen Berichten',
      value: unreadCount,
      icon: MessageSquare,
      iconColor: 'text-purple-600',
      iconBg: 'bg-purple-100',
      borderColor: 'border-purple-400',
      onClick: () => router.push('/messages'),
    },
    {
      label: 'Bevestigde Boekingen',
      value: bookings.filter((b) => b.status === 'CONFIRMED').length,
      icon: CheckCircle,
      iconColor: 'text-green-600',
      iconBg: 'bg-green-100',
      borderColor: 'border-green-400',
      onClick: () => setActiveTab('bookings'),
    },
  ];

  // Loading state
  if (loading) {
    return (
      <main className="min-h-screen bg-gradient-to-br bg-gray-50">
        <Container className="py-4 sm:py-6">
          <Skeleton className="h-8 w-48 mb-1" />
          <Skeleton className="h-5 w-64 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-4 rounded-2xl">
                <Skeleton className="h-8 w-8 mb-3" />
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-6 w-16" />
              </Card>
            ))}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br bg-gray-50">
      <Container className="py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5">
            <span className="gradient-text">Mijn Dashboard</span>
          </h1>
          <p className="text-sm text-gray-600">Welkom terug, {user.name}!</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Gelukt!</p>
              <p className="text-sm text-green-600 mt-1">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-red-800">Fout</p>
              <p className="text-sm text-red-600 mt-1">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <div key={stat.label}>
                <Card
                  className={`p-4 border-t-4 ${stat.borderColor} rounded-2xl hover:shadow-md transition-all cursor-pointer`}
                  onClick={stat.onClick}
                >
                  <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                    <Icon className={`w-5 h-5 ${stat.iconColor}`} />
                  </div>
                  <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
                </Card>
              </div>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-full w-full max-w-2xl mx-auto flex gap-1 mb-6 overflow-x-auto">
            <TabsTrigger value="events" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <PartyPopper className="w-4 h-4 mr-1 hidden sm:inline" />
              Mijn Events
            </TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Offertes
              {openQuotesCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center min-w-5 h-5 px-1 rounded-full bg-amber-400 text-[10px] font-bold text-gray-900">
                  {openQuotesCount}
                </span>
              )}
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">Aanvragen</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">Boekingen</TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-6">
            {selectedEvent ? (
              <EventDetailView
                event={{
                  ...selectedEvent,
                  eventType: selectedEvent.eventType as any,
                  status: selectedEvent.status as any,
                  slots: selectedEvent.slots.map((s) => ({
                    ...s,
                    category: s.category as any,
                    status: s.status as any,
                    isRequired: s.isRequired ?? true,
                    displayOrder: s.displayOrder ?? 0,
                    quotesCount: s.quotesCount ?? s.quotes?.length ?? 0,
                    quotes: (s.quotes || []).map((q) => ({
                      ...q,
                      message: q.message ?? undefined,
                      accepted: q.accepted ?? false,
                      providerName: q.providerName || '',
                    })),
                  })),
                }}
                quotes={quotes.filter((q) => q.canAccept).map((q) => ({
                  id: q.id,
                  totalPrice: q.totalPrice,
                  accepted: q.status === 'ACCEPTED',
                  providerName: q.provider.businessName,
                  includedServices: q.includedServices,
                  validUntil: q.validUntil,
                  provider: {
                    ...q.provider,
                    location: '', // Placeholder
                  },
                }))}
                onBack={() => setSelectedEvent(null)}
                onRefresh={async () => {
                  // Refresh all events and quotes data
                  const [eventsRes, quotesRes] = await Promise.all([
                    fetch('/api/events'),
                    fetch('/api/quotes'),
                  ]);
                  const [eventsData, quotesData] = await Promise.all([
                    eventsRes.json(),
                    quotesRes.json(),
                  ]);
                  setEvents(eventsData.events || []);
                  setQuotes(quotesData.quotes || []);
                  // Update the selected event with fresh data
                  const updatedEvent = eventsData.events?.find((e: Event) => e.id === selectedEvent.id);
                  if (updatedEvent) setSelectedEvent(updatedEvent);
                }}
                onRequestQuote={(category: string) => router.push(`/browse?category=${category}`)}
                onLinkQuote={async (quoteId: string, slotId: string) => {
                  try {
                    const response = await fetch(`/api/quotes/${quoteId}/link`, {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ eventSlotId: slotId }),
                    });
                    if (!response.ok) {
                      const data = await response.json().catch(() => ({}));
                      throw new Error(data.error || 'Kon offerte niet koppelen');
                    }
                    // Refresh events and quotes
                    const [eventsRes, quotesRes] = await Promise.all([
                      fetch('/api/events'),
                      fetch('/api/quotes'),
                    ]);
                    const [eventsData, quotesData] = await Promise.all([
                      eventsRes.json(),
                      quotesRes.json(),
                    ]);
                    setEvents(eventsData.events || []);
                    setQuotes(quotesData.quotes || []);
                    // Update selected event
                    const updatedEvent = eventsData.events?.find((e: Event) => e.id === selectedEvent.id);
                    if (updatedEvent) setSelectedEvent(updatedEvent);
                    showSuccess('Offerte gekoppeld aan je event');
                  } catch (err) {
                    showError(err instanceof Error ? err.message : 'Kon offerte niet koppelen');
                  }
                }}
                onDeleteEvent={() => setDeletingEvent(selectedEvent)}
              />
            ) : (
              <>
                {/* Events Header */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mijn Events</h2>
                    <p className="text-gray-600">Beheer al je events op één plek</p>
                  </div>
                  <Button
                    onClick={() => router.push('/events/new')}
                    className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Nieuw Event
                  </Button>
                </div>

                {events.length === 0 ? (
                  <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                    <PartyPopper className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-900 mb-2">Nog geen events</h3>
                    <p className="text-gray-600 mb-6">
                      Maak een event aan om je providers en offertes georganiseerd te houden
                    </p>
                    <Button
                      onClick={() => router.push('/events/new')}
                      className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Eerste Event Aanmaken
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event) => (
                      <div key={event.id}>
                        <EventCard
                          event={{
                            ...event,
                            eventType: event.eventType as any,
                            status: event.status as any,
                            slots: event.slots.map((s) => ({
                              ...s,
                              category: s.category as any,
                              status: s.status as any,
                            })),
                          }}
                          onClick={() => setSelectedEvent(event)}
                        />
                      </div>
                    ))}
                  </div>
                )}

                {/* Unlinked Quotes Section */}
                {quotes.filter((q) => q.canAccept && !q.eventSlotId).length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Ongekoppelde Offertes</h3>
                    <UnlinkedQuotes
                      quotes={quotes.filter((q) => q.canAccept && !q.eventSlotId)}
                      events={events.map((e) => ({
                        ...e,
                        eventType: e.eventType as any,
                        slots: e.slots.map((s) => ({
                          ...s,
                          category: s.category as any,
                        })),
                      }))}
                      onLinkQuote={async (quoteId, slotId) => {
                        try {
                          const response = await fetch(`/api/quotes/${quoteId}/link`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ eventSlotId: slotId }),
                          });
                          if (!response.ok) {
                            const data = await response.json().catch(() => ({}));
                            throw new Error(data.error || 'Kon offerte niet koppelen');
                          }
                          // Refresh events and quotes
                          const [eventsRes, quotesRes] = await Promise.all([
                            fetch('/api/events'),
                            fetch('/api/quotes'),
                          ]);
                          const [eventsData, quotesData] = await Promise.all([
                            eventsRes.json(),
                            quotesRes.json(),
                          ]);
                          setEvents(eventsData.events || []);
                          setQuotes(quotesData.quotes || []);
                          showSuccess('Offerte gekoppeld aan je event');
                        } catch (err) {
                          showError(err instanceof Error ? err.message : 'Kon offerte niet koppelen');
                        }
                      }}
                    />
                  </div>
                )}
              </>
            )}
          </TabsContent>

          {/* Quotes Tab: compare quotes per event part */}
          <TabsContent value="quotes" className="space-y-6">
            {quoteGroups.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <Euro className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Nog geen offertes</h3>
                <p className="text-gray-600 mb-6">
                  Vraag offertes aan bij providers; hier vergelijk je ze naast elkaar.
                </p>
                <Button
                  onClick={() => router.push('/browse')}
                  className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
                >
                  Providers zoeken
                </Button>
              </Card>
            ) : (
              quoteGroups.map((group) => {
                const cheapestOpen = group.quotes.filter((q) => q.canAccept).sort((a, b) => a.totalPrice - b.totalPrice)[0];
                return (
                  <section key={group.title + group.subtitle}>
                    <div className="mb-3">
                      <h3 className="text-lg font-bold text-gray-900">{group.title}</h3>
                      <p className="text-sm text-gray-500">
                        {group.subtitle} · {group.quotes.length} offerte{group.quotes.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                      {group.quotes.map((quote) => {
                        const daysLeft = daysUntil(quote.validUntil);
                        const isCheapest = cheapestOpen?.id === quote.id && group.quotes.filter((q) => q.canAccept).length > 1;
                        return (
                          <Card
                            key={quote.id}
                            className={`p-5 border-2 rounded-3xl flex flex-col ${
                              quote.status === 'ACCEPTED' ? 'border-green-300 bg-green-50/40' : 'border-gray-100'
                            }`}
                          >
                            <div className="flex items-start justify-between gap-2 mb-3">
                              <div className="min-w-0">
                                <p className="font-bold text-gray-900 truncate">{quote.provider.businessName}</p>
                                <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                                  {quote.provider.verified && (
                                    <span className="inline-flex items-center gap-0.5 text-green-700">
                                      <CheckCircle className="w-3 h-3" /> Geverifieerd
                                    </span>
                                  )}
                                  {(quote.provider.reviewCount ?? 0) > 0 && (
                                    <span className="inline-flex items-center gap-0.5">
                                      <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                      {quote.provider.rating} ({quote.provider.reviewCount})
                                    </span>
                                  )}
                                </div>
                              </div>
                              {quote.status === 'ACCEPTED' ? (
                                <Badge className="bg-green-100 text-green-800 shrink-0">Geboekt</Badge>
                              ) : quote.expired ? (
                                <Badge className="bg-gray-100 text-gray-600 shrink-0">Verlopen</Badge>
                              ) : isCheapest ? (
                                <Badge className="bg-amber-100 text-amber-800 shrink-0">Laagste prijs</Badge>
                              ) : null}
                            </div>

                            <p className="text-3xl font-bold text-gray-900">{formatEuro(quote.totalPrice)}</p>
                            <p className="text-sm font-medium text-gray-700 mb-3">{quote.packageName}</p>

                            {quote.includedServices.length > 0 && (
                              <ul className="space-y-1 mb-3">
                                {quote.includedServices.slice(0, 5).map((service, idx) => (
                                  <li key={idx} className="text-sm text-gray-600 flex items-start gap-2">
                                    <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
                                    {service}
                                  </li>
                                ))}
                                {quote.includedServices.length > 5 && (
                                  <li className="text-xs text-gray-500">+ {quote.includedServices.length - 5} meer</li>
                                )}
                              </ul>
                            )}

                            <div className="text-xs text-gray-500 mb-4 space-y-0.5">
                              <p>
                                {eventTypeLabel(quote.serviceRequest.eventType)} · {formatDate(quote.serviceRequest.eventDate)}
                              </p>
                              {quote.status !== 'ACCEPTED' && !quote.expired && (
                                <p className={daysLeft <= 3 ? 'text-amber-700 font-medium' : ''}>
                                  Geldig tot {formatDate(quote.validUntil)}
                                  {daysLeft <= 3 && daysLeft >= 0 ? ` (nog ${daysLeft} dag${daysLeft === 1 ? '' : 'en'})` : ''}
                                </p>
                              )}
                            </div>

                            <div className="mt-auto flex flex-col gap-2">
                              {quote.canAccept && (
                                <div className="flex gap-2">
                                  <Button
                                    onClick={() => handleAcceptQuote(quote.id)}
                                    disabled={!!acceptingQuote}
                                    className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600"
                                  >
                                    {acceptingQuote === quote.id ? 'Bezig...' : 'Accepteren'}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    onClick={() => setRejectingQuote(quote)}
                                    disabled={!!acceptingQuote}
                                    className="rounded-xl"
                                  >
                                    Afwijzen
                                  </Button>
                                </div>
                              )}
                              <Button
                                variant="ghost"
                                size="sm"
                                className="rounded-xl text-purple-700"
                                onClick={() => handleOpenChat(quote.provider.userId)}
                              >
                                <MessageSquare className="w-4 h-4 mr-1" />
                                Vraag iets aan {quote.provider.businessName}
                              </Button>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </section>
                );
              })
            )}
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {requests.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen aanvragen gevonden</h3>
                <p className="text-gray-600 mb-6">Je hebt nog geen aanvragen gedaan</p>
                <Button
                  onClick={() => router.push('/browse')}
                  className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
                >
                  Browse Providers
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6">
                {requests.map((request) => (
                  <Card key={request.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-1">{eventTypeLabel(request.eventType)}</h3>
                        {request.eventName && (
                          <p className="text-sm text-purple-700 font-medium mb-1">Voor: {request.eventName}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(request.eventDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {request.eventLocation}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {request.guestCount} gasten
                          </span>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>

                    {request.provider && (
                      <div className="pt-4 border-t border-gray-200">
                        <p className="text-sm text-gray-600 mb-2">Provider</p>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                              {categoryLabel(request.provider.category, true)}
                            </Badge>
                            <span className="font-semibold text-gray-900">{request.provider.businessName}</span>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="rounded-xl"
                            onClick={() => handleOpenChat(request.provider!.userId)}
                          >
                            <MessageSquare className="w-4 h-4 mr-1" />
                            Chat
                          </Button>
                        </div>
                      </div>
                    )}

                    {request.status === 'REJECTED' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm text-red-800">
                        De provider is niet beschikbaar voor deze aanvraag
                        {request.declineReason ? `: "${request.declineReason}"` : '.'} Zoek een andere provider voor dit onderdeel.
                      </div>
                    )}

                    {request.quotes.some((q) => q.open) && (
                      <button
                        type="button"
                        onClick={() => setActiveTab('quotes')}
                        className="mt-4 w-full text-left p-3 bg-purple-50 hover:bg-purple-100 transition-colors rounded-xl text-sm text-purple-800 font-medium"
                      >
                        <MessageSquare className="w-4 h-4 inline mr-1" />
                        {request.quotes.filter((q) => q.open).length} offerte
                        {request.quotes.filter((q) => q.open).length > 1 ? 's' : ''} ontvangen. Bekijk en vergelijk →
                      </button>
                    )}

                    {['PENDING', 'QUOTED'].includes(request.status) && (
                      <div className="mt-4 flex justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50"
                          onClick={() => {
                            setCancelReason('');
                            setCancellingRequest(request);
                          }}
                        >
                          Aanvraag annuleren
                        </Button>
                      </div>
                    )}
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {bookings.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen boekingen</h3>
                <p className="text-gray-600">Je hebt nog geen boekingen</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div className="w-full">
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {categoryLabel(booking.provider.category, true)}
                          </Badge>
                          <span className="font-bold text-gray-900 text-lg">{booking.provider.businessName}</span>
                        </div>
                        {booking.quote && (
                          <p className="text-md font-semibold text-gray-700 mb-2">{booking.quote.packageName}</p>
                        )}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-3">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {formatDate(booking.eventDate)}
                          </span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {booking.eventLocation}
                          </span>
                          <span className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {booking.guestCount} gasten
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mb-4">
                          {formatEuro(booking.finalPrice)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(booking.status)}
                        {booking.status !== 'CANCELLED' && getPaymentBadge(booking.paymentStatus)}
                      </div>
                    </div>

                    {/* Included Services from Quote */}
                    {booking.quote && booking.quote.includedServices && booking.quote.includedServices.length > 0 && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Inbegrepen in dit pakket:</p>
                        <ul className="space-y-1">
                          {booking.quote.includedServices.map((service, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {service}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Terms */}
                    {booking.quote && booking.quote.terms && (
                      <div className="mb-4 pb-4 border-b border-gray-200">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Voorwaarden:</p>
                        <p className="text-sm text-gray-600">{booking.quote.terms}</p>
                      </div>
                    )}

                    {booking.status === 'CONFIRMED' && (booking.paymentStatus || 'UNPAID') === 'UNPAID' && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-xl border border-amber-200 flex items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                          <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                          <p className="text-sm text-amber-800 font-medium">Betaling nog openstaand</p>
                        </div>
                        {paymentsEnabled() ? (
                          <button
                            onClick={() => router.push(`/checkout/${booking.id}`)}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold rounded-xl px-4 py-2 text-sm flex-shrink-0 shadow-md transition-all"
                          >
                            Betaling afmaken →
                          </button>
                        ) : (
                          <p className="text-xs text-amber-700 text-right">
                            Regel de betaling voorlopig rechtstreeks met de provider
                          </p>
                        )}
                      </div>
                    )}

                    {booking.status === 'CANCELLED' && (
                      <div className="mt-4 p-3 bg-red-50 rounded-xl text-sm text-red-800">
                        Geannuleerd {booking.cancelledByMe ? 'door jou' : 'door de provider'}
                        {booking.cancellationReason ? `: "${booking.cancellationReason}"` : ''}
                      </div>
                    )}

                    {booking.status === 'COMPLETED' && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        {booking.review ? (
                          <p className="text-sm text-purple-800 flex items-center gap-1">
                            <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                            Je gaf {booking.review.rating}/5. Bedankt voor je review!
                          </p>
                        ) : (
                          <>
                            <p className="text-sm text-purple-800">Hoe was het? Help andere klanten met je review.</p>
                            <Button
                              size="sm"
                              onClick={() => setReviewingBooking(booking)}
                              className="rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white"
                            >
                              <Star className="w-4 h-4 mr-1" />
                              Schrijf een review
                            </Button>
                          </>
                        )}
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200 flex flex-col sm:flex-row gap-2">
                      <Button
                        onClick={() => handleOpenChat(booking.provider.userId)}
                        variant="outline"
                        className="flex-1 rounded-xl"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat met {booking.provider.businessName}
                      </Button>
                      {booking.status === 'CONFIRMED' && (
                        <>
                          <Button
                            variant="outline"
                            className="rounded-xl"
                            onClick={() =>
                              downloadIcs({
                                id: booking.id,
                                title: `${booking.provider.businessName}: ${booking.quote?.packageName ?? 'Boeking'}`,
                                date: booking.eventDate,
                                location: booking.eventLocation,
                                description: 'Geboekt via Eventiphy',
                              })
                            }
                          >
                            <Calendar className="w-4 h-4 mr-2" />
                            In mijn agenda
                          </Button>
                          <Button
                            variant="ghost"
                            className="rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setCancelReason('');
                              setCancellingBooking(booking);
                            }}
                          >
                            Annuleren
                          </Button>
                        </>
                      )}
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Container>

      {/* Rejection Confirmation Dialog - Using Reusable System */}
      <ConfirmationDialog
        open={!!rejectingQuote}
        onOpenChange={(open) => {
          if (!open) {
            setRejectingQuote(null);
            setRejectionReason('');
          }
        }}
        title="Offerte afwijzen?"
        description="Weet je zeker dat je deze offerte wilt afwijzen? Deze actie kan niet ongedaan worden gemaakt."
      >
        {rejectingQuote && (
          <>
            <DialogQuoteInfo
              quote={{
                totalPrice: rejectingQuote.totalPrice,
                packageName: rejectingQuote.packageName,
                includedServices: rejectingQuote.includedServices,
                serviceRequest: rejectingQuote.serviceRequest,
              }}
              status="pending"
            />

            <DialogTextField
              label="Waarom wijs je deze offerte af?"
              value={rejectionReason}
              onChange={setRejectionReason}
              placeholder="Bijv. 'Prijs te hoog', 'Andere provider gekozen', 'Evenement geannuleerd'..."
              helperText="Je feedback helpt providers hun diensten te verbeteren (optioneel voor provider)"
            />

            <DialogActions>
              <DialogButton
                onClick={() => handleRejectQuote(rejectingQuote.id)}
                variant="danger"
                disabled={!!acceptingQuote}
                loading={acceptingQuote === rejectingQuote.id}
              >
                Toch afwijzen
              </DialogButton>
              <DialogButton
                onClick={() => {
                  setRejectingQuote(null);
                  setRejectionReason('');
                }}
                variant="outline"
                disabled={!!acceptingQuote}
              >
                Offerte behouden
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* Cancel Request Dialog */}
      <ConfirmationDialog
        open={!!cancellingRequest}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingRequest(null);
            setCancelReason('');
          }
        }}
        title="Aanvraag annuleren?"
        description="De provider krijgt een bericht dat je de aanvraag intrekt. Openstaande offertes voor deze aanvraag vervallen."
      >
        {cancellingRequest && (
          <>
            <DialogTextField
              label="Reden (optioneel)"
              value={cancelReason}
              onChange={setCancelReason}
              placeholder="Bijv. 'Andere provider gekozen' of 'Event gaat niet door'"
            />
            <DialogActions>
              <DialogButton onClick={handleCancelRequest} variant="danger" loading={isCancelling} disabled={isCancelling}>
                Aanvraag annuleren
              </DialogButton>
              <DialogButton
                onClick={() => {
                  setCancellingRequest(null);
                  setCancelReason('');
                }}
                variant="outline"
                disabled={isCancelling}
              >
                Terug
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* Cancel Booking Dialog */}
      <ConfirmationDialog
        open={!!cancellingBooking}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingBooking(null);
            setCancelReason('');
          }
        }}
        title="Boeking annuleren?"
        description="De provider krijgt meteen een bericht. Spreek afspraken over een eventueel voorschot rechtstreeks met de provider af."
      >
        {cancellingBooking && (
          <>
            <div className="p-4 bg-gray-50 rounded-xl mb-4 text-sm">
              <p className="font-semibold text-gray-900">{cancellingBooking.provider.businessName}</p>
              <p className="text-gray-600">
                {formatDate(cancellingBooking.eventDate)} · {formatEuro(cancellingBooking.finalPrice)}
              </p>
            </div>
            <DialogTextField
              label="Waarom annuleer je?"
              value={cancelReason}
              onChange={setCancelReason}
              placeholder="Bijv. 'Datum van het event is verschoven'"
              required
            />
            <DialogActions>
              <DialogButton onClick={handleCancelBooking} variant="danger" loading={isCancelling} disabled={isCancelling}>
                Boeking annuleren
              </DialogButton>
              <DialogButton
                onClick={() => {
                  setCancellingBooking(null);
                  setCancelReason('');
                }}
                variant="outline"
                disabled={isCancelling}
              >
                Boeking behouden
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      <ReviewDialog
        booking={reviewingBooking ? { id: reviewingBooking.id, providerName: reviewingBooking.provider.businessName } : null}
        onClose={() => setReviewingBooking(null)}
        onSubmitted={async () => {
          setReviewingBooking(null);
          await refreshAll();
          showSuccess('Bedankt! Je review staat nu op het profiel van de provider.');
        }}
      />

      {/* Cancel Event Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        title="Event annuleren?"
        description="Openstaande aanvragen en bevestigde boekingen van dit event worden geannuleerd, en de providers krijgen een bericht."
      >
        {deletingEvent && (
          <>
            <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">
                🗑️
              </div>
              <div>
                <h4 className="font-bold text-gray-900">{deletingEvent.name}</h4>
                <p className="text-sm text-red-600">Dit event wordt geannuleerd</p>
              </div>
            </div>

            <DialogActions>
              <DialogButton
                onClick={() => setDeletingEvent(null)}
                variant="outline"
              >
                Terug
              </DialogButton>
              <DialogButton
                onClick={handleDeleteEvent}
                variant="danger"
                loading={isDeletingEvent}
              >
                Event annuleren
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>
    </main>
  );
}
