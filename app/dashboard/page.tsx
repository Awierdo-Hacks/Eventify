'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { mockRequests, mockQuotes, mockBookings } from '@/lib/dashboardMockData';
import {
  FileText,
  MessageSquare,
  CheckCircle,
  Calendar,
  Euro,
  Users,
  Clock,
  AlertCircle,
} from 'lucide-react';

export default function DashboardPage() {
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      label: 'Actieve Aanvragen',
      value: mockRequests.filter((r) => r.status === 'pending').length,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      label: 'Ontvangen Offertes',
      value: mockQuotes.filter((q) => q.status === 'pending').length,
      icon: MessageSquare,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      label: 'Bevestigde Boekingen',
      value: mockBookings.filter((b) => b.status === 'confirmed').length,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      label: 'Totaal Uitgegeven',
      value: `€${mockBookings.reduce((sum, b) => sum + b.amount, 0)}`,
      icon: Euro,
      color: 'text-amber-600',
      bgColor: 'bg-amber-100',
    },
  ];

  const getStatusBadge = (status: string) => {
    const statusConfig: Record<string, { variant: any; label: string; className: string }> = {
      pending: { variant: 'secondary', label: 'In behandeling', className: 'bg-blue-100 text-blue-800' },
      quotes_received: { variant: 'secondary', label: 'Offertes ontvangen', className: 'bg-purple-100 text-purple-800' },
      accepted: { variant: 'secondary', label: 'Geaccepteerd', className: 'bg-green-100 text-green-800' },
      rejected: { variant: 'secondary', label: 'Afgewezen', className: 'bg-red-100 text-red-800' },
      confirmed: { variant: 'secondary', label: 'Bevestigd', className: 'bg-green-100 text-green-800' },
      completed: { variant: 'secondary', label: 'Voltooid', className: 'bg-gray-100 text-gray-800' },
      paid: { variant: 'secondary', label: 'Betaald', className: 'bg-green-100 text-green-800' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return <Badge className={config.className}>{config.label}</Badge>;
  };

  return (
    <main className="min-h-screen bg-gray-50">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">
            <span className="gradient-text">Mijn Dashboard</span>
          </h1>
          <p className="text-xl text-gray-600">Beheer je aanvragen, offertes en boekingen</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: index * 0.1 }}
            >
              <Card className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventify-lg transition-all">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                    <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
                    <stat.icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Tabs */}
        <Card className="p-6 border-2 border-gray-100 rounded-3xl">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="overview">Overzicht</TabsTrigger>
              <TabsTrigger value="requests">
                Aanvragen ({mockRequests.length})
              </TabsTrigger>
              <TabsTrigger value="quotes">
                Offertes ({mockQuotes.filter((q) => q.status === 'pending').length})
              </TabsTrigger>
              <TabsTrigger value="bookings">
                Boekingen ({mockBookings.length})
              </TabsTrigger>
            </TabsList>

            {/* Overview Tab */}
            <TabsContent value="overview">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 text-gray-900">Recente Activiteit</h3>
                  <div className="space-y-3">
                    {mockRequests.slice(0, 3).map((request) => (
                      <div
                        key={request.id}
                        className="flex items-center justify-between p-4 gradient-feature rounded-2xl"
                      >
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center">
                            <FileText className="w-5 h-5 text-purple-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{request.provider_name}</p>
                            <p className="text-sm text-gray-600">
                              {request.event_type} • {new Date(request.event_date).toLocaleDateString('nl-NL')}
                            </p>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            {/* Requests Tab */}
            <TabsContent value="requests">
              <div className="space-y-4">
                {mockRequests.length > 0 ? (
                  mockRequests.map((request) => (
                    <Card
                      key={request.id}
                      className="p-6 border-2 border-gray-100 rounded-2xl hover:shadow-eventify-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900 mb-1">
                            {request.provider_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Badge variant="outline">{request.category}</Badge>
                            <span>•</span>
                            <span>{request.event_type}</span>
                          </div>
                        </div>
                        {getStatusBadge(request.status)}
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">
                            {new Date(request.event_date).toLocaleDateString('nl-NL')}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{request.guest_count} gasten</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm">
                          <MessageSquare className="w-4 h-4 text-gray-400" />
                          <span className="text-gray-600">{request.quotes_count} offertes</span>
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl" size="sm">
                          Details
                        </Button>
                        {request.quotes_count > 0 && (
                          <Button
                            onClick={() => setActiveTab('quotes')}
                            className="rounded-xl gradient-brand"
                            size="sm"
                          >
                            Bekijk Offertes
                          </Button>
                        )}
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nog geen aanvragen
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Start met browsen en vraag je eerste offerte aan
                    </p>
                    <Button className="gradient-brand rounded-xl">Ontdek Providers</Button>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Quotes Tab */}
            <TabsContent value="quotes">
              <div className="space-y-4">
                {mockQuotes.filter((q) => q.status === 'pending').length > 0 ? (
                  mockQuotes
                    .filter((q) => q.status === 'pending')
                    .map((quote) => (
                      <Card
                        key={quote.id}
                        className="p-6 border-2 border-gray-100 rounded-2xl hover:shadow-eventify-md transition-all"
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div>
                            <h4 className="font-semibold text-lg text-gray-900 mb-1">
                              {quote.provider_name}
                            </h4>
                            <p className="text-sm text-gray-600">{quote.description}</p>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold gradient-text">€{quote.amount}</div>
                            <div className="text-xs text-gray-500">
                              Geldig tot {new Date(quote.valid_until).toLocaleDateString('nl-NL')}
                            </div>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button className="flex-1 gradient-brand rounded-xl">
                            Accepteren
                          </Button>
                          <Button variant="outline" className="flex-1 rounded-xl">
                            Afwijzen
                          </Button>
                        </div>
                      </Card>
                    ))
                ) : (
                  <div className="text-center py-12">
                    <MessageSquare className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Geen openstaande offertes</h3>
                    <p className="text-gray-600">Ontvangen offertes verschijnen hier</p>
                  </div>
                )}
              </div>
            </TabsContent>

            {/* Bookings Tab */}
            <TabsContent value="bookings">
              <div className="space-y-4">
                {mockBookings.length > 0 ? (
                  mockBookings.map((booking) => (
                    <Card
                      key={booking.id}
                      className="p-6 border-2 border-gray-100 rounded-2xl hover:shadow-eventify-md transition-all"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div>
                          <h4 className="font-semibold text-lg text-gray-900 mb-1">
                            {booking.provider_name}
                          </h4>
                          <div className="flex items-center gap-2 text-sm">
                            <Badge variant="outline">{booking.category}</Badge>
                            {getStatusBadge(booking.status)}
                            {getStatusBadge(booking.payment_status)}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xl font-bold text-gray-900">€{booking.amount}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-4 h-4" />
                          {new Date(booking.event_date).toLocaleDateString('nl-NL')}
                        </div>
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          Geboekt op {new Date(booking.created_at).toLocaleDateString('nl-NL')}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button variant="outline" className="rounded-xl" size="sm">
                          Details
                        </Button>
                        <Button variant="outline" className="rounded-xl" size="sm">
                          Contact Provider
                        </Button>
                      </div>
                    </Card>
                  ))
                ) : (
                  <div className="text-center py-12">
                    <CheckCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Nog geen boekingen</h3>
                    <p className="text-gray-600">Geaccepteerde offertes worden boekingen</p>
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </Card>
      </Container>
    </main>
  );
}
