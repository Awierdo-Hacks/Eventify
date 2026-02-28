'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
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
import { EventDetailView } from '@/components/events/EventDetailView';
import { UnlinkedQuotes } from '@/components/events/UnlinkedQuotes';
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
  budgetRange: string;
  status: string;
  createdAt: string;
  provider?: {
    id: string;
    businessName: string;
    category: string;
    location: string;
  };
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
  paymentStatus: string;
  createdAt: string;
  provider: {
    id: string;
    businessName: string;
    category: string;
  };
  quote?: {
    id: string;
    packageName: string;
    includedServices: string[];
    terms: string | null;
  };
}

interface EventSlotQuote {
  id: string;
  totalPrice: number;
  accepted: boolean;
  providerName: string;
  message?: string;
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
  eventDate: string;
  location: string;
  guestCount: number;
  status: string;
  slots: EventSlot[];
  createdAt: string;
  updatedAt?: string;
  budgetMin?: number | null;
  budgetMax?: number | null;
  description?: string | null;
}

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, status } = useSession();
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null);
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);
  const [rejectingQuote, setRejectingQuote] = useState<Quote | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // Check for success message
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Je aanvraag is succesvol verstuurd! Je ontvangt binnen 24 uur een offerte.');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Redirect based on user role
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/dashboard');
    } else if (status === 'authenticated') {
      // Redirect providers and admins to their respective dashboards
      if (user?.role === 'PROVIDER') {
        router.push('/provider-dashboard');
      } else if (user?.role === 'ADMIN') {
        router.push('/admin');
      }
    }
  }, [status, user, router]);

  // Fetch all dashboard data (only for customers)
  useEffect(() => {
    if (status !== 'authenticated') return;
    // Don't fetch if user is not a customer (will be redirected)
    if (user?.role && user.role !== 'CUSTOMER') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [requestsRes, quotesRes, bookingsRes, eventsRes] = await Promise.all([
          fetch('/api/requests'),
          fetch('/api/quotes'),
          fetch('/api/bookings'),
          fetch('/api/events'),
        ]);

        console.log('API responses:', {
          requests: { ok: requestsRes.ok, status: requestsRes.status },
          quotes: { ok: quotesRes.ok, status: quotesRes.status },
          bookings: { ok: bookingsRes.ok, status: bookingsRes.status },
          events: { ok: eventsRes.ok, status: eventsRes.status },
        });

        if (!requestsRes.ok || !quotesRes.ok || !bookingsRes.ok) {
          const errors = [];
          if (!requestsRes.ok) errors.push(`Requests: ${requestsRes.status}`);
          if (!quotesRes.ok) errors.push(`Quotes: ${quotesRes.status}`);
          if (!bookingsRes.ok) errors.push(`Bookings: ${bookingsRes.status}`);
          throw new Error(`Failed to fetch: ${errors.join(', ')}`);
        }

        const [requestsData, quotesData, bookingsData, eventsData] = await Promise.all([
          requestsRes.json(),
          quotesRes.json(),
          bookingsRes.json(),
          eventsRes.ok ? eventsRes.json() : { events: [] },
        ]);

        console.log('Fetched data:', {
          requests: requestsData.length || requestsData.requests?.length,
          quotes: quotesData.quotes?.length,
          bookings: bookingsData.bookings?.length,
          events: eventsData.events?.length,
        });

        setRequests(Array.isArray(requestsData) ? requestsData : requestsData.requests || []);
        setQuotes(quotesData.quotes || []);
        setBookings(bookingsData.bookings || []);
        setEvents(eventsData.events || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Er is iets misgegaan bij het laden van je dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status, user]);

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
      color: 'text-pink-600',
      bgColor: 'bg-pink-100',
    },
    {
      label: 'Actieve Aanvragen',
      value: requests.filter((r) => r.status === 'PENDING').length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Ontvangen Offertes',
      value: quotes.filter((q) => q.status === 'PENDING').length,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Bevestigde Boekingen',
      value: bookings.filter((b) => b.status === 'CONFIRMED').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
  ];

  // Loading state
  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container className="py-8">
          <Skeleton className="h-12 w-64 mb-2" />
          <Skeleton className="h-6 w-96 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Card key={i} className="p-6 border-2 border-gray-100 rounded-3xl">
                <Skeleton className="h-8 w-8 mb-4" />
                <Skeleton className="h-8 w-24 mb-2" />
                <Skeleton className="h-4 w-32" />
              </Card>
            ))}
          </div>
        </Container>
      </main>
    );
  }

  // Not authenticated
  if (!user) {
    return null;
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Mijn Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600">Welkom terug, {user.name}!</p>
        </div>

        {/* Success Message */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-green-800">Gelukt!</p>
              <p className="text-sm text-green-600 mt-1">{successMessage}</p>
            </div>
          </motion.div>
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-shadow">
                  <div className={`w-12 h-12 ${stat.bgColor} rounded-2xl flex items-center justify-center mb-4`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <p className="text-3xl font-bold text-gray-900 mb-1">{stat.value}</p>
                  <p className="text-sm text-gray-600">{stat.label}</p>
                </Card>
              </motion.div>
            );
          })}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-2 border-gray-100 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl">Overzicht</TabsTrigger>
            <TabsTrigger value="events" className="rounded-xl">
              <PartyPopper className="w-4 h-4 mr-1" />
              Mijn Events
            </TabsTrigger>
            <TabsTrigger value="requests" className="rounded-xl">Aanvragen</TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-xl">Offertes</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-xl">Boekingen</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-8 border-2 border-gray-100 rounded-3xl">
              <h2 className="text-2xl font-bold mb-6">Recente Activiteit</h2>
              
              {requests.length === 0 && quotes.length === 0 && bookings.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">Nog geen activiteit</h3>
                  <p className="text-gray-600 mb-6">Begin met het aanvragen van een offerte bij een provider</p>
                  <Button
                    onClick={() => router.push('/browse')}
                    className="gradient-brand rounded-xl"
                  >
                    Browse Providers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Recent Requests */}
                  {requests.slice(0, 3).map((request) => (
                    <div key={request.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                          <FileText className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{request.eventType}</p>
                          <p className="text-sm text-gray-600">{formatDate(request.eventDate)} • {request.eventLocation}</p>
                        </div>
                      </div>
                      {getStatusBadge(request.status)}
                    </div>
                  ))}

                  {/* Recent Quotes */}
                  {quotes.slice(0, 2).map((quote) => (
                    <div key={quote.id} className="flex items-center justify-between p-4 bg-purple-50 rounded-xl">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                          <MessageSquare className="w-5 h-5 text-purple-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{quote.provider.businessName}</p>
                          <p className="text-sm text-gray-600">€{quote.totalPrice.toLocaleString()} • {quote.packageName}</p>
                        </div>
                      </div>
                      <Badge className={quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {quote.status === 'ACCEPTED' ? 'Geaccepteerd' : 'Nog te beoordelen'}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </TabsContent>

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
              />
            ) : (
              <>
                {/* Events Header */}
                <div className="flex justify-between items-center">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">Mijn Events</h2>
                    <p className="text-gray-600">Beheer al je events op één plek</p>
                  </div>
                  <Button
                    onClick={() => router.push('/events/new')}
                    className="gradient-brand rounded-xl"
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
                      className="gradient-brand rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Eerste Event Aanmaken
                    </Button>
                  </Card>
                ) : (
                  <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {events.map((event, index) => (
                      <motion.div
                        key={event.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
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
                      </motion.div>
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
                  className="gradient-brand rounded-xl"
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
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                        <div className="flex items-center gap-3">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {request.provider.category}
                          </Badge>
                          <span className="font-semibold text-gray-900">{request.provider.businessName}</span>
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

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            {quotes.filter((q) => q.status !== 'ACCEPTED').length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen openstaande offertes</h3>
                <p className="text-gray-600">Je hebt momenteel geen offertes om te beoordelen</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {quotes.filter((q) => q.status !== 'ACCEPTED').map((quote) => (
                  <Card key={quote.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          €{quote.totalPrice.toLocaleString()}
                        </h3>
                        <p className="text-lg font-semibold text-gray-700 mb-2">{quote.packageName}</p>
                        <p className="text-gray-600 mb-3">{quote.packageDescription}</p>
                        <div className="flex items-center gap-3 text-sm">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {quote.provider.category}
                          </Badge>
                          <span className="font-semibold text-gray-900">{quote.provider.businessName}</span>
                        </div>
                      </div>
                      <Badge className={quote.status === 'ACCEPTED' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                        {quote.status === 'ACCEPTED' ? 'Geaccepteerd' : 'In afwachting'}
                      </Badge>
                    </div>

                    {/* Included Services */}
                    {quote.includedServices && quote.includedServices.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Inbegrepen:</p>
                        <ul className="space-y-1">
                          {quote.includedServices.map((service, idx) => (
                            <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                              <CheckCircle className="w-4 h-4 text-green-600" />
                              {service}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Event Details */}
                    <div className="pt-4 border-t border-gray-200 mb-4">
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {formatDate(quote.serviceRequest.eventDate)}
                        </span>
                        <span className="flex items-center gap-1">
                          <MapPin className="w-4 h-4" />
                          {quote.serviceRequest.eventLocation}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    {quote.status !== 'ACCEPTED' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => handleAcceptQuote(quote.id)}
                          disabled={acceptingQuote === quote.id}
                          className="flex-1 gradient-brand rounded-xl"
                        >
                          {acceptingQuote === quote.id ? 'Bezig...' : 'Accepteren'}
                        </Button>
                        <Button
                          onClick={() => setRejectingQuote(quote)}
                          variant="outline"
                          className="flex-1 rounded-xl"
                        >
                          Afwijzen
                        </Button>
                      </div>
                    )}

                    {quote.status === 'ACCEPTED' && (
                      <div className="pt-4 border-t border-gray-200">
                        <div className="flex items-center gap-2 text-green-600">
                          <CheckCircle className="w-5 h-5" />
                          <span className="font-semibold">Offerte geaccepteerd - Boeking bevestigd!</span>
                        </div>
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
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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
                        {getStatusBadge(booking.paymentStatus)}
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

                    {booking.status === 'CONFIRMED' && booking.paymentStatus === 'UNPAID' && (
                      <div className="mt-4 p-3 bg-amber-50 rounded-xl flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-amber-600" />
                        <p className="text-sm text-amber-800">
                          Betaling nog openstaand - Neem contact op met de provider
                        </p>
                      </div>
                    )}
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
    </main>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Container className="py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32 w-full" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </Container>
      </main>
    }>
      <DashboardContent />
    </Suspense>
  );
}
