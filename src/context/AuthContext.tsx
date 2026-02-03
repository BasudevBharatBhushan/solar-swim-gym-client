import { createContext, useContext, useState, ReactNode } from 'react';

export interface Location {
  location_id: string;
  name: string;
  address?: string;
}

interface AuthContextType {
  token: string | null;
  role: string | null;
  loginId: string | null;
  userParams: any | null;
  locations: Location[];
  currentLocationId: string | null;
  login: (token: string, role: string, loginId: string, params?: any) => void;
  logout: () => void;
  isAuthenticated: boolean;
  setLocations: (locations: Location[]) => void;
  setCurrentLocationId: (id: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(sessionStorage.getItem('token'));
  const [role, setRole] = useState<string | null>(sessionStorage.getItem('role'));
  const [loginId, setLoginId] = useState<string | null>(sessionStorage.getItem('loginId'));
  const [userParams, setUserParams] = useState<any | null>(
    sessionStorage.getItem('userParams') ? JSON.parse(sessionStorage.getItem('userParams')!) : null
  );

  // Global Location State
  const [locations, setLocationsState] = useState<Location[]>([]);
  const [currentLocationId, setCurrentLocationIdState] = useState<string | null>(
    sessionStorage.getItem('currentLocationId')
  );

  const setLocations = (newLocations: Location[]) => {
    setLocationsState(newLocations);
  };

  const setCurrentLocationId = (id: string) => {
    sessionStorage.setItem('currentLocationId', id);
    setCurrentLocationIdState(id);
  };

  const login = (newToken: string, newRole: string, newLoginId: string, newParams: any = {}) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('role', newRole);
    sessionStorage.setItem('loginId', newLoginId);
    sessionStorage.setItem('userParams', JSON.stringify(newParams));

    setToken(newToken);
    setRole(newRole);
    setLoginId(newLoginId);
    setUserParams(newParams);
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('loginId');
    sessionStorage.removeItem('userParams');
    sessionStorage.removeItem('currentLocationId');

    setToken(null);
    setRole(null);
    setLoginId(null);
    setUserParams(null);
    setLocationsState([]);
    setCurrentLocationIdState(null);
  };

  const isAuthenticated = !!token;

  return (
    <AuthContext.Provider value={{
      token,
      role,
      loginId,
      userParams,
      locations,
      currentLocationId,
      login,
      logout,
      isAuthenticated,
      setLocations,
      setCurrentLocationId
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
