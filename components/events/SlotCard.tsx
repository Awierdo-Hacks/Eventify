'use client';

import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Search, Eye, Check, Trash2, MoreHorizontal } from 'lucide-react';
import {
  SlotStatus,
  ProviderCategory,
  slotStatusConfig,
  categoryIcons,
  categoryNames,
} from '@/lib/eventHelpers';

interface Quote {
  id: string;
  totalPrice: number;
  accepted: boolean;
  providerName: string;
}

interface SlotCardProps {
  slot: {
    id: string;
    category: ProviderCategory;
    customName?: string | null;
    status: SlotStatus;
    quotesCount: number;
    quotes?: Quote[];
    bookedQuote?: {
      id: string;
      totalPrice: number;
      providerName?: string;
      provider?: {
        id: string;
        businessName: string;
        category: string;
        location: string;
      };
    } | null;
  };
  onFindProviders: (slotId: string, category: ProviderCategory) => void;
  onViewQuotes: (slotId: string) => void;
  onRemoveSlot?: (slotId: string) => void;
  isCompact?: boolean;
  index?: number;
}

export function SlotCard({
  slot,
  onFindProviders,
  onViewQuotes,
  onRemoveSlot,
  isCompact = false,
  index = 0,
}: SlotCardProps) {
  const config = slotStatusConfig[slot.status];
  const displayName = slot.customName || categoryNames[slot.category];

  if (isCompact) {
    return (
      <div
        className={`flex items-center justify-between p-3 rounded-xl border-2 ${config.bgColor} border-transparent`}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">{categoryIcons[slot.category]}</span>
          <span className="font-medium text-gray-900">{displayName}</span>
        </div>
        <Badge className={config.className}>{config.label}</Badge>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
    >
      <Card
        className={`p-4 border-2 rounded-2xl transition-all hover:shadow-md ${
          slot.status === 'BOOKED'
            ? 'border-green-200 bg-green-50'
            : slot.status === 'QUOTES_RECEIVED'
            ? 'border-purple-200 bg-purple-50'
            : 'border-gray-100'
        }`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl ${
                slot.status === 'BOOKED'
                  ? 'bg-green-100'
                  : slot.status === 'QUOTES_RECEIVED'
                  ? 'bg-purple-100'
                  : 'bg-gray-100'
              }`}
            >
              {categoryIcons[slot.category]}
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">{displayName}</h4>
              <Badge className={`${config.className} mt-1`}>{config.label}</Badge>
            </div>
          </div>
          
          {onRemoveSlot && slot.status !== 'BOOKED' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-gray-400 hover:text-red-500"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveSlot(slot.id);
              }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Content based on status */}
        {slot.status === 'BOOKED' && slot.bookedQuote && (
          <div className="mb-3 p-3 bg-white rounded-xl border border-green-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">
                  {slot.bookedQuote.providerName || slot.bookedQuote.provider?.businessName || 'Provider'}
                </p>
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <Check className="w-3 h-3" />
                  Geboekt
                </p>
              </div>
              <p className="text-lg font-bold text-gray-900">
                €{slot.bookedQuote.totalPrice.toLocaleString()}
              </p>
            </div>
          </div>
        )}

        {slot.status === 'QUOTES_RECEIVED' && slot.quotesCount > 0 && (
          <div className="mb-3 p-3 bg-white rounded-xl border border-purple-200">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{slot.quotesCount} offerte(s) ontvangen</p>
                <p className="text-sm text-purple-600">Bekijk en vergelijk</p>
              </div>
              {slot.quotes && slot.quotes.length > 0 && (
                <p className="text-sm text-gray-600">
                  €{Math.min(...slot.quotes.map((q) => q.totalPrice)).toLocaleString()} - €
                  {Math.max(...slot.quotes.map((q) => q.totalPrice)).toLocaleString()}
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          {slot.status === 'EMPTY' && (
            <Button
              variant="default"
              size="sm"
              className="flex-1 rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors shadow-sm"
              onClick={() => onFindProviders(slot.id, slot.category)}
            >
              <Search className="w-4 h-4 mr-2" />
              Zoek Providers
            </Button>
          )}

          {slot.status === 'SEARCHING' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl"
              onClick={() => onFindProviders(slot.id, slot.category)}
            >
              <Search className="w-4 h-4 mr-2" />
              Verder Zoeken
            </Button>
          )}

          {(slot.status === 'QUOTES_REQUESTED' || slot.status === 'QUOTES_RECEIVED') && (
            <>
              <Button
                variant="default"
                size="sm"
                className="flex-1 rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors shadow-sm"
                onClick={() => onViewQuotes(slot.id)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Bekijk Offertes
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="rounded-xl"
                onClick={() => onFindProviders(slot.id, slot.category)}
              >
                <Search className="w-4 h-4" />
              </Button>
            </>
          )}

          {slot.status === 'BOOKED' && (
            <Button
              variant="outline"
              size="sm"
              className="flex-1 rounded-xl text-green-600 border-green-200 hover:bg-green-50"
              onClick={() => onViewQuotes(slot.id)}
            >
              <Eye className="w-4 h-4 mr-2" />
              Details Bekijken
            </Button>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
