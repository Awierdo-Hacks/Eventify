'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { UserRole } from '@/generated/prisma/client';

interface SessionUser {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  providerId: number | null;
}

interface SessionContextType {
  user: SessionUser | null;
  status: 'loading' | 'authenticated' | 'unauthenticated';
  update: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated'>('loading');

  const fetchSession = async () => {
    try {
      const res = await fetch('/api/auth/session');
      const data = await res.json();
      
      if (data.user) {
        setUser(data.user);
        setStatus('authenticated');
      } else {
        setUser(null);
        setStatus('unauthenticated');
      }
    } catch (error) {
      console.error('Session fetch error:', error);
      setUser(null);
      setStatus('unauthenticated');
    }
  };

  useEffect(() => {
    fetchSession();
  }, []);

  return (
    <SessionContext.Provider value={{ user, status, update: fetchSession }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession moet gebruikt worden binnen een SessionProvider');
  }
  return context;
}
