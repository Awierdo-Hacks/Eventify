'use client';

import { useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { PageUser, ProviderProfileStatus } from '@/lib/page-data';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  ConfirmationDialog,
  DialogQuoteInfo,
  DialogTextField,
  DialogWarning,
  DialogActions,
  DialogButton,
} from '@/components/ui/confirmation-dialog';
import { eventTypeLabel, formatEuro, paymentStatusLabel, priceRangeLabel } from '@/lib/labels';
import { downloadIcs } from '@/lib/ics';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Euro,
  Calendar,
  MapPin,
  Users,
  Clock,
  Send,
  X,
  Plus,
  UserCircle,
  ShieldCheck,
  AlertTriangle,
  Pencil,
} from 'lucide-react';

// Lazy load – alleen ingeladen wanneer gebruiker het profiel tab opent (699 regels)
const ProfileEditForm = dynamic(() => import('@/components/providers/ProfileEditForm'), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full rounded-3xl" />,
});

// Lazy load – alleen ingeladen wanneer gebruiker het agenda tab opent
const AgendaCalendar = dynamic(() => import('@/components/providers/AgendaCalendar'), {
  ssr: false,
  loading: () => <Skeleton className="h-96 w-full rounded-3xl" />,
});

// Lazy load – kalender-koppelingen instellingen
const CalendarSyncSettings = dynamic(() => import('@/components/providers/CalendarSyncSettings'), {
  ssr: false,
  loading: () => <Skeleton className="h-40 w-full rounded-3xl" />,
});

interface ServiceRequest {
  id: string;
  eventType: string;
  eventDate: string;
  eventLocation: string;
  guestCount: number;
  budgetRange: string | null;
  description: string;
  status: string;
  createdAt: string;
  declineReason?: string | null;
  providerAvailable?: boolean | null;
  customer: {
    id: string;
    name: string;
    email: string;
    phone: string;
  };
  quotes: {
    id: string;
    totalPrice: number;
    accepted?: boolean;
    rejected?: boolean;
    open?: boolean;
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
  expired?: boolean;
  createdAt: string;
  rejectedAt?: string | null;
  rejectionReason?: string | null;
  serviceRequest: {
    id: string;
    status?: string;
    eventType: string;
    eventDate: string;
    customer: {
      id: string;
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
  customer: {
    id: string;
    name: string;
    email: string;
  };
  quote?: { packageName: string } | null;
}

interface ProviderDashboardInitialData {
  requests: ServiceRequest[];
  quotes: Quote[];
  bookings: Booking[];
  profile: ProviderProfileStatus | null;
}

interface ProviderDashboardClientProps {
  initialData: ProviderDashboardInitialData;
  initialUser: PageUser;
}

type RequestFilter = 'new' | 'quoted' | 'closed' | 'all';

const EMPTY_QUOTE_FORM = () => ({
  totalPrice: '',
  message: '',
  terms: '',
  includedServices: ['', '', ''],
  validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
});

function daysUntil(dateString: string): number {
  return Math.ceil((new Date(dateString).getTime() - Date.now()) / (24 * 60 * 60 * 1000));
}

function isOnOrAfterEventDay(dateString: string): boolean {
  return new Date().toISOString().split('T')[0] >= new Date(dateString).toISOString().split('T')[0];
}

export default function ProviderDashboardClient({
  initialData,
  initialUser,
}: ProviderDashboardClientProps) {
  const router = useRouter();
  const user = initialUser;
  const profile = initialData.profile;

  const [activeTab, setActiveTab] = useState('requests');
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const [requests, setRequests] = useState<ServiceRequest[]>(initialData.requests);
  const [quotes, setQuotes] = useState<Quote[]>(initialData.quotes);
  const [bookings, setBookings] = useState<Booking[]>(initialData.bookings);
  const [providerProfile, setProviderProfile] = useState<any>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [requestFilter, setRequestFilter] = useState<RequestFilter>('new');

  // Quote dialog: create for a request, or edit an open quote
  const [creatingQuoteFor, setCreatingQuoteFor] = useState<ServiceRequest | null>(null);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteForm, setQuoteForm] = useState(EMPTY_QUOTE_FORM);
  const [submittingQuote, setSubmittingQuote] = useState(false);

  // Withdraw / remove quote
  const [withdrawingQuote, setWithdrawingQuote] = useState<Quote | null>(null);
  const [withdrawingQuoteId, setWithdrawingQuoteId] = useState<string | null>(null);

  // Decline request / cancel or complete booking
  const [decliningRequest, setDecliningRequest] = useState<ServiceRequest | null>(null);
  const [cancellingBooking, setCancellingBooking] = useState<Booking | null>(null);
  const [reason, setReason] = useState('');
  const [actionBusy, setActionBusy] = useState<string | null>(null);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 5000);
  };

  const showError = (message: string) => {
    setError(message);
    setTimeout(() => setError(null), 6000);
  };

  // Fetch provider profile data
  const fetchProfile = async () => {
    setProfileLoading(true);
    try {
      const res = await fetch('/api/providers/me');
      if (res.ok) {
        const data = await res.json();
        setProviderProfile(data);
      }
    } catch (err) {
      console.error('Profile fetch error:', err);
    } finally {
      setProfileLoading(false);
    }
  };

