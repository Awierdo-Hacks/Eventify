'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Building2,
  MapPin,
  Tag,
  FileText,
  Phone,
  Globe,
  Calendar,
  Clock,
  Users,
  Camera,
  Upload,
  X,
  Plus,
  Trash2,
  Loader2,
  Save,
  Eye,
  CheckCircle,
} from 'lucide-react';

const CATEGORIES = [
  { value: 'catering', label: '🍽️ Catering & Food' },
  { value: 'dj', label: '🎵 DJ & Muziek' },
  { value: 'photography', label: '📸 Fotografie' },
  { value: 'decoration', label: '✨ Decoratie & Styling' },
  { value: 'venues', label: '🏛️ Locaties & Zalen' },
  { value: 'entertainment', label: '🎭 Entertainment' },
  { value: 'flowers', label: '💐 Bloemen & Arrangementen' },
  { value: 'video', label: '🎥 Videografie' },
  { value: 'planning', label: '📋 Event Planning' },
  { value: 'transport', label: '🚗 Transport' },
];

const PRICE_RANGES = [
  { value: 'LOW', label: '€ — Budget' },
  { value: 'MEDIUM', label: '€€ — Gemiddeld' },
  { value: 'HIGH', label: '€€€ — Premium' },
  { value: 'PREMIUM', label: '€€€€ — Luxe' },
];

interface ProviderService {
  id?: string;
  name: string;
  description: string;
  priceFrom: number | string;
  priceTo: number | string | null;
}

interface ProfileData {
  id: string;
  businessName: string;
  category: string;
  description: string;
  location: string;
  priceRange: string;
  phone: string;
  website: string;
  availability: string;
  responseTime: string;
  minGuests: number | null;
  maxGuests: number | null;
  images: string[];
  portfolioImages: string[];
  services: string[];
  providerServices: ProviderService[];
  verified: boolean;
}

interface ProfileEditFormProps {
  initialData: ProfileData;
  onSave: () => void;
}

