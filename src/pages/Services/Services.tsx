import { useEffect, useState } from 'react';
import { 
  Box, Button, Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  TextField, MenuItem, Alert, Snackbar, Grid, InputAdornment, Chip, Switch
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import PaymentIcon from '@mui/icons-material/Payment';
import { serviceCatalog } from '../../services/serviceCatalog';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';

// Types - Locally defined to ensure UI needs are met
interface LocalService {
  service_id?: string;
  id?: string;
  name: string;
  description: string;
  type: string;        // "Type" dropdown
  service_type: string; // "Service Type" dropdown
  is_addon_only?: boolean;
  pricing_structure: PricingStructure[]; 
  is_active?: boolean;
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

export const Services = () => {
  const { currentLocationId } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();
  const [services, setServices] = useState<LocalService[]>([]);
  const [selectedService, setSelectedService] = useState<LocalService | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form state
  const [serviceName, setServiceName] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState('GROUP'); // "Type"
  const [serviceType, setServiceType] = useState('TRAINING'); // "Service Type"

  const [isActive, setIsActive] = useState(true);
  const [pricingGrid, setPricingGrid] = useState<PricingGrid>({});

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

  const handleServiceClick = (service: LocalService) => {
    setSelectedService(service);
    setIsCreating(false);
    setServiceName(service.name);
    setDescription(service.description);
    setType(service.type || 'GROUP');
    setServiceType(service.service_type || 'TRAINING');
    // setIsAddonOnly(service.is_addon_only || false); // Removed
    setIsActive(service.is_active !== false); // Default true unless false
    setPricingGrid(apiToGrid(service.pricing_structure || []));
  };

  const handleAddNew = () => {
    setSelectedService(null);
    setIsCreating(true);
    setServiceName('');
    setDescription('');
    setType('GROUP');
    setServiceType('TRAINING');
    // setIsAddonOnly(false); // Removed
    setIsActive(true);
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
        type: type,
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
      // Update local list
      fetchServices();
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
                border: '1px solid', 
                borderColor: 'divider',
                borderRadius: 1,
                height: '100%',
                maxHeight: 'calc(100vh - 100px)',
                display: 'flex',
                flexDirection: 'column'
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
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                    {services.map((service) => {
                         const isSelected = selectedService?.service_id === service.service_id || selectedService?.id === service.id;
                         return (
                            <Box 
                                key={service.service_id || service.id}
                                onClick={() => handleServiceClick(service)}
                                sx={{ 
                                    p: 2, 
                                    borderBottom: '1px solid', 
                                    borderColor: 'divider',
                                    cursor: 'pointer',
                                    bgcolor: isSelected ? '#eff6ff' : 'transparent', // Light blue bg for selected
                                    position: 'relative',
                                    '&:hover': { bgcolor: '#f1f5f9' }
                                }}
                            >
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                                    <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isSelected ? 'primary.main' : 'text.primary' }}>
                                        {service.name}
                                    </Typography>
                                    <Chip 
                                        label="ACTIVE" 
                                        size="small" 
                                        sx={{ 
                                            height: 20, 
                                            fontSize: '0.65rem', 
                                            fontWeight: 700,
                                            bgcolor: '#d1fae5', 
                                            color: '#059669',
                                            borderRadius: '4px'
                                        }} 
                                    />
                                </Box>
                                <Typography variant="caption" color="text.secondary" display="block" sx={{ 
                                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' 
                                }}>
                                    {service.description || '.'}
                                </Typography>
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
                    Service Detail
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
                            value={type}
                            onChange={(e) => setType(e.target.value)}
                            >
                                <MenuItem value="GROUP">Group</MenuItem>
                                <MenuItem value="PRIVATE">Private</MenuItem>
                            </TextField>
                    </Grid>
                    <Grid size={{ xs: 12, md: 6 }}>
                            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 600, display: 'block', mb: 1, textTransform: 'uppercase', fontSize: '0.65rem' }}>
                            SERVICE TYPE
                            </Typography>
                            <TextField 
                            fullWidth
                            select
                            value={serviceType}
                            onChange={(e) => setServiceType(e.target.value)}
                            >
                                <MenuItem value="TRAINING">Training</MenuItem>
                                <MenuItem value="CLASS">Class</MenuItem>
                                <MenuItem value="FACILITY">Facility</MenuItem>
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
                        <PaymentIcon color="primary" sx={{ fontSize: 20 }} />
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
        <Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert>
      </Snackbar>
       <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" onClose={() => setSuccess(null)} variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};
