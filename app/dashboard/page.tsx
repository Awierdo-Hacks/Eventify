'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Calendar,
  Euro,
  Users,
  AlertCircle,
  MapPin,
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
}

export default function DashboardPage() {
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
  const [acceptingQuote, setAcceptingQuote] = useState<string | null>(null);

  // Check for success message
  useEffect(() => {
    if (searchParams.get('success') === 'true') {
      setSuccessMessage('Je aanvraag is succesvol verstuurd! Je ontvangt binnen 24 uur een offerte.');
      setTimeout(() => setSuccessMessage(null), 5000);
    }
    const tab = searchParams.get('tab');
    if (tab) setActiveTab(tab);
  }, [searchParams]);

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/dashboard');
    }
  }, [status, router]);

  // Fetch all dashboard data
  useEffect(() => {
    if (status !== 'authenticated') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [requestsRes, quotesRes, bookingsRes] = await Promise.all([
          fetch('/api/requests'),
          fetch('/api/quotes'),
          fetch('/api/bookings'),
        ]);

        console.log('API responses:', {
          requests: { ok: requestsRes.ok, status: requestsRes.status },
          quotes: { ok: quotesRes.ok, status: quotesRes.status },
          bookings: { ok: bookingsRes.ok, status: bookingsRes.status },
        });

        if (!requestsRes.ok || !quotesRes.ok || !bookingsRes.ok) {
          const errors = [];
          if (!requestsRes.ok) errors.push(`Requests: ${requestsRes.status}`);
          if (!quotesRes.ok) errors.push(`Quotes: ${quotesRes.status}`);
          if (!bookingsRes.ok) errors.push(`Bookings: ${bookingsRes.status}`);
          throw new Error(`Failed to fetch: ${errors.join(', ')}`);
        }

        const [requestsData, quotesData, bookingsData] = await Promise.all([
          requestsRes.json(),
          quotesRes.json(),
          bookingsRes.json(),
        ]);

        console.log('Fetched data:', {
          requests: requestsData.length || requestsData.requests?.length,
          quotes: quotesData.quotes?.length,
          bookings: bookingsData.bookings?.length,
        });

        setRequests(Array.isArray(requestsData) ? requestsData : requestsData.requests || []);
        setQuotes(quotesData.quotes || []);
        setBookings(bookingsData.bookings || []);
      } catch (err) {
        console.error('Error fetching dashboard data:', err);
        setError('Er is iets misgegaan bij het laden van je dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status]);

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
      alert(err instanceof Error ? err.message : 'Er is iets misgegaan bij het accepteren van de offerte');
    } finally {
      setAcceptingQuote(null);
    }
  };

  const handleRejectQuote = async (quoteId: string) => {
    if (!confirm('Weet je zeker dat je deze offerte wilt afwijzen?')) return;

    try {
      const response = await fetch(`/api/quotes/${quoteId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ action: 'reject' }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan');
      }

      // Refresh quotes
      const quotesRes = await fetch('/api/quotes');
      const quotesData = await quotesRes.json();
      setQuotes(quotesData.quotes || []);
    } catch (err) {
      console.error('Error rejecting quote:', err);
      alert(err instanceof Error ? err.message : 'Er is iets misgegaan bij het afwijzen van de offerte');
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
    {
      label: 'Totaal Uitgegeven',
      value: `€${bookings.reduce((sum, b) => sum + b.finalPrice, 0).toLocaleString()}`,
      icon: Euro,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
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
                <Card className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-md transition-shadow">
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
                  <Card key={request.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-md transition-shadow">
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
            {quotes.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen offertes ontvangen</h3>
                <p className="text-gray-600">Je hebt nog geen offertes ontvangen</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {quotes.map((quote) => (
                  <Card key={quote.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-md transition-shadow">
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
                          onClick={() => handleRejectQuote(quote.id)}
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
                  <Card key={booking.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-3 mb-2">
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {booking.provider.category}
                          </Badge>
                          <span className="font-bold text-gray-900 text-lg">{booking.provider.businessName}</span>
                        </div>
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
                        <p className="text-2xl font-bold text-gray-900">
                          €{booking.finalPrice.toLocaleString()}
                        </p>
                      </div>
                      <div className="flex flex-col gap-2 items-end">
                        {getStatusBadge(booking.status)}
                        {getStatusBadge(booking.paymentStatus)}
                      </div>
                    </div>

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
    </main>
  );
}
