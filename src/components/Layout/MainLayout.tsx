import { ReactNode, useEffect } from 'react';
import { Box, AppBar, Toolbar, Typography, Button, CssBaseline, Select, MenuItem, FormControl } from '@mui/material';
import { Sidebar } from './Sidebar';
import { useAuth, Location } from '../../context/AuthContext';
import { useNavigate, Navigate } from 'react-router-dom';
import axios from 'axios';

import LocationOnIcon from '@mui/icons-material/LocationOn';

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
      <AppBar position="fixed" sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
        <Toolbar>
          <Typography variant="h6" noWrap component="div" sx={{ flexGrow: 1, fontWeight: 'bold', letterSpacing: '0.5px' }}>
            SOLAR SWIM <span style={{ fontWeight: 300 }}>ADMIN</span>
          </Typography>

          {/* Location Selector for Super Admin */}
          {role === 'SUPER_ADMIN' && (
             <FormControl size="small" sx={{ minWidth: 260, mr: 2 }}>
                <Select
                  value={currentLocationId || ''}
                  onChange={(e) => setCurrentLocationId(e.target.value)}
                  displayEmpty
                  renderValue={(selected) => {
                    if (!selected) return <Typography color="text.secondary" variant="body2">Select Location</Typography>;
                    const loc = locations.find(l => l.location_id === selected);
                    return (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <LocationOnIcon sx={{ fontSize: 18, color: 'primary.main' }} />
                            <Box sx={{ overflow: 'hidden' }}>
                                <Typography variant="body2" sx={{ fontWeight: 700, lineHeight: 1.2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {loc?.name}
                                </Typography>
                                {loc?.address && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', fontSize: '0.65rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                        {loc.address}
                                    </Typography>
                                )}
                            </Box>
                        </Box>
                    );
                  }}
                  sx={{ 
                      bgcolor: 'background.paper',
                      borderRadius: 2,
                      '& .MuiSelect-select': { 
                          py: 0.75,
                          px: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          minHeight: '40px'
                      },
                      '& .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'rgba(0,0,0,0.1)'
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                          borderColor: 'primary.main'
                      }
                  }}
                  MenuProps={{
                      PaperProps: {
                          sx: {
                              mt: 1,
                              borderRadius: 2,
                              boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
                              maxHeight: 400
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
                            py: 1.5, 
                            px: 2,
                            borderBottom: '1px solid', 
                            borderColor: 'divider', 
                            '&:last-child': { borderBottom: 0 },
                            '&.Mui-selected': {
                                bgcolor: 'primary.light',
                                '&:hover': { bgcolor: 'primary.light' }
                            }
                        }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 2, width: '100%' }}>
                        <Box sx={{ 
                            mt: 0.5, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            width: 32,
                            height: 32,
                            borderRadius: 1,
                            bgcolor: 'rgba(30, 41, 59, 0.05)',
                            color: 'primary.main'
                        }}>
                            <LocationOnIcon fontSize="small" />
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 700, color: 'text.primary', mb: 0.25 }}>
                            {loc.name}
                          </Typography>
                          {loc.address && (
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', lineHeight: 1.3 }}>
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

          <Button color="primary" variant="outlined" onClick={handleLogout} sx={{ borderColor: 'divider' }}>
            Sign Out
          </Button>
        </Toolbar>
      </AppBar>
      <Sidebar />
      <Box component="main" sx={{ flexGrow: 1, p: 3, bgcolor: '#f1f5f9', minHeight: '100vh' }}>
        <Toolbar /> {/* Spacer for AppBar */}
        {children}
      </Box>
    </Box>
  );
};
