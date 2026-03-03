'use client';

import { motion } from 'framer-motion';
import { CheckCircle, ArrowRight, PartyPopper } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface RegistrationCompleteProps {
  accountType: 'CUSTOMER' | 'PROVIDER';
  name: string;
}

export default function RegistrationComplete({ accountType, name }: RegistrationCompleteProps) {
  const router = useRouter();

  const handleContinue = () => {
    if (accountType === 'PROVIDER') {
      router.push('/provider-dashboard');
    } else {
      router.push('/dashboard');
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
      className="text-center space-y-8 py-8"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200, damping: 15 }}
        className="relative w-24 h-24 mx-auto"
      >
        <div className="w-24 h-24 rounded-full bg-gradient-to-r from-purple-600 to-amber-500 flex items-center justify-center">
          <CheckCircle className="w-12 h-12 text-white" />
        </div>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="absolute -top-2 -right-2"
        >
          <PartyPopper className="w-8 h-8 text-amber-500" />
        </motion.div>
      </motion.div>

      {/* Welcome Message */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="space-y-3"
      >
        <h2 className="text-3xl font-bold text-gray-900">
          Welkom bij Eventiphy, {name}! 🎉
        </h2>
        <p className="text-lg text-gray-600 max-w-md mx-auto">
          {accountType === 'PROVIDER'
            ? 'Je profiel is aangemaakt! Klanten kunnen je nu vinden op de browse-pagina.'
            : 'Je account is aangemaakt! Je kunt nu events plannen en dienstverleners vinden.'}
        </p>
      </motion.div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className="space-y-4 max-w-sm mx-auto"
      >
        <Button
          onClick={handleContinue}
          className="w-full h-14 rounded-2xl text-lg font-semibold bg-gradient-to-r from-purple-600 to-amber-500 hover:opacity-90 text-white"
        >
          Ga naar {accountType === 'PROVIDER' ? 'Dashboard' : 'Dashboard'}
          <ArrowRight className="w-5 h-5 ml-2" />
        </Button>

        {accountType === 'CUSTOMER' && (
          <Button
            onClick={() => router.push('/browse')}
            variant="outline"
            className="w-full h-12 rounded-xl border-2"
          >
            🔍 Ontdek Dienstverleners
          </Button>
        )}

        {accountType === 'PROVIDER' && (
          <Button
            onClick={() => router.push('/browse')}
            variant="outline"
            className="w-full h-12 rounded-xl border-2"
          >
            👀 Bekijk je profiel op de browse-pagina
          </Button>
        )}
      </motion.div>

      {/* Decorative confetti-like elements */}
      <div className="relative">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0],
              y: [-20, -60],
              x: [0, (i % 2 === 0 ? 1 : -1) * (20 + i * 10)],
            }}
            transition={{
              delay: 0.8 + i * 0.1,
              duration: 1.5,
              repeat: 0,
            }}
            className={`absolute top-0 left-1/2 w-3 h-3 rounded-full ${
              ['bg-purple-400', 'bg-amber-400', 'bg-pink-400', 'bg-green-400', 'bg-blue-400', 'bg-red-400'][i]
            }`}
          />
        ))}
      </div>
    </motion.div>
  );
}
