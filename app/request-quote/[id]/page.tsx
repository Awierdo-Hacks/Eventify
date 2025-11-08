'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { notFound } from 'next/navigation';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { mockProviders } from '@/lib/mockData';
import { ArrowLeft, Calendar, Users, Euro, MessageSquare, CheckCircle } from 'lucide-react';

export default function RequestQuotePage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const provider = mockProviders.find((p) => p.id === params.id);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    customer_email: '',
    customer_name: '',
    customer_phone: '',
    event_type: '',
    event_date: '',
    event_location: '',
    guest_count: '',
    budget: '',
    message: '',
  });

  if (!provider) {
    notFound();
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));
    
    setIsSubmitting(false);
    router.push('/dashboard?tab=requests&success=true');
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

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

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Form */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-2 border-gray-100 rounded-3xl bg-white">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <h1 className="text-3xl font-bold mb-2">
                  <span className="gradient-text">Offerte Aanvragen</span>
                </h1>
                <p className="text-gray-600 mb-8">
                  Vul onderstaand formulier in en ontvang binnen 24 uur een offerte op maat
                </p>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Personal Info */}
                  <div>
                    <h3 className="font-semibold text-lg mb-4 text-gray-900">Jouw Gegevens</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Volledige naam *
                        </label>
                        <Input
                          name="customer_name"
                          value={formData.customer_name}
                          onChange={handleChange}
                          placeholder="Bijv. Jan Jansen"
                          required
                          className="rounded-xl border-2 border-gray-100 h-12"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Email adres *
                        </label>
                        <Input
                          type="email"
                          name="customer_email"
                          value={formData.customer_email}
                          onChange={handleChange}
                          placeholder="jan@voorbeeld.nl"
                          required
                          className="rounded-xl border-2 border-gray-100 h-12"
                        />
                      </div>
                    </div>
                    <div className="mt-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Telefoonnummer *
                      </label>
                      <Input
                        type="tel"
                        name="customer_phone"
                        value={formData.customer_phone}
                        onChange={handleChange}
                        placeholder="06 12345678"
                        required
                        className="rounded-xl border-2 border-gray-100 h-12"
                      />
                    </div>
                  </div>

                  {/* Event Details */}
                  <div className="pt-6 border-t border-gray-200">
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

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            <Calendar className="w-4 h-4 inline mr-1" />
                            Event datum *
                          </label>
                          <Input
                            type="date"
                            name="event_date"
                            value={formData.event_date}
                            onChange={handleChange}
                            required
                            min={new Date().toISOString().split('T')[0]}
                            className="rounded-xl border-2 border-gray-100 h-12"
                          />
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
                            min={provider.min_guests}
                            max={provider.max_guests}
                            className="rounded-xl border-2 border-gray-100 h-12"
                          />
                        </div>
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
                          Budget indicatie
                        </label>
                        <Input
                          type="number"
                          name="budget"
                          value={formData.budget}
                          onChange={handleChange}
                          placeholder="€ 0"
                          className="rounded-xl border-2 border-gray-100 h-12"
                        />
                        <p className="text-sm text-gray-500 mt-1">Optioneel - helpt de provider een passende offerte te maken</p>
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
                      name="message"
                      value={formData.message}
                      onChange={handleChange}
                      rows={4}
                      placeholder="Vertel iets meer over je evenement of specifieke wensen..."
                      className="w-full rounded-xl border-2 border-gray-100 p-4 focus:border-purple-500 focus:outline-none resize-none"
                    />
                  </div>

                  {/* Submit */}
                  <div className="flex gap-4 pt-6">
                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex-1 gradient-brand hover:opacity-90 rounded-xl h-12"
                    >
                      {isSubmitting ? 'Versturen...' : 'Offerte Aanvragen'}
                    </Button>
                    <Link href={`/providers/${provider.id}`} className="flex-1">
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
            <Card className="p-6 border-2 border-gray-100 rounded-3xl bg-white sticky top-24">
              <h3 className="font-semibold text-lg mb-4 text-gray-900">Je vraagt offerte aan bij:</h3>
              
              <div className="mb-4">
                <img
                  src={provider.image}
                  alt={provider.business_name}
                  className="w-full h-32 object-cover rounded-2xl mb-3"
                />
                <h4 className="font-semibold text-gray-900 mb-1">{provider.business_name}</h4>
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
                  <span className="text-gray-600">Reactietijd</span>
                  <span className="font-semibold text-gray-900">{provider.response_time}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Rating</span>
                  <span className="font-semibold text-gray-900">⭐ {provider.rating}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Prijs indicatie</span>
                  <span className="font-semibold text-gray-900">{provider.price_range}</span>
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
