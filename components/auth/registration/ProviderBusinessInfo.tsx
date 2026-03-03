'use client';

import { motion } from 'framer-motion';
import { Building2, MapPin, Tag, FileText } from 'lucide-react';

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
  { value: '€', label: '€ — Budget' },
  { value: '€€', label: '€€ — Gemiddeld' },
  { value: '€€€', label: '€€€ — Premium' },
  { value: '€€€€', label: '€€€€ — Luxe' },
];

interface ProviderBusinessData {
  businessName: string;
  category: string;
  description: string;
  location: string;
  priceRange: string;
}

interface ProviderBusinessInfoProps {
  data: ProviderBusinessData;
  onChange: (data: ProviderBusinessData) => void;
  errors: Record<string, string>;
}

export default function ProviderBusinessInfo({ data, onChange, errors }: ProviderBusinessInfoProps) {
  const updateField = (field: keyof ProviderBusinessData, value: string) => {
    onChange({ ...data, [field]: value });
  };

  const inputClass = (field: string) =>
    `w-full pl-10 pr-4 h-12 rounded-xl border-2 ${
      errors[field] ? 'border-red-300 bg-red-50' : 'border-gray-100'
    } focus:border-purple-500 focus:ring-0 outline-none transition-colors`;

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center">
          <Building2 className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Bedrijfsgegevens</h2>
        <p className="text-gray-600">Vertel ons over je bedrijf</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        {/* Bedrijfsnaam */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Bedrijfsnaam</label>
          <div className="relative">
            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={data.businessName}
              onChange={(e) => updateField('businessName', e.target.value)}
              placeholder="Bijv. Chef's Delight Catering"
              className={inputClass('businessName')}
            />
          </div>
          {errors.businessName && <p className="text-xs text-red-500">{errors.businessName}</p>}
        </div>

        {/* Categorie */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Categorie</label>
          <div className="relative">
            <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <select
              value={data.category}
              onChange={(e) => updateField('category', e.target.value)}
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
          <label className="text-sm font-medium text-gray-700">Locatie</label>
          <div className="relative">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={data.location}
              onChange={(e) => updateField('location', e.target.value)}
              placeholder="Bijv. Amsterdam"
              className={inputClass('location')}
            />
          </div>
          {errors.location && <p className="text-xs text-red-500">{errors.location}</p>}
        </div>

        {/* Prijsklasse */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Prijsklasse</label>
          <div className="grid grid-cols-2 gap-3">
            {PRICE_RANGES.map((range) => (
              <button
                key={range.value}
                type="button"
                onClick={() => updateField('priceRange', range.value)}
                className={`p-3 rounded-xl border-2 text-sm font-medium transition-all ${
                  data.priceRange === range.value
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
          <label className="text-sm font-medium text-gray-700">Beschrijving</label>
          <div className="relative">
            <FileText className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
            <textarea
              value={data.description}
              onChange={(e) => updateField('description', e.target.value)}
              placeholder="Beschrijf je bedrijf en diensten... (min. 50 karakters)"
              rows={4}
              className={`w-full pl-10 pr-4 py-3 rounded-xl border-2 ${
                errors.description ? 'border-red-300 bg-red-50' : 'border-gray-100'
              } focus:border-purple-500 focus:ring-0 outline-none transition-colors resize-none`}
            />
          </div>
          <div className="flex justify-between">
            {errors.description && <p className="text-xs text-red-500">{errors.description}</p>}
            <p
              className={`text-xs ml-auto ${data.description.length >= 50 ? 'text-green-500' : 'text-gray-400'}`}
            >
              {data.description.length}/50 min
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
