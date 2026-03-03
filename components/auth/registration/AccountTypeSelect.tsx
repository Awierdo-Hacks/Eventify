'use client';

import { motion } from 'framer-motion';
import { User, Building2 } from 'lucide-react';

interface AccountTypeSelectProps {
  onSelect: (type: 'CUSTOMER' | 'PROVIDER') => void;
  selected: 'CUSTOMER' | 'PROVIDER' | null;
}

export default function AccountTypeSelect({ onSelect, selected }: AccountTypeSelectProps) {
  const options = [
    {
      type: 'CUSTOMER' as const,
      icon: User,
      title: 'Ik ben een Klant',
      description: 'Ik zoek diensten voor mijn event',
      features: ['Evenementen plannen', 'Providers ontdekken', 'Offertes aanvragen'],
    },
    {
      type: 'PROVIDER' as const,
      icon: Building2,
      title: 'Ik ben een Provider',
      description: 'Ik bied diensten aan voor events',
      features: ['Profiel aanmaken', 'Offertes versturen', 'Klanten bereiken'],
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h2 className="text-4xl font-bold text-gray-900">
          Welkom bij{' '}
          <span className="bg-gradient-to-r from-purple-600 to-amber-500 bg-clip-text text-transparent">
            Eventiphy
          </span>
        </h2>
        <p className="text-xl text-gray-600">Hoe wil je Eventiphy gebruiken?</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl mx-auto">
        {options.map((option, index) => {
          const Icon = option.icon;
          const isSelected = selected === option.type;

          return (
            <motion.div
              key={option.type}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              onClick={() => onSelect(option.type)}
              className={`
                relative cursor-pointer rounded-3xl border-2 p-8 transition-all duration-300
                ${
                  isSelected
                    ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-amber-50 shadow-xl scale-[1.02]'
                    : 'border-gray-100 bg-white hover:border-purple-200 hover:shadow-lg hover:-translate-y-1'
                }
              `}
            >
              {isSelected && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-4 right-4 w-6 h-6 bg-gradient-to-r from-purple-600 to-amber-500 rounded-full flex items-center justify-center"
                >
                  <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </motion.div>
              )}

              <div className="text-center space-y-4">
                <div
                  className={`
                  w-20 h-20 mx-auto rounded-2xl flex items-center justify-center
                  ${
                    isSelected
                      ? 'bg-gradient-to-r from-purple-600 to-amber-500'
                      : 'bg-gradient-to-br from-purple-100 to-amber-100'
                  }
                `}
                >
                  <Icon className={`w-10 h-10 ${isSelected ? 'text-white' : 'text-purple-600'}`} />
                </div>

                <div>
                  <h3 className="text-xl font-semibold text-gray-900">{option.title}</h3>
                  <p className="text-gray-600 mt-1">{option.description}</p>
                </div>

                <ul className="space-y-2 text-left">
                  {option.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-2 text-sm text-gray-600">
                      <div
                        className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-purple-500' : 'bg-gray-300'}`}
                      />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
