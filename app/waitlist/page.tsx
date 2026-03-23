'use client';

import { useState } from 'react';
import { Container, PageHeader, Section } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CheckCircle, Users, Briefcase } from 'lucide-react';

const SERVICE_CATEGORIES = [
  { value: 'CATERING', label: 'Catering' },
  { value: 'MUSIC', label: 'Muziek / DJ' },
  { value: 'PHOTOGRAPHY', label: 'Fotografie' },
  { value: 'DECORATION', label: 'Decoratie' },
  { value: 'VENUE', label: 'Locatie' },
  { value: 'ENTERTAINMENT', label: 'Entertainment' },
  { value: 'VIDEOGRAPHY', label: 'Videografie' },
  { value: 'TRANSPORT', label: 'Transport' },
  { value: 'ACCOMMODATION', label: 'Accommodatie' },
  { value: 'SECURITY', label: 'Beveiliging' },
  { value: 'SANITARY', label: 'Sanitair' },
  { value: 'CAKE', label: 'Taart' },
  { value: 'FLOWERS', label: 'Bloemen' },
  { value: 'MC', label: 'MC' },
  { value: 'OTHER', label: 'Overige' },
];

export default function WaitlistPage() {
  const [type, setType] = useState<'CUSTOMER' | 'PROVIDER'>('CUSTOMER');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [categories, setCategories] = useState<string[]>([]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  function toggleCategory(value: string) {
    setCategories((prev) =>
      prev.includes(value) ? prev.filter((c) => c !== value) : [...prev, value]
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/waitlist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, name, email, phone, categories, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Er is iets misgegaan. Probeer opnieuw.');
      } else {
        setSuccess(true);
      }
    } catch {
      setError('Er is iets misgegaan. Controleer je internetverbinding.');
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <main className="min-h-screen">
        <Section background="gradient-hero" className="py-10 md:py-14">
          <Container className="py-0">
            <PageHeader title="Wachtlijst" gradient className="mb-0" />
          </Container>
        </Section>
        <Section className="py-10 md:py-16">
          <Container className="py-0">
            <div className="max-w-lg mx-auto text-center">
              <div className="w-16 h-16 rounded-2xl gradient-brand flex items-center justify-center mx-auto mb-6">
                <CheckCircle className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-3">Je staat op de lijst!</h2>
              <p className="text-gray-600 text-lg">
                Bedankt voor je aanmelding. We houden je op de hoogte zodra Eventiphy live gaat.
              </p>
            </div>
          </Container>
        </Section>
      </main>
    );
  }

  return (
    <main className="min-h-screen">
      <Section background="gradient-hero" className="py-10 md:py-14">
        <Container className="py-0">
          <PageHeader
            title="Join de wachtlijst"
            subtitle="Eventiphy komt eraan. Meld je nu aan en wees er als eerste bij."
            gradient
            className="mb-0"
          />
        </Container>
      </Section>

      <Section className="py-8 md:py-12">
        <Container className="py-0">
          <div className="max-w-2xl mx-auto">
            <Card className="p-6 sm:p-8 bg-white border-2 border-gray-100 rounded-3xl shadow-eventiphy-lg">
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Type selectie */}
                <div>
                  <p className="text-sm font-semibold text-gray-700 mb-3">Ik ben een...</p>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setType('CUSTOMER')}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors text-left ${
                        type === 'CUSTOMER'
                          ? 'border-purple-500 bg-purple-50 text-purple-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Users className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Klant</p>
                        <p className="text-xs opacity-75">Ik organiseer een event</p>
                      </div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setType('PROVIDER')}
                      className={`flex items-center gap-3 p-4 rounded-2xl border-2 transition-colors text-left ${
                        type === 'PROVIDER'
                          ? 'border-purple-500 bg-purple-50 text-purple-800'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      <Briefcase className="w-5 h-5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm">Dienstverlener</p>
                        <p className="text-xs opacity-75">Ik bied diensten aan</p>
                      </div>
                    </button>
                  </div>
                </div>

                {/* Naam */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Naam <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Jouw volledige naam"
                    required
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* E-mail */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    E-mailadres <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="jouw@email.be"
                    required
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Telefoon */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Telefoonnummer <span className="text-gray-400 font-normal text-xs">(optioneel)</span>
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+32 ..."
                    className="w-full h-11 px-4 rounded-xl border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 transition-colors"
                  />
                </div>

                {/* Diensten (alleen voor providers) */}
                {type === 'PROVIDER' && (
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-3">
                      Welke diensten bied je aan? <span className="text-red-500">*</span>
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {SERVICE_CATEGORIES.map((cat) => (
                        <button
                          key={cat.value}
                          type="button"
                          onClick={() => toggleCategory(cat.value)}
                          className={`px-3 py-2 rounded-xl border-2 text-sm font-medium transition-colors ${
                            categories.includes(cat.value)
                              ? 'border-purple-500 bg-purple-50 text-purple-800'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {cat.label}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Bericht */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Bericht <span className="text-gray-400 font-normal text-xs">(optioneel)</span>
                  </label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={
                      type === 'PROVIDER'
                        ? 'Vertel iets meer over je diensten of ervaring...'
                        : 'Vertel iets meer over je event of verwachtingen...'
                    }
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:border-purple-400 transition-colors resize-none"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3">
                    {error}
                  </p>
                )}

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full h-12 rounded-xl gradient-brand text-white font-semibold text-base shadow-eventiphy hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {loading ? 'Bezig...' : 'Schrijf me in'}
                </Button>
              </form>
            </Card>
          </div>
        </Container>
      </Section>
    </main>
  );
}
