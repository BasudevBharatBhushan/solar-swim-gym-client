import React, { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Alert, Snackbar, Grid, Card, CardContent, InputAdornment
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { serviceCatalog } from '../../services/serviceCatalog';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

// Types
interface Service {
  service_id?: string;
  id?: string;
  name: string;
  description: string;
  service_type: string;
  is_addon_only?: boolean;
  pricing_structure: PricingStructure[]; 
}

interface PricingStructure {
  age_group_id: string;
  terms: PricingTerm[];
}

interface PricingTerm {
  subscription_term_id: string;
  price: number | string;
}

// Grid data structure for UI
interface PricingGrid {
  [ageGroupId: string]: {
    [termId: string]: number | string;
  };
}

export const ServiceManagement = () => {
  const { currentLocationId } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();
  const [services, setServices] = useState<Service[]>([]);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [serviceType, setServiceType] = useState('class');
  const [isAddonOnly, setIsAddonOnly] = useState(false);
  const [pricingGrid, setPricingGrid] = useState<PricingGrid>({});

  const fetchServices = async () => {
    if (!currentLocationId) return;
    try {
       const res = await serviceCatalog.getServices(currentLocationId);
       setServices(res);
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch services.");
    }
  };

  useEffect(() => {
    if (currentLocationId) {
        fetchServices();
    }
  }, [currentLocationId]);

  // Convert API pricing_structure to grid format
  const apiToGrid = (pricing_structure: PricingStructure[]): PricingGrid => {
    const grid: PricingGrid = {};
    
    pricing_structure.forEach(ageGroupPricing => {
      const ageGroupId = ageGroupPricing.age_group_id;
      grid[ageGroupId] = {};
      
      ageGroupPricing.terms.forEach(term => {
        grid[ageGroupId][term.subscription_term_id] = term.price;
      });
    });
    
    return grid;
  };

  // Convert grid format to API pricing_structure
  const gridToApi = (grid: PricingGrid): PricingStructure[] => {
    const pricingStructure: PricingStructure[] = [];
    
    Object.keys(grid).forEach(ageGroupId => {
      const terms: PricingTerm[] = [];
      
      Object.keys(grid[ageGroupId]).forEach(termId => {
        const price = grid[ageGroupId][termId];
        if (price !== '' && price !== null && price !== undefined) {
          terms.push({
            subscription_term_id: termId,
            price: typeof price === 'string' ? parseFloat(price) : price
          });
        }
      });
      
      if (terms.length > 0) {
        pricingStructure.push({
          age_group_id: ageGroupId,
          terms
        });
      }
    });
    
    return pricingStructure;
  };

  const handleServiceClick = (service: Service) => {
    setSelectedService(service);
    setIsCreating(false);
    setServiceName(service.name);
    setDescription(service.description);
    setServiceType(service.service_type);
    setIsAddonOnly(service.is_addon_only || false);
    setPricingGrid(apiToGrid(service.pricing_structure || []));
  };

  const handleAddNew = () => {
    setSelectedService(null);
    setIsCreating(true);
    setServiceName('');
    setDescription('');
    setServiceType('class');
    setIsAddonOnly(false);
    setPricingGrid({});
  };

  const handleCancel = () => {
    setSelectedService(null);
    setIsCreating(false);
    setServiceName('');
    setDescription('');
    setServiceType('class');
    setIsAddonOnly(false);
    setPricingGrid({});
  };

  const handlePriceChange = (ageGroupId: string, termId: string, value: string) => {
    setPricingGrid(prev => ({
      ...prev,
      [ageGroupId]: {
        ...(prev[ageGroupId] || {}),
        [termId]: value
      }
    }));
  };

  const handleSave = async () => {
    if (!currentLocationId) return;
    
    if (!serviceName.trim()) {
      setError('Service name is required');
      return;
    }

    try {
      const payload: any = {
        location_id: currentLocationId,
        name: serviceName,
        description: description,
        service_type: serviceType,
        is_addon_only: isAddonOnly,
        pricing_structure: gridToApi(pricingGrid)
      };

      if (selectedService) {
        payload.service_id = selectedService.service_id || selectedService.id;
      }

      await serviceCatalog.upsertService(payload);
      setSuccess(`Service ${selectedService ? 'updated' : 'created'} successfully!`);
      handleCancel();
      fetchServices();
    } catch (err: any) {
      setError(err.message || "Failed to save service.");
    }
  };

  if (!currentLocationId) {
      return <Alert severity="warning">Please select a location to manage services.</Alert>;
  }

  const showForm = isCreating || selectedService !== null;

  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2, bgcolor: '#FFD700', p: 2, textAlign: 'center', fontWeight: 'bold' }}>
        SERVICE MANAGEMENT
      </Typography>

      <Grid container spacing={2}>
        {/* Left Panel - Services List */}
        <Grid xs={12} md={showForm ? 4 : 12}>
          <Box sx={{ bgcolor: '#90EE90', p: 1, mb: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>SERVICES</Typography>
            <Button 
              variant="contained" 
              size="small"
              startIcon={<AddIcon />} 
              onClick={handleAddNew}
              sx={{ bgcolor: '#FF8C00', '&:hover': { bgcolor: '#FF7000' } }}
            >
              (+) SERVICE
            </Button>
          </Box>

          <TableContainer component={Paper}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>DESCRIPTION</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {services.map((service) => (
                  <TableRow 
                    key={service.service_id || service.id}
                    hover
                    onClick={() => handleServiceClick(service)}
                    sx={{ 
                      cursor: 'pointer',
                      bgcolor: (selectedService?.service_id === service.service_id || selectedService?.id === service.id) ? '#FFE4B5' : 'inherit'
                    }}
                  >
                    <TableCell>{service.name}</TableCell>
                    <TableCell>{service.description}</TableCell>
                  </TableRow>
                ))}
                {services.length === 0 && (
                    <TableRow>
                        <TableCell colSpan={2} align="center">No services found.</TableCell>
                    </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </Grid>

        {/* Right Panel - Service Form */}
        {showForm && (
          <Grid xs={12} md={8}>
            <Card>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2, bgcolor: '#FF8C00', p: 1, color: 'white', fontWeight: 'bold' }}>
                  {isCreating ? 'NEW SERVICE' : 'EDIT SERVICE'}
                </Typography>

                {/* Basic Info */}
                <Grid container spacing={2} sx={{ mb: 3 }}>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Service Name"
                      value={serviceName}
                      onChange={(e) => setServiceName(e.target.value)}
                      size="small"
                    />
                  </Grid>
                  <Grid xs={12} sm={6}>
                    <TextField
                      fullWidth
                      select
                      label="Service Type"
                      value={serviceType}
                      onChange={(e) => setServiceType(e.target.value)}
                      size="small"
                    >
                      <MenuItem value="class">Class</MenuItem>
                      <MenuItem value="appointment">Appointment</MenuItem>
                      <MenuItem value="facility">Facility Access</MenuItem>
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      multiline
                      rows={2}
                      size="small"
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Is Addon Only?"
                      value={isAddonOnly ? 'true' : 'false'}
                      onChange={(e) => setIsAddonOnly(e.target.value === 'true')}
                      size="small"
                    >
                      <MenuItem value="false">No</MenuItem>
                      <MenuItem value="true">Yes</MenuItem>
                    </TextField>
                  </Grid>
                </Grid>

                {/* Pricing Grid */}
                <Box sx={{ bgcolor: '#FFB6C1', p: 2, borderRadius: 1 }}>
                  <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
                    SERVICE FEE (if Opted as Add ON)
                  </Typography>

                  <TableContainer component={Paper} sx={{ maxHeight: 400 }}>
                    <Table size="small" stickyHeader>
                      <TableHead>
                        <TableRow>
                          <TableCell sx={{ fontWeight: 'bold', bgcolor: '#FF8C00', color: 'white' }}>
                            Age Group / Subscription Term
                          </TableCell>
                          {subscriptionTerms.map(term => (
                            <TableCell 
                              key={term.subscription_term_id || term.id} 
                              align="center"
                              sx={{ fontWeight: 'bold', bgcolor: '#FF8C00', color: 'white' }}
                            >
                              {term.name}
                            </TableCell>
                          ))}
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {ageGroups.map(ageGroup => {
                          const ageGroupId = ageGroup.age_group_id || ageGroup.id || '';
                          return (
                            <TableRow key={ageGroupId}>
                              <TableCell sx={{ fontWeight: 'bold', bgcolor: '#FFE4B5' }}>
                                {ageGroup.name}
                              </TableCell>
                              {subscriptionTerms.map(term => {
                                const termId = term.subscription_term_id || term.id || '';
                                const value = pricingGrid[ageGroupId]?.[termId] || '';
                                
                                return (
                                  <TableCell key={termId} align="center">
                                    <TextField
                                      type="number"
                                      size="small"
                                      value={value}
                                      onChange={(e) => handlePriceChange(ageGroupId, termId, e.target.value)}
                                      InputProps={{
                                        startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                      }}
                                      sx={{ width: 100 }}
                                    />
                                  </TableCell>
                                );
                              })}
                            </TableRow>
                          );
                        })}
                        {ageGroups.length === 0 && (
                          <TableRow>
                            <TableCell colSpan={subscriptionTerms.length + 1} align="center">
                              No age groups configured. Please add age groups first.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Box>

                {/* Action Buttons */}
                <Box sx={{ mt: 3, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button variant="outlined" onClick={handleCancel}>
                    Cancel
                  </Button>
                  <Button variant="contained" onClick={handleSave}>
                    Save
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)}>{success}</Alert>
      </Snackbar>
    </Box>
  );
};
