import { createContext, useContext, useState, ReactNode } from 'react';

export interface Location {
  location_id: string;
  name: string;
  address?: string;
}

export interface UserParams {
  first_name?: string;
  last_name?: string;
  email?: string;
  account_id?: string;
  profile_id?: string;
  location_id?: string;
  is_primary?: boolean;
  date_of_birth?: string;
  location?: {
    name?: string;
    address?: string;
  };
  [key: string]: unknown;
}

interface AuthContextType {
  token: string | null;
  role: string | null;
  loginId: string | null;
  userParams: UserParams | null;
  locations: Location[];
  currentLocationId: string | null;
  login: (token: string, role: string, loginId: string, params?: UserParams) => void;
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
  const [userParams, setUserParams] = useState<UserParams | null>(
    sessionStorage.getItem('userParams')
      ? (JSON.parse(sessionStorage.getItem('userParams')!) as UserParams)
      : null
  );

  // Global Location State
  const [locations, setLocationsState] = useState<Location[]>(() => {
    const savedLocations = sessionStorage.getItem('locations');
    return savedLocations ? JSON.parse(savedLocations) : [];
  });
  const [currentLocationId, setCurrentLocationIdState] = useState<string | null>(
    sessionStorage.getItem('currentLocationId')
  );

  const setLocations = (newLocations: Location[]) => {
    sessionStorage.setItem('locations', JSON.stringify(newLocations));
    setLocationsState(newLocations);
  };

  const setCurrentLocationId = (id: string) => {
    sessionStorage.setItem('currentLocationId', id);
    setCurrentLocationIdState(id);
  };

  const login = (newToken: string, newRole: string, newLoginId: string, newParams: UserParams = {}) => {
    sessionStorage.setItem('token', newToken);
    sessionStorage.setItem('role', newRole);
    sessionStorage.setItem('loginId', newLoginId);
    sessionStorage.setItem('userParams', JSON.stringify(newParams));

    setToken(newToken);
    setRole(newRole);
    setLoginId(newLoginId);
    setUserParams(newParams);

    // If the login response includes location details, set them
    if (newParams.location && newParams.location_id) {
        const userLocation: Location = {
            location_id: newParams.location_id,
            name: newParams.location.name,
            address: newParams.location.address
        };
        setLocations([userLocation]);
        setCurrentLocationId(newParams.location_id);
    }
  };

  const logout = () => {
    sessionStorage.removeItem('token');
    sessionStorage.removeItem('role');
    sessionStorage.removeItem('loginId');
    sessionStorage.removeItem('userParams');
    sessionStorage.removeItem('currentLocationId');
    sessionStorage.removeItem('locations');

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
