'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Camera,
  Upload,
  X,
  Plus,
  Trash2,
  Star,
  MapPin,
  CheckCircle,
  Image as ImageIcon,
  Eye,
} from 'lucide-react';
import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface Service {
  name: string;
  description: string;
  priceFrom: string;
  priceTo: string;
}

interface ProviderPortfolioData {
  profileImage: File | null;
  profileImagePreview: string;
  portfolioImages: File[];
  portfolioImagePreviews: string[];
  services: Service[];
}

interface ProviderPortfolioProps {
  data: ProviderPortfolioData;
  onChange: (data: ProviderPortfolioData) => void;
  errors: Record<string, string>;
  businessName: string;
  category: string;
  location: string;
  priceRange: string;
  description: string;
}

const PRICE_MAP: Record<string, string> = {
  '€': '€',
  '€€': '€€',
  '€€€': '€€€',
  '€€€€': '€€€€',
};

export default function ProviderPortfolio({
  data,
  onChange,
  errors,
  businessName,
  category,
  location,
  priceRange,
  description,
}: ProviderPortfolioProps) {
  const [showPreview, setShowPreview] = useState(false);
  const [newService, setNewService] = useState<Service>({
    name: '',
    description: '',
    priceFrom: '',
    priceTo: '',
  });
  const profileInputRef = useRef<HTMLInputElement>(null);
  const portfolioInputRef = useRef<HTMLInputElement>(null);

  const handleProfileImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const preview = URL.createObjectURL(file);
    onChange({ ...data, profileImage: file, profileImagePreview: preview });
  };

  const handlePortfolioImages = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const remaining = 5 - data.portfolioImages.length;
    const toAdd = files.slice(0, remaining);
    const newPreviews = toAdd.map((f) => URL.createObjectURL(f));
    onChange({
      ...data,
      portfolioImages: [...data.portfolioImages, ...toAdd],
      portfolioImagePreviews: [...data.portfolioImagePreviews, ...newPreviews],
    });
  };

  const removePortfolioImage = (index: number) => {
    const newImages = data.portfolioImages.filter((_, i) => i !== index);
    const newPreviews = data.portfolioImagePreviews.filter((_, i) => i !== index);
    onChange({ ...data, portfolioImages: newImages, portfolioImagePreviews: newPreviews });
  };

  const addService = () => {
    if (!newService.name || !newService.priceFrom) return;
    onChange({ ...data, services: [...data.services, newService] });
    setNewService({ name: '', description: '', priceFrom: '', priceTo: '' });
  };

  const removeService = (index: number) => {
    const newServices = data.services.filter((_, i) => i !== index);
    onChange({ ...data, services: newServices });
  };

  // The provider card as it would appear on the browse page
  const LivePreviewCard = () => {
    const displayImage =
      data.portfolioImagePreviews[0] || data.profileImagePreview || '';
    return (
      <Card className="overflow-hidden border-2 border-gray-100 rounded-3xl h-full max-w-sm mx-auto">
        {/* Image */}
        <div className="relative h-48 overflow-hidden bg-gray-200">
          {displayImage ? (
            <img
              src={displayImage}
              alt={businessName}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <MapPin className="w-12 h-12" />
            </div>
          )}
          <div className="absolute top-3 right-3">
            <Badge className="bg-green-500 text-white flex items-center gap-1">
              <CheckCircle className="w-3 h-3" />
              Nieuw
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-5">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-lg text-gray-900">
              {businessName || 'Jouw Bedrijfsnaam'}
            </h3>
            <Badge variant="secondary" className="bg-amber-100 text-amber-700 shrink-0">
              {PRICE_MAP[priceRange] || '€€'}
            </Badge>
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-600 mb-3">
            <MapPin className="w-4 h-4" />
            {location || 'Locatie'}
          </div>

          <div className="flex items-center gap-2 mb-4">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
              <span className="font-semibold text-gray-900">—</span>
            </div>
            <span className="text-sm text-gray-500">(0 reviews)</span>
          </div>

          <p className="text-sm text-gray-600 line-clamp-2 mb-4">
            {description || 'Geen beschrijving beschikbaar'}
          </p>

          <div className="w-full bg-gradient-to-r from-purple-600 to-amber-500 text-white text-center py-2 rounded-xl font-medium text-sm">
            Bekijk Details
          </div>
        </div>
      </Card>
    );
  };

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8">
      <div className="text-center space-y-3">
        <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center">
          <Camera className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Portfolio & Diensten</h2>
        <p className="text-gray-600">Laat zien wat je te bieden hebt</p>
      </div>

      <div className="max-w-4xl mx-auto">
        {/* Live Preview Toggle */}
        <button
          type="button"
          onClick={() => setShowPreview(!showPreview)}
          className="mb-6 flex items-center gap-2 mx-auto text-sm font-medium text-purple-600 hover:text-purple-700"
        >
          <Eye className="w-4 h-4" />
          {showPreview ? 'Verberg' : 'Toon'} live voorbeeld van je profiel
        </button>

        <AnimatePresence>
          {showPreview && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 overflow-hidden"
            >
              <div className="p-6 bg-gray-50 rounded-2xl border-2 border-dashed border-purple-200">
                <p className="text-center text-sm text-gray-500 mb-4">
                  📱 Zo zien klanten jouw profiel op de browse-pagina
                </p>
                <LivePreviewCard />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left column: Images */}
          <div className="space-y-6">
            {/* Profile Image */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Profielfoto</label>
              <div
                onClick={() => profileInputRef.current?.click()}
                className={`relative cursor-pointer group w-32 h-32 rounded-2xl border-2 border-dashed ${
                  errors.profileImage ? 'border-red-300' : 'border-gray-200 hover:border-purple-400'
                } flex items-center justify-center overflow-hidden transition-colors`}
              >
                {data.profileImagePreview ? (
                  <>
                    <img
                      src={data.profileImagePreview}
                      alt="Profiel"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera className="w-6 h-6 text-white" />
                    </div>
                  </>
                ) : (
                  <div className="text-center p-4">
                    <Upload className="w-6 h-6 mx-auto text-gray-400 mb-1" />
                    <span className="text-xs text-gray-400">Upload</span>
                  </div>
                )}
              </div>
              <input
                ref={profileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                onChange={handleProfileImage}
              />
              {errors.profileImage && (
                <p className="text-xs text-red-500">{errors.profileImage}</p>
              )}
            </div>

            {/* Portfolio Images */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Portfolio foto&apos;s ({data.portfolioImages.length}/5)
              </label>
              <div className="grid grid-cols-3 gap-3">
                {data.portfolioImagePreviews.map((preview, index) => (
                  <div key={index} className="relative group aspect-square rounded-xl overflow-hidden border border-gray-200">
                    <img
                      src={preview}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => removePortfolioImage(index)}
                      className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}

                {data.portfolioImages.length < 5 && (
                  <button
                    type="button"
                    onClick={() => portfolioInputRef.current?.click()}
                    className="aspect-square rounded-xl border-2 border-dashed border-gray-200 hover:border-purple-400 flex flex-col items-center justify-center transition-colors"
                  >
                    <Plus className="w-5 h-5 text-gray-400" />
                    <span className="text-xs text-gray-400 mt-1">Toevoegen</span>
                  </button>
                )}
              </div>
              <input
                ref={portfolioInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp"
                multiple
                className="hidden"
                onChange={handlePortfolioImages}
              />
              {errors.portfolioImages && (
                <p className="text-xs text-red-500">{errors.portfolioImages}</p>
              )}
              <p className="text-xs text-gray-400">
                JPG, PNG of WebP. Max 5MB per foto.
              </p>
            </div>
          </div>

          {/* Right column: Services */}
          <div className="space-y-6">
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">
                Diensten ({data.services.length})
              </label>

              {/* Existing services */}
              <div className="space-y-2 max-h-60 overflow-y-auto">
                {data.services.map((service, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-3 bg-gray-50 rounded-xl flex items-start justify-between"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{service.name}</p>
                      {service.description && (
                        <p className="text-xs text-gray-500 truncate">{service.description}</p>
                      )}
                      <p className="text-xs text-purple-600 mt-1">
                        €{service.priceFrom}
                        {service.priceTo ? ` – €${service.priceTo}` : '+'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeService(index)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition-colors shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </motion.div>
                ))}
              </div>

              {/* Add new service form */}
              <div className="p-4 border-2 border-dashed border-gray-200 rounded-xl space-y-3">
                <p className="text-sm font-medium text-gray-700">Nieuwe dienst toevoegen</p>
                <input
                  type="text"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  placeholder="Naam van de dienst"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-0 outline-none"
                />
                <input
                  type="text"
                  value={newService.description}
                  onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  placeholder="Korte beschrijving (optioneel)"
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-0 outline-none"
                />
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input
                      type="number"
                      value={newService.priceFrom}
                      onChange={(e) => setNewService({ ...newService, priceFrom: e.target.value })}
                      placeholder="Vanaf"
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-0 outline-none"
                    />
                  </div>
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">€</span>
                    <input
                      type="number"
                      value={newService.priceTo}
                      onChange={(e) => setNewService({ ...newService, priceTo: e.target.value })}
                      placeholder="Tot (optioneel)"
                      className="w-full h-10 pl-7 pr-3 rounded-lg border border-gray-200 text-sm focus:border-purple-500 focus:ring-0 outline-none"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={addService}
                  disabled={!newService.name || !newService.priceFrom}
                  className="w-full h-10 rounded-xl bg-purple-50 text-purple-600 font-medium text-sm hover:bg-purple-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Dienst toevoegen
                </button>
              </div>
              {errors.services && <p className="text-xs text-red-500">{errors.services}</p>}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
