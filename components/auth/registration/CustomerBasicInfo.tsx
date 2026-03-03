'use client';

import { motion } from 'framer-motion';
import { User, Mail, Lock, Calendar } from 'lucide-react';

interface CustomerData {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface CustomerBasicInfoProps {
  data: CustomerData;
  onChange: (data: CustomerData) => void;
  errors: Record<string, string>;
}

export default function CustomerBasicInfo({ data, onChange, errors }: CustomerBasicInfoProps) {
  const updateField = (field: keyof CustomerData, value: string) => {
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
          <User className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-3xl font-bold text-gray-900">Persoonlijke Gegevens</h2>
        <p className="text-gray-600">Vertel ons iets over jezelf</p>
      </div>

      <div className="max-w-lg mx-auto space-y-5">
        {/* Naam rij */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Voornaam</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={data.firstName}
                onChange={(e) => updateField('firstName', e.target.value)}
                placeholder="Jan"
                className={inputClass('firstName')}
              />
            </div>
            {errors.firstName && <p className="text-xs text-red-500">{errors.firstName}</p>}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Achternaam</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={data.lastName}
                onChange={(e) => updateField('lastName', e.target.value)}
                placeholder="Jansen"
                className={inputClass('lastName')}
              />
            </div>
            {errors.lastName && <p className="text-xs text-red-500">{errors.lastName}</p>}
          </div>
        </div>

        {/* Geboortedatum */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Geboortedatum</label>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={data.dateOfBirth}
              onChange={(e) => updateField('dateOfBirth', e.target.value)}
              className={inputClass('dateOfBirth')}
            />
          </div>
          {errors.dateOfBirth && <p className="text-xs text-red-500">{errors.dateOfBirth}</p>}
        </div>

        {/* Email */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">E-mailadres</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="email"
              value={data.email}
              onChange={(e) => updateField('email', e.target.value)}
              placeholder="jan@voorbeeld.nl"
              className={inputClass('email')}
            />
          </div>
          {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
        </div>

        {/* Wachtwoord */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Wachtwoord</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={data.password}
              onChange={(e) => updateField('password', e.target.value)}
              placeholder="Minimaal 8 karakters"
              className={inputClass('password')}
            />
          </div>
          {errors.password && <p className="text-xs text-red-500">{errors.password}</p>}
        </div>

        {/* Bevestig wachtwoord */}
        <div className="space-y-2">
          <label className="text-sm font-medium text-gray-700">Bevestig Wachtwoord</label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="password"
              value={data.confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              placeholder="Herhaal je wachtwoord"
              className={inputClass('confirmPassword')}
            />
          </div>
          {errors.confirmPassword && <p className="text-xs text-red-500">{errors.confirmPassword}</p>}
        </div>
      </div>
    </motion.div>
  );
}
