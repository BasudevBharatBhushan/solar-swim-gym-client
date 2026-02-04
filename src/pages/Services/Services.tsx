import { useEffect, useState, memo, useCallback } from 'react';
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
import { PageHeader } from '../../components/Common/PageHeader';
import { dropdownOptions } from '../../lib/dropdownOptions';

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

// ----------------------------------------------------------------------
// Optimized Sub-components
// ----------------------------------------------------------------------

const ServiceListItem = memo(({ 
  service, 
  isSelected, 
  onClick 
}: { 
  service: LocalService, 
  isSelected: boolean, 
  onClick: (s: LocalService) => void 
}) => {
  return (
    <Box 
        onClick={() => onClick(service)}
        sx={{
            p: 2,
            borderBottom: '1px solid',
            borderColor: 'divider',
            cursor: 'pointer',
            position: 'relative',
            transition: 'all 0.2s',
            bgcolor: isSelected ? '#ecfdf5' : 'transparent',
            '&:hover': {
                bgcolor: isSelected ? '#d1fae5' : '#f8fafc'
            }
        }}
    >
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, color: isSelected ? '#0369a1' : 'text.primary' }}>
                {service.name}
            </Typography>
            <Chip 
                label={service.is_active !== false ? "ACTIVE" : "INACTIVE"} 
                size="small" 
                sx={{ 
                    height: 20, 
                    fontSize: '0.65rem', 
                    fontWeight: 700,
                    bgcolor: service.is_active !== false ? '#d1fae5' : '#fee2e2', 
                    color: service.is_active !== false ? '#059669' : '#b91c1c',
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
});

const ServiceBasicInfo = memo(({
    name,
    description,
    type,
    serviceType,
    isActive,
    onNameChange,
    onDescriptionChange,
    onTypeChange,
    onServiceTypeChange,
    onActiveChange
}: {
    name: string,
    description: string,
    type: string,
    serviceType: string,
    isActive: boolean,
    onNameChange: (v: string) => void,
    onDescriptionChange: (v: string) => void,
    onTypeChange: (v: string) => void,
    onServiceTypeChange: (v: string) => void,
    onActiveChange: (v: boolean) => void
}) => (
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
                    value={name} 
                    onChange={(e) => onNameChange(e.target.value)}
                    placeholder="e.g. Swimming Class"
                    />
            </Grid>
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', pt: 3 }}>
                <Typography variant="body2" sx={{ mr: 2, fontWeight: 500, color: 'text.secondary' }}>Active Status</Typography>
                    <Switch 
                    checked={isActive} 
                    onChange={(e) => onActiveChange(e.target.checked)} 
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
                    onChange={(e) => onDescriptionChange(e.target.value)}
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
                    onChange={(e) => onTypeChange(e.target.value)}
                    >
                        {dropdownOptions.serviceType.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
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
                    onChange={(e) => onServiceTypeChange(e.target.value)}
                    >
                        {dropdownOptions.serviceCategory.map((opt) => (
                            <MenuItem key={opt.value} value={opt.value}>
                                {opt.label}
                            </MenuItem>
                        ))}
                    </TextField>
            </Grid>
        </Grid>
    </Paper>
));

const PricingCell = memo(({ 
  ageGroupId, 
  termId, 
  value, 
  onChange,
  isRecurring
}: { 
  ageGroupId: string, 
  termId: string, 
  value: string | number, 
  onChange: (ageGroupId: string, termId: string, value: string) => void,
  isRecurring?: boolean
}) => (
  <TableCell align="center">
    <TextField
        size="small"
        placeholder="0.00"
        value={value}
        onChange={(e) => onChange(ageGroupId, termId, e.target.value)}
        sx={{ 
            width: 120,
            backgroundColor: 'white',
            '& .MuiOutlinedInput-root': {
                borderRadius: 1 
            }
        }}
        InputProps={{
            startAdornment: <InputAdornment position="start" sx={{ '& .MuiTypography-root': { fontSize: '0.8rem', color: 'text.secondary' } }}>$</InputAdornment>,
            endAdornment: isRecurring ? (
                <InputAdornment position="end" sx={{ '& .MuiTypography-root': { fontSize: '0.7rem', color: 'text.secondary' } }}>
                    / Month
                </InputAdornment>
            ) : null,
        }}
    />
  </TableCell>
));

const PricingRow = memo(({ 
  ageGroup, 
  subscriptionTerms, 
  rowPricing, 
  onChange 
}: { 
  ageGroup: any, 
  subscriptionTerms: any[], 
  rowPricing: { [termId: string]: number | string }, 
  onChange: (ageGroupId: string, termId: string, value: string) => void 
}) => {
  const ageGroupId = ageGroup.age_group_id || ageGroup.id || '';
  return (
    <TableRow sx={{ '&:last-child td': { borderBottom: 0 } }}>
      <TableCell component="th" scope="row" sx={{ py: 2 }}>
        <Box>
            <Typography variant="subtitle2" sx={{ fontWeight: 500 }}>
                {ageGroup.name}
            </Typography>
            <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                {ageGroup.min_age} - {ageGroup.max_age} yrs
            </Typography>
        </Box>
      </TableCell>
      {subscriptionTerms.map(term => {
        const termId = term.subscription_term_id || term.id || '';
        return (
          <PricingCell 
            key={termId}
            ageGroupId={ageGroupId}
            termId={termId}
            value={rowPricing?.[termId] || ''}
            onChange={onChange}
            isRecurring={term.payment_mode === 'RECURRING'}
          />
        );
      })}
    </TableRow>
  );
});

// ----------------------------------------------------------------------

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
  const [type, setType] = useState('GROUP'); // "Type" dropdown
  const [serviceType, setServiceType] = useState('TRAINING'); // "Service Type" dropdown
  const [isActive, setIsActive] = useState(true);
  const [pricingGrid, setPricingGrid] = useState<PricingGrid>({});

  const fetchServices = useCallback(async (idToSelect?: string, forceSelectFirst = false) => {
    if (!currentLocationId) return;
    try {
       const res = await serviceCatalog.getServices(currentLocationId);
       setServices(res);

       // If an ID is provided, try to find and select it
       if (idToSelect) {
         const serviceToSelect = res.find((s: any) => (s.service_id || s.id) === idToSelect);
         if (serviceToSelect) {
           handleServiceClick(serviceToSelect);
           return;
         }
       }

       // Select first service by default if available and (forceSelectFirst OR nothing selected)
       if (res.length > 0 && (forceSelectFirst || (!selectedService && !isCreating))) {
           handleServiceClick(res[0]);
       }
    } catch (err: any) {
      console.error(err);
      setError("Failed to fetch services.");
    }
  }, [currentLocationId, selectedService, isCreating]);

  useEffect(() => {
    if (currentLocationId) {
        // Clear selection when location changes
        setSelectedService(null);
        setIsCreating(false);
        fetchServices(undefined, true);
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

  const handleServiceClick = useCallback((service: LocalService) => {
    setSelectedService(service);
    setIsCreating(false);
    setServiceName(service.name);
    setDescription(service.description);
    setType(service.type || 'GROUP');
    setServiceType(service.service_type || 'TRAINING');
    setIsActive(service.is_active !== false);
    setPricingGrid(apiToGrid(service.pricing_structure || []));
  }, []);

  const handleAddNew = () => {
    setSelectedService(null);
    setIsCreating(true);
    setServiceName('');
    setDescription('');
    setType('GROUP');
    setServiceType('TRAINING');
    setIsActive(true);
    setPricingGrid({});
  };

  const handlePriceChange = useCallback((ageGroupId: string, termId: string, value: string) => {
    setPricingGrid(prev => ({
      ...prev,
      [ageGroupId]: {
        ...(prev[ageGroupId] || {}),
        [termId]: value
      }
    }));
  }, []);

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
        is_active: isActive,
        pricing_structure: gridToApi(pricingGrid)
      };

      if (selectedService) {
        payload.service_id = selectedService.service_id || selectedService.id;
      }

      const response = await serviceCatalog.upsertService(payload);
      const savedServiceId = response?.service_id || response?.id;
      
      setSuccess(`Service ${selectedService ? 'updated' : 'created'} successfully!`);
      fetchServices(savedServiceId);
    } catch (err: any) {
      setError(err.message || "Failed to save service.");
    }
  };

  if (!currentLocationId) {
      return <Alert severity="warning" sx={{ m: 2 }}>Please select a location to manage services.</Alert>;
  }

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader 
        title="Service Management" 
        description="Configure service offerings, types, and tiered pricing structures for this location."
        breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Services', active: true }
        ]}
      />
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
                
                <Box sx={{ overflowY: 'auto', flex: 1 }}>
                    {services.map((service) => {
                         const serviceId = service.service_id || service.id;
                         const selectedId = selectedService?.service_id || selectedService?.id;
                         const isSelected = !isCreating && !!selectedId && selectedId === serviceId;

                         return (
                            <ServiceListItem 
                                key={serviceId || Math.random().toString()}
                                service={service}
                                isSelected={isSelected}
                                onClick={handleServiceClick}
                            />
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
                <Typography variant="h4" sx={{ fontWeight: 600 }}>
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

            <ServiceBasicInfo 
                name={serviceName}
                description={description}
                type={type}
                serviceType={serviceType}
                isActive={isActive}
                onNameChange={setServiceName}
                onDescriptionChange={setDescription}
                onTypeChange={setType}
                onServiceTypeChange={setServiceType}
                onActiveChange={setIsActive}
            />

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
                        <Typography
                            variant="subtitle2"
                            sx={{
                                fontWeight: 700,
                                color: 'primary.main',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                fontSize: '0.75rem'
                            }}
                        >
                            SERVICE FEE
                            <span style={{ marginLeft: 8, fontWeight: 500, fontSize: '0.9rem', color: '#64748b', textTransform: 'none' }}>
                                (if Opted as Add On)
                            </span>
                        </Typography>
                </Box>
                <TableContainer sx={{ maxHeight: 400 }}>
                    <Table size="small">
                        <TableHead>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: '1px solid', borderColor: '#e2e8f0', py: 1.5 }}>Age Group / Subscription Term</TableCell>
                                {subscriptionTerms.map(term => (
                                    <TableCell key={term.id || term.subscription_term_id || ''} align="center" sx={{ fontWeight: 600, bgcolor: 'transparent', borderBottom: '1px solid', borderColor: '#e2e8f0' }}>
                                        <Box>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 600, lineHeight: 1.2 }}>
                                                {term.name}
                                            </Typography>
                                            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem', display: 'block' }}>
                                                {term.payment_mode === 'RECURRING' ? 'Recurring' : 'Pay in Full'}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {ageGroups.map(ageGroup => (
                                <PricingRow 
                                    key={ageGroup.age_group_id || ageGroup.id || ''}
                                    ageGroup={ageGroup}
                                    subscriptionTerms={subscriptionTerms}
                                    rowPricing={pricingGrid[ageGroup.age_group_id || ageGroup.id || '']}
                                    onChange={handlePriceChange}
                                />
                            ))}
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
