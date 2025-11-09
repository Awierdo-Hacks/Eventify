'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Container, PageHeader } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  DollarSign,
  Calendar,
  MapPin,
  Users,
  TrendingUp,
  Clock,
  Send,
  X,
  Plus,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface ServiceRequest {
  id: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount: number;
  budgetRange: string;
  description: string;
  status: string;
  createdAt: string;
  customer: {
    name: string;
    email: string;
    phone: string;
  };
  quotes: {
    id: string;
    totalPrice: number;
  }[];
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
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  serviceRequest: {
    id: string;
    eventType: string;
    eventDate: string;
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
  customer: {
    name: string;
    email: string;
  };
}

export default function ProviderDashboardPage() {
  const router = useRouter();
  const { user, status } = useSession();
  
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  const [requests, setRequests] = useState<ServiceRequest[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  
  // Quote creation dialog state
  const [creatingQuoteFor, setCreatingQuoteFor] = useState<ServiceRequest | null>(null);
  const [quoteForm, setQuoteForm] = useState({
    totalPrice: '',
    message: '',
    terms: '',
    includedServices: ['', '', ''],
    validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
  });
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Redirect if not provider
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/provider-dashboard');
    } else if (status === 'authenticated' && user?.role !== 'PROVIDER') {
      router.push('/dashboard');
    }
  }, [status, user, router]);

  // Fetch all provider dashboard data
  useEffect(() => {
    if (status !== 'authenticated' || user?.role !== 'PROVIDER') return;

    const fetchDashboardData = async () => {
      setLoading(true);
      setError(null);

      try {
        const [requestsRes, quotesRes, bookingsRes] = await Promise.all([
          fetch('/api/requests'),
          fetch('/api/quotes'),
          fetch('/api/bookings'),
        ]);

        if (!requestsRes.ok || !quotesRes.ok || !bookingsRes.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const [requestsData, quotesData, bookingsData] = await Promise.all([
          requestsRes.json(),
          quotesRes.json(),
          bookingsRes.json(),
        ]);

        setRequests(requestsData.requests || requestsData || []);
        setQuotes(quotesData.quotes || quotesData || []);
        setBookings(bookingsData.bookings || bookingsData || []);
      } catch (err) {
        console.error('Dashboard data fetch error:', err);
        setError(err instanceof Error ? err.message : 'Failed to load dashboard');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [status, user]);

  // Calculate stats
  const stats = {
    pendingRequests: requests.filter((r) => r.status === 'PENDING' && r.quotes.length === 0).length,
    sentQuotes: quotes.length,
    activeBookings: bookings.filter((b) => b.status === 'CONFIRMED').length,
    totalRevenue: bookings.reduce((sum, b) => sum + b.finalPrice, 0),
  };

  // Handle quote creation
  const handleCreateQuote = async () => {
    if (!creatingQuoteFor) return;

    setSubmittingQuote(true);
    setError(null);

    try {
      const includedServices = quoteForm.includedServices.filter(s => s.trim() !== '');
      
      if (!quoteForm.totalPrice || !quoteForm.message || includedServices.length === 0) {
        throw new Error('Vul alle verplichte velden in');
      }

      const response = await fetch('/api/quotes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestId: creatingQuoteFor.id,
          totalPrice: parseFloat(quoteForm.totalPrice),
          message: quoteForm.message,
          terms: quoteForm.terms || 'Standaard voorwaarden van toepassing.',
          includedServices,
          validUntil: new Date(quoteForm.validUntil).toISOString(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create quote');
      }

      // Refresh data
      const [requestsRes, quotesRes] = await Promise.all([
        fetch('/api/requests'),
        fetch('/api/quotes'),
      ]);

      const [requestsData, quotesData] = await Promise.all([
        requestsRes.json(),
        quotesRes.json(),
      ]);

      setRequests(requestsData.requests || requestsData || []);
      setQuotes(quotesData.quotes || quotesData || []);

      // Reset form and close dialog
      setCreatingQuoteFor(null);
      setQuoteForm({
        totalPrice: '',
        message: '',
        terms: '',
        includedServices: ['', '', ''],
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      });

      setSuccessMessage('Offerte succesvol verstuurd!');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Create quote error:', err);
      setError(err instanceof Error ? err.message : 'Failed to create quote');
      setTimeout(() => setError(null), 5000);
    } finally {
      setSubmittingQuote(false);
    }
  };

  const addServiceField = () => {
    setQuoteForm(prev => ({
      ...prev,
      includedServices: [...prev.includedServices, ''],
    }));
  };

  const removeServiceField = (index: number) => {
    setQuoteForm(prev => ({
      ...prev,
      includedServices: prev.includedServices.filter((_, i) => i !== index),
    }));
  };

  const updateServiceField = (index: number, value: string) => {
    setQuoteForm(prev => ({
      ...prev,
      includedServices: prev.includedServices.map((s, i) => i === index ? value : s),
    }));
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      PENDING: 'bg-amber-100 text-amber-800',
      QUOTED: 'bg-blue-100 text-blue-800',
      ACCEPTED: 'bg-green-100 text-green-800',
      REJECTED: 'bg-red-100 text-red-800',
      CONFIRMED: 'bg-green-100 text-green-800',
      COMPLETED: 'bg-gray-100 text-gray-800',
    };

    const labels = {
      PENDING: 'In afwachting',
      QUOTED: 'Offerte verstuurd',
      ACCEPTED: 'Geaccepteerd',
      REJECTED: 'Afgewezen',
      CONFIRMED: 'Bevestigd',
      COMPLETED: 'Voltooid',
    };

    return (
      <Badge className={styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-800'}>
        {labels[status as keyof typeof labels] || status}
      </Badge>
    );
  };

  if (status === 'loading' || (status === 'authenticated' && user?.role !== 'PROVIDER')) {
    return (
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
        <Container className="py-12">
          <Skeleton className="h-12 w-64 mb-8" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50">
      <Container className="py-12">
        <PageHeader
          title="Provider Dashboard"
        />
        <p className="text-gray-600 mb-8">{`Welkom terug, ${user?.name}! Beheer je aanvragen, offertes en boekingen.`}</p>

        {/* Success/Error Messages */}
        {successMessage && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-600" />
            <span className="text-green-800 font-semibold">{successMessage}</span>
          </motion.div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3"
          >
            <X className="w-5 h-5 text-red-600" />
            <span className="text-red-800 font-semibold">{error}</span>
          </motion.div>
        )}

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {[
            {
              icon: FileText,
              label: 'Nieuwe Aanvragen',
              value: stats.pendingRequests,
              color: 'from-amber-500 to-orange-500',
            },
            {
              icon: MessageSquare,
              label: 'Verzonden Offertes',
              value: stats.sentQuotes,
              color: 'from-blue-500 to-cyan-500',
            },
            {
              icon: CheckCircle,
              label: 'Actieve Boekingen',
              value: stats.activeBookings,
              color: 'from-green-500 to-emerald-500',
            },
            {
              icon: DollarSign,
              label: 'Totale Omzet',
              value: `€${stats.totalRevenue.toLocaleString()}`,
              color: 'from-purple-500 to-pink-500',
            },
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-md transition-all">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${stat.color} flex items-center justify-center`}>
                    <stat.icon className="w-7 h-7 text-white" />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border-2 border-gray-200 p-1 rounded-2xl">
            <TabsTrigger value="overview" className="rounded-xl">Overzicht</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-xl">
              Aanvragen
              {stats.pendingRequests > 0 && (
                <Badge className="ml-2 bg-amber-500 text-white">{stats.pendingRequests}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-xl">Mijn Offertes</TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-xl">Boekingen</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <Card className="p-6 border-2 border-gray-100 rounded-3xl">
              <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                <TrendingUp className="w-6 h-6 text-purple-600" />
                Recente Activiteit
              </h3>
              
              <div className="space-y-4">
                {loading ? (
                  <>
                    <Skeleton className="h-20 w-full" />
                    <Skeleton className="h-20 w-full" />
                  </>
                ) : (
                  <>
                    {requests.slice(0, 3).map((request) => (
                      <div key={request.id} className="p-4 bg-gray-50 rounded-xl flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-gray-900">{request.eventType}</p>
                          <p className="text-sm text-gray-600">{request.customer.name} · {formatDate(request.eventDate)}</p>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                    
                    {requests.length === 0 && (
                      <p className="text-center text-gray-500 py-8">Geen recente activiteit</p>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-6">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-48 w-full" />
                <Skeleton className="h-48 w-full" />
              </div>
            ) : requests.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen aanvragen</h3>
                <p className="text-gray-600">Je hebt nog geen service aanvragen ontvangen</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {requests.map((request) => (
                  <Card key={request.id} className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-md transition-shadow">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">{request.eventType}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
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

                    <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm font-semibold text-gray-700 mb-1">Beschrijving</p>
                      <p className="text-gray-700">{request.description}</p>
                    </div>

                    <div className="pt-4 border-t border-gray-200 mb-4">
                      <p className="text-sm font-semibold text-gray-700 mb-2">Klantgegevens</p>
                      <div className="flex items-center gap-4 text-sm text-gray-600">
                        <span>{request.customer.name}</span>
                        <span>·</span>
                        <span>{request.customer.email}</span>
                        <span>·</span>
                        <span>{request.customer.phone}</span>
                      </div>
                    </div>

                    {request.quotes.length === 0 ? (
                      <Button
                        onClick={() => setCreatingQuoteFor(request)}
                        className="w-full gradient-brand rounded-xl"
                      >
                        <Send className="w-4 h-4 mr-2" />
                        Offerte Maken
                      </Button>
                    ) : (
                      <div className="p-3 bg-blue-50 rounded-xl text-center">
                        <p className="text-sm text-blue-800 font-semibold">
                          ✓ Offerte verstuurd ({request.quotes.length})
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
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : quotes.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen offertes</h3>
                <p className="text-gray-600">Je hebt nog geen offertes verstuurd</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {quotes.map((quote) => (
                  <Card key={quote.id} className={`p-6 border-2 rounded-3xl ${
                    quote.status === 'REJECTED' ? 'border-red-200 bg-red-50/30' : 'border-gray-100'
                  }`}>
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          €{quote.totalPrice.toLocaleString()}
                        </h3>
                        <p className="text-lg font-semibold text-gray-700 mb-2">{quote.packageName}</p>
                        <p className="text-sm text-gray-600">
                          Voor: {quote.serviceRequest.customer.name} · {quote.serviceRequest.eventType}
                        </p>
                      </div>
                      {getStatusBadge(quote.status)}
                    </div>

                    {/* Rejection Reason */}
                    {quote.status === 'REJECTED' && quote.rejectionReason && (
                      <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                        <p className="text-sm font-semibold text-red-800 mb-1">Reden van afwijzing:</p>
                        <p className="text-sm text-red-700">{quote.rejectionReason}</p>
                        <p className="text-xs text-red-600 mt-2">
                          Afgewezen op: {quote.rejectedAt ? formatDate(quote.rejectedAt) : 'N/A'}
                        </p>
                      </div>
                    )}

                    {quote.includedServices && quote.includedServices.length > 0 && (
                      <div className="mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-2">Inbegrepen services:</p>
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

                    <div className="pt-4 border-t border-gray-200 text-sm text-gray-600 mb-4">
                      <p>Geldig tot: {formatDate(quote.validUntil)}</p>
                      <p>Verstuurd: {formatDate(quote.createdAt)}</p>
                    </div>

                    {/* Actions for Rejected Quotes */}
                    {quote.status === 'REJECTED' && (
                      <div className="flex gap-3 pt-4 border-t border-gray-200">
                        <Button
                          onClick={() => {
                            // Pre-fill form with previous quote data
                            const request = requests.find(r => r.id === quote.serviceRequest.id);
                            if (request) {
                              setCreatingQuoteFor(request);
                              setQuoteForm({
                                totalPrice: quote.totalPrice.toString(),
                                message: quote.packageName,
                                terms: quote.packageDescription || '',
                                includedServices: quote.includedServices.length > 0 ? quote.includedServices : ['', '', ''],
                                validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              });
                            }
                          }}
                          className="flex-1 gradient-brand rounded-xl"
                        >
                          <Send className="w-4 h-4 mr-2" />
                          Opnieuw Offerte Maken
                        </Button>
                        <Button
                          onClick={async () => {
                            if (!confirm('Weet je zeker dat je deze aanvraag wilt annuleren? Deze actie kan niet ongedaan worden gemaakt.')) return;
                            
                            try {
                              // Delete the rejected quote
                              await fetch(`/api/quotes/${quote.id}`, {
                                method: 'DELETE',
                              });
                              
                              // Refresh quotes
                              const quotesRes = await fetch('/api/quotes');
                              const quotesData = await quotesRes.json();
                              setQuotes(quotesData.quotes || []);
                              
                              setSuccessMessage('Aanvraag geannuleerd');
                              setTimeout(() => setSuccessMessage(null), 5000);
                            } catch (err) {
                              setError('Kon aanvraag niet annuleren');
                              setTimeout(() => setError(null), 5000);
                            }
                          }}
                          variant="outline"
                          className="flex-1 border-2 border-red-300 text-red-700 hover:bg-red-50 rounded-xl"
                        >
                          <X className="w-4 h-4 mr-2" />
                          Aanvraag Annuleren
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
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
            ) : bookings.length === 0 ? (
              <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen boekingen</h3>
                <p className="text-gray-600">Je hebt nog geen bevestigde boekingen</p>
              </Card>
            ) : (
              <div className="grid gap-6">
                {bookings.map((booking) => (
                  <Card key={booking.id} className="p-6 border-2 border-gray-100 rounded-3xl bg-gradient-to-br from-green-50 to-emerald-50">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">
                          €{booking.finalPrice.toLocaleString()}
                        </h3>
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                          {booking.customer.name}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
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
                      </div>
                      <div className="flex flex-col gap-2">
                        {getStatusBadge(booking.status)}
                        <Badge className={booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                          {booking.paymentStatus === 'PAID' ? 'Betaald' : 'Te betalen'}
                        </Badge>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-200">
                      <p className="text-sm text-gray-600">Contact: {booking.customer.email}</p>
                      <p className="text-sm text-gray-600">Geboekt op: {formatDate(booking.createdAt)}</p>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </Container>

      {/* Create Quote Dialog */}
      <Dialog open={!!creatingQuoteFor} onOpenChange={(open) => {
        if (!open) {
          setCreatingQuoteFor(null);
          setQuoteForm({
            totalPrice: '',
            message: '',
            terms: '',
            includedServices: ['', '', ''],
            validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          });
        }
      }}>
        <DialogContent className="max-w-2xl rounded-3xl shadow-eventify-lg bg-white max-h-[90vh] overflow-y-auto">
          <button
            onClick={() => setCreatingQuoteFor(null)}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <DialogHeader className="bg-white">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              Offerte Maken
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              Maak een offerte voor {creatingQuoteFor?.customer.name}
            </DialogDescription>
          </DialogHeader>

          {creatingQuoteFor && (
            <div className="space-y-6 py-4 bg-white">
              {/* Request Details */}
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                <h4 className="font-semibold text-gray-900 mb-2">{creatingQuoteFor.eventType}</h4>
                <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                  <span>📅 {formatDate(creatingQuoteFor.eventDate)}</span>
                  <span>📍 {creatingQuoteFor.eventLocation}</span>
                  <span>👥 {creatingQuoteFor.guestCount} gasten</span>
                  <span>💰 Budget: {creatingQuoteFor.budgetRange}</span>
                </div>
              </div>

              {/* Quote Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Totaalprijs (€) *
                  </label>
                  <Input
                    type="number"
                    value={quoteForm.totalPrice}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                    placeholder="2500"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Pakket Naam *
                  </label>
                  <Input
                    type="text"
                    value={quoteForm.message}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, message: e.target.value }))}
                    placeholder="Premium Catering Pakket"
                    className="rounded-xl"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Inbegrepen Services * <span className="text-gray-500 font-normal">(minimaal 1)</span>
                  </label>
                  <div className="space-y-2">
                    {quoteForm.includedServices.map((service, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="text"
                          value={service}
                          onChange={(e) => updateServiceField(index, e.target.value)}
                          placeholder={`Service ${index + 1}`}
                          className="rounded-xl flex-1"
                        />
                        {quoteForm.includedServices.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => removeServiceField(index)}
                            className="rounded-xl"
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    ))}
                    <Button
                      type="button"
                      variant="outline"
                      onClick={addServiceField}
                      className="w-full rounded-xl"
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Service Toevoegen
                    </Button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Voorwaarden
                  </label>
                  <textarea
                    value={quoteForm.terms}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, terms: e.target.value }))}
                    placeholder="Prijs inclusief BTW. Aanbetaling van 30% vereist..."
                    className="w-full px-4 py-3 border-2 border-gray-200 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Geldig tot
                  </label>
                  <Input
                    type="date"
                    value={quoteForm.validUntil}
                    onChange={(e) => setQuoteForm(prev => ({ ...prev, validUntil: e.target.value }))}
                    className="rounded-xl"
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3 pt-4 border-t border-gray-200 bg-white">
                <Button
                  onClick={handleCreateQuote}
                  disabled={submittingQuote}
                  className="flex-1 gradient-brand text-white font-semibold py-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                >
                  {submittingQuote ? 'Versturen...' : 'Offerte Versturen'}
                </Button>
                <Button
                  onClick={() => setCreatingQuoteFor(null)}
                  variant="outline"
                  disabled={submittingQuote}
                  className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-6 rounded-xl hover:bg-gray-50 transition-colors"
                >
                  Annuleren
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
