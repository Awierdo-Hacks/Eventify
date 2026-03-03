'use client';

import { motion } from 'framer-motion';
import { Phone, Mail, Lock, User, Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface ProviderContactData {
  contactName: string;
  email: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface ProviderContactInfoProps {
  data: ProviderContactData;
  onChange: (data: ProviderContactData) => void;
  errors: Record<string, string>;
}

export default function ProviderContactInfo({ data, onChange, errors }: ProviderContactInfoProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const updateField = (field: keyof ProviderContactData, value: string) => {
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
          <Phone className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Contactgegevens</h2>
        <p className="text-gray-600">Hoe kunnen klanten je bereiken?</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        {/* Contactpersoon */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Contactpersoon</label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={data.contactName}
              onChange={(e) => updateField('contactName', e.target.value)}
              placeholder="Bijv. Jan de Vries"
              className={inputClass('contactName')}
            />
          </div>
          {errors.contactName && <p className="text-xs text-red-500">{errors.contactName}</p>}
        </div>

        {/* E-mail */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">E-mailadres</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="info@jouwbedrijf.nl"
              className={inputClass('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Telefoon */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Telefoonnummer</label>
          <div className="relative">
            <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="tel"
              value={data.phone}
              onChange={(e) => updateField('phone', e.target.value)}
              placeholder="06 12345678"
              className={inputClass('phone')}
            />
          </div>
          {errors.phone && <p className="text-xs text-red-500">{errors.phone}</p>}
        </div>

        <div className="border-t border-gray-100 pt-5">
          <p className="text-sm text-gray-500 mb-4">Maak een wachtwoord aan om je account te beveiligen</p>

          {/* Wachtwoord */}
          <div className="space-y-2 mb-4">
            <label className="text-sm font-medium text-gray-700">Wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={data.password}
                onChange={(e) => updateField('password', e.target.value)}
                placeholder="Minimaal 6 tekens"
                className={`${inputClass('password')} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}

            {/* Password strength indicator */}
            {data.password && (
              <div className="flex gap-1">
                {[1, 2, 3, 4].map((level) => {
                  const strength =
                    (data.password.length >= 6 ? 1 : 0) +
                    (/[A-Z]/.test(data.password) ? 1 : 0) +
                    (/[0-9]/.test(data.password) ? 1 : 0) +
                    (/[^A-Za-z0-9]/.test(data.password) ? 1 : 0);
                  return (
                    <div
                      key={level}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        level <= strength
                          ? strength <= 1
                            ? 'bg-red-400'
                            : strength <= 2
                            ? 'bg-amber-400'
                            : strength <= 3
                            ? 'bg-green-400'
                            : 'bg-green-600'
                          : 'bg-gray-200'
                      }`}
                    />
                  );
                })}
              </div>
            )}
          </div>

          {/* Bevestig wachtwoord */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Bevestig wachtwoord</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type={showConfirm ? 'text' : 'password'}
                value={data.confirmPassword}
                onChange={(e) => updateField('confirmPassword', e.target.value)}
                placeholder="Herhaal je wachtwoord"
                className={`${inputClass('confirmPassword')} pr-10`}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(!showConfirm)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
            {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
