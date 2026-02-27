'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SlotCard } from './SlotCard';
import {
  ConfirmationDialog,
  DialogQuoteInfo,
  DialogWarning,
  DialogTextField,
  DialogActions,
  DialogButton,
} from '@/components/ui/confirmation-dialog';
import {
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  Euro,
  Edit,
  Plus,
  Trash2,
  MoreHorizontal,
  Check,
  X,
  Eye,
  Star,
} from 'lucide-react';
import {
  EventType,
  EventStatus,
  SlotStatus,
  ProviderCategory,
  eventTypeIcons,
  eventTypeNames,
  eventStatusConfig,
  categoryIcons,
  categoryNames,
  calculateEventProgress,
  calculateCostRange,
  mapEnumToCategory,
  mapCategoryToEnum,
} from '@/lib/eventHelpers';

interface Quote {
  id: string;
  totalPrice: number;
  accepted: boolean;
  providerName: string;
  includedServices?: string[];
  validUntil?: string;
  message?: string;
  createdAt?: string;
  provider?: {
    id: string;
    businessName: string;
    category: string;
    location: string;
    rating?: number;
    image?: string | null;
  };
}

interface EventSlot {
  id: string;
  category: ProviderCategory;
  customName?: string | null;
  isRequired: boolean;
  displayOrder: number;
  status: SlotStatus;
  quotesCount: number;
  quotes: Quote[];
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
}

interface EventDetailViewProps {
  event: {
    id: string;
    name: string;
    eventType: EventType;
    eventDate?: string | null;
    location?: string | null;
    guestCount?: number | null;
    budgetMin?: number | null;
    budgetMax?: number | null;
    status: EventStatus;
    createdAt: string;
    updatedAt?: string;
    slots: EventSlot[];
  };
  quotes?: Quote[];
  onBack: () => void;
  onRefresh?: () => void;
  onRequestQuote?: (category: string) => void;
  onLinkQuote?: (quoteId: string, slotId: string) => Promise<void>;
  onEditEvent?: () => void;
  onDeleteEvent?: () => void;
}

