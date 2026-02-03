import { ReactNode, useEffect } from 'react';
import { Box, Typography, Button, CssBaseline, Select, MenuItem, FormControl } from '@mui/material';
import { Sidebar } from './Sidebar';
import { useAuth, Location } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

import LocationOnIcon from '@mui/icons-material/LocationOn';
import LogoutIcon from '@mui/icons-material/Logout';

const API_URL = 'http://localhost:3001/api/v1';

interface MainLayoutProps {
  children: ReactNode;
}

export const MainLayout = ({ children }: MainLayoutProps) => {
  const { isAuthenticated, logout, role, token, locations, currentLocationId, setLocations, setCurrentLocationId } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // If SuperAdmin and locations are not loaded, fetch them
    if (isAuthenticated && role === 'SUPER_ADMIN' && locations.length === 0) {
      axios.get(`${API_URL}/locations`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(res => {
        setLocations(res.data);
        // Set default location if not set
        if (!currentLocationId && res.data.length > 0) {
            setCurrentLocationId(res.data[0].location_id);
        }
      })
      .catch(err => console.error("Failed to fetch locations", err));
    }
  }, [isAuthenticated, role, locations.length, token, currentLocationId, setLocations, setCurrentLocationId]);

  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f1f5f9', minHeight: '100vh', position: 'relative'}}>
        
        {/* Top Right Controls (Location & Sign Out) */}
        <Box sx={{ 
          position: 'absolute', 
          top: 20, 
          right: 24, 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5, 
          zIndex: 10 
        }}>
          {/* Location Selector for Super Admin */}
          {role === 'SUPER_ADMIN' && (
             <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={currentLocationId || ''}
                  onChange={(e) => setCurrentLocationId(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return (
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <LocationOnIcon sx={{ fontSize: 18, color: 'text.disabled' }} />
                        <Typography color="text.secondary" variant="body2" sx={{ fontSize: '0.875rem' }}>
                          Select Location
                        </Typography>
                      </Box>
                    );
                    const loc = locations.find(l => l.location_id === selected);
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon sx={{ fontSize: 18, color: '#1976d2' }} />
                            <Typography variant="body2" sx={{ 
                              fontWeight: 500, 
                              color: '#1e293b',
                              fontSize: '0.875rem'
                            }}>
                                {loc?.name}
                            </Typography>
                        </Box>
                    );
                  }}
                  sx={{ 
                      bgcolor: '#ffffff',
                      borderRadius: '8px',
                      height: '38px',
                      boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s ease',
                      '& .MuiSelect-select': { 
                          py: 0,
                          px: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          height: '38px',
                          boxSizing: 'border-box'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#e2e8f0',
                          borderWidth: '1px'
                      },
                      '&:hover': {
                          boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                          '& .MuiOutlinedInput-notchedOutline': {
                              borderColor: '#cbd5e1'
                          }
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                          borderColor: '#1976d2',
                          borderWidth: '1px'
                      }
                  }}
                  MenuProps={{
                      PaperProps: {
                          sx: {
                              mt: 0.5,
                              borderRadius: '8px',
                              boxShadow: '0 4px 24px rgba(0,0,0,0.12)',
                              maxHeight: 400,
                              border: '1px solid #e2e8f0'
                          }
                      }
                  }}
                >
                  <MenuItem value="" disabled sx={{ display: 'none' }}>Select Location</MenuItem>
                  {locations.map((loc: Location) => (
                    <MenuItem 
                        key={loc.location_id} 
                        value={loc.location_id}
                        sx={{ 
                            py: 1.25, 
                            px: 2,
                            borderBottom: '1px solid #f1f5f9', 
                            '&:last-child': { borderBottom: 0 },
                            '&.Mui-selected': {
                                bgcolor: '#eff6ff',
                                '&:hover': { bgcolor: '#dbeafe' }
                            },
                            '&:hover': {
                                bgcolor: '#f8fafc'
                            }
                        }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, width: '100%' }}>
                        <LocationOnIcon sx={{ fontSize: 20, color: '#1976d2', mt: 0.25 }} />
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ 
                            fontWeight: 600, 
                            color: '#1e293b', 
                            mb: 0.25,
                            fontSize: '0.875rem'
                          }}>
                            {loc.name}
                          </Typography>
                          {loc.address && (
                            <Typography variant="caption" sx={{ 
                              display: 'block', 
                              lineHeight: 1.4,
                              color: '#64748b',
                              fontSize: '0.75rem'
                            }}>
                              {loc.address}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
             </FormControl>
          )}

          <Button 
            onClick={handleLogout}
            startIcon={<LogoutIcon sx={{ fontSize: 16 }} />}
            sx={{ 
                height: '38px',
                px: 2,
                py: 0,
                color: '#475569',
                fontWeight: 500,
                fontSize: '0.875rem',
                textTransform: 'none',
                bgcolor: '#ffffff',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                transition: 'all 0.2s ease',
                '&:hover': {
                    bgcolor: '#f8fafc',
                    borderColor: '#cbd5e1',
                    boxShadow: '0 2px 6px rgba(0,0,0,0.12)',
                    color: '#1e293b'
                }
            }}>
            Sign Out
          </Button>
        </Box>

        {children}
      </Box>
    </Box>
  );
};
