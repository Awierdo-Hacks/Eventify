'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, ChevronRight } from 'lucide-react';
import {
  EventType,
  EventStatus,
  SlotStatus,
  ProviderCategory,
  eventTypeIcons,
  eventTypeNames,
  eventStatusConfig,
  slotStatusConfig,
  categoryIcons,
  categoryNames,
  calculateEventProgress,
} from '@/lib/eventHelpers';

interface EventSlot {
  id: string;
  category: ProviderCategory;
  customName?: string;
  status: SlotStatus;
  quotesCount?: number;
  bookedQuote?: {
    id: string;
    totalPrice: number;
    providerName?: string;
    provider?: {
      id: string;
      businessName: string;
    };
  } | null;
}

interface EventCardProps {
  event: {
    id: string;
    name: string;
    eventType: EventType;
    eventDate?: string | null;
    location?: string | null;
    status: EventStatus;
    slots: EventSlot[];
  };
  onClick?: () => void;
  onOpenEvent?: (id: string) => void;
  index?: number;
}

export function EventCard({ event, onClick, onOpenEvent, index = 0 }: EventCardProps) {
  const progress = calculateEventProgress(event.slots);
  const bookedCount = event.slots.filter((s) => s.status === 'BOOKED').length;
  const quotesReceivedCount = event.slots.filter((s) => s.status === 'QUOTES_RECEIVED').length;
  const statusConfig = eventStatusConfig[event.status];

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <div>
      <Card
        className="p-6 border-2 border-gray-100 rounded-3xl hover:shadow-eventiphy-lg transition-all cursor-pointer group"
        onClick={() => {
          if (onClick) onClick();
          else if (onOpenEvent) onOpenEvent(event.id);
        }}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-3xl">{eventTypeIcons[event.eventType]}</span>
            <div>
              <h3 className="text-xl font-bold text-gray-900 group-hover:text-purple-600 transition-colors">
                {event.name}
              </h3>
              <p className="text-sm text-gray-500">{eventTypeNames[event.eventType]}</p>
            </div>
          </div>
          <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
        </div>

        {/* Meta Info */}
        <div className="flex flex-wrap gap-4 mb-4 text-sm text-gray-600">
          {event.eventDate && (
            <span className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {formatDate(event.eventDate)}
            </span>
          )}
          {event.location && (
            <span className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {event.location}
            </span>
          )}
        </div>

        {/* Progress Bar */}
        <div className="mb-4">
          <div className="flex justify-between text-sm mb-1">
            <span className="text-gray-600">Voortgang</span>
            <span className="font-medium text-gray-900">
              {bookedCount > 0 && `${bookedCount} geboekt`}
              {bookedCount > 0 && quotesReceivedCount > 0 && ', '}
              {quotesReceivedCount > 0 && `${quotesReceivedCount} met offertes`}
              {bookedCount === 0 && quotesReceivedCount === 0 && `0 van ${event.slots.length}`}
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Slots Preview */}
        <div className="flex flex-wrap gap-2 mb-4">
          {event.slots.slice(0, 6).map((slot) => {
            const config = slotStatusConfig[slot.status];
            return (
              <div
                key={slot.id}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-lg text-xs ${config.className}`}
                title={`${categoryNames[slot.category]}: ${config.label}`}
              >
                <span>{categoryIcons[slot.category]}</span>
                {slot.status === 'BOOKED' && slot.bookedQuote ? (
                  <span className="max-w-[100px] truncate">
                    {slot.bookedQuote.providerName || slot.bookedQuote.provider?.businessName}
                  </span>
                ) : (slot.quotesCount ?? 0) > 0 ? (
                  <span>{slot.quotesCount} offertes</span>
                ) : (
                  <span>{categoryNames[slot.category]}</span>
                )}
              </div>
            );
          })}
          {event.slots.length > 6 && (
            <span className="px-2 py-1 text-xs text-gray-500">
              +{event.slots.length - 6} meer
            </span>
          )}
        </div>

        {/* Action */}
        <div className="flex justify-end">
          <Button
            variant="ghost"
            size="sm"
            className="text-purple-600 hover:text-purple-700 hover:bg-purple-50 group-hover:translate-x-1 transition-transform"
          >
            Beheer Event
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </Card>
    </div>
  );
}