export default function ProfileEditForm({ initialData, onSave }: ProfileEditFormProps) {
  // Form state
  const [businessName, setBusinessName] = useState(initialData.businessName);
  const [category, setCategory] = useState(initialData.category);
  const [description, setDescription] = useState(initialData.description);
  const [location, setLocation] = useState(initialData.location);
  const [priceRange, setPriceRange] = useState(initialData.priceRange);
  const [phone, setPhone] = useState(initialData.phone);
  const [website, setWebsite] = useState(initialData.website);
  const [availability, setAvailability] = useState(initialData.availability);
  const [responseTime, setResponseTime] = useState(initialData.responseTime);
  const [minGuests, setMinGuests] = useState<string>(initialData.minGuests?.toString() || '');
  const [maxGuests, setMaxGuests] = useState<string>(initialData.maxGuests?.toString() || '');
  const [images, setImages] = useState<string[]>(initialData.images);
  const [providerServices, setProviderServices] = useState<ProviderService[]>(
    initialData.providerServices
  );

  // New service form
  const [newServiceName, setNewServiceName] = useState('');
  const [newServiceDesc, setNewServiceDesc] = useState('');
  const [newServicePriceFrom, setNewServicePriceFrom] = useState('');
  const [newServicePriceTo, setNewServicePriceTo] = useState('');

  // UI state
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [successMessage, setSuccessMessage] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 h-12 rounded-xl border-2 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-100'
    } focus:border-purple-500 focus:ring-0 outline-none transition-colors`;

  const inputClassSimple = (field: string) =>
    `w-full px-4 h-12 rounded-xl border-2 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-100'
    } focus:border-purple-500 focus:ring-0 outline-none transition-colors`;

  // ===== VALIDATION =====
  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!businessName.trim()) newErrors.businessName = 'Bedrijfsnaam is verplicht';
    if (!category) newErrors.category = 'Categorie is verplicht';
    if (!location.trim()) newErrors.location = 'Locatie is verplicht';
    if (!description.trim() || description.trim().length < 50) {
      newErrors.description = 'Beschrijving moet minimaal 50 karakters zijn';
    }
    if (!priceRange) newErrors.priceRange = 'Prijsklasse is verplicht';

    if (minGuests && maxGuests && parseInt(minGuests) > parseInt(maxGuests)) {
      newErrors.maxGuests = 'Maximum moet hoger zijn dan minimum';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ===== IMAGE UPLOAD =====
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const remaining = 6 - images.length;
    if (remaining <= 0) {
      setErrors({ ...errors, images: 'Maximum 6 foto\'s bereikt' });
      return;
    }

    setUploading(true);
    try {
      const toUpload = files.slice(0, remaining);
      const uploadedUrls: string[] = [];

      for (const file of toUpload) {
        const formData = new FormData();
        formData.append('file', file);
        const res = await fetch('/api/upload', { method: 'POST', body: formData });
        if (!res.ok) throw new Error('Upload mislukt');
        const data = await res.json();
        uploadedUrls.push(data.url);
      }

      setImages([...images, ...uploadedUrls]);
    } catch {
      setErrors({ ...errors, images: 'Foto upload mislukt, probeer opnieuw' });
    } finally {
      setUploading(false);
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  // ===== SERVICES =====
  const addService = () => {
    if (!newServiceName.trim() || !newServicePriceFrom) return;

    setProviderServices([
      ...providerServices,
      {
        name: newServiceName.trim(),
        description: newServiceDesc.trim(),
        priceFrom: parseFloat(newServicePriceFrom) || 0,
        priceTo: newServicePriceTo ? parseFloat(newServicePriceTo) : null,
      },
    ]);

    setNewServiceName('');
    setNewServiceDesc('');
    setNewServicePriceFrom('');
    setNewServicePriceTo('');
  };

  const removeService = (index: number) => {
    setProviderServices(providerServices.filter((_, i) => i !== index));
  };

  // ===== SAVE =====
  const handleSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setErrors({});
    setSuccessMessage('');

    try {
      const res = await fetch(`/api/providers/${initialData.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessName: businessName.trim(),
          category,
          description: description.trim(),
          location: location.trim(),
          priceRange,
          phone: phone.trim() || null,
          website: website.trim() || null,
          availability: availability.trim() || null,
          responseTime: responseTime.trim() || null,
          minGuests: minGuests ? parseInt(minGuests) : null,
          maxGuests: maxGuests ? parseInt(maxGuests) : null,
          images,
          portfolioImages: images.slice(1), // First image = profile, rest = portfolio
          services: providerServices.map((s) => s.name),
          providerServices: providerServices.map((s) => ({
            name: s.name,
            description: s.description || null,
            priceFrom: typeof s.priceFrom === 'string' ? parseFloat(s.priceFrom) || 0 : s.priceFrom,
            priceTo: s.priceTo
              ? typeof s.priceTo === 'string' ? parseFloat(s.priceTo) : s.priceTo
              : null,
          })),
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        if (data.errors) {
          setErrors(data.errors);
        } else {
          throw new Error(data.error || 'Opslaan mislukt');
        }
        return;
      }

      setSuccessMessage('Profiel succesvol bijgewerkt!');
      setTimeout(() => setSuccessMessage(''), 5000);
      onSave();
    } catch (err) {
      setErrors({ general: err instanceof Error ? err.message : 'Er is iets misgegaan' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Success message */}
      {successMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-50 border-2 border-green-200 rounded-xl flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-green-800 font-semibold">{successMessage}</span>
        </motion.div>
      )}

      {/* General error */}
      {errors.general && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-50 border-2 border-red-200 rounded-xl flex items-center gap-3"
        >
          <X className="w-5 h-5 text-red-600" />
          <span className="text-red-800 font-semibold">{errors.general}</span>
        </motion.div>
      )}

      {/* Verification badge */}
      {initialData.verified && (
        <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-xl">
          <CheckCircle className="w-5 h-5 text-green-600" />
          <span className="text-sm text-green-800 font-medium">Je profiel is geverifieerd ✓</span>
        </div>
      )}

      {/* ===== SECTIE 1: BEDRIJFSINFORMATIE ===== */}
      <Card className="p-6 border-2 border-gray-100 rounded-3xl">
        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Building2 className="w-6 h-6 text-purple-600" />
          Bedrijfsinformatie
        </h3>
        <p className="text-sm text-gray-500 mb-6">Basisgegevens van je bedrijf</p>

        <div className="space-y-5">
          {/* Bedrijfsnaam */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bedrijfsnaam *</label>
            <div className="relative">
              <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="Bijv. Chef's Delight Catering"
                className={inputClass('businessName')}
              />
            </div>
            {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
          </div>

          {/* Categorie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Categorie *</label>
            <div className="relative">
              <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className={`${inputClass('category')} appearance-none bg-white`}
              >
                <option value="">Selecteer een categorie</option>
                {CATEGORIES.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.category && <p className="text-xs text-red-500">{errors.category}</p>}
          </div>

          {/* Locatie */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Locatie *</label>
            <div className="relative">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Bijv. Amsterdam"
                className={inputClass('location')}
              />
            </div>
            {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
          </div>

          {/* Prijsklasse */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Prijsklasse *</label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {PRICE_RANGES.map((range) => (
                <button
                  key={range.value}
                  type="button"
                  onClick={() => setPriceRange(range.value)}
                  className={`p-3 min-h-[44px] rounded-xl border-2 text-sm font-medium transition-all ${
                    priceRange === range.value
                      ? 'border-purple-500 bg-purple-50 text-purple-700'
                      : 'border-gray-100 text-gray-600 hover:border-purple-200'
                  }`}
                >
                  {range.label}
                </button>
              ))}
            </div>
            {errors.priceRange && <p className="text-xs text-red-500">{errors.priceRange}</p>}
          </div>

          {/* Beschrijving */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Beschrijving *</label>
            <div className="relative">
              <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Beschrijf je bedrijf en diensten... (min. 50 karakters)"
                rows={4}
                className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${
                  errors.description ? 'border-red-300 bg-red-50' : 'border-gray-100'
                } focus:border-purple-500 focus:ring-0 outline-none transition-colors resize-none`}
              />
            </div>
            <div className="flex justify-between">
              {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
              <p className={`text-xs ml-auto ${description.length >= 50 ? 'text-green-500' : 'text-gray-400'}`}>
                {description.length}/50 min
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* ===== SECTIE 2: CONTACT & BEREIKBAARHEID ===== */}
      <Card className="p-6 border-2 border-gray-100 rounded-3xl">
        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Phone className="w-6 h-6 text-purple-600" />
          Contact & Bereikbaarheid
        </h3>
        <p className="text-sm text-gray-500 mb-6">Hoe kunnen klanten je bereiken?</p>

        <div className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Telefoon */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Telefoonnummer</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="06 12345678"
                  className={inputClass('phone')}
                />
              </div>
            </div>

            {/* Website */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Website</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="url"
                  value={website}
                  onChange={(e) => setWebsite(e.target.value)}
                  placeholder="https://jouwbedrijf.nl"
                  className={inputClass('website')}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {/* Beschikbaarheid */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Beschikbaarheid</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={availability}
                  onChange={(e) => setAvailability(e.target.value)}
                  placeholder="Bijv. Ma-Za, weekenden op aanvraag"
                  className={inputClass('availability')}
                />
              </div>
            </div>

            {/* Reactietijd */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Reactietijd</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={responseTime}
                  onChange={(e) => setResponseTime(e.target.value)}
                  placeholder="Bijv. Binnen 24 uur"
                  className={inputClass('responseTime')}
                />
              </div>
            </div>
          </div>

          {/* Min/Max Gasten */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Minimum gasten</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={minGuests}
                  onChange={(e) => setMinGuests(e.target.value)}
                  placeholder="Bijv. 10"
                  min="0"
                  className={inputClass('minGuests')}
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Maximum gasten</label>
              <div className="relative">
                <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="number"
                  value={maxGuests}
                  onChange={(e) => setMaxGuests(e.target.value)}
                  placeholder="Bijv. 200"
                  min="0"
                  className={inputClass('maxGuests')}
                />
              </div>
              {errors.maxGuests && <p className="text-xs text-red-500">{errors.maxGuests}</p>}
            </div>
          </div>
        </div>
      </Card>

      {/* ===== SECTIE 3: FOTO'S & PORTFOLIO ===== */}
      <Card className="p-6 border-2 border-gray-100 rounded-3xl">
        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Camera className="w-6 h-6 text-purple-600" />
          Foto&apos;s & Portfolio
        </h3>
        <p className="text-sm text-gray-500 mb-6">
          Voeg foto&apos;s toe om klanten te overtuigen (max. 6)
        </p>

        {/* Current images grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-4">
          {images.map((img, index) => (
            <div key={index} className="relative group rounded-xl overflow-hidden border-2 border-gray-100 aspect-video">
              <img src={img} alt={`Foto ${index + 1}`} className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeImage(index)}
                className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center md:opacity-0 md:group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="w-4 h-4" />
              </button>
              {index === 0 && (
                <Badge className="absolute bottom-2 left-2 bg-purple-600 text-white text-xs">
                  Hoofdfoto
                </Badge>
              )}
            </div>
          ))}

          {/* Upload button */}
          {images.length < 6 && (
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="border-2 border-dashed border-gray-200 rounded-xl aspect-video flex flex-col items-center justify-center text-gray-400 hover:border-purple-400 hover:text-purple-500 transition-colors cursor-pointer"
            >
              {uploading ? (
                <Loader2 className="w-8 h-8 animate-spin" />
              ) : (
                <>
                  <Upload className="w-8 h-8 mb-2" />
                  <span className="text-sm">Foto toevoegen</span>
                </>
              )}
            </button>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml,image/gif,image/bmp,image/tiff"
          multiple
          className="hidden"
          onChange={handleImageUpload}
        />

        {errors.images && <p className="text-xs text-red-500 mt-2">{errors.images}</p>}

        <p className="text-xs text-gray-400 mt-2">
          JPG, PNG of WebP · Max 5MB per foto · De eerste foto wordt je hoofdfoto
        </p>
      </Card>

      {/* ===== SECTIE 4: DIENSTEN ===== */}
      <Card className="p-6 border-2 border-gray-100 rounded-3xl">
        <h3 className="text-xl font-bold text-gray-900 mb-1 flex items-center gap-2">
          <Tag className="w-6 h-6 text-purple-600" />
          Diensten
        </h3>
        <p className="text-sm text-gray-500 mb-6">Welke diensten bied je aan?</p>

        {/* Existing services */}
        {providerServices.length > 0 && (
          <div className="space-y-3 mb-6">
            {providerServices.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-xl"
              >
                <div className="flex-1">
                  <p className="font-semibold text-gray-900">{service.name}</p>
                  {service.description && (
                    <p className="text-sm text-gray-600 mt-0.5">{service.description}</p>
                  )}
                  <p className="text-sm text-purple-600 font-medium mt-1">
                    €{typeof service.priceFrom === 'string' ? service.priceFrom : service.priceFrom.toFixed(0)}
                    {service.priceTo && ` — €${typeof service.priceTo === 'string' ? service.priceTo : service.priceTo.toFixed(0)}`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeService(index)}
                  className="ml-4 p-3 text-red-400 hover:text-red-600 active:text-red-600 hover:bg-red-50 active:bg-red-50 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Add new service */}
        <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl space-y-3">
          <p className="text-sm font-medium text-gray-700">Nieuwe dienst toevoegen</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              type="text"
              value={newServiceName}
              onChange={(e) => setNewServiceName(e.target.value)}
              placeholder="Naam dienst *"
              className={inputClassSimple('newServiceName')}
            />
            <input
              type="text"
              value={newServiceDesc}
              onChange={(e) => setNewServiceDesc(e.target.value)}
              placeholder="Korte beschrijving"
              className={inputClassSimple('newServiceDesc')}
            />
            <input
              type="number"
              value={newServicePriceFrom}
              onChange={(e) => setNewServicePriceFrom(e.target.value)}
              placeholder="Prijs vanaf (€) *"
              min="0"
              className={inputClassSimple('newServicePriceFrom')}
            />
            <input
              type="number"
              value={newServicePriceTo}
              onChange={(e) => setNewServicePriceTo(e.target.value)}
              placeholder="Prijs tot (€, optioneel)"
              min="0"
              className={inputClassSimple('newServicePriceTo')}
            />
          </div>
          <Button
            type="button"
            variant="outline"
            onClick={addService}
            disabled={!newServiceName.trim() || !newServicePriceFrom}
            className="rounded-xl"
          >
            <Plus className="w-4 h-4 mr-2" />
            Dienst toevoegen
          </Button>
        </div>
      </Card>

      {/* ===== SAVE BUTTON ===== */}
      <div className="flex items-center justify-between pt-2">
        <a
          href={`/providers/${initialData.id}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 text-sm text-purple-600 hover:text-purple-700 font-medium"
        >
          <Eye className="w-4 h-4" />
          Bekijk publiek profiel
        </a>

        <Button
          onClick={handleSave}
          disabled={saving}
          className="rounded-full border border-purple-300 text-purple-700 bg-white hover:bg-purple-100 transition-all h-12 px-8 text-base shadow "
        >
          {saving ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Opslaan...
            </>
          ) : (
            <>
              <Save className="w-5 h-5 mr-2" />
              Profiel Opslaan
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
