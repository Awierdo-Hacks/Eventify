'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { mockProviders, categories, locations } from '@/lib/mockData';
import { MapPin, Star, CheckCircle, Search } from 'lucide-react';

export default function BrowsePage() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedLocation, setSelectedLocation] = useState<string>('all');
  const [priceRange, setPriceRange] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Initialize from URL parameters
  useEffect(() => {
    const category = searchParams.get('category');
    const location = searchParams.get('location');
    const query = searchParams.get('q');
    
    if (category) setSelectedCategory(category);
    if (location) setSelectedLocation(location);
    if (query) setSearchQuery(query);
  }, [searchParams]);

  const filteredProviders = mockProviders.filter((provider) => {
    if (selectedCategory !== 'all' && provider.category !== selectedCategory) return false;
    if (selectedLocation !== 'all' && provider.location !== selectedLocation) return false;
    if (priceRange !== 'all' && provider.price_range !== priceRange) return false;
    if (searchQuery && !provider.business_name.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    return true;
  });

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
        <Card className="p-6 mb-8 bg-white border-2 border-gray-100 rounded-3xl shadow-eventify-lg">
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
              <option value="€">€ - Budget</option>
              <option value="€€">€€ - Gemiddeld</option>
              <option value="€€€">€€€ - Premium</option>
              <option value="€€€€">€€€€ - Luxe</option>
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
        <div className="mb-6">
          <p className="text-gray-600">
            <span className="font-semibold text-gray-900">{filteredProviders.length}</span>{' '}
            {filteredProviders.length === 1 ? 'resultaat' : 'resultaten'} gevonden
          </p>
        </div>

        {/* Provider Grid */}
        {filteredProviders.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredProviders.map((provider, index) => (
              <motion.div
                key={provider.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Link href={`/providers/${provider.id}`}>
                  <Card className="overflow-hidden hover:shadow-eventify-xl transition-all hover:-translate-y-1 cursor-pointer border-2 border-gray-100 rounded-3xl h-full">
                    {/* Image */}
                    <div className="relative h-48 overflow-hidden">
                      <img
                        src={provider.image}
                        alt={provider.business_name}
                        className="w-full h-full object-cover hover:scale-110 transition-transform duration-300"
                      />
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
                          {provider.business_name}
                        </h3>
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700">
                          {provider.price_range}
                        </Badge>
                      </div>

                      <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
                        <MapPin className="w-4 h-4" />
                        {provider.location}
                      </div>

                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                          <span className="font-semibold text-gray-900">{provider.rating}</span>
                        </div>
                        <span className="text-sm text-gray-500">
                          ({provider.review_count} reviews)
                        </span>
                      </div>

                      <p className="text-sm text-gray-600 line-clamp-2 mb-4">
                        {provider.description}
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
        ) : (
          // Empty State
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
