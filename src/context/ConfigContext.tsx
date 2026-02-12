import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { configService } from '../services/configService';
import { dropdownService, DropdownValue } from '../services/dropdownService';
import { useAuth } from './AuthContext';

// Types
export interface AgeGroup {
  age_group_id: string;
  id?: string;
  name: string;
  min_age?: number;
  max_age?: number;
  is_recurring?: boolean;
  recurrence_unit?: string;
}

export interface SubscriptionTerm {
  subscription_term_id: string;
  id?: string;
  name: string;
  duration_months?: number;
  payment_mode?: 'RECURRING' | 'PAY_IN_FULL';
  recurrence_unit?: string;
  recurrence_unit_value?: number;
}

export interface WaiverProgram {
  waiver_program_id: string;
  name: string;
  code: string;
  is_active: boolean;
}

interface ConfigContextType {
  ageGroups: AgeGroup[];
  subscriptionTerms: SubscriptionTerm[];
  waiverPrograms: WaiverProgram[];
  dropdownValues: DropdownValue[];
  loading: boolean;
  error: string | null;
  refreshAgeGroups: () => Promise<void>;
  refreshSubscriptionTerms: () => Promise<void>;
  refreshWaiverPrograms: () => Promise<void>;
  refreshDropdownValues: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined);

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (error instanceof Error && error.message) {
    return error.message;
  }
  return fallback;
};

export const ConfigProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentLocationId } = useAuth();
  const [ageGroups, setAgeGroups] = useState<AgeGroup[]>([]);
  const [subscriptionTerms, setSubscriptionTerms] = useState<SubscriptionTerm[]>([]);
  const [waiverPrograms, setWaiverPrograms] = useState<WaiverProgram[]>([]);
  const [dropdownValues, setDropdownValues] = useState<DropdownValue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  // Fetch Age Groups
  const refreshAgeGroups = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getAgeGroups();
      setAgeGroups(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch age groups'));
      console.error('Error fetching age groups:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch Subscription Terms
  const refreshSubscriptionTerms = useCallback(async () => {
    if (!currentLocationId) {
      setSubscriptionTerms([]);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      const data = await configService.getSubscriptionTerms(currentLocationId);
      setSubscriptionTerms(data);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to fetch subscription terms'));
      console.error('Error fetching subscription terms:', err);
    } finally {
      setLoading(false);
    }
  }, [currentLocationId]);

  // Fetch Waiver Programs
  const refreshWaiverPrograms = useCallback(async () => {
    try {
      const data = await configService.getWaiverPrograms(currentLocationId || undefined);
      setWaiverPrograms(data || []);
    } catch (err: unknown) {
      console.error('Error fetching waiver programs:', err);
    }
  }, [currentLocationId]);

  // Fetch Dropdown Values
  const refreshDropdownValues = useCallback(async () => {
    if (!currentLocationId) {
      setDropdownValues([]);
      return;
    }
    try {
      const data = await dropdownService.getAll(currentLocationId);
      setDropdownValues(data || []);
    } catch (err: unknown) {
      console.error('Error fetching dropdown values:', err);
      // Don't block the UI for this, just log it
    }
  }, [currentLocationId]);

  // Refresh all
  const refreshAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      await Promise.all([
        refreshAgeGroups(),
        refreshSubscriptionTerms(),
        refreshWaiverPrograms(),
        refreshDropdownValues()
      ]);
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to refresh configuration'));
    } finally {
      setLoading(false);
    }
  }, [refreshAgeGroups, refreshSubscriptionTerms, refreshWaiverPrograms, refreshDropdownValues]);

  // Initial load when location changes
  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  const value: ConfigContextType = {
    ageGroups,
    subscriptionTerms,
    waiverPrograms,
    dropdownValues,
    loading,
    error,
    refreshAgeGroups,
    refreshSubscriptionTerms,
    refreshWaiverPrograms,
    refreshDropdownValues,
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
