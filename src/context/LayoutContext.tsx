import { createContext, useContext, useState, ReactNode } from 'react';

interface Breadcrumb {
  label: string;
  href?: string;
  active?: boolean;
}

interface LayoutContextType {
  title: string;
  description: string;
  breadcrumbs: Breadcrumb[];
  action: ReactNode | null;
  setHeader: (data: { 
    title: string; 
    description?: string; 
    breadcrumbs?: Breadcrumb[]; 
    action?: ReactNode 
  }) => void;
}

const LayoutContext = createContext<LayoutContextType | undefined>(undefined);

export const LayoutProvider = ({ children }: { children: ReactNode }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [breadcrumbs, setBreadcrumbs] = useState<Breadcrumb[]>([]);
  const [action, setAction] = useState<ReactNode | null>(null);

  const setHeader = (data: { 
    title: string; 
    description?: string; 
    breadcrumbs?: Breadcrumb[]; 
    action?: ReactNode 
  }) => {
    setTitle(data.title);
    setDescription(data.description || '');
    setBreadcrumbs(data.breadcrumbs || []);
    setAction(data.action || null);
  };

  return (
    <LayoutContext.Provider value={{ title, description, breadcrumbs, action, setHeader }}>
      {children}
    </LayoutContext.Provider>
  );
};

export const useLayout = () => {
  const context = useContext(LayoutContext);
  if (!context) {
    throw new Error('useLayout must be used within a LayoutProvider');
  }
  return context;
};
