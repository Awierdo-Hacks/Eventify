'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  MapPin,
  Star,
  CheckCircle,
  Clock,
  Users,
  Mail,
  Phone,
  Calendar,
  ArrowLeft,
} from 'lucide-react';

interface Review {
  id: string;
  rating: number;
  title: string;
  comment: string;
  eventType: string;
  eventDate: string;
  createdAt: string;
  customer: {
    id: string;
    name: string;
  };
}

interface Provider {
  id: string;
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  description: string | null;
  services: string[];
  images: string[];
  availability: string | null;
  minGuests: number | null;
  maxGuests: number | null;
  responseTime: string | null;
  verified: boolean;
  rating: number;
  reviewCount: number;
  bookingCount: number;
}

export default function ProviderDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const router = useRouter();
  const [selectedImage, setSelectedImage] = useState(0);
  const [provider, setProvider] = useState<Provider | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [providerId, setProviderId] = useState<string | null>(null);

  // Handle async params for Next.js 15+
  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = await Promise.resolve(params);
      setProviderId(resolvedParams.id);
    };
    resolveParams();
  }, [params]);

  useEffect(() => {
    if (!providerId) return;

    const fetchProviderData = async () => {
      setLoading(true);
      setError(null);

      try {
        // Fetch provider details
        const providerResponse = await fetch(`/api/providers/${providerId}`);
        
        if (providerResponse.status === 404) {
          router.push('/browse');
          return;
        }

        if (!providerResponse.ok) {
          throw new Error('Failed to fetch provider');
        }

        const providerData = await providerResponse.json();
        setProvider(providerData);
        setReviews(providerData.reviews || []);
      } catch (err) {
        console.error('Error fetching provider:', err);
        setError('Er is iets misgegaan bij het laden van de provider');
      } finally {
        setLoading(false);
      }
    };

    fetchProviderData();
  }, [providerId, router]);

  const getPriceRangeDisplay = (range: string) => {
    const priceMap: Record<string, string> = {
      LOW: '€',
      MEDIUM: '€€',
      HIGH: '€€€',
      PREMIUM: '€€€€',
    };
    return priceMap[range] || range;
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container className="py-8">
          <Skeleton className="h-10 w-48 mb-6" />
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="overflow-hidden border-2 border-gray-100 rounded-3xl">
                <Skeleton className="h-96 w-full" />
                <div className="p-4 flex gap-2">
                  {[1, 2, 3, 4].map((i) => (
                    <Skeleton key={i} className="h-20 w-20 rounded-xl" />
                  ))}
                </div>
              </Card>
              <Card className="p-6 border-2 border-gray-100 rounded-3xl">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-1/2 mb-6" />
                <Skeleton className="h-20 w-full mb-6" />
                <Skeleton className="h-32 w-full" />
              </Card>
            </div>
            <div className="lg:col-span-1">
              <Card className="p-6 border-2 border-gray-100 rounded-3xl">
                <Skeleton className="h-6 w-32 mb-4" />
                <Skeleton className="h-24 w-full mb-4" />
                <Skeleton className="h-12 w-full mb-3" />
                <Skeleton className="h-12 w-full" />
              </Card>
            </div>
          </div>
        </Container>
      </main>
    );
  }

  if (error || !provider) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Container className="py-8">
          <Card className="p-12 text-center bg-white border-2 border-red-100 rounded-3xl">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Provider niet gevonden</h3>
            <p className="text-gray-600 mb-6">{error || 'Deze provider bestaat niet'}</p>
            <Link href="/browse">
              <Button className="rounded-xl">Terug naar Browse</Button>
            </Link>
          </Card>
        </Container>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Back Button */}
        <Link href="/browse">
          <Button variant="ghost" className="mb-6 rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar overzicht
          </Button>
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image Gallery */}
            <Card className="overflow-hidden border-2 border-gray-100 rounded-3xl">
              <div className="relative h-96 bg-gray-200">
                {provider.images && provider.images.length > 0 ? (
                  <img
                    src={provider.images[selectedImage]}
                    alt={provider.businessName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">
                    <MapPin className="w-24 h-24" />
                  </div>
                )}
                {provider.verified && (
                  <div className="absolute top-4 right-4">
                    <Badge className="bg-green-500 text-white flex items-center gap-2 text-base py-2 px-4">
                      <CheckCircle className="w-5 h-5" />
                      Geverifieerd
                    </Badge>
                  </div>
                )}
              </div>
              {provider.images && provider.images.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {provider.images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImage(idx)}
                      className={`relative h-20 w-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all ${
                        selectedImage === idx ? 'border-purple-500 scale-105' : 'border-gray-200'
                      }`}
                    >
                      <img src={img} alt={`${provider.businessName} ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </Card>

            {/* Info Card */}
            <Card className="p-6 border-2 border-gray-100 rounded-3xl">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-gray-900">{provider.businessName}</h1>
                  <div className="flex items-center gap-4 text-gray-600">
                    <div className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {provider.location}
                    </div>
                    <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                      {provider.category}
                    </Badge>
                  </div>
                </div>
                <Badge variant="secondary" className="bg-amber-100 text-amber-700 text-lg py-2 px-4">
                  {getPriceRangeDisplay(provider.priceRange)}
                </Badge>
              </div>

              <div className="flex items-center gap-2 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(provider.rating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="font-semibold text-gray-900">
                  {provider.rating > 0 ? provider.rating.toFixed(1) : '—'}
                </span>
                <span className="text-gray-500">
                  ({provider.reviewCount} review{provider.reviewCount !== 1 ? 's' : ''})
                </span>
              </div>

              <p className="text-gray-700 mb-6 leading-relaxed">
                {provider.description || 'Geen beschrijving beschikbaar'}
              </p>

              {/* Services */}
              {provider.services && provider.services.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-semibold text-lg mb-3 text-gray-900">Diensten</h3>
                  <div className="flex flex-wrap gap-2">
                    {provider.services.map((service) => (
                      <Badge key={service} variant="outline" className="border-2">
                        {service}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Quick Info */}
              <div className="grid grid-cols-2 gap-4 p-4 gradient-feature rounded-2xl">
                {provider.responseTime && (
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Reactietijd</div>
                      <div className="font-semibold text-gray-900">{provider.responseTime}</div>
                    </div>
                  </div>
                )}
                {provider.minGuests && provider.maxGuests && (
                  <div className="flex items-center gap-2">
                    <Users className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Capaciteit</div>
                      <div className="font-semibold text-gray-900">
                        {provider.minGuests} - {provider.maxGuests} gasten
                      </div>
                    </div>
                  </div>
                )}
                {provider.availability && (
                  <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Beschikbaarheid</div>
                      <div className="font-semibold text-gray-900">{provider.availability}</div>
                    </div>
                  </div>
                )}
                {provider.bookingCount > 0 && (
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-purple-600" />
                    <div>
                      <div className="text-sm text-gray-600">Boekingen</div>
                      <div className="font-semibold text-gray-900">{provider.bookingCount}</div>
                    </div>
                  </div>
                )}
              </div>
            </Card>

            {/* Reviews Section */}
            <Card className="p-6 border-2 border-gray-100 rounded-3xl">
              <h2 className="text-2xl font-bold mb-6 text-gray-900">
                Reviews ({reviews.length})
              </h2>
              {reviews.length > 0 ? (
                <div className="space-y-6">
                  {reviews.map((review) => (
                    <motion.div
                      key={review.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="pb-6 border-b border-gray-200 last:border-0"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-semibold text-gray-900">{review.customer.name}</h4>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <span>{review.eventType}</span>
                            <span>•</span>
                            <span>{new Date(review.eventDate).toLocaleDateString('nl-NL')}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-4 h-4 ${
                                i < review.rating ? 'fill-amber-400 text-amber-400' : 'text-gray-300'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      <h5 className="font-medium text-gray-900 mb-2">{review.title}</h5>
                      <p className="text-gray-600">{review.comment}</p>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">⭐</div>
                  <p className="text-gray-600">Nog geen reviews beschikbaar</p>
                </div>
              )}
            </Card>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 border-2 border-gray-100 rounded-3xl sticky top-24">
              <h3 className="text-xl font-bold mb-4 text-gray-900">Aanvragen</h3>
              
              <div className="space-y-4 mb-6">
                <div className="p-4 gradient-feature rounded-2xl">
                  <div className="text-sm text-gray-600 mb-1">Prijs indicatie</div>
                  <div className="text-2xl font-bold gradient-text">
                    {getPriceRangeDisplay(provider.priceRange)}
                  </div>
                </div>
              </div>

              <Link href={`/request-quote/${provider.id}`}>
                <Button className="w-full gradient-brand hover:opacity-90 rounded-xl h-12 text-base mb-3">
                  Offerte Aanvragen
                </Button>
              </Link>

              <Button variant="outline" className="w-full rounded-xl h-12">
                <Mail className="w-4 h-4 mr-2" />
                Contact Opnemen
              </Button>

              <div className="mt-6 pt-6 border-t border-gray-200">
                <h4 className="font-semibold mb-3 text-gray-900">Waarom boeken via Eventiphy?</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Veilige betalingen</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">24/7 klantenservice</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                    <span className="text-gray-600">Geverifieerde professionals</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </Container>
    </main>
  );
}
