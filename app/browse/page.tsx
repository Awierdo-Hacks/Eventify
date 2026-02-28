'use client';

import { useState, useEffect, Suspense } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { categories, locations } from '@/lib/mockData';
import { MapPin, Star, CheckCircle, Search, Loader2 } from 'lucide-react';

interface Provider {
  id: string;
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  description: string | null;
  images: string[];
  verified: boolean;
  rating: number;
  reviewCount: number;
}

function BrowseContent() {
  const searchParams = useSearchParams();
  
  // Initialize state directly from URL parameters to avoid race conditions
  const [selectedCategory, setSelectedCategory] = useState<string>(() => 
    searchParams.get('category') || 'all'
  );
  const [selectedLocation, setSelectedLocation] = useState<string>(() => 
    searchParams.get('location') || 'all'
  );
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState(() => 
    searchParams.get('q') || ''
  );
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Update state when URL parameters change (for navigation within the page)
  useEffect(() => {
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const query = searchParams.get('q');
    
    // Only update if URL params differ from current state
    if (category && category !== selectedCategory) setSelectedCategory(category);
    if (location && location !== selectedLocation) setSelectedLocation(location);
    if (query !== null && query !== searchQuery) setSearchQuery(query);
  }, [searchParams, selectedCategory, selectedLocation, searchQuery]);

  // Fetch providers from API
  useEffect(() => {
    const fetchProviders = async () => {
      setLoading(true);
      setError(null);

      try {
        const params = new URLSearchParams();
        if (selectedCategory !== 'all') params.append('category', selectedCategory);
        if (selectedLocation !== 'all') params.append('location', selectedLocation);
        if (priceRange !== 'all') params.append('priceRange', priceRange);
        if (searchQuery) params.append('search', searchQuery);

        const response = await fetch(`/api/providers?${params.toString()}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch providers');
        }

        const data = await response.json();
        setProviders(data.providers);
      } catch (err) {
        console.error('Error fetching providers:', err);
        setError('Er is iets misgegaan bij het laden van providers');
      } finally {
        setLoading(false);
      }
    };

    fetchProviders();
  }, [selectedCategory, selectedLocation, priceRange, searchQuery]);
  
  // Map price range to display format
  const getPriceRangeDisplay = (range: string) => {
    const priceMap: Record<string, string> = {
      LOW: '€',
      MEDIUM: '€€',
      HIGH: '€€€',
      PREMIUM: '€€€€',
    };
    return priceMap[range] || range;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Ontdek</span> Dienstverleners
          </h1>
          <p className="text-xl text-gray-600">
            Vind de perfecte professionals voor jouw evenement
          </p>
        </div>

        {/* Filters */}
        <Card className="p-6 mb-8 bg-white border-2 border-gray-100 rounded-3xl shadow-eventiphy-lg">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <Input
                placeholder="Zoek op naam..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl border-2 border-gray-100"
              />
            </div>

            {/* Category Filter */}
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="rounded-xl border-2 border-gray-100 h-12 px-4 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">Alle categorieën</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>

            {/* Location Filter */}
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className="rounded-xl border-2 border-gray-100 h-12 px-4 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">Alle locaties</option>
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>

            {/* Price Range Filter */}
            <select
              value={priceRange}
              onChange={(e) => setPriceRange(e.target.value)}
              className="rounded-xl border-2 border-gray-100 h-12 px-4 focus:border-purple-500 focus:outline-none"
            >
              <option value="all">Alle prijzen</option>
              <option value="LOW">€ - Budget</option>
              <option value="MEDIUM">€€ - Gemiddeld</option>
              <option value="HIGH">€€€ - Premium</option>
              <option value="PREMIUM">€€€€ - Luxe</option>
            </select>
          </div>

          {/* Active Filters Display */}
          <div className="flex gap-2 mt-4 flex-wrap">
            {selectedCategory !== 'all' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {categories.find((c) => c.id === selectedCategory)?.name}
                <button
                  onClick={() => setSelectedCategory('all')}
                  className="ml-2 hover:text-purple-900"
                >
                  ×
                </button>
              </Badge>
            )}
            {selectedLocation !== 'all' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {selectedLocation}
                <button
                  onClick={() => setSelectedLocation('all')}
                  className="ml-2 hover:text-purple-900"
                >
                  ×
                </button>
              </Badge>
            )}
            {priceRange !== 'all' && (
              <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                {priceRange}
                <button onClick={() => setPriceRange('all')} className="ml-2 hover:text-purple-900">
                  ×
                </button>
              </Badge>
            )}
          </div>
        </Card>

        {/* Results Count */}
        {!loading && !error && (
          <div className="mb-6">
            <p className="text-gray-600">
              <span className="font-semibold text-gray-900">{providers.length}</span>{' '}
              {providers.length === 1 ? 'resultaat' : 'resultaten'} gevonden
            </p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Card key={i} className="overflow-hidden border-2 border-gray-100 rounded-3xl">
                <Skeleton className="h-48 w-full" />
                <div className="p-5 space-y-3">
                  <Skeleton className="h-6 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-10 w-full" />
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Error State */}
        {error && (
          <Card className="p-12 text-center bg-white border-2 border-red-100 rounded-3xl">
            <div className="text-6xl mb-4">⚠️</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Er is iets misgegaan</h3>
            <p className="text-gray-600 mb-6">{error}</p>
            <Button
              onClick={() => window.location.reload()}
              variant="outline"
              className="rounded-xl"
            >
              Probeer Opnieuw
            </Button>
          </Card>
        )}

        {/* Provider Grid */}
        {!loading && !error && providers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {providers.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={`/providers/${provider.id}`}>
                  <Card className="overflow-hidden hover:shadow-eventiphy-xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-gray-100 rounded-3xl h-full">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden bg-gray-200">
                      {provider.images && provider.images.length > 0 ? (
                        <img
                          src={provider.images[0]}
                          alt={provider.businessName}
                          className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">
                          <MapPin className="w-12 h-12" />
                        </div>
                      )}
                      {provider.verified && (
                        <div className="absolute top-3 right-3">
                          <Badge className="bg-green-500 text-white flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-lg text-gray-900">
                          {provider.businessName}
                        </h3>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {getPriceRangeDisplay(provider.priceRange)}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        {provider.location}
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-gray-900">
                            {provider.rating > 0 ? provider.rating.toFixed(1) : '—'}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({provider.reviewCount} review{provider.reviewCount !== 1 ? 's' : ''})
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {provider.description || 'Geen beschrijving beschikbaar'}
                      </p>

                      <Button className="w-full gradient-brand hover:opacity-90 rounded-xl">
                        Bekijk Details
                      </Button>
                    </div>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && !error && providers.length === 0 && (
          <Card className="p-12 text-center bg-white border-2 border-gray-100 rounded-3xl">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Geen resultaten gevonden</h3>
            <p className="text-gray-600 mb-6">
              Probeer je filters aan te passen of zoek op een andere term
            </p>
            <Button
              onClick={() => {
                setSelectedCategory('all');
                setSelectedLocation('all');
                setPriceRange('all');
                setSearchQuery('');
              }}
              variant="outline"
              className="rounded-xl"
            >
              Reset Filters
            </Button>
          </Card>
        )}
      </Container>
    </main>
  );
}

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50 py-8">
        <Container>
          <div className="mb-8">
            <Skeleton className="h-12 w-64 mb-4" />
            <Skeleton className="h-6 w-96" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton key={i} className="h-96 w-full" />
            ))}
          </div>
        </Container>
      </main>
    }>
      <BrowseContent />
    </Suspense>
  );
}
