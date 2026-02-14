'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useApiClient } from '@/lib/api/client';

interface CreditContextValue {
  credits: number | null;
  loading: boolean;
  refreshCredits: () => Promise<void>;
}

const CreditContext = createContext<CreditContextValue | null>(null);

export function CreditProvider({ children }: { children: React.ReactNode }) {
  const api = useApiClient();
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshCredits = useCallback(async () => {
    const { data, ok } = await api.get('/api/credits/balance');
    if (ok) {
      const balance = data.balance ?? data;
      setCredits(balance.credits ?? 0);
    }
    setLoading(false);
  }, [api]);

  useEffect(() => {
    refreshCredits();
  }, [refreshCredits]);

  return (
    <CreditContext.Provider value={{ credits, loading, refreshCredits }}>
      {children}
    </CreditContext.Provider>
  );
}

export function useCredits() {
  const context = useContext(CreditContext);
  if (!context) {
    throw new Error('useCredits must be used within a CreditProvider');
  }
  return context;
}
