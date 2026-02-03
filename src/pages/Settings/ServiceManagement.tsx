import { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Alert, Snackbar, Grid, InputAdornment, Chip, Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
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
  is_active?: boolean;
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

  const [pricingGrid, setPricingGrid] = useState<PricingGrid>({});
  const [isActive, setIsActive] = useState(true);

  const fetchServices = async () => {
    if (!currentLocationId) return;
    try {
       const res = await serviceCatalog.getServices(currentLocationId);
       setServices(res);
       // Select first service by default if available and not creating
       if (res.length > 0 && !selectedService && !isCreating) {
           handleServiceClick(res[0]);
       }
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
      
      Object.keys(grid[ageGroupId] || {}).forEach(termId => {
        const price = grid[ageGroupId][termId];
        // Allow 0 but filter empty strings/null/undefined if necessary, though 0 is valid price
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
    setPricingGrid(apiToGrid(service.pricing_structure || []));
    setIsActive(service.is_active !== false); // Default to true if undefined
  };

  const handleAddNew = () => {
    setSelectedService(null);
    setIsCreating(true);
    setServiceName('');
    setDescription('');
    setServiceType('class');
    // setIsAddonOnly(false); // Removed
    setPricingGrid({});
    setIsActive(true);
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
        // is_addon_only: isAddonOnly,
        is_active: isActive,
        pricing_structure: gridToApi(pricingGrid)
      };

      if (selectedService) {
        payload.service_id = selectedService.service_id || selectedService.id;
      }

      await serviceCatalog.upsertService(payload);
      setSuccess(`Service ${selectedService ? 'updated' : 'created'} successfully!`);
      fetchServices();
      // Keep form open or clear? Image suggests it stays open or reflects new state
    } catch (err: any) {
      setError(err.message || "Failed to save service.");
    }
  };

  if (!currentLocationId) {
      return <Alert severity="warning" sx={{ m: 2 }}>Please select a location to manage services.</Alert>;
  }

  return (
    <Box sx={{ p: 3, maxWidth: 1400, mx: 'auto' }}>
      <Grid container spacing={3}>
        {/* Left Panel - Services List */}
        <Grid size={{ xs: 12, md: 4, lg: 3 }}>
           <Paper 
             elevation={0} 
             sx={{ 
                overflow: 'hidden', 
                boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.05)',
                borderRadius: 1 // Use moderate rounding from image
             }}
           >
                {/* Green Header */}
                <Box sx={{ 
                    bgcolor: '#10b981', 
                    p: 2, 
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center' 
                }}>
                    <Typography variant="subtitle1" sx={{ color: 'white', fontWeight: 700, letterSpacing: '0.05em' }}>
                        SERVICES
                    </Typography>
                    <Button 
                        size="small" 
                        variant="contained" 
                        startIcon={<AddIcon sx={{ fontSize: 16 }} />}
                        onClick={handleAddNew}
                        sx={{ 
                            bgcolor: 'rgba(255,255,255,0.2)', 
                            color: 'white',
                            fontSize: '0.75rem',
                            minWidth: 'auto',
                            px: 1.5,
                            '&:hover': { bgcolor: 'rgba(255,255,255,0.3)' } 
                        }}
                    >
                        SERVICE
                    </Button>
                </Box>
                
                {/* List */}
                <Box sx={{ maxHeight: 'calc(100vh - 200px)', overflowY: 'auto' }}>
                    {services.map((service) => {
                         const isSelected = selectedService?.service_id === service.service_id || selectedService?.id === service.id;
                         const isActiveService = service.is_active !== false; // Handle undefined/null as active if needed, or strict false
                         
                         return (
                            <Box 
                                key={service.service_id || service.id}
                                onClick={() => handleServiceClick(service)}
                                sx={{ 
                                    p: 2, 
                                    borderBottom: '1px solid', 
                                    borderColor: 'divider', 
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? '#ecfdf5' : 'white',
                                    position: 'relative',
                                    '&:hover': { bgcolor: isSelected ? '#ecfdf5' : '#f9fafb' }
                                }}
                            >
                                <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5, color: isSelected ? '#047857' : 'text.primary' }}>
                                    {service.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1, 
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                                }}>
                                    {service.description || 'No description'}
                                </Typography>
                                <Chip 
                                    label={isActiveService ? "ACTIVE" : "INACTIVE"}
                                    size="small" 
                                    sx={{ 
                                        height: 20, 
                                        fontSize: '0.65rem', 
                                        fontWeight: 700,
                                        bgcolor: isActiveService ? '#d1fae5' : '#f3f4f6', 
                                        color: isActiveService ? '#059669' : '#6b7280',
                                        borderRadius: '6px'
                                    }} 
                                />
                                {isSelected && (
                                    <Box sx={{ 
                                        position: 'absolute', 
                                        left: 0, 
                                        top: 0, 
                                        bottom: 0, 
                                        width: 3, 
                                        bgcolor: '#10b981' 
                                    }} />
                                )}
                            </Box>
                         );
                    })}
                     {services.length === 0 && (
                        <Box sx={{ p: 3, textAlign: 'center', color: 'text.secondary' }}>
                            <Typography variant="body2">No services found.</Typography>
                        </Box>
                    )}
                </Box>
           </Paper>
        </Grid>

        {/* Right Panel - Edit Form */}
        <Grid size={{ xs: 12, md: 8, lg: 9 }}>
            {/* 1. Header Box */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 2, 
                    mb: 2, 
                    borderRadius: 1, 
                    border: '1px solid', 
                    borderColor: '#e2e8f0',
                    display: 'flex', 
                    justifyContent: 'space-between', 
                    alignItems: 'center',
                    bgcolor: 'background.paper'
                }}
            >
                <Typography variant="h6" sx={{ fontWeight: 600 }}>
                    {isCreating ? 'Create Service' : 'Edit Service'}
                </Typography>
                <Button 
                    variant="contained" 
                    disableElevation
                    startIcon={<SaveIcon />}
                    onClick={handleSave}
                    sx={{ 
                        bgcolor: '#1e293b', 
                        borderRadius: 1,
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 600,
                        '&:hover': { bgcolor: '#0f172a' } 
                    }}
                >
                    Save Changes
                </Button>
            </Paper>

            {/* 2. Details Box */}
            <Paper 
                elevation={0} 
                sx={{ 
                    p: 3, 
                    mb: 2, 
                    borderRadius: 1, 
                    border: '1px solid', 
                    borderColor: '#e2e8f0',
                    bgcolor: 'background.paper' 
                }}
            >
                <Grid container spacing={3}>
                    <Grid size={{ xs: 12, md: 8 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            SERVICE NAME
                            </Typography>
                            <TextField 
                            fullWidth 
                            value={serviceName} 
                            onChange={(e) => setServiceName(e.target.value)}
                            placeholder="e.g. Swimming Class"
                            />
                    </Grid>
                    <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pt: 3 }}>
                        <Typography variant="body2" sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Active Status</Typography>
                            <Switch 
                            checked={isActive} 
                            onChange={(e) => setIsActive(e.target.checked)} 
                            color="success" 
                            />
                    </Grid>
                    
                    <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            DESCRIPTION
                            </Typography>
                            <TextField 
                            fullWidth 
                            multiline
                            rows={3}
                            value={description} 
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Service description..."
                            />
                    </Grid>

                    <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            TYPE
                            </Typography>
                            <TextField 
                            fullWidth
                            select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            >
                                <MenuItem value="class">Class</MenuItem>
                                <MenuItem value="appointment">Appointment</MenuItem>
                                <MenuItem value="facility">Facility</MenuItem>
                            </TextField>
                    </Grid>

                </Grid>
            </Paper>

            {/* 3. Pricing Box */}
            <Paper 
                elevation={0} 
                sx={{ 
                    borderRadius: 1, 
                    border: '1px solid', 
                    borderColor: '#e2e8f0', 
                    overflow: 'hidden',
                    bgcolor: 'background.paper'
                }}
            >
                <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: '#e2e8f0', display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc' }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>
                        SERVICE FEE
                        </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: '1px solid', borderColor: '#e2e8f0', py: 1.5 }}>Age Group / Subscription Term</TableCell>
                                {subscriptionTerms.map(term => (
                                    <TableCell key={term.id || term.subscription_term_id || ''} align="center" sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: '1px solid', borderColor: '#e2e8f0' }}>
                                        {term.name}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ageGroups.map(ageGroup => {
                                const ageGroupId = ageGroup.age_group_id || ageGroup.id || '';
                                return (
                                    <TableRow key={ageGroupId} sx={{ '&:last-child td': { borderBottom: 0 } }}>
                                        <TableCell component="th" scope="row" sx={{ fontWeight: 500, py: 2 }}>
                                            {ageGroup.name}
                                        </TableCell>
                                        {subscriptionTerms.map(term => {
                                            const termId = term.subscription_term_id || term.id || '';
                                            const value = pricingGrid[ageGroupId]?.[termId] || '';
                                            return (
                                                <TableCell key={termId} align="center">
                                                    <TextField
                                                        size="small"
                                                        placeholder="0.00"
                                                        value={value}
                                                        onChange={(e) => handlePriceChange(ageGroupId, termId, e.target.value)}
                                                        sx={{ 
                                                            width: 120,
                                                            backgroundColor: 'white',
                                                            '& .MuiOutlinedInput-root': {
                                                                borderRadius: 1 
                                                            }
                                                        }}
                                                        InputProps={{
                                                            startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.8rem', color: 'text.secondary' } }}>$</InputAdornment>,
                                                        }}
                                                    />
                                                </TableCell>
                                            );
                                        })}
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Grid>
      </Grid>
      
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
       <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};
