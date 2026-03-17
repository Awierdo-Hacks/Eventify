'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useSession } from '@/components/providers/SessionProvider';
import { Container } from '@/components/layout';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Plus,
  X,
  Calendar,
  MapPin,
  Users,
  Euro,
  AlertCircle,
} from 'lucide-react';
import {
  EventType,
  ProviderCategory,
  eventTemplates,
  eventTypeIcons,
  eventTypeNames,
  eventTypeDescriptions,
  categoryIcons,
  categoryNames,
  getAllCategories,
} from '@/lib/eventHelpers';

type WizardStep = 1 | 2 | 3;

interface SlotConfig {
  category: ProviderCategory;
  isRequired: boolean;
  customName?: string;
}

export default function NewEventPage() {
  const router = useRouter();
  const { user, status } = useSession();
  
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Step 1: Event type
  const [selectedType, setSelectedType] = useState<EventType | null>(null);
  
  // Step 2: Slots
  const [slots, setSlots] = useState<SlotConfig[]>([]);
  const [showAddSlot, setShowAddSlot] = useState(false);
  
  // Step 3: Details
  const [eventDetails, setEventDetails] = useState({
    name: '',
    eventDate: '',
    location: '',
    guestCount: '',
    budgetMin: '',
    budgetMax: '',
  });

  // Redirect if not authenticated
  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/login?redirect=/events/new');
    }
  }, [status, router]);

  // Initialize slots when event type is selected
  useEffect(() => {
    if (selectedType) {
      const template = eventTemplates[selectedType];
      const initialSlots: SlotConfig[] = [
        ...template.requiredSlots.map((cat) => ({
          category: cat as ProviderCategory,
          isRequired: true,
        })),
      ];
      setSlots(initialSlots);
    }
  }, [selectedType]);

  const handleSelectType = (type: EventType) => {
    setSelectedType(type);
    setCurrentStep(2);
  };

  const handleToggleSlot = (category: ProviderCategory, isOptional: boolean) => {
    const exists = slots.find((s) => s.category === category);
    if (exists) {
      setSlots(slots.filter((s) => s.category !== category));
    } else {
      setSlots([...slots, { category, isRequired: !isOptional }]);
    }
  };

  const handleAddCustomSlot = (category: ProviderCategory) => {
    if (!slots.find((s) => s.category === category)) {
      setSlots([...slots, { category, isRequired: false }]);
    }
    setShowAddSlot(false);
  };

  const handleRemoveSlot = (category: ProviderCategory) => {
    setSlots(slots.filter((s) => s.category !== category));
  };

  const handleSubmit = async () => {
    if (!eventDetails.name.trim()) {
      setError('Geef je event een naam');
      return;
    }

    if (slots.length === 0) {
      setError('Voeg minimaal één provider-categorie toe');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/events', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: eventDetails.name.trim(),
          eventType: selectedType,
          eventDate: eventDetails.eventDate || null,
          location: eventDetails.location.trim() || null,
          guestCount: eventDetails.guestCount ? parseInt(eventDetails.guestCount) : null,
          budgetMin: eventDetails.budgetMin ? parseFloat(eventDetails.budgetMin) : null,
          budgetMax: eventDetails.budgetMax ? parseFloat(eventDetails.budgetMax) : null,
          slots: slots.map((slot, index) => ({
            category: slot.category,
            isRequired: slot.isRequired,
            displayOrder: index,
          })),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Er is iets misgegaan');
      }

      const event = await response.json();
      router.push(`/dashboard?tab=events&event=${event.id}&success=created`);
    } catch (err) {
      console.error('Error creating event:', err);
      setError(err instanceof Error ? err.message : 'Er is iets misgegaan');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading') {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Laden...</div>
      </main>
    );
  }

  if (!user) {
    return null;
  }

  const template = selectedType ? eventTemplates[selectedType] : null;
  const availableCategories = getAllCategories().filter(
    (cat) => !slots.find((s) => s.category === cat.id)
  );

  return (
    <main className="min-h-screen bg-gradient-to-b from-purple-50 via-white to-amber-50">
      <Container className="py-8">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Terug
          </Button>
          
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">
            <span className="gradient-text">Nieuw Event</span>
          </h1>
          <p className="text-xl text-gray-600">
            Plan je event in 3 eenvoudige stappen
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          {[1, 2, 3].map((step) => (
            <div key={step} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  currentStep >= step
                    ? 'bg-gradient-to-r from-purple-600 to-amber-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {currentStep > step ? <Check className="w-5 h-5" /> : step}
              </div>
              {step < 3 && (
                <div
                  className={`w-12 sm:w-24 h-1 mx-1 sm:mx-2 rounded transition-colors ${
                    currentStep > step ? 'bg-purple-500' : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>

        {/* Error Message */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-600">{error}</p>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* Step 1: Event Type Selection */}
          {currentStep === 1 && (
            <motion.div
              key="step1"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Wat voor event plan je?
                </h2>
                <p className="text-gray-600">
                  Kies een type en we helpen je met een template
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl mx-auto">
                {(Object.keys(eventTemplates) as EventType[]).map((type) => (
                  <motion.div
                    key={type}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      className={`p-6 border-2 rounded-3xl cursor-pointer transition-all ${
                        selectedType === type
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-100 hover:border-purple-200 hover:shadow-lg'
                      }`}
                      onClick={() => handleSelectType(type)}
                    >
                      <div className="text-4xl mb-4">{eventTypeIcons[type]}</div>
                      <h3 className="text-xl font-semibold text-gray-900 mb-2">
                        {eventTypeNames[type]}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {eventTypeDescriptions[type]}
                      </p>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Step 2: Configure Slots */}
          {currentStep === 2 && template && (
            <motion.div
              key="step2"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Welke providers heb je nodig?
                </h2>
                <p className="text-gray-600">
                  Pas de aanbevolen categorieën aan naar jouw wensen
                </p>
              </div>

              <Card className="p-4 sm:p-8 border-2 border-gray-100 rounded-3xl max-w-3xl mx-auto">
                {/* Selected Slots */}
                <div className="mb-8">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Geselecteerde categorieën
                  </h3>
                  <div className="flex flex-wrap gap-3">
                    {slots.map((slot) => (
                      <Badge
                        key={slot.category}
                        className={`px-4 py-2 text-base flex items-center gap-2 ${
                          slot.isRequired
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-700'
                        }`}
                      >
                        <span>{categoryIcons[slot.category]}</span>
                        <span>{categoryNames[slot.category]}</span>
                        <button
                          onClick={() => handleRemoveSlot(slot.category)}
                          className="ml-1 p-1 -mr-1 rounded-full hover:text-red-600 active:text-red-600 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </Badge>
                    ))}
                    {slots.length === 0 && (
                      <p className="text-gray-500 italic">Geen categorieën geselecteerd</p>
                    )}
                  </div>
                </div>

                {/* Optional Slots from Template */}
                {template.optionalSlots.length > 0 && (
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                      Optionele categorieën
                    </h3>
                    <div className="flex flex-wrap gap-3">
                      {template.optionalSlots.map((cat) => {
                        const category = cat as ProviderCategory;
                        const isSelected = slots.find((s) => s.category === category);
                        return (
                          <Badge
                            key={category}
                            className={`px-4 py-2 text-base cursor-pointer transition-all ${
                              isSelected
                                ? 'bg-green-100 text-green-800'
                                : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
                            }`}
                            onClick={() => handleToggleSlot(category, true)}
                          >
                            <span className="mr-2">{categoryIcons[category]}</span>
                            {categoryNames[category]}
                            {isSelected && <Check className="w-4 h-4 ml-2" />}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Add Custom Category */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Andere categorieën
                  </h3>
                  
                  {showAddSlot ? (
                    <div className="p-4 bg-gray-50 rounded-xl">
                      <p className="text-sm text-gray-600 mb-3">Selecteer een categorie:</p>
                      <div className="flex flex-wrap gap-2">
                        {availableCategories.map((cat) => (
                          <Badge
                            key={cat.id}
                            className="px-3 py-1.5 bg-white border border-gray-200 text-gray-700 cursor-pointer hover:border-purple-300 hover:bg-purple-50"
                            onClick={() => handleAddCustomSlot(cat.id)}
                          >
                            <span className="mr-1">{cat.icon}</span>
                            {cat.name}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="mt-3"
                        onClick={() => setShowAddSlot(false)}
                      >
                        Annuleren
                      </Button>
                    </div>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setShowAddSlot(true)}
                      className="rounded-xl"
                      disabled={availableCategories.length === 0}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      Categorie toevoegen
                    </Button>
                  )}
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(1)}
                    className="rounded-xl"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Terug
                  </Button>
                  <Button
                    onClick={() => setCurrentStep(3)}
                    className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
                    disabled={slots.length === 0}
                  >
                    Volgende
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* Step 3: Event Details */}
          {currentStep === 3 && (
            <motion.div
              key="step3"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              <div className="text-center mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  Event Details
                </h2>
                <p className="text-gray-600">
                  Vul de basisgegevens in (alleen naam is verplicht)
                </p>
              </div>

              <Card className="p-4 sm:p-8 border-2 border-gray-100 rounded-3xl max-w-2xl mx-auto">
                <div className="space-y-6">
                  {/* Event Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Event Naam <span className="text-red-500">*</span>
                    </label>
                    <Input
                      value={eventDetails.name}
                      onChange={(e) => setEventDetails({ ...eventDetails, name: e.target.value })}
                      placeholder="Bijv. Bruiloft Jan & Marie"
                      className="rounded-xl border-2 border-gray-100 h-12"
                    />
                  </div>

                  {/* Event Date */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Calendar className="w-4 h-4 inline mr-2" />
                      Datum (optioneel)
                    </label>
                    <Input
                      type="date"
                      value={eventDetails.eventDate}
                      onChange={(e) => setEventDetails({ ...eventDetails, eventDate: e.target.value })}
                      className="rounded-xl border-2 border-gray-100 h-12"
                    />
                  </div>

                  {/* Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <MapPin className="w-4 h-4 inline mr-2" />
                      Locatie (optioneel)
                    </label>
                    <Input
                      value={eventDetails.location}
                      onChange={(e) => setEventDetails({ ...eventDetails, location: e.target.value })}
                      placeholder="Bijv. Amsterdam"
                      className="rounded-xl border-2 border-gray-100 h-12"
                    />
                  </div>

                  {/* Guest Count */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Users className="w-4 h-4 inline mr-2" />
                      Aantal gasten (optioneel)
                    </label>
                    <Input
                      type="number"
                      value={eventDetails.guestCount}
                      onChange={(e) => setEventDetails({ ...eventDetails, guestCount: e.target.value })}
                      placeholder="Bijv. 100"
                      className="rounded-xl border-2 border-gray-100 h-12"
                    />
                  </div>

                  {/* Budget */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      <Euro className="w-4 h-4 inline mr-2" />
                      Budget indicatie (optioneel)
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <Input
                        type="number"
                        value={eventDetails.budgetMin}
                        onChange={(e) => setEventDetails({ ...eventDetails, budgetMin: e.target.value })}
                        placeholder="Min €"
                        className="rounded-xl border-2 border-gray-100 h-12"
                      />
                      <Input
                        type="number"
                        value={eventDetails.budgetMax}
                        onChange={(e) => setEventDetails({ ...eventDetails, budgetMax: e.target.value })}
                        placeholder="Max €"
                        className="rounded-xl border-2 border-gray-100 h-12"
                      />
                    </div>
                  </div>

                  {/* Summary */}
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <h4 className="font-semibold text-gray-900 mb-2">Samenvatting</h4>
                    <div className="text-sm text-gray-600 space-y-1">
                      <p>
                        <strong>Type:</strong> {selectedType ? eventTypeNames[selectedType] : '-'}
                      </p>
                      <p>
                        <strong>Categorieën:</strong> {slots.length} geselecteerd
                      </p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {slots.map((slot) => (
                          <span key={slot.category} className="text-lg" title={categoryNames[slot.category]}>
                            {categoryIcons[slot.category]}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Navigation */}
                <div className="flex justify-between mt-8 pt-6 border-t border-gray-100">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentStep(2)}
                    className="rounded-xl"
                    disabled={isSubmitting}
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Terug
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    className="rounded-xl border-2 border-purple-400 text-purple-700 bg-white hover:bg-purple-50 transition-colors h-10 px-6 text-sm shadow-sm"
                    disabled={isSubmitting || !eventDetails.name.trim()}
                  >
                    {isSubmitting ? (
                      <>
                        <span className="animate-spin mr-2">⏳</span>
                        Aanmaken...
                      </>
                    ) : (
                      <>
                        Event Aanmaken
                        <Check className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </Container>
    </main>
  );
}