  // Load profile when switching to profile tab
  useEffect(() => {
    if (activeTab === 'profile' && !providerProfile && !profileLoading) {
      fetchProfile();
    }
  }, [activeTab, providerProfile, profileLoading]);

  const refreshAll = async () => {
    const [requestsRes, quotesRes, bookingsRes] = await Promise.all([
      fetch('/api/requests'),
      fetch('/api/quotes'),
      fetch('/api/bookings'),
    ]);
    const [requestsData, quotesData, bookingsData] = await Promise.all([
      requestsRes.json(),
      quotesRes.json(),
      bookingsRes.json(),
    ]);
    setRequests(requestsData.requests || []);
    setQuotes(quotesData.quotes || []);
    setBookings(bookingsData.bookings || []);
  };

  // Calculate stats
  const isNewRequest = (r: ServiceRequest) => r.status === 'PENDING' && !r.quotes.some((q) => q.open);
  const stats = useMemo(() => {
    const completedRevenue = bookings.filter((b) => b.status === 'COMPLETED').reduce((sum, b) => sum + b.finalPrice, 0);
    const upcomingRevenue = bookings.filter((b) => b.status === 'CONFIRMED').reduce((sum, b) => sum + b.finalPrice, 0);
    return {
      newRequests: requests.filter(isNewRequest).length,
      openQuotes: quotes.filter((q) => q.status === 'PENDING' && !q.expired).length,
      activeBookings: bookings.filter((b) => b.status === 'CONFIRMED').length,
      completedRevenue,
      upcomingRevenue,
    };
  }, [requests, quotes, bookings]);

