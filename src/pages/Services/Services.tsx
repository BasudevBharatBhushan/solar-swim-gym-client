import React, { useState, useEffect, useCallback } from 'react';
import { Box, Button, CircularProgress, Typography } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { ServiceList } from './ServiceList';
import { ServiceDetail } from './ServiceDetail';
import { Service, AgeGroupPricing } from '../../types/service';
import { serviceCatalog } from '../../services/serviceCatalog';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

export const Services: React.FC = () => {
  const { currentLocationId, locations } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();
  const currentLocation = locations.find(l => l.location_id === currentLocationId);
  const [services, setServices] = useState<Service[]>([]);
  const [selectedServiceId, setSelectedServiceId] = useState<string | null>(null);
  const [isCreatingNew, setIsCreatingNew] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    if (!currentLocationId) return;
    setIsLoading(true);
    setError(null);
    try {
      const response = await serviceCatalog.getServices(currentLocationId);
      setServices(response || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch services');
    } finally {
      setIsLoading(false);
    }
  }, [currentLocationId]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const handleSelectService = (service: Service) => {
    setSelectedServiceId(service.service_id);
    setIsCreatingNew(false);
  };

  const handleAddNew = () => {
    setSelectedServiceId(null);
    setIsCreatingNew(true);
  };

  const handleSave = async (savedService: Service) => {
    try {
      // Ensure location_id is set
      const serviceToSave = { 
        ...savedService, 
        location_id: currentLocationId as string
      };
      
      const response = await serviceCatalog.upsertService(serviceToSave);
      const updatedService = response;

      if (isCreatingNew) {
        setServices(prev => [...prev, updatedService]);
        setSelectedServiceId(updatedService.service_id);
        setIsCreatingNew(false);
      } else {
        setServices(prev => prev.map(s => {
          return s.service_id === updatedService.service_id ? updatedService : s;
        }));
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save service');
    }
  };

  const getEmptyService = (): Service => {
      // Build a pricing structure based on current age groups and terms
      const pricing_structure: AgeGroupPricing[] = ageGroups.map(ag => ({
          age_group_id: ag.age_group_id || ag.id || '',
          age_group_name: ag.name,
          terms: subscriptionTerms.map(st => ({
              subscription_term_id: st.subscription_term_id || st.id || '',
              term_name: st.name,
              price: 0
          }))
      }));

      return {
          service_id: '',
          location_id: currentLocationId || '',
          name: '',
          description: '',
          is_active: true,
          is_addon_only: false,
          type: 'GROUP',
          service_type: 'TRAINING',
          pricing_structure
      };
  };

  const selectedService = isCreatingNew 
    ? getEmptyService() 
    : services.find(s => s.service_id === selectedServiceId) || null;

  if (!currentLocationId) {
      return (
          <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">Please select a location first.</Typography>
          </Box>
      );
  }

  return (
    <Box sx={{ height: 'calc(100vh - 84px)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Page Header */}
      <Box sx={{ bgcolor: '#FFD700', py: 1, px: 3, borderBottom: '2px solid #FF8C00' }}>
        <Typography variant="h5" sx={{ fontWeight: 900, color: '#000', textAlign: 'center' }}>
          SERVICE MANAGEMENT
        </Typography>
      </Box>

      {isLoading && services.length === 0 ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', bgcolor: '#f5f5f5' }}>
              <CircularProgress size={24} sx={{ mr: 2 }} />
              <Typography>Loading services...</Typography>
          </Box>
      ) : error ? (
          <Box sx={{ p: 4, textAlign: 'center', bgcolor: '#f5f5f5' }}>
              <Typography color="error">{error}</Typography>
              <Button onClick={fetchServices} sx={{ mt: 2 }}>Retry</Button>
          </Box>
      ) : (
        <Box sx={{ display: 'flex', height: '100%', bgcolor: '#f5f5f5' }}>
          {/* Left Panel: Service List */}
          <Box sx={{ width: { xs: '100%', md: '33%', lg: '25%' }, height: '100%', borderRight: '2px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#90EE90', borderBottom: '1px solid #77cb77' }}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#000' }}>SERVICES</Typography>
                  <Button 
                      variant="contained" 
                      size="small"
                      startIcon={<AddIcon />} 
                      onClick={handleAddNew}
                      sx={{ 
                        bgcolor: '#FF8C00', 
                        color: '#fff',
                        fontWeight: 700,
                        '&:hover': { bgcolor: '#FF7000' } 
                      }}
                  >
                      (+) SERVICE
                  </Button>
              </Box>
              <Box sx={{ flexGrow: 1, overflow: 'hidden' }}>
                <ServiceList 
                    services={services} 
                    selectedServiceId={isCreatingNew ? null : selectedServiceId} 
                    onSelectService={handleSelectService} 
                />
              </Box>
          </Box>
          
          {/* Right Panel: Details */}
          <Box sx={{ width: { xs: '100%', md: '67%', lg: '75%' }, height: '100%', bgcolor: 'background.paper' }}>
             <ServiceDetail 
               key={isCreatingNew ? 'new' : selectedServiceId || 'none'}
               service={selectedService} 
               onSave={handleSave} 
               isNew={isCreatingNew}
             />
          </Box>
        </Box>
      )}
    </Box>
  );
};
