'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link2, Calendar, Euro, ChevronDown, Check, X } from 'lucide-react';
import {
  EventType,
  ProviderCategory,
  eventTypeIcons,
  categoryIcons,
  categoryNames,
  mapCategoryToEnum,
} from '@/lib/eventHelpers';

interface Event {
  id: string;
  name: string;
  eventType: EventType;
  slots: Array<{
    id: string;
    category: ProviderCategory;
    status: string;
  }>;
}

interface Quote {
  id: string;
  totalPrice: number;
  createdAt: string;
  validUntil: string;
  status: string;
  provider: {
    id: string;
    businessName: string;
    category: string;
  };
  serviceRequest: {
    id: string;
    eventType: string;
    eventDate: string;
    eventLocation: string;
  };
}

interface UnlinkedQuotesProps {
  quotes: Quote[];
  events: Event[];
  onLinkQuote: (quoteId: string, eventSlotId: string) => Promise<void>;
}

export function UnlinkedQuotes({ quotes, events, onLinkQuote }: UnlinkedQuotesProps) {
  const [expandedQuote, setExpandedQuote] = useState<string | null>(null);
  const [linkingQuote, setLinkingQuote] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const handleLinkQuote = async (quoteId: string, slotId: string) => {
    setLinkingQuote(quoteId);
    try {
      await onLinkQuote(quoteId, slotId);
      setExpandedQuote(null);
    } finally {
      setLinkingQuote(null);
    }
  };

  // Get matching slots for a quote based on provider category
  const getMatchingSlots = (quote: Quote) => {
    const providerCategory = mapCategoryToEnum(quote.provider.category);
    if (!providerCategory) return [];

    return events.flatMap((event) =>
      event.slots
        .filter((slot) => slot.category === providerCategory && slot.status !== 'BOOKED')
        .map((slot) => ({
          ...slot,
          eventId: event.id,
          eventName: event.name,
          eventType: event.eventType,
        }))
    );
  };

  if (quotes.length === 0) {
    return (
      <Card className="p-8 border-2 border-gray-100 rounded-3xl text-center">
        <Link2 className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Geen ongekoppelde offertes
        </h3>
        <p className="text-gray-600">
          Al je offertes zijn gekoppeld aan een event of je hebt nog geen offertes ontvangen.
        </p>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600">
          {quotes.length} offerte(s) nog niet gekoppeld aan een event
        </p>
      </div>

      {quotes.map((quote, index) => {
        const matchingSlots = getMatchingSlots(quote);
        const isExpanded = expandedQuote === quote.id;

        return (
          <motion.div
            key={quote.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Card
              className={`border-2 rounded-2xl overflow-hidden transition-all ${
                isExpanded ? 'border-purple-200' : 'border-gray-100'
              }`}
            >
              {/* Quote Header */}
              <div
                className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                onClick={() => setExpandedQuote(isExpanded ? null : quote.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">
                      {categoryIcons[mapCategoryToEnum(quote.provider.category) || 'OTHER']}
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-900">{quote.provider.businessName}</h4>
                      <div className="flex items-center gap-3 text-sm text-gray-500">
                        <span>{categoryNames[mapCategoryToEnum(quote.provider.category) || 'OTHER']}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(quote.serviceRequest.eventDate)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold text-gray-900">
                        €{quote.totalPrice.toLocaleString()}
                      </p>
                      <Badge
                        className={
                          quote.status === 'PENDING'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {quote.status === 'PENDING' ? 'Te beoordelen' : quote.status}
                      </Badge>
                    </div>
                    <ChevronDown
                      className={`w-5 h-5 text-gray-400 transition-transform ${
                        isExpanded ? 'rotate-180' : ''
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {isExpanded && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="border-t border-gray-100"
                >
                  <div className="p-4 bg-gray-50">
                    <h5 className="text-sm font-medium text-gray-700 mb-3">
                      Koppel aan een event slot:
                    </h5>

                    {matchingSlots.length === 0 ? (
                      <div className="text-center py-4">
                        <p className="text-sm text-gray-500 mb-3">
                          Geen passende event slots gevonden voor deze categorie.
                        </p>
                        <Button variant="outline" size="sm" className="rounded-xl">
                          Nieuw Event Aanmaken
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {matchingSlots.map((slot) => (
                          <div
                            key={slot.id}
                            className="flex items-center justify-between p-3 bg-white rounded-xl border border-gray-200 hover:border-purple-200 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-xl">{eventTypeIcons[slot.eventType]}</span>
                              <div>
                                <p className="font-medium text-gray-900">{slot.eventName}</p>
                                <p className="text-sm text-gray-500">
                                  {categoryIcons[slot.category]} {categoryNames[slot.category]}
                                </p>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors shadow-sm"
                              onClick={() => handleLinkQuote(quote.id, slot.id)}
                              disabled={linkingQuote === quote.id}
                            >
                              {linkingQuote === quote.id ? (
                                <span className="animate-spin">⏳</span>
                              ) : (
                                <>
                                  <Link2 className="w-4 h-4 mr-1" />
                                  Koppelen
                                </>
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedQuote(null);
                        }}
                      >
                        <X className="w-4 h-4 mr-1" />
                        Annuleren
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="flex-1 rounded-xl"
                        onClick={(e) => {
                          e.stopPropagation();
                          setExpandedQuote(null);
                        }}
                      >
                        Later Koppelen
                      </Button>
                    </div>
                  </div>
                </motion.div>
              )}
            </Card>
          </motion.div>
        );
      })}
    </div>
  );
}
