'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Calendar as CalendarComponent } from '@/components/ui/calendar';
import { ArrowLeft, Calendar, Users, Euro, MessageSquare, CheckCircle, AlertCircle } from 'lucide-react';
import { format, isSameDay, isBefore, startOfDay, startOfMonth, endOfMonth, addMonths } from 'date-fns';
import { nl } from 'date-fns/locale';

interface Provider {
  id: string;
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  images: string[];
  verified: boolean;
}

export default function RequestQuotePage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const { user, status } = useSession();
  const [providerId, setProviderId] = useState<string | null>(null);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    event_type: '',
    event_date: '',
    event_location: '',
    guest_count: '',
    budget_range: 'MEDIUM',
    description: '',
  });
  const [unavailableDates, setUnavailableDates] = useState<string[]>([]);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const selectedDate = formData.event_date ? new Date(formData.event_date + 'T00:00:00') : undefined;

  const fetchAvailability = useCallback(async (month: Date, provId: string) => {
    try {
      const from = startOfMonth(month).toISOString().split('T')[0];
      const to = endOfMonth(addMonths(month, 1)).toISOString().split('T')[0];
      const res = await fetch(`/api/providers/${provId}/availability?from=${from}&to=${to}`);
      if (res.ok) {
        const data = await res.json();
        setUnavailableDates(data.unavailableDates || []);
      }
    } catch { /* stil falen */ }
  }, []);

  useEffect(() => {
    if (providerId) fetchAvailability(calendarMonth, providerId);
  }, [calendarMonth, providerId, fetchAvailability]);

  // Handle async params
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setProviderId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  // Fetch provider data
  useEffect(() => {
    if (!providerId) return;

    const fetchProvider = async () => {
      setLoading(true);
      try {
        const response = await fetch(`/api/providers/${providerId}`);
        
        if (response.status === 404) {
          router.push('/browse');
          return;
        }

        if (!response.ok) {
          throw new Error('Failed to fetch provider');
        }

        const data = await response.json();
        setProvider(data);
      } catch (err) {
        console.error('Error fetching provider:', err);
        setError('Provider niet gevonden');
      } finally {
        setLoading(false);
      }
    };

    fetchProvider();
  }, [providerId, router]);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/login?redirect=/request-quote/${providerId}`);
    }
  }, [status, router, providerId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !providerId || !provider) {
      setError('Je moet ingelogd zijn om een offerte aan te vragen');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const requestBody = {
        providerId: providerId,
        category: provider.category,
        eventType: formData.event_type,
        eventDate: formData.event_date,
        eventLocation: formData.event_location,
        guestCount: parseInt(formData.guest_count),
        budgetRange: formData.budget_range,
        description: formData.description,
        customerName: user.name,
        customerEmail: user.email,
        customerPhone: user.email, // Use email as phone for now
        preferredContact: 'email',
      };
      
      console.log('Sending request:', requestBody);
      
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('API Error Response:', data);
        throw new Error(data.error || 'Er is iets misgegaan');
      }

      const result = await response.json();
      console.log('Success response:', result);

      // Success - redirect to dashboard
      router.push('/dashboard?tab=requests&success=true');
    } catch (err) {
      console.error('Error submitting request:', err);
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan bij het versturen van de aanvraag');
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Loading state
  if (loading || status === 'loading') {
    return (
      <main className="min-h-screen gradient-hero">
        <Container className="py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
            <div className="lg:col-span-2">
              <Card className="p-4 sm:p-8 border-2 border-gray-100 rounded-3xl bg-white">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-8" />
                <div className="space-y-6">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Skeleton key={i} className="h-12 w-full" />
                  ))}
                </div>
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card className="p-6 border-2 border-gray-100 rounded-3xl bg-white sticky top-8">
                <Skeleton className="h-48 w-full mb-4" />
                <Skeleton className="h-6 w-3/4 mb-2" />
                <Skeleton className="h-4 w-1/2" />
              </Card>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  // Not authenticated or provider not found
  if (!user || !provider) {
    return null;
  }

  return (
    <main className="min-h-screen gradient-hero">
      <Container className="py-8">
        {/* Back Button */}
        <Link href={`/providers/${provider.id}`}>
          <Button variant="ghost" className="mb-6 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar provider
          </Button>
        </Link>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-4 sm:p-8 border-2 border-gray-100 rounded-3xl bg-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-xl sm:text-3xl font-bold mb-2">
                  <span className="gradient-text">Offerte Aanvragen</span>
                </h1>
                <p className="text-gray-600 mb-8">
                  Vul onderstaand formulier in en ontvang binnen 24 uur een offerte op maat
                </p>

                {error && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Fout bij versturen</p>
                      <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                  </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                  {/* Event Details */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Event Details</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Type evenement *
                        </label>
                        <select
                          name="event_type"
                          value={formData.event_type}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border-2 border-gray-100 h-12 px-4 focus:border-purple-500 focus:outline-none"
                        >
                          <option value="">Selecteer type...</option>
                          <option value="wedding">Bruiloft</option>
                          <option value="birthday">Verjaardag</option>
                          <option value="corporate">Bedrijfsfeest</option>
                          <option value="anniversary">Jubileum</option>
                          <option value="other">Anders</option>
                        </select>
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Calendar className="w-4 h-4 inline mr-1" />
                          Event datum *
                        </label>
                        <div className="border-2 border-gray-100 rounded-xl p-2 flex justify-center">
                          <CalendarComponent
                            mode="single"
                            selected={selectedDate}
                            onSelect={(date) => {
                              if (date) {
                                setFormData({ ...formData, event_date: format(date, 'yyyy-MM-dd') });
                              }
                            }}
                            month={calendarMonth}
                            onMonthChange={setCalendarMonth}
                            disabled={(date) =>
                              isBefore(date, startOfDay(new Date())) ||
                              unavailableDates.some((ud) => isSameDay(new Date(ud + 'T00:00:00'), date))
                            }
                            modifiers={{
                              unavailable: unavailableDates.map((d) => new Date(d + 'T00:00:00')),
                            }}
                            modifiersClassNames={{
                              unavailable: '!bg-red-50 !text-red-400 !line-through',
                            }}
                          />
                        </div>
                        {selectedDate && (
                          <p className="text-sm text-purple-600 font-medium mt-2">
                            Geselecteerd: {format(selectedDate, 'd MMMM yyyy', { locale: nl })}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Users className="w-4 h-4 inline mr-1" />
                          Aantal gasten *
                        </label>
                        <Input
                          type="number"
                          name="guest_count"
                          value={formData.guest_count}
                          onChange={handleChange}
                          placeholder="Bijv. 50"
                          required
                          min={1}
                          className="rounded-xl border-2 border-gray-100 h-12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Locatie *
                        </label>
                        <Input
                          name="event_location"
                          value={formData.event_location}
                          onChange={handleChange}
                          placeholder="Stad of adres"
                          required
                          className="rounded-xl border-2 border-gray-100 h-12"
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          <Euro className="w-4 h-4 inline mr-1" />
                          Budget range *
                        </label>
                        <select
                          name="budget_range"
                          value={formData.budget_range}
                          onChange={handleChange}
                          required
                          className="w-full rounded-xl border-2 border-gray-100 h-12 px-4 focus:border-purple-500 focus:outline-none"
                        >
                          <option value="LOW">€ - Budget vriendelijk</option>
                          <option value="MEDIUM">€€ - Gemiddeld</option>
                          <option value="HIGH">€€€ - Premium</option>
                          <option value="PREMIUM">€€€€ - Luxe</option>
                        </select>
                      </div>
                    </div>
                  </div>

                  {/* Additional Message */}
                  <div className="pt-6 border-t border-gray-200">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      Extra informatie of wensen
                    </label>
                    <textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Vertel iets meer over je evenement of specifieke wensen..."
                      className="w-full rounded-xl border-2 border-gray-100 p-4 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="w-full sm:flex-1 rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-12 shadow-sm"
                    >
                      {isSubmitting ? 'Versturen...' : 'Offerte Aanvragen'}
                    </Button>
                    <Link href={`/providers/${provider.id}`} className="w-full sm:flex-1">
                      <Button type="button" variant="outline" className="w-full rounded-xl h-12">
                        Annuleren
                      </Button>
                    </Link>
                  </div>
                </form>
              </motion.div>
            </Card>
          </div>

          {/* Sidebar - Provider Info */}
          <div className="lg:col-span-1">
            <Card className="p-4 sm:p-6 border-2 border-gray-100 rounded-3xl bg-white md:sticky md:top-24">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Je vraagt offerte aan bij:</h3>
              
              <div className="mb-4">
                {provider.images && provider.images.length > 0 ? (
                  <div className="relative w-full h-32 rounded-2xl mb-3 overflow-hidden">
                    <Image
                      src={provider.images[0]}
                      alt={provider.businessName}
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 400px"
                      priority
                    />
                  </div>
                ) : (
                  <div className="w-full h-32 bg-gray-200 rounded-2xl mb-3 flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-gray-400" />
                  </div>
                )}
                <h4 className="font-semibold text-gray-900 mb-1">{provider.businessName}</h4>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {provider.category}
                  </Badge>
                  {provider.verified && (
                    <Badge className="bg-green-500 text-white flex items-center gap-1">
                      <CheckCircle className="w-3 h-3" />
                      Verified
                    </Badge>
                  )}
                </div>
              </div>

              <div className="space-y-3 text-sm pt-4 border-t border-gray-200">
                <div className="flex justify-between">
                  <span className="text-gray-600">Locatie</span>
                  <span className="font-semibold text-gray-900">{provider.location}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prijs indicatie</span>
                  <span className="font-semibold text-gray-900">
                    {provider.priceRange === 'LOW' && '€'}
                    {provider.priceRange === 'MEDIUM' && '€€'}
                    {provider.priceRange === 'HIGH' && '€€€'}
                    {provider.priceRange === 'PREMIUM' && '€€€€'}
                  </span>
                </div>
              </div>

              <div className="mt-6 p-4 gradient-feature rounded-2xl">
                <p className="text-sm text-gray-600">
                  <CheckCircle className="w-4 h-4 inline text-green-500 mr-1" />
                  Offerte is gratis en vrijblijvend
                </p>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
