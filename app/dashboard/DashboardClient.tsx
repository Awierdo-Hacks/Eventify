'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
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
import { eventTypeIcons, calculateEventProgress } from '@/lib/eventHelpers';
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
  createdAt: string;
  eventSlotId?: string | null; // Added for filtering linked quotes
  provider: {
    id: string;
    businessName: string;
    category: string;
    userId: string;
  };
  serviceRequest: {
    id: string;
    eventType: string;
    eventDate: string;
    eventLocation: string;
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
}

export default function DashboardClient({
  initialData,
  initialUser,
  initialTab = 'events',
  initialSuccess,
}: DashboardClientProps) {
  const router = useRouter();
  const user = initialUser;
  const [activeTab, setActiveTab] = useState(initialTab);
  const [loading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(
    initialSuccess === 'true'
      ? 'Je aanvraag is succesvol verstuurd! Je ontvangt binnen 24 uur een offerte.'
      : null
  );
  
  const [requests, setRequests] = useState<ServiceRequest[]>(initialData.requests);
  const [quotes, setQuotes] = useState<Quote[]>(initialData.quotes);
  const [bookings, setBookings] = useState<Booking[]>(initialData.bookings);
  const [events, setEvents] = useState<Event[]>(initialData.events);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);
  const [rejectingQuote, setRejectingQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [unreadCount, setUnreadCount] = useState(initialData.unreadCount);
  const [deletingEvent, setDeletingEvent] = useState<Event | null>(null);
  const [isDeletingEvent, setIsDeletingEvent] = useState(false);

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

      // Refresh data
      const [quotesRes, bookingsRes] = await Promise.all([
        fetch('/api/quotes'),
        fetch('/api/bookings'),
      ]);

      const [quotesData, bookingsData] = await Promise.all([
        quotesRes.json(),
        bookingsRes.json(),
      ]);

      setQuotes(quotesData.quotes || []);
      setBookings(bookingsData.bookings || []);
      setSuccessMessage('Offerte geaccepteerd! Je boeking is bevestigd.');
      setTimeout(() => setSuccessMessage(null), 5000);
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

      // Refresh quotes
      const quotesRes = await fetch('/api/quotes');
      const quotesData = await quotesRes.json();
      setQuotes(quotesData.quotes || []);
      
      // Toon success message
      setSuccessMessage('Offerte afgewezen');
      setTimeout(() => setSuccessMessage(null), 5000);
      
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
      if (!res.ok) throw new Error('Kon event niet verwijderen');
      
      // Refresh events list
      const eventsRes = await fetch('/api/events');
      const eventsData = await eventsRes.json();
      setEvents(eventsData.events || []);
      setSelectedEvent(null);
      setDeletingEvent(null);
      setSuccessMessage('Event is succesvol verwijderd');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      console.error('Error deleting event:', err);
      setError('Er is iets misgegaan bij het verwijderen van het event');
      setTimeout(() => setError(null), 5000);
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
      const conversation = await res.json();
      router.push(`/messages/${conversation.id}`);
    } catch (err) {
      console.error('Error opening chat:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { label: string; className: string }> = {
      PENDING: { label: 'In behandeling', className: 'bg-blue-100 text-blue-800' },
      QUOTED: { label: 'Offertes ontvangen', className: 'bg-purple-100 text-purple-800' },
      ACCEPTED: { label: 'Geaccepteerd', className: 'bg-green-100 text-green-800' },
      REJECTED: { label: 'Afgewezen', className: 'bg-red-100 text-red-800' },
      CONFIRMED: { label: 'Bevestigd', className: 'bg-green-100 text-green-800' },
      COMPLETED: { label: 'Voltooid', className: 'bg-gray-100 text-gray-800' },
      CANCELLED: { label: 'Geannuleerd', className: 'bg-red-100 text-red-800' },
      PAID: { label: 'Betaald', className: 'bg-green-100 text-green-800' },
      UNPAID: { label: 'Nog te betalen', className: 'bg-amber-100 text-amber-800' },
    };
    const config = statusConfig[status] || statusConfig.PENDING;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
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
      label: 'Actieve Aanvragen',
      value: requests.filter((r) => r.status === 'PENDING').length,
      icon: FileText,
      iconColor: 'text-blue-600',
      iconBg: 'bg-blue-100',
      borderColor: 'border-blue-400',
      onClick: () => setActiveTab('requests'),
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
          <TabsList className="bg-white border border-gray-200 p-1 rounded-full w-full max-w-lg mx-auto flex gap-1 mb-6">
            <TabsTrigger value="events" className="rounded-full flex-1 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <PartyPopper className="w-4 h-4 mr-1" />
              Mijn Events
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-full flex-1 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">Aanvragen</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full flex-1 text-sm data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">Boekingen</TabsTrigger>
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
                quotes={quotes.filter((q) => q.status === 'PENDING').map((q) => ({
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
                    if (!response.ok) throw new Error('Failed to link quote');
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
                    setSuccessMessage('Offerte gekoppeld aan event slot');
                    setTimeout(() => setSuccessMessage(null), 3000);
                  } catch (err) {
                    console.error('Error linking quote:', err);
                    setError('Kon offerte niet koppelen');
                    setTimeout(() => setError(null), 3000);
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
                {quotes.filter((q) => q.status === 'PENDING' && !q.eventSlotId).length > 0 && (
                  <div className="mt-8">
                    <h3 className="text-xl font-bold text-gray-900 mb-4">Ongekoppelde Offertes</h3>
                    <UnlinkedQuotes
                      quotes={quotes.filter((q) => q.status === 'PENDING' && !q.eventSlotId)}
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
                          if (!response.ok) throw new Error('Failed to link quote');
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
                          setSuccessMessage('Offerte gekoppeld aan event slot');
                          setTimeout(() => setSuccessMessage(null), 3000);
                        } catch (err) {
                          console.error('Error linking quote:', err);
                          setError('Kon offerte niet koppelen');
                          setTimeout(() => setError(null), 3000);
                        }
                      }}
                    />
                  </div>
                )}
              </>
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
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{request.eventType}</h3>
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
                              {request.provider.category}
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

                    {request.quotes.length > 0 && (
                      <div className="mt-4 p-3 bg-purple-50 rounded-xl">
                        <p className="text-sm text-purple-800">
                          <MessageSquare className="w-4 h-4 inline mr-1" />
                          {request.quotes.length} offerte{request.quotes.length > 1 ? 's' : ''} ontvangen
                        </p>
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
                            {booking.provider.category}
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
                          €{booking.finalPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(booking.status)}
                        {getStatusBadge(booking.paymentStatus || 'UNPAID')}
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
                      <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-800">
                          Betaling nog openstaand - Neem contact op met de provider
                        </p>
                      </div>
                    )}

                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <Button
                        onClick={() => handleOpenChat(booking.provider.userId)}
                        variant="outline"
                        className="w-full rounded-xl"
                      >
                        <MessageSquare className="w-4 h-4 mr-2" />
                        Chat met {booking.provider.businessName}
                      </Button>
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

      {/* Delete Event Confirmation Dialog */}
      <ConfirmationDialog
        open={!!deletingEvent}
        onOpenChange={(open) => !open && setDeletingEvent(null)}
        title="Event verwijderen?"
        description="Weet je zeker dat je dit event wilt verwijderen? Alle gekoppelde offertes worden losgekoppeld."
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
                Annuleren
              </DialogButton>
              <DialogButton
                onClick={handleDeleteEvent}
                variant="danger"
                loading={isDeletingEvent}
              >
                Verwijder Evenement
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>
    </main>
  );
}
