'use client';

import { motion } from 'framer-motion';
import { Container, Section } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, Calendar, CheckCircle, Star,ForkKnife, Music, Camera, Theater, Sparkle, Building } from 'lucide-react';

const categories = [
  { name: 'Catering', icon: ForkKnife, count: 120 },
  { name: 'DJ & Muziek', icon: Music, count: 85 },
  { name: 'Fotografie', icon: Camera, count: 95 },
  { name: 'Decoratie', icon: Sparkle, count: 70 },
  { name: 'Locaties', icon: Building, count: 45 },
  { name: 'Entertainment', icon: Theater, count: 60 },
];

const features = [
  {
    icon: Search,
    title: 'Vind Professionals',
    description: 'Ontdek geverifieerde dienstverleners in jouw regio',
  },
  {
    icon: Calendar,
    title: 'Plan & Boek',
    description: 'Vraag offertes aan en boek direct online',
  },
  {
    icon: CheckCircle,
    title: 'Veilig Betalen',
    description: 'Transparante prijzen en veilige betalingen',
  },
  {
    icon: Star,
    title: 'Bewezen Kwaliteit',
    description: 'Bekijk reviews van andere klanten',
  },
];

export default function Home() {
  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <Section background="gradient-hero">
        <Container>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-center"
          >
            <h1 className="text-5xl md:text-7xl font-bold mb-6">
              <span className="gradient-text">
                Jouw Droomfeest
              </span>
              <br />
              Begint Hier
            </h1>
            <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
              Vind binnen 5 minuten de perfecte dienstverleners voor jouw event
            </p>
            
            {/* Search Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="p-8 max-w-2xl mx-auto bg-white border-2 border-gray-100 rounded-3xl shadow-eventify-xl">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Wat voor event organiseer je?"
                    className="flex-1 rounded-xl border-2 border-gray-100 h-12 px-4 focus:border-purple-500 focus:outline-none"
                  />
                  <Button className="gradient-brand hover:opacity-90 h-12 px-8 rounded-xl">
                    <Search className="w-5 h-5 mr-2" />
                    Zoeken
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        </Container>
      </Section>

      {/* Categories Section */}
      <Section>
        <Container>
          <h2 className="text-4xl font-bold text-center mb-12">
            Ontdek Diensten
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 text-center hover:shadow-eventify-lg transition-all hover:-translate-y-1 cursor-pointer border-2 border-gray-100 rounded-3xl">
                  <div className="text-4xl mb-3"><category.icon /></div>
                  <h3 className="font-semibold text-gray-900 mb-2">{category.name}</h3>
                  <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                    {category.count} providers
                  </Badge>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* Features Section */}
      <Section background="gradient-feature">
        <Container>
          <h2 className="text-4xl font-bold text-center mb-4">
            Waarom <span className="gradient-text">Eventify</span>?
          </h2>
          <p className="text-xl text-gray-600 text-center mb-12 max-w-2xl mx-auto">
            De slimste manier om jouw evenement te organiseren
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
              >
                <Card className="p-6 h-full bg-white border-2 border-gray-100 rounded-3xl hover:shadow-eventify-lg transition-all">
                  <div className="w-12 h-12 rounded-xl gradient-brand flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-lg mb-2 text-gray-900">{feature.title}</h3>
                  <p className="text-gray-600">{feature.description}</p>
                </Card>
              </motion.div>
            ))}
          </div>
        </Container>
      </Section>

      {/* CTA Section */}
      <Section>
        <Container>
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="text-center gradient-feature rounded-3xl p-12"
          >
            <h2 className="text-4xl font-bold mb-4">
              Klaar om te beginnen?
            </h2>
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Maak vandaag nog een account en vind de perfecte dienstverleners voor jouw event
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" className="gradient-brand hover:opacity-90 rounded-xl">
                Start Gratis
              </Button>
              <Button size="lg" variant="outline" className="rounded-xl">
                Meer Informatie
              </Button>
            </div>
          </motion.div>
        </Container>
      </Section>
    </main>
  );
}