  const filteredRequests = useMemo(() => {
    const filtered = requests.filter((r) => {
      if (requestFilter === 'new') return isNewRequest(r);
      if (requestFilter === 'quoted') return r.status === 'QUOTED' || (r.status === 'PENDING' && r.quotes.some((q) => q.open));
      if (requestFilter === 'closed') return ['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(r.status);
      return true;
    });
    // Soonest events first for open work, newest first otherwise
    return filtered.sort((a, b) =>
      requestFilter === 'closed' || requestFilter === 'all'
        ? new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        : new Date(a.eventDate).getTime() - new Date(b.eventDate).getTime()
    );
  }, [requests, requestFilter]);

  const closeQuoteDialog = () => {
    setCreatingQuoteFor(null);
    setEditingQuote(null);
    setQuoteForm(EMPTY_QUOTE_FORM());
  };

  // Create a new quote or save changes to an open one
  const handleSubmitQuote = async () => {
    if (!creatingQuoteFor && !editingQuote) return;

    setSubmittingQuote(true);
    setError(null);

    try {
      const includedServices = quoteForm.includedServices.filter((s) => s.trim() !== '');

      if (!quoteForm.totalPrice || !quoteForm.message || includedServices.length === 0) {
        throw new Error('Vul prijs, pakketnaam en minstens één inbegrepen dienst in');
      }

      const response = editingQuote
        ? await fetch(`/api/quotes/${editingQuote.id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              action: 'update',
              totalPrice: parseFloat(quoteForm.totalPrice),
              packageName: quoteForm.message,
              terms: quoteForm.terms || null,
              includedServices,
              validUntil: quoteForm.validUntil,
            }),
          })
        : await fetch('/api/quotes', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              requestId: creatingQuoteFor!.id,
              totalPrice: parseFloat(quoteForm.totalPrice),
              message: quoteForm.message,
              terms: quoteForm.terms || 'Standaard voorwaarden van toepassing.',
              includedServices,
              validUntil: quoteForm.validUntil,
            }),
          });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || 'Kon de offerte niet opslaan');
      }

      const wasEditing = !!editingQuote;
      await refreshAll();
      closeQuoteDialog();
      showSuccess(wasEditing ? 'Offerte aangepast. De klant krijgt een bericht.' : 'Offerte verstuurd! De klant krijgt een bericht.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de offerte niet opslaan');
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleWithdrawQuote = async () => {
    if (!withdrawingQuote) return;

    setWithdrawingQuoteId(withdrawingQuote.id);
    try {
      const response = await fetch(`/api/quotes/${withdrawingQuote.id}`, { method: 'DELETE' });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Kon de offerte niet intrekken');

      await refreshAll();
      setWithdrawingQuote(null);
      showSuccess(data.message || 'Offerte ingetrokken');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de offerte niet intrekken');
    } finally {
      setWithdrawingQuoteId(null);
    }
  };

  const handleDeclineRequest = async () => {
    if (!decliningRequest) return;
    setActionBusy(decliningRequest.id);
    try {
      const res = await fetch(`/api/requests/${decliningRequest.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'decline', reason: reason || undefined }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kon de aanvraag niet afwijzen');
      await refreshAll();
      setDecliningRequest(null);
      setReason('');
      showSuccess('Aanvraag afgewezen. De klant weet dat je niet beschikbaar bent.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de aanvraag niet afwijzen');
    } finally {
      setActionBusy(null);
    }
  };

  const handleCompleteBooking = async (booking: Booking) => {
    setActionBusy(booking.id);
    try {
      const res = await fetch(`/api/bookings/${booking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'complete' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kon de boeking niet voltooien');
      await refreshAll();
      showSuccess('Boeking voltooid. De klant wordt uitgenodigd om een review te schrijven.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de boeking niet voltooien');
    } finally {
      setActionBusy(null);
    }
  };

  const handleCancelBooking = async () => {
    if (!cancellingBooking) return;
    if (reason.trim().length < 3) {
      showError('Geef een korte reden voor de annulering');
      return;
    }
    setActionBusy(cancellingBooking.id);
    try {
      const res = await fetch(`/api/bookings/${cancellingBooking.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cancel', reason: reason.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Kon de boeking niet annuleren');
      await refreshAll();
      setCancellingBooking(null);
      setReason('');
      showSuccess('Boeking geannuleerd. De klant krijgt een bericht.');
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Kon de boeking niet annuleren');
    } finally {
      setActionBusy(null);
    }
  };

  const handleOpenChat = async (customerId: string) => {
    try {
      const res = await fetch('/api/conversations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipientId: customerId }),
      });
      if (!res.ok) throw new Error('Kon gesprek niet openen');
      const data = await res.json();
      router.push(`/messages/${data.conversation.id}`);
    } catch (err) {
      console.error('Error opening chat:', err);
      showError('Kon het gesprek niet openen');
    }
  };

  const openEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setQuoteForm({
      totalPrice: quote.totalPrice.toString(),
      message: quote.packageName,
      terms: quote.packageDescription || '',
      includedServices: quote.includedServices.length > 0 ? quote.includedServices : ['', '', ''],
      validUntil: new Date(quote.validUntil).toISOString().split('T')[0],
    });
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
    return new Date(dateString).toLocaleDateString('nl-BE', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getRequestBadge = (request: ServiceRequest) => {
    const config: Record<string, [string, string]> = {
      PENDING: ['Nieuw', 'bg-amber-100 text-amber-800'],
      QUOTED: ['Offerte verstuurd', 'bg-blue-100 text-blue-800'],
      ACCEPTED: ['Geboekt', 'bg-green-100 text-green-800'],
      REJECTED: ['Afgewezen door jou', 'bg-gray-100 text-gray-700'],
      CANCELLED: ['Geannuleerd door klant', 'bg-red-100 text-red-800'],
    };
    const [label, className] = config[request.status] ?? [request.status, 'bg-gray-100 text-gray-800'];
    return <Badge className={className}>{label}</Badge>;
  };

  const getQuoteBadge = (quote: Quote) => {
    if (quote.status === 'ACCEPTED') return <Badge className="bg-green-100 text-green-800">Geaccepteerd</Badge>;
    if (quote.status === 'REJECTED') return <Badge className="bg-red-100 text-red-800">Afgewezen</Badge>;
    if (quote.expired) return <Badge className="bg-gray-100 text-gray-600">Verlopen</Badge>;
    const days = daysUntil(quote.validUntil);
    if (days <= 3) return <Badge className="bg-amber-100 text-amber-800">Verloopt binnenkort</Badge>;
    return <Badge className="bg-blue-100 text-blue-800">Wacht op klant</Badge>;
  };

  const getBookingBadge = (status: string) => {
    const config: Record<string, [string, string]> = {
      CONFIRMED: ['Bevestigd', 'bg-green-100 text-green-800'],
      COMPLETED: ['Voltooid', 'bg-gray-100 text-gray-800'],
      CANCELLED: ['Geannuleerd', 'bg-red-100 text-red-800'],
      PENDING: ['In afwachting', 'bg-amber-100 text-amber-800'],
    };
    const [label, className] = config[status] ?? [status, 'bg-gray-100 text-gray-800'];
    return <Badge className={className}>{label}</Badge>;
  };

  const requestFilters: { value: RequestFilter; label: string; count: number }[] = [
    { value: 'new', label: 'Nieuw', count: stats.newRequests },
    { value: 'quoted', label: 'Offerte verstuurd', count: requests.filter((r) => r.status === 'QUOTED').length },
    { value: 'closed', label: 'Afgesloten', count: requests.filter((r) => ['ACCEPTED', 'REJECTED', 'CANCELLED'].includes(r.status)).length },
    { value: 'all', label: 'Alles', count: requests.length },
  ];

  return (
    <main className="min-h-screen bg-gradient-to-br bg-gray-50">
      <Container className="py-4 sm:py-6">
        {/* Header */}
        <div className="mb-4">
          <h1 className="text-xl sm:text-2xl font-bold mb-0.5">
            <span className="gradient-text">Provider Dashboard</span>
          </h1>
          <p className="text-sm text-gray-600">Welkom terug, {user?.name}! Beheer je aanvragen, offertes en boekingen.</p>
        </div>

        {/* Verification & profile completeness */}
        {profile && !profile.verified && (
          <Card className="mb-4 p-4 border-2 border-amber-200 bg-amber-50 rounded-2xl flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm">
              <p className="font-semibold text-amber-900">Je profiel wordt geverifieerd</p>
              <p className="text-amber-800">
                Klanten vinden je zodra het Eventiphy-team je profiel heeft gecontroleerd. Een volledig profiel wordt sneller goedgekeurd.
              </p>
            </div>
          </Card>
        )}
        {profile && profile.completeness < 100 && (
          <Card className="mb-4 p-4 border-2 border-gray-100 rounded-2xl">
            <div className="flex items-center justify-between gap-3 mb-2">
              <p className="text-sm font-semibold text-gray-900">Profiel {profile.completeness}% compleet</p>
              <Button variant="ghost" size="sm" className="rounded-xl text-purple-700" onClick={() => setActiveTab('profile')}>
                Profiel aanvullen →
              </Button>
            </div>
            <div className="h-2 rounded-full bg-gray-100 overflow-hidden mb-2">
              <div className="h-full rounded-full bg-gradient-to-r from-purple-500 to-amber-400" style={{ width: `${profile.completeness}%` }} />
            </div>
            <p className="text-xs text-gray-500">Nog toe te voegen: {profile.missing.join(' · ')}</p>
          </Card>
        )}

        {/* Success/Error Messages */}
        {successMessage && (
          <div className="mb-4 p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3">
            <CheckCircle className="w-5 h-5 text-green-600 shrink-0" />
            <span className="text-green-800 font-semibold">{successMessage}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3">
            <X className="w-5 h-5 text-red-600 shrink-0" />
            <span className="text-red-800 font-semibold">{error}</span>
          </div>
        )}

        {/* Stats Grid - only visible on the Aanvragen tab */}
        {activeTab === 'requests' && <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          {[
            {
              icon: FileText,
              label: 'Nieuwe aanvragen',
              value: stats.newRequests,
              borderColor: 'border-t-amber-400',
              iconBg: 'bg-amber-100',
              iconColor: 'text-amber-600',
              onClick: () => { setActiveTab('requests'); setRequestFilter('new'); },
            },
            {
              icon: MessageSquare,
              label: 'Offertes bij klant',
              value: stats.openQuotes,
              borderColor: 'border-t-blue-400',
              iconBg: 'bg-blue-100',
              iconColor: 'text-blue-600',
              onClick: () => setActiveTab('quotes'),
            },
            {
              icon: CheckCircle,
              label: 'Komende boekingen',
              value: stats.activeBookings,
              borderColor: 'border-t-green-400',
              iconBg: 'bg-green-100',
              iconColor: 'text-green-600',
              onClick: () => setActiveTab('bookings'),
            },
            {
              icon: Euro,
              label: 'Omzet via Eventiphy',
              value: formatEuro(stats.completedRevenue),
              hint: stats.upcomingRevenue > 0 ? `+ ${formatEuro(stats.upcomingRevenue)} gepland` : 'Voltooide boekingen',
              borderColor: 'border-t-purple-400',
              iconBg: 'bg-purple-100',
              iconColor: 'text-purple-600',
              onClick: () => setActiveTab('bookings'),
            },
          ].map((stat) => (
            <Card
              key={stat.label}
              className={`p-4 border-t-4 ${stat.borderColor} rounded-2xl hover:shadow-eventiphy-md transition-all cursor-pointer`}
              onClick={stat.onClick}
            >
              <div className={`w-10 h-10 ${stat.iconBg} rounded-xl flex items-center justify-center mb-3`}>
                <stat.icon className={`w-5 h-5 ${stat.iconColor}`} />
              </div>
              <p className="text-xs text-gray-500 mb-0.5">{stat.label}</p>
              <p className="text-xl sm:text-2xl font-bold text-gray-900">{stat.value}</p>
              {'hint' in stat && stat.hint && <p className="text-xs text-gray-500 mt-0.5">{stat.hint}</p>}
            </Card>
          ))}
        </div>}

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white border border-gray-200 p-1 rounded-full w-full max-w-2xl mx-auto flex gap-1 mb-6 overflow-x-auto">
            <TabsTrigger value="requests" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Aanvragen
              {stats.newRequests > 0 && (
                <Badge className="ml-1.5 bg-amber-500 text-white text-[10px] px-1.5 py-0 min-w-0 h-4">{stats.newRequests}</Badge>
              )}
            </TabsTrigger>
            <TabsTrigger value="quotes" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              Offertes
            </TabsTrigger>
            <TabsTrigger value="bookings" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">Boekingen</TabsTrigger>
            <TabsTrigger value="agenda" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <Calendar className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
              Agenda
            </TabsTrigger>
            <TabsTrigger value="profile" className="rounded-full flex-1 text-xs sm:text-sm whitespace-nowrap data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-500 data-[state=active]:to-purple-600 data-[state=active]:text-white">
              <UserCircle className="w-3.5 h-3.5 mr-1 hidden sm:inline" />
              Profiel
            </TabsTrigger>
          </TabsList>

          {/* Requests Tab */}
          <TabsContent value="requests" className="space-y-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
              {requestFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  onClick={() => setRequestFilter(filter.value)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium border-2 whitespace-nowrap transition-colors ${
                    requestFilter === filter.value
                      ? 'border-purple-500 bg-purple-50 text-purple-800'
                      : 'border-gray-200 text-gray-600 hover:border-gray-300 bg-white'
                  }`}
                >
                  {filter.label} <span className="text-gray-400">({filter.count})</span>
                </button>
              ))}
            </div>

            {filteredRequests.length === 0 ? (
              <Card className="p-6 md:p-12 border-2 border-gray-100 rounded-3xl text-center">
                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {requestFilter === 'new' ? 'Geen nieuwe aanvragen' : 'Geen aanvragen in deze lijst'}
                </h3>
                <p className="text-gray-600">
                  {requestFilter === 'new'
                    ? 'Nieuwe aanvragen van klanten verschijnen hier. Een volledig profiel en een up-to-date agenda helpen je gevonden te worden.'
                    : 'Kies een ander filter om je andere aanvragen te zien.'}
                </p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {filteredRequests.map((request) => {
                  const isOpen = ['PENDING', 'QUOTED'].includes(request.status);
                  const hasOpenQuote = request.quotes.some((q) => q.open);
                  return (
                    <Card key={request.id} className="p-4 sm:p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-md transition-shadow flex flex-col">
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-3 gap-2">
                        <div>
                          <h3 className="text-xl font-bold text-gray-900 mb-2">{eventTypeLabel(request.eventType)}</h3>
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
                        {getRequestBadge(request)}
                      </div>

                      {isOpen && request.providerAvailable === false && (
                        <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                          Je agenda staat op bezet voor deze dag. Wijs de aanvraag af of maak de dag vrij in je agenda.
                        </div>
                      )}
                      {isOpen && request.providerAvailable === true && (
                        <p className="mb-3 text-sm text-green-700 flex items-center gap-1">
                          <CheckCircle className="w-4 h-4" /> Je bent vrij op deze dag
                        </p>
                      )}

                      <div className="mb-3 text-sm text-gray-600">
                        <span className="font-medium text-gray-700">Budget:</span> {priceRangeLabel(request.budgetRange)}
                      </div>

                      {request.description && (
                        <div className="mb-4 p-4 bg-gray-50 rounded-xl">
                          <p className="text-sm font-semibold text-gray-700 mb-1">Wat de klant vraagt</p>
                          <p className="text-gray-700 whitespace-pre-line">{request.description}</p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200 mb-4">
                        <p className="text-sm font-semibold text-gray-700 mb-1">Klant</p>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-0.5 sm:gap-2 text-sm text-gray-600">
                          <span>{request.customer.name}</span>
                          <span className="hidden sm:inline">·</span>
                          <span className="break-all">{request.customer.email}</span>
                          {request.customer.phone && (
                            <>
                              <span className="hidden sm:inline">·</span>
                              <span>{request.customer.phone}</span>
                            </>
                          )}
                        </div>
                      </div>

                      {request.status === 'REJECTED' && request.declineReason && (
                        <p className="mb-4 text-sm text-gray-500">Jouw reden: &ldquo;{request.declineReason}&rdquo;</p>
                      )}

                      <div className="mt-auto flex flex-col sm:flex-row gap-2">
                        {isOpen && !hasOpenQuote && (
                          <Button
                            onClick={() => {
                              setQuoteForm(EMPTY_QUOTE_FORM());
                              setCreatingQuoteFor(request);
                            }}
                            className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:from-purple-700 hover:to-purple-600 shadow-sm"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Offerte maken
                          </Button>
                        )}
                        {isOpen && hasOpenQuote && (
                          <div className="flex-1 p-2.5 bg-blue-50 rounded-xl text-center text-sm text-blue-800 font-semibold">
                            ✓ Offerte verstuurd, wacht op de klant
                          </div>
                        )}
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleOpenChat(request.customer.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        {isOpen && (
                          <Button
                            variant="ghost"
                            className="rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              setReason('');
                              setDecliningRequest(request);
                            }}
                          >
                            Niet beschikbaar
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Quotes Tab */}
          <TabsContent value="quotes" className="space-y-6">
            {quotes.length === 0 ? (
              <Card className="p-6 md:p-12 border-2 border-gray-100 rounded-3xl text-center">
                <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen offertes</h3>
                <p className="text-gray-600">Je hebt nog geen offertes verstuurd</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {quotes.map((quote) => {
                  const isOpen = quote.status === 'PENDING' && !quote.expired;
                  const request = requests.find((r) => r.id === quote.serviceRequest.id);
                  const requestOpen = request ? ['PENDING', 'QUOTED'].includes(request.status) : false;
                  return (
                    <Card key={quote.id} className={`p-4 sm:p-6 border-2 rounded-3xl flex flex-col ${
                      quote.status === 'REJECTED' ? 'border-red-200 bg-red-50/30' : quote.status === 'ACCEPTED' ? 'border-green-200 bg-green-50/30' : 'border-gray-100'
                    }`}>
                      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
                        <div>
                          <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatEuro(quote.totalPrice)}</h3>
                          <p className="text-lg font-semibold text-gray-700 mb-1">{quote.packageName}</p>
                          <p className="text-sm text-gray-600">
                            Voor {quote.serviceRequest.customer.name} · {eventTypeLabel(quote.serviceRequest.eventType)} · {formatDate(quote.serviceRequest.eventDate)}
                          </p>
                        </div>
                        {getQuoteBadge(quote)}
                      </div>

                      {quote.status === 'REJECTED' && quote.rejectionReason && (
                        <div className="mb-4 p-4 bg-red-50 border-2 border-red-200 rounded-xl">
                          <p className="text-sm font-semibold text-red-800 mb-1">Reden:</p>
                          <p className="text-sm text-red-700">{quote.rejectionReason}</p>
                          {quote.rejectedAt && <p className="text-xs text-red-600 mt-2">Op {formatDate(quote.rejectedAt)}</p>}
                        </div>
                      )}

                      {quote.includedServices && quote.includedServices.length > 0 && (
                        <div className="mb-4">
                          <p className="text-sm font-semibold text-gray-700 mb-2">Inbegrepen:</p>
                          <ul className="space-y-1">
                            {quote.includedServices.map((service, idx) => (
                              <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                                <CheckCircle className="w-4 h-4 text-green-600 shrink-0" />
                                {service}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div className="pt-4 border-t border-gray-200 text-sm text-gray-600 mb-4">
                        <p className="flex items-center gap-1">
                          <Clock className="w-4 h-4" /> Geldig tot {formatDate(quote.validUntil)}
                        </p>
                        <p>Verstuurd op {formatDate(quote.createdAt)}</p>
                      </div>

                      <div className="mt-auto flex flex-col sm:flex-row gap-2 pt-4 border-t border-gray-200">
                        {isOpen && (
                          <Button variant="outline" className="flex-1 rounded-xl" onClick={() => openEditQuote(quote)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Aanpassen
                          </Button>
                        )}
                        {quote.status === 'REJECTED' && request && requestOpen && (
                          <Button
                            onClick={() => {
                              setCreatingQuoteFor(request);
                              setQuoteForm({
                                totalPrice: quote.totalPrice.toString(),
                                message: quote.packageName,
                                terms: quote.packageDescription || '',
                                includedServices: quote.includedServices.length > 0 ? quote.includedServices : ['', '', ''],
                                validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                              });
                            }}
                            className="flex-1 rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 shadow-sm"
                          >
                            <Send className="w-4 h-4 mr-2" />
                            Nieuwe offerte sturen
                          </Button>
                        )}
                        <Button
                          onClick={() => handleOpenChat(quote.serviceRequest.customer.id)}
                          variant="outline"
                          className="rounded-xl"
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        {(isOpen || quote.status === 'REJECTED' || quote.expired) && quote.status !== 'ACCEPTED' && (
                          <Button
                            onClick={() => setWithdrawingQuote(quote)}
                            variant="ghost"
                            className="rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50"
                          >
                            {isOpen ? 'Intrekken' : 'Verwijderen'}
                          </Button>
                        )}
                      </div>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-6">
            {bookings.length === 0 ? (
              <Card className="p-6 md:p-12 border-2 border-gray-100 rounded-3xl text-center">
                <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Geen boekingen</h3>
                <p className="text-gray-600">Zodra een klant je offerte accepteert, staat de boeking hier.</p>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 gap-4 sm:gap-6">
                {bookings.map((booking) => (
                  <Card
                    key={booking.id}
                    className={`p-4 sm:p-6 border-2 rounded-3xl flex flex-col ${
                      booking.status === 'CONFIRMED'
                        ? 'border-green-100 bg-gradient-to-br from-green-50 to-emerald-50'
                        : booking.status === 'CANCELLED'
                          ? 'border-red-100 bg-red-50/30'
                          : 'border-gray-100'
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-4 gap-2">
                      <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-1">{formatEuro(booking.finalPrice)}</h3>
                        <p className="text-lg font-semibold text-gray-700 mb-2">
                          {booking.customer.name}
                          {booking.quote?.packageName && <span className="text-gray-500 font-normal"> · {booking.quote.packageName}</span>}
                        </p>
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600">
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
                      <div className="flex flex-row sm:flex-col gap-2 sm:items-end">
                        {getBookingBadge(booking.status)}
                        {booking.status !== 'CANCELLED' && (
                          <Badge className={booking.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}>
                            {paymentStatusLabel(booking.paymentStatus || 'UNPAID')}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {booking.status === 'CANCELLED' && (
                      <p className="mb-4 text-sm text-red-800">
                        Geannuleerd {booking.cancelledByMe ? 'door jou' : 'door de klant'}
                        {booking.cancellationReason ? `: "${booking.cancellationReason}"` : ''}
                      </p>
                    )}
                    {booking.status === 'COMPLETED' && (
                      <p className="mb-4 text-sm text-gray-600">
                        {booking.review ? `De klant gaf je ${booking.review.rating}/5 ⭐` : 'Wachten op een review van de klant'}
                      </p>
                    )}

                    <div className="mt-auto pt-4 border-t border-gray-200 flex flex-col gap-3">
                      <p className="text-sm text-gray-600">
                        Contact: {booking.customer.email} · Geboekt op {formatDate(booking.createdAt)}
                      </p>
                      <div className="flex flex-col sm:flex-row gap-2">
                        {booking.status === 'CONFIRMED' && isOnOrAfterEventDay(booking.eventDate) && (
                          <Button
                            onClick={() => handleCompleteBooking(booking)}
                            disabled={actionBusy === booking.id}
                            className="flex-1 rounded-xl bg-gradient-to-r from-green-600 to-emerald-500 text-white"
                          >
                            <CheckCircle className="w-4 h-4 mr-2" />
                            {actionBusy === booking.id ? 'Bezig...' : 'Markeer als voltooid'}
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          className="rounded-xl"
                          onClick={() => handleOpenChat(booking.customer.id)}
                        >
                          <MessageSquare className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        {booking.status === 'CONFIRMED' && (
                          <>
                            <Button
                              variant="outline"
                              className="rounded-xl"
                              onClick={() =>
                                downloadIcs({
                                  id: booking.id,
                                  title: `Eventiphy: ${booking.customer.name}`,
                                  date: booking.eventDate,
                                  location: booking.eventLocation,
                                  description: `${booking.guestCount} gasten · ${formatEuro(booking.finalPrice)}`,
                                })
                              }
                            >
                              <Calendar className="w-4 h-4 mr-1" />
                              In agenda
                            </Button>
                            <Button
                              variant="ghost"
                              className="rounded-xl text-gray-500 hover:text-red-700 hover:bg-red-50"
                              onClick={() => {
                                setReason('');
                                setCancellingBooking(booking);
                              }}
                            >
                              Annuleren
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Agenda Tab */}
          <TabsContent value="agenda" className="space-y-6">
            <AgendaCalendar />

            {/* Kalender-koppelingen */}
            <div className="rounded-3xl border-2 border-gray-100 bg-white p-5 sm:p-6">
              <h3 className="text-base font-semibold text-gray-900 mb-1">Kalender-koppelingen</h3>
              <p className="text-sm text-gray-500 mb-4">
                Koppel je Google Calendar of iCal (iPhone/Outlook) zodat je beschikbaarheid automatisch gesynchroniseerd wordt.
              </p>
              <CalendarSyncSettings />
            </div>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            {user.providerId && (
              <div className="flex justify-end">
                <Link href={`/providers/${user.providerId}`} className="text-sm text-purple-700 hover:underline">
                  Bekijk je publieke profiel →
                </Link>
              </div>
            )}
            {profileLoading ? (
              <div className="space-y-6">
                <Card className="p-6 border-2 border-gray-100 rounded-3xl">
                  <Skeleton className="h-8 w-48 mb-4" />
                  <div className="space-y-4">
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-12 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                </Card>
              </div>
            ) : providerProfile ? (
              <ProfileEditForm
                initialData={providerProfile}
                onSave={() => fetchProfile()}
              />
            ) : (
              <Card className="p-6 md:p-12 border-2 border-gray-100 rounded-3xl text-center">
                <UserCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Profiel laden mislukt</h3>
                <p className="text-gray-600 mb-4">Er is iets misgegaan bij het ophalen van je profiel</p>
                <Button onClick={fetchProfile} className="rounded-xl">
                  Opnieuw proberen
                </Button>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </Container>

      {/* Withdraw / remove quote dialog */}
      <ConfirmationDialog
        open={!!withdrawingQuote}
        onOpenChange={(open) => !open && setWithdrawingQuote(null)}
        title={withdrawingQuote?.status === 'PENDING' && !withdrawingQuote?.expired ? 'Offerte intrekken?' : 'Offerte verwijderen?'}
        description={
          withdrawingQuote?.status === 'PENDING' && !withdrawingQuote?.expired
            ? 'De klant kan deze offerte daarna niet meer accepteren en krijgt een bericht. Je kunt later een nieuwe offerte sturen zolang de aanvraag openstaat.'
            : 'De offerte verdwijnt uit je overzicht.'
        }
      >
        {withdrawingQuote && (
          <>
            <DialogQuoteInfo
              quote={{
                totalPrice: withdrawingQuote.totalPrice,
                packageName: withdrawingQuote.packageName,
                includedServices: withdrawingQuote.includedServices,
                serviceRequest: withdrawingQuote.serviceRequest,
              }}
              status={withdrawingQuote.status === 'REJECTED' ? 'rejected' : 'pending'}
            />
            <DialogActions>
              <DialogButton
                onClick={handleWithdrawQuote}
                variant="danger"
                disabled={!!withdrawingQuoteId}
                loading={withdrawingQuoteId === withdrawingQuote.id}
              >
                {withdrawingQuote.status === 'PENDING' && !withdrawingQuote.expired ? 'Offerte intrekken' : 'Verwijderen'}
              </DialogButton>
              <DialogButton
                onClick={() => setWithdrawingQuote(null)}
                variant="outline"
                disabled={!!withdrawingQuoteId}
              >
                Terug
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* Decline request dialog */}
      <ConfirmationDialog
        open={!!decliningRequest}
        onOpenChange={(open) => {
          if (!open) {
            setDecliningRequest(null);
            setReason('');
          }
        }}
        title="Niet beschikbaar voor deze aanvraag?"
        description="De klant krijgt meteen een bericht, zodat die een andere provider kan zoeken. Dat is beter dan geen antwoord."
      >
        {decliningRequest && (
          <>
            <DialogTextField
              label="Reden (optioneel, de klant ziet dit)"
              value={reason}
              onChange={setReason}
              placeholder="Bijv. 'Die dag ben ik al volgeboekt' of 'Dit aantal gasten is te groot voor ons'"
            />
            <DialogActions>
              <DialogButton
                onClick={handleDeclineRequest}
                variant="danger"
                loading={actionBusy === decliningRequest.id}
                disabled={!!actionBusy}
              >
                Aanvraag afwijzen
              </DialogButton>
              <DialogButton
                onClick={() => {
                  setDecliningRequest(null);
                  setReason('');
                }}
                variant="outline"
                disabled={!!actionBusy}
              >
                Terug
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* Cancel booking dialog */}
      <ConfirmationDialog
        open={!!cancellingBooking}
        onOpenChange={(open) => {
          if (!open) {
            setCancellingBooking(null);
            setReason('');
          }
        }}
        title="Boeking annuleren?"
        description="Annuleer alleen als het echt niet anders kan: de klant moet op korte termijn een vervanger zoeken."
      >
        {cancellingBooking && (
          <>
            <DialogWarning
              type="warning"
              title={`${cancellingBooking.customer.name} · ${formatDate(cancellingBooking.eventDate)}`}
              message="De klant krijgt meteen een bericht met jouw reden. Het onderdeel van hun event wordt weer vrijgegeven."
            />
            <DialogTextField
              label="Reden van annulering"
              value={reason}
              onChange={setReason}
              placeholder="Bijv. 'Ziekte in het team'"
              required
            />
            <DialogActions>
              <DialogButton
                onClick={handleCancelBooking}
                variant="danger"
                loading={actionBusy === cancellingBooking.id}
                disabled={!!actionBusy}
              >
                Boeking annuleren
              </DialogButton>
              <DialogButton
                onClick={() => {
                  setCancellingBooking(null);
                  setReason('');
                }}
                variant="outline"
                disabled={!!actionBusy}
              >
                Boeking behouden
              </DialogButton>
            </DialogActions>
          </>
        )}
      </ConfirmationDialog>

      {/* Create / Edit Quote Dialog */}
      <Dialog open={!!creatingQuoteFor || !!editingQuote} onOpenChange={(open) => !open && closeQuoteDialog()}>
        <DialogContent className="max-w-2xl rounded-3xl shadow-eventiphy-lg bg-white max-h-[90vh] overflow-y-auto">
          <button
            onClick={closeQuoteDialog}
            className="absolute right-4 top-4 rounded-full p-2 hover:bg-gray-100 transition-colors z-10"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <DialogHeader className="bg-white">
            <DialogTitle className="text-2xl font-bold text-gray-900">
              {editingQuote ? 'Offerte aanpassen' : 'Offerte maken'}
            </DialogTitle>
            <DialogDescription className="text-gray-600">
              {editingQuote
                ? `De klant ${editingQuote.serviceRequest.customer.name} krijgt een bericht over de wijziging.`
                : `Maak een offerte voor ${creatingQuoteFor?.customer.name}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6 py-4 bg-white">
            {/* Request Details */}
            {creatingQuoteFor && (
              <div className="p-4 bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl border-2 border-purple-100">
                <h4 className="font-semibold text-gray-900 mb-2">{eventTypeLabel(creatingQuoteFor.eventType)}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-gray-600">
                  <span>📅 {formatDate(creatingQuoteFor.eventDate)}</span>
                  <span>📍 {creatingQuoteFor.eventLocation}</span>
                  <span>👥 {creatingQuoteFor.guestCount} gasten</span>
                  <span>💰 Budget: {priceRangeLabel(creatingQuoteFor.budgetRange)}</span>
                </div>
              </div>
            )}

            {/* Quote Form */}
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Totaalprijs (€, incl. btw) *
                </label>
                <Input
                  type="number"
                  min="1"
                  value={quoteForm.totalPrice}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, totalPrice: e.target.value }))}
                  placeholder="2500"
                  className="rounded-xl"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Pakketnaam *
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
                  Inbegrepen diensten * <span className="text-gray-500 font-normal">(minimaal 1)</span>
                </label>
                <div className="space-y-2">
                  {quoteForm.includedServices.map((service, index) => (
                    <div key={index} className="flex gap-2">
                      <Input
                        type="text"
                        value={service}
                        onChange={(e) => updateServiceField(index, e.target.value)}
                        placeholder={`Dienst ${index + 1}`}
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
                    Dienst toevoegen
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
                  placeholder="Prijs inclusief btw. Voorschot van 30% bij bevestiging..."
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
                  min={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setQuoteForm(prev => ({ ...prev, validUntil: e.target.value }))}
                  className="rounded-xl"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-gray-200 bg-white">
              <Button
                onClick={handleSubmitQuote}
                disabled={submittingQuote}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-600 to-purple-500 text-white font-semibold py-6 shadow-sm"
              >
                {submittingQuote ? 'Bezig...' : editingQuote ? 'Wijzigingen opslaan' : 'Offerte versturen'}
              </Button>
              <Button
                onClick={closeQuoteDialog}
                variant="outline"
                disabled={submittingQuote}
                className="flex-1 border-2 border-gray-300 text-gray-700 font-semibold py-6 rounded-xl hover:bg-gray-50 transition-colors"
              >
                Annuleren
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </main>
  );
}