export function EventDetailView({
  event,
  quotes: externalQuotes,
  onBack,
  onRefresh,
  onRequestQuote,
  onLinkQuote,
  onEditEvent,
  onDeleteEvent,
}: EventDetailViewProps) {
  const router = useRouter();
  const [showAddSlot, setShowAddSlot] = useState(false);
  const [isAddingSlot, setIsAddingSlot] = useState(false);
  const [selectedSlotForQuotes, setSelectedSlotForQuotes] = useState<string | null>(null);
  
  // Quote details modal state
  const [selectedQuoteForDetails, setSelectedQuoteForDetails] = useState<Quote | null>(null);
  
  // Confirmation dialog states
  const [slotToRemove, setSlotToRemove] = useState<{ id: string; category: ProviderCategory } | null>(null);
  const [isRemovingSlot, setIsRemovingSlot] = useState(false);
  
  // Event editing state
  const [isEditingMeta, setIsEditingMeta] = useState(false);
  const [isSavingMeta, setIsSavingMeta] = useState(false);
  const [editedEventData, setEditedEventData] = useState({
    eventDate: event.eventDate || '',
    location: event.location || '',
    guestCount: event.guestCount?.toString() || '',
    budgetMin: event.budgetMin?.toString() || '',
    budgetMax: event.budgetMax?.toString() || '',
  });

  const progress = calculateEventProgress(event.slots);
  const statusConfig = eventStatusConfig[event.status];

  // Calculate costs
  const slotsWithPrices = event.slots.map((slot) => ({
    status: slot.status,
    quotes: slot.quotes.map((q) => ({ total_price: q.totalPrice })),
    booked_quote: slot.bookedQuote ? { total_price: slot.bookedQuote.totalPrice } : null,
  }));
  const costRange = calculateCostRange(slotsWithPrices);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('nl-NL', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const handleFindProviders = (slotId: string, category: ProviderCategory) => {
    // Navigate to browse page with category filter and event context
    // Use mapEnumToCategory to convert the enum to the database category string
    const categorySlug = mapEnumToCategory(category);
    router.push(`/browse?category=${categorySlug}&eventId=${event.id}&slotId=${slotId}`);
  };

  const handleViewQuotes = (slotId: string) => {
    setSelectedSlotForQuotes(slotId);
  };

  const handleAddSlot = async (category: ProviderCategory) => {
    setIsAddingSlot(true);
    try {
      const response = await fetch(`/api/events/${event.id}/slots`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category, isRequired: false }),
      });

      if (response.ok) {
        onRefresh?.();
        setShowAddSlot(false);
      }
    } catch (error) {
      console.error('Error adding slot:', error);
    } finally {
      setIsAddingSlot(false);
    }
  };

  // Show confirmation dialog for removing slot
  const confirmRemoveSlot = (slotId: string, category: ProviderCategory) => {
    setSlotToRemove({ id: slotId, category });
  };

  const handleRemoveSlot = async () => {
    if (!slotToRemove) return;
    
    setIsRemovingSlot(true);
    try {
      const response = await fetch(`/api/events/${event.id}/slots/${slotToRemove.id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        onRefresh?.();
        setSlotToRemove(null);
      }
    } catch (error) {
      console.error('Error removing slot:', error);
    } finally {
      setIsRemovingSlot(false);
    }
  };

  // Save edited event meta data
  const handleSaveEventMeta = async () => {
    setIsSavingMeta(true);
    try {
      const response = await fetch(`/api/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          eventDate: editedEventData.eventDate || null,
          location: editedEventData.location || null,
          guestCount: editedEventData.guestCount ? parseInt(editedEventData.guestCount) : null,
          budgetMin: editedEventData.budgetMin ? parseFloat(editedEventData.budgetMin) : null,
          budgetMax: editedEventData.budgetMax ? parseFloat(editedEventData.budgetMax) : null,
        }),
      });

      if (response.ok) {
        onRefresh?.();
        setIsEditingMeta(false);
      }
    } catch (error) {
      console.error('Error updating event:', error);
    } finally {
      setIsSavingMeta(false);
    }
  };

  const cancelEditMeta = () => {
    setEditedEventData({
      eventDate: event.eventDate || '',
      location: event.location || '',
      guestCount: event.guestCount?.toString() || '',
      budgetMin: event.budgetMin?.toString() || '',
      budgetMax: event.budgetMax?.toString() || '',
    });
    setIsEditingMeta(false);
  };

  // Get selected slot for quotes modal
  const selectedSlot = selectedSlotForQuotes
    ? event.slots.find((s) => s.id === selectedSlotForQuotes)
    : null;

  // Get available categories for adding
  const usedCategories = event.slots.map((s) => s.category);
  const availableCategories = (Object.keys(categoryNames) as ProviderCategory[]).filter(
    (cat) => !usedCategories.includes(cat)
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" onClick={onBack} className="mb-2 -ml-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug naar Events
          </Button>
          <div className="flex items-center gap-3">
            <span className="text-4xl">{eventTypeIcons[event.eventType]}</span>
            <div>
              <h2 className="text-3xl font-bold text-gray-900">{event.name}</h2>
              <div className="flex items-center gap-3 mt-1">
                <span className="text-gray-500">{eventTypeNames[event.eventType]}</span>
                <Badge className={statusConfig.className}>{statusConfig.label}</Badge>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          {onEditEvent && (
            <Button variant="outline" onClick={onEditEvent} className="rounded-xl">
              <Edit className="w-4 h-4 mr-2" />
              Bewerken
            </Button>
          )}
          {onDeleteEvent && (
            <Button
              variant="outline"
              onClick={onDeleteEvent}
              className="rounded-xl text-red-600 hover:bg-red-50"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Meta Info */}
      <Card className="p-6 border-2 border-gray-100 rounded-3xl relative">
        {/* Edit Button */}
        {!isEditingMeta && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsEditingMeta(true)}
            className="absolute top-4 right-4 text-gray-400 hover:text-purple-600"
          >
            <Edit className="w-4 h-4" />
          </Button>
        )}

        {isEditingMeta ? (
          /* Edit Mode */
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Datum</label>
                <Input
                  type="date"
                  value={editedEventData.eventDate ? editedEventData.eventDate.split('T')[0] : ''}
                  onChange={(e) => setEditedEventData({ ...editedEventData, eventDate: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Locatie</label>
                <Input
                  type="text"
                  placeholder="Bijv. Amsterdam"
                  value={editedEventData.location}
                  onChange={(e) => setEditedEventData({ ...editedEventData, location: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Aantal gasten</label>
                <Input
                  type="number"
                  placeholder="Bijv. 100"
                  value={editedEventData.guestCount}
                  onChange={(e) => setEditedEventData({ ...editedEventData, guestCount: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget min</label>
                  <Input
                    type="number"
                    placeholder="€ Min"
                    value={editedEventData.budgetMin}
                    onChange={(e) => setEditedEventData({ ...editedEventData, budgetMin: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Budget max</label>
                  <Input
                    type="number"
                    placeholder="€ Max"
                    value={editedEventData.budgetMax}
                    onChange={(e) => setEditedEventData({ ...editedEventData, budgetMax: e.target.value })}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={cancelEditMeta}
                className="rounded-xl"
              >
                <X className="w-4 h-4 mr-1" />
                Annuleren
              </Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleSaveEventMeta}
                disabled={isSavingMeta}
                className="gradient-brand rounded-xl"
              >
                {isSavingMeta ? (
                  <span className="animate-spin mr-1">⏳</span>
                ) : (
                  <Check className="w-4 h-4 mr-1" />
                )}
                Opslaan
              </Button>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Datum</p>
                <p className="font-semibold text-gray-900">
                  {event.eventDate ? formatDate(event.eventDate) : 'Nog niet bepaald'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                <MapPin className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Locatie</p>
                <p className="font-semibold text-gray-900">{event.location || 'Nog niet bepaald'}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Gasten</p>
                <p className="font-semibold text-gray-900">
                  {event.guestCount ? `${event.guestCount} personen` : 'Nog niet bepaald'}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center">
                <Euro className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Budget</p>
                <p className="font-semibold text-gray-900">
                  {event.budgetMin || event.budgetMax
                    ? `€${event.budgetMin?.toLocaleString() || '0'} - €${event.budgetMax?.toLocaleString() || '∞'}`
                    : 'Nog niet bepaald'}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Progress Bar */}
        <div className="mt-6 pt-6 border-t border-gray-100">
          <div className="flex justify-between text-sm mb-2">
            <span className="text-gray-600">Voortgang</span>
            <span className="font-medium text-gray-900">{progress}% voltooid</span>
          </div>
          <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-amber-500 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        </div>
      </Card>

      {/* Slots Grid */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-bold text-gray-900">Provider Categorieën</h3>
          <Button
            variant="outline"
            onClick={() => setShowAddSlot(!showAddSlot)}
            className="rounded-xl"
            disabled={availableCategories.length === 0}
          >
            <Plus className="w-4 h-4 mr-2" />
            Categorie Toevoegen
          </Button>
        </div>

        {/* Add Slot Dropdown */}
        {showAddSlot && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-4 p-4 bg-gray-50 rounded-xl"
          >
            <p className="text-sm text-gray-600 mb-3">Selecteer een categorie om toe te voegen:</p>
            <div className="flex flex-wrap gap-2">
              {availableCategories.map((cat) => (
                <Button
                  key={cat}
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => handleAddSlot(cat)}
                  disabled={isAddingSlot}
                >
                  <span className="mr-2">{categoryIcons[cat]}</span>
                  {categoryNames[cat]}
                </Button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Slots */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {event.slots.map((slot, index) => (
            <SlotCard
              key={slot.id}
              slot={slot}
              onFindProviders={handleFindProviders}
              onViewQuotes={handleViewQuotes}
              onRemoveSlot={(slotId) => confirmRemoveSlot(slotId, slot.category)}
              index={index}
            />
          ))}
        </div>

        {event.slots.length === 0 && (
          <Card className="p-12 border-2 border-gray-100 rounded-3xl text-center">
            <p className="text-gray-500 mb-4">Nog geen categorieën toegevoegd</p>
            <Button
              variant="default"
              onClick={() => setShowAddSlot(true)}
              className="gradient-brand rounded-xl"
            >
              <Plus className="w-4 h-4 mr-2" />
              Eerste Categorie Toevoegen
            </Button>
          </Card>
        )}
      </div>

      {/* Cost Overview */}
      {(costRange.min > 0 || costRange.max > 0) && (
        <Card className="p-6 border-2 border-gray-100 rounded-3xl">
          <h3 className="text-xl font-bold text-gray-900 mb-4">Kostenoverzicht</h3>
          <div className="space-y-3">
            {event.slots
              .filter((slot) => slot.status === 'BOOKED' || slot.quotes.length > 0)
              .map((slot) => {
                const isBooked = slot.status === 'BOOKED' && slot.bookedQuote;
                const prices = slot.quotes.map((q) => q.totalPrice);
                const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
                const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;

                return (
                  <div
                    key={slot.id}
                    className="flex items-center justify-between py-2 border-b border-gray-100 last:border-0"
                  >
                    <div className="flex items-center gap-2">
                      <span>{categoryIcons[slot.category]}</span>
                      <span className="text-gray-700">
                        {slot.customName || categoryNames[slot.category]}
                      </span>
                      {isBooked && (
                        <Badge className="bg-green-100 text-green-800 text-xs">Geboekt</Badge>
                      )}
                    </div>
                    <span className="font-semibold text-gray-900">
                      {isBooked
                        ? `€${slot.bookedQuote!.totalPrice.toLocaleString()}`
                        : `€${minPrice.toLocaleString()} - €${maxPrice.toLocaleString()}`}
                    </span>
                  </div>
                );
              })}
          </div>
          <div className="mt-4 pt-4 border-t-2 border-gray-200 flex items-center justify-between">
            <span className="text-lg font-bold text-gray-900">Geschat Totaal</span>
            <span className="text-xl font-bold text-gray-900">
              €{costRange.min.toLocaleString()}
              {costRange.max !== costRange.min && ` - €${costRange.max.toLocaleString()}`}
            </span>
          </div>
        </Card>
      )}

      {/* Quotes Modal */}
      {selectedSlot && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedSlotForQuotes(null)}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-3xl max-w-2xl w-full max-h-[80vh] overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{categoryIcons[selectedSlot.category]}</span>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">
                      {selectedSlot.customName || categoryNames[selectedSlot.category]}
                    </h3>
                    <p className="text-sm text-gray-500">
                      {selectedSlot.quotes.length} offerte(s)
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedSlotForQuotes(null)}
                >
                  ✕
                </Button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto max-h-[60vh]">
              {selectedSlot.quotes.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500 mb-4">Nog geen offertes ontvangen</p>
                  <Button
                    variant="default"
                    className="gradient-brand rounded-xl"
                    onClick={() => {
                      setSelectedSlotForQuotes(null);
                      handleFindProviders(selectedSlot.id, selectedSlot.category);
                    }}
                  >
                    Zoek Providers
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedSlot.quotes.map((quote) => (
                    <Card
                      key={quote.id}
                      className={`p-4 border-2 rounded-xl ${
                        quote.accepted
                          ? 'border-green-200 bg-green-50'
                          : 'border-gray-100 hover:border-purple-200'
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-semibold text-gray-900">
                            {quote.provider?.businessName || quote.providerName}
                          </h4>
                          {quote.provider && (
                            <p className="text-sm text-gray-500">{quote.provider.location}</p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-xl font-bold text-gray-900">
                            €{quote.totalPrice.toLocaleString()}
                          </p>
                          {quote.accepted && (
                            <Badge className="bg-green-100 text-green-800">Geaccepteerd</Badge>
                          )}
                        </div>
                      </div>

                      {quote.message && (
                        <p className="text-sm text-gray-600 mb-3">{quote.message}</p>
                      )}

                      {!quote.accepted && (
                        <div className="flex gap-2">
                          <Button
                            variant="default"
                            size="sm"
                            className="flex-1 gradient-brand rounded-xl"
                          >
                            Accepteren
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="rounded-xl"
                            onClick={() => setSelectedQuoteForDetails(quote)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Details
                          </Button>
                        </div>
                      )}
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}

      {/* Quote Details Dialog */}
      <ConfirmationDialog
        open={!!selectedQuoteForDetails}
        onOpenChange={(open) => !open && setSelectedQuoteForDetails(null)}
        title="Offerte Details"
        description={`Bekijk de volledige details van deze offerte`}
      >
        {selectedQuoteForDetails && (
          <div className="space-y-4">
            {/* Provider Info */}
            <div className="flex items-center gap-4 p-4 bg-purple-50 rounded-xl">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-xl">
                {selectedQuoteForDetails.provider?.category ? 
                  categoryIcons[mapCategoryToEnum(selectedQuoteForDetails.provider.category) as ProviderCategory || 'OTHER'] : '📋'}
              </div>
              <div className="flex-1">
                <h4 className="font-bold text-gray-900">
                  {selectedQuoteForDetails.provider?.businessName || selectedQuoteForDetails.providerName}
                </h4>
                {selectedQuoteForDetails.provider && (
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                    <MapPin className="w-3 h-3" />
                    {selectedQuoteForDetails.provider.location}
                    {selectedQuoteForDetails.provider.rating && (
                      <>
                        <span>•</span>
                        <Star className="w-3 h-3 text-amber-500" />
                        {selectedQuoteForDetails.provider.rating}
                      </>
                    )}
                  </div>
                )}
              </div>
              <div className="text-right">
                <p className="text-2xl font-bold text-gray-900">
                  €{selectedQuoteForDetails.totalPrice.toLocaleString()}
                </p>
              </div>
            </div>

            {/* Included Services */}
            {selectedQuoteForDetails.includedServices && selectedQuoteForDetails.includedServices.length > 0 && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Inbegrepen diensten</h5>
                <div className="space-y-1">
                  {selectedQuoteForDetails.includedServices.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-sm text-gray-600">
                      <Check className="w-4 h-4 text-green-500" />
                      {service}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Message */}
            {selectedQuoteForDetails.message && (
              <div>
                <h5 className="text-sm font-medium text-gray-700 mb-2">Bericht van de provider</h5>
                <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded-xl">
                  {selectedQuoteForDetails.message}
                </p>
              </div>
            )}

            {/* Validity */}
            {selectedQuoteForDetails.validUntil && (
              <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                <span className="text-sm text-amber-700">Geldig tot</span>
                <span className="text-sm font-medium text-amber-800">
                  {formatDate(selectedQuoteForDetails.validUntil)}
                </span>
              </div>
            )}
          </div>
        )}

        <DialogActions>
          <DialogButton
            onClick={() => setSelectedQuoteForDetails(null)}
            variant="outline"
          >
            Sluiten
          </DialogButton>
          <DialogButton
            onClick={() => {
              // TODO: Implement accept quote functionality
              setSelectedQuoteForDetails(null);
            }}
            variant="success"
          >
            <Check className="w-4 h-4 mr-1" />
            Accepteren
          </DialogButton>
        </DialogActions>
      </ConfirmationDialog>

      {/* Remove Slot Confirmation Dialog */}
      <ConfirmationDialog
        open={!!slotToRemove}
        onOpenChange={(open) => !open && setSlotToRemove(null)}
        title="Categorie verwijderen?"
        description="Weet je zeker dat je deze categorie uit je event wilt verwijderen?"
      >
        {slotToRemove && (
          <div className="flex items-center gap-4 p-4 bg-red-50 rounded-xl mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center text-xl">
              {categoryIcons[slotToRemove.category]}
            </div>
            <div>
              <h4 className="font-bold text-gray-900">{categoryNames[slotToRemove.category]}</h4>
              <p className="text-sm text-red-600">Wordt verwijderd uit je event</p>
            </div>
          </div>
        )}

        <DialogWarning
          type="warning"
          title="Let op!"
          message="Als er offertes gekoppeld zijn aan deze categorie, worden deze losgekoppeld."
        />

        <DialogActions>
          <DialogButton
            onClick={() => setSlotToRemove(null)}
            variant="outline"
          >
            Annuleren
          </DialogButton>
          <DialogButton
            onClick={handleRemoveSlot}
            variant="danger"
            loading={isRemovingSlot}
          >
            <Trash2 className="w-4 h-4 mr-1" />
            Verwijderen
          </DialogButton>
        </DialogActions>
      </ConfirmationDialog>
    </div>
  );
}
