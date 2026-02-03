import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { configService } from '../services/configService';
import { useAuth } from './AuthContext';

// Types
export interface AgeGroup {
  age_group_id: string;
  id?: string;
  name: string;
  min_age?: number;
  max_age?: number;
}

export interface SubscriptionTerm {
  subscription_term_id: string;
  id?: string;
  name: string;
  duration_months?: number;
  payment_mode?: 'RECURRING' | 'PAY_IN_FULL';
}

interface ConfigContextType {
  ageGroups: AgeGroup[];
  subscriptionTerms: SubscriptionTerm[];
  loading: boolean;
  error: string | null;
  refreshAgeGroups: () => Promise<void>;
  refreshSubscriptionTerms: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLocationId } = useAuth();
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [subscriptionTerms, setSubscriptionTerms] = useState<SubscriptionTerm[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch Age Groups
  const refreshAgeGroups = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getAgeGroups();
      setAgeGroups(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch age groups');
      console.error('Error fetching age groups:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Subscription Terms
  const refreshSubscriptionTerms = async () => {
    if (!currentLocationId) {
      setSubscriptionTerms([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getSubscriptionTerms(currentLocationId);
      setSubscriptionTerms(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch subscription terms');
      console.error('Error fetching subscription terms:', err);
    } finally {
      setLoading(false);
    }
  };

  // Refresh both
  const refreshAll = async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshAgeGroups(),
        refreshSubscriptionTerms()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to refresh configuration');
    } finally {
      setLoading(false);
    }
  };

  // Initial load when location changes
  useEffect(() => {
    refreshAll();
  }, [currentLocationId]);

  const value: ConfigContextType = {
    ageGroups,
    subscriptionTerms,
    loading,
    error,
    refreshAgeGroups,
    refreshSubscriptionTerms,
    refreshAll
  };

  return (
    <ConfigContext.Provider value={value}>
      {children}
    </ConfigContext.Provider>
  );
};

// Custom hook to use the config context
export const useConfig = (): ConfigContextType => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within a ConfigProvider');
  }
  return context;
};
