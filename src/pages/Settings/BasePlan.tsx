import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  InputAdornment,
  CircularProgress,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert
} from '@mui/material';
import { Add } from '@mui/icons-material';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { basePriceService, BasePrice } from '../../services/basePriceService';
import { serviceCatalog } from '../../services/serviceCatalog';
import { membershipService, MembershipService } from '../../services/membershipService';
import { PageHeader } from '../../components/Common/PageHeader';


// --- Types ---
interface RowKey {
  planName: string;
  role: 'PRIMARY' | 'ADD_ON';
  ageGroupId: string;
}

// Helper to generate unique key for a row
const getRowId = (key: RowKey) => `${key.planName}-${key.role}-${key.ageGroupId}`;

export const BasePlan = () => {
  const { currentLocationId } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();
  
  const [loading, setLoading] = useState(false);
  
  // Data State
  const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]); // For dropdown

  const [openCreate, setOpenCreate] = useState(false);
  const [manageServicesId, setManageServicesId] = useState<string | null>(null);
  
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [createForm, setCreateForm] = useState<Partial<BasePrice>>({
    role: 'PRIMARY',
    is_active: true
  });

  // Fetch Data
  const fetchData = async () => {
    if (!currentLocationId) return;
    setLoading(true);
    try {
      const data = await basePriceService.getAll(currentLocationId);
      setBasePrices(data.prices);
      
      // Fetch all services for the dropdown to see available services (for the modal)
      const allServices = await serviceCatalog.getServices(currentLocationId);
      setAvailableServices(allServices);

    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentLocationId]);


  // --- Pivot Logic ---
  // Group by Plan Name first (to make sections usually, or just rows)
  // User asked: "Show rows grouped by Program / Plan name."
  // And "display all the subscription term in same row".
  
  // 1. Identification of Unique Rows: (Plan, Role, AgeGroup)
  const uniqueRowsMap = new Map<string, RowKey>();
  basePrices.forEach(p => {
      const key: RowKey = { planName: p.name, role: p.role, ageGroupId: p.age_group_id };
      uniqueRowsMap.set(getRowId(key), key);
  });
  
  // Sort rows: Primary roles first overall, then by Plan Name and Age.
  const uniqueRows = Array.from(uniqueRowsMap.values()).sort((a, b) => {
      if (a.role !== b.role) return a.role === 'PRIMARY' ? -1 : 1;
      if (a.planName !== b.planName) return a.planName.localeCompare(b.planName);
      // Sort age by min_age if possible, else name
      const agA = ageGroups.find(g => g.age_group_id === a.ageGroupId);
      const agB = ageGroups.find(g => g.age_group_id === b.ageGroupId);
      return (agA?.min_age || 0) - (agB?.min_age || 0);
  });

  // Group rows for display by Plan Name (Plan Header)
  const rowsByPlan: Record<string, RowKey[]> = {};
  uniqueRows.forEach(row => {
      if (!rowsByPlan[row.planName]) rowsByPlan[row.planName] = [];
      rowsByPlan[row.planName].push(row);
  });

  // Ordered list of plan names to preserve sorting
  const orderedPlanNames = Array.from(new Set(uniqueRows.map(r => r.planName)));

  // Helper to find existing price for a cell
  const getPrice = (row: RowKey, termId: string) => {
      return basePrices.find(p => 
          p.name === row.planName && 
          p.role === row.role && 
          p.age_group_id === row.ageGroupId && 
          p.subscription_term_id === termId
      );
  };

  // --- Handlers ---
  const handlePriceSave = async (row: RowKey, termId: string, val: number) => {
    if (!currentLocationId) return;

    const existing = getPrice(row, termId);

    const payload: BasePrice = {
      base_price_id: existing?.base_price_id,
      location_id: currentLocationId,
      name: row.planName,
      role: row.role,
      age_group_id: row.ageGroupId,
      subscription_term_id: termId,
      price: val,
      is_active: true
    };

    // Optimistic Update
    setBasePrices(prev => {
      const exists = prev.find(p =>
        p.name === payload.name &&
        p.role === payload.role &&
        p.age_group_id === payload.age_group_id &&
        p.subscription_term_id === payload.subscription_term_id
      );

      if (exists) {
        return prev.map(p =>
          (p.name === payload.name && p.role === payload.role && p.age_group_id === payload.age_group_id && p.subscription_term_id === payload.subscription_term_id)
            ? { ...p, price: val }
            : p
        );
      } else {
        return [...prev, payload];
      }
    });

    try {
      const result = await basePriceService.upsert(payload);
      // If it was a new record, update it with the ID from response
      if (!existing?.base_price_id && result.base_price_id) {
        setBasePrices(prev => prev.map(p =>
          (p.name === payload.name && p.role === payload.role && p.age_group_id === payload.age_group_id && p.subscription_term_id === payload.subscription_term_id)
            ? result : p
        ));
      }
      setSuccess("Price updated successfully.");
    } catch (e) {
      console.error("Save failed", e);
      setError("Failed to save price.");
    }
  };



    // --- Creation ---
    const handleCreate = async () => {
         if(!createForm.name || !createForm.age_group_id || !createForm.subscription_term_id || !currentLocationId) {
             setError("Please fill in all required fields.");
             return;
         }

         setSaving(true);
         const payload = { ...createForm, location_id: currentLocationId, price: Number(createForm.price || 0) } as BasePrice;
         try {
             await basePriceService.upsert(payload);
             await fetchData();
             setSuccess("Base plan row created successfully.");
             setOpenCreate(false);
             setCreateForm({
                role: 'PRIMARY',
                is_active: true
             });
         } catch(e: any) {
             console.error("Create failed", e);
             setError(e.message || "Failed to create base plan row.");
         } finally {
             setSaving(false);
         }
    };


  if (!currentLocationId) {
      return <Alert severity="warning" sx={{ m: 2 }}>Please select a location to manage base plan pricing.</Alert>;
  }

  return (
      <Box sx={{ p: 3 }}>
                <PageHeader 
                  title="Base Plan Pricing" 
                  description="Configure base plan pricing and included services for different age groups and terms."
                  breadcrumbs={[
                      { label: 'Settings', href: '/settings' },
                      { label: 'Base Plan Pricing', active: true }
                  ]}
                />
         <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => {
                    setCreateForm({ role: 'PRIMARY', is_active: true });
                    setOpenCreate(true);
                }}
            >
                Add Base Plan
            </Button>
        </Box>

        {loading ? <CircularProgress /> : orderedPlanNames.map(planName => (
            <Paper key={planName} sx={{ mb: 4, overflow: 'hidden' }}>
                 <Box sx={{ bgcolor: 'rgba(25, 118, 210, 0.04)', p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="h5" sx={{ fontWeight: 800, color: '#1a237e', letterSpacing: -0.5 }}>{planName}</Typography>
                    <Chip label="Plan Group" size="small" sx={{ fontWeight: 'bold', bgcolor: '#e3f2fd', color: '#1565c0' }} />
                </Box>
                
                <Box sx={{ p: 0 }}>
                    {/* Unique Profiles in this Plan Name */}
                    {Array.from(new Set(rowsByPlan[planName].map(r => `${r.role}||${r.ageGroupId}`))).map(profileKey => {
                        const [role, ageGroupId] = profileKey.split('||');
                        const profileRows = rowsByPlan[planName].filter(r => r.role === role && r.ageGroupId === ageGroupId);
                        // All rows in this profile are actually the SAME logical profile (just different terms)
                        // So we pick the first one to represent the metadata
                        const profileMeta = profileRows[0];
                        
                        // Find ANY base_price_id for this profile to manage services
                        const profilePrice = basePrices.find(p => 
                             p.name === planName && 
                             p.role === role && 
                             p.age_group_id === ageGroupId
                        );
                        
                        return (
                            <Box key={profileKey} sx={{ borderBottom: '1px solid #f0f0f0', p: 2 }}>
                                {/* Profile Header */}
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#455a64' }}>
                                            {role === 'PRIMARY' ? 'Primary' : 'Add-On'} • {ageGroups.find(g => g.age_group_id === ageGroupId)?.name}
                                        </Typography>
                                        <Chip 
                                            label={role} 
                                            size="small" 
                                            sx={{ 
                                                fontSize: '0.65rem', fontWeight: 800, height: 20,
                                                bgcolor: role === 'PRIMARY' ? '#e3f2fd' : '#f3e5f5',
                                                color: role === 'PRIMARY' ? '#1565c0' : '#7b1fa2'
                                            }} 
                                        />
                                    </Box>
                                    
                                    <Button
                                        variant="outlined"
                                        size="small"
                                        startIcon={<Add />}
                                        onClick={() => {
                                             if (profilePrice?.base_price_id) {
                                                 setManageServicesId(profilePrice.base_price_id);
                                             } else {
                                                 // Edge case: No price saved yet for this profile? 
                                                 // Ideally we should warn or create a dummy one.
                                                 setError("Please save at least one price for this profile before adding services.");
                                             }
                                        }}
                                        disabled={!profilePrice?.base_price_id}
                                        sx={{ textTransform: 'none', fontWeight: 600 }}
                                    >
                                        Included Services
                                    </Button>
                                </Box>

                                {/* Terms Grid */}
                                <Box sx={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                                    {subscriptionTerms.map(term => {
                                        const priceObj = getPrice(profileMeta, term.subscription_term_id);
                                        return (
                                           <Box key={term.subscription_term_id} sx={{ minWidth: 150 }}>
                                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#78909c', fontWeight: 700, fontSize: '0.7rem' }}>
                                                    {term.name.toUpperCase()}
                                                </Typography>
                                                <TextField 
                                                    size="small"
                                                    type="number"
                                                    defaultValue={priceObj?.price || ''}
                                                    placeholder="-"
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val !== priceObj?.price) {
                                                            handlePriceSave(profileMeta, term.subscription_term_id, val);
                                                        }
                                                    }}
                                                    sx={{ width: '100%' }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start"><Typography sx={{ fontSize: '0.8rem', fontWeight: 600 }}>$</Typography></InputAdornment>,
                                                        endAdornment: term.payment_mode === 'RECURRING' && <Typography variant="caption" sx={{ color: '#bdbdbd', fontSize: '0.7rem' }}>/mo</Typography>
                                                    }}
                                                />
                                           </Box>
                                        );
                                    })}
                                </Box>
                            </Box>
                        );
                    })}
                </Box>
            </Paper>
        ))}
        
        {/* Create Dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Base Plan Row</DialogTitle>
            <DialogContent>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                     <TextField 
                        label="Plan Name"
                        placeholder="Enter Plan Name"
                        fullWidth
                        value={createForm.name || ''}
                        onChange={e => setCreateForm({...createForm, name: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                    />
                     <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select 
                            value={createForm.role || ''} 
                            label="Role"
                            onChange={e => setCreateForm({...createForm, role: e.target.value as any})}
                        >
                            <MenuItem value="PRIMARY">Primary</MenuItem>
                            <MenuItem value="ADD_ON">AddOn</MenuItem>
                        </Select>
                    </FormControl>
                    <FormControl fullWidth>
                        <InputLabel>Age Group</InputLabel>
                        <Select
                            value={createForm.age_group_id || ''}
                            label="Age Group"
                            onChange={e => setCreateForm({...createForm, age_group_id: e.target.value})}
                        >
                             {ageGroups.map(g => (
                                <MenuItem key={g.age_group_id} value={g.age_group_id}>{g.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary">Initial Price (You can allow other terms later)</Typography>
                     <FormControl fullWidth>
                        <InputLabel>Initial Term</InputLabel>
                        <Select
                            value={createForm.subscription_term_id || ''}
                            label="Initial Term"
                            onChange={e => setCreateForm({...createForm, subscription_term_id: e.target.value})}
                        >
                             {subscriptionTerms.map(t => (
                                <MenuItem key={t.subscription_term_id} value={t.subscription_term_id}>{t.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                     <TextField 
                        label="Price"
                        type="number"
                        fullWidth
                        value={createForm.price || ''}
                        onChange={e => setCreateForm({...createForm, price: Number(e.target.value)})}
                    />
                 </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenCreate(false)} disabled={saving}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleCreate} 
                    disabled={saving || !createForm.name || !createForm.age_group_id || !createForm.subscription_term_id}
                >
                    {saving ? <CircularProgress size={24} /> : "Create Row"}
                </Button>
            </DialogActions>
        </Dialog>

        {/* Services Manager Modal */}
        <ServicesManagerDialog 
            basePriceId={manageServicesId}
            onClose={() => setManageServicesId(null)}
            availableServices={availableServices}
        />

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
            <Alert severity="success" onClose={() => setSuccess(null)} variant="filled">{success}</Alert>
        </Snackbar>
    </Box>
  );
};

// --- Sub-components ---

const ServicesManagerDialog = ({ basePriceId, onClose, availableServices }: { basePriceId: string | null, onClose: () => void, availableServices: any[] }) => {
    const [services, setServices] = useState<MembershipService[]>([]);
    const [loading, setLoading] = useState(false);
    const [newServiceId, setNewServiceId] = useState('');

    useEffect(() => {
        if(basePriceId) {
            setLoading(true);
            membershipService.getServices(basePriceId)
                .then(setServices)
                .catch(e => console.error(e))
                .finally(() => setLoading(false));
        } else {
            setServices([]);
        }
    }, [basePriceId]);

    const handleAdd = async () => {
        if (!newServiceId || !basePriceId) return;
        const newSvc: MembershipService = {
            service_id: newServiceId,
            membership_program_id: basePriceId, // Use basePriceId as owner
            is_included: true,
            usage_limit: 'Unlimited',
            is_active: true
        };
        try {
            await membershipService.upsertServices([newSvc]);
            const updated = await membershipService.getServices(basePriceId);
            setServices(updated);
            setNewServiceId('');
        } catch(e) { console.error(e); }
    };

    const handleUpdate = async (svc: MembershipService, updates: Partial<MembershipService>) => {
        const updated = { ...svc, ...updates };
        setServices(prev => prev.map(s => s.membership_service_id === svc.membership_service_id ? updated : s));
        try {
             await membershipService.upsertServices([updated]);
        } catch(e) { console.error(e); }
    };

    return (
        <Dialog open={!!basePriceId} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Included Services</DialogTitle>
            <DialogContent>
                {loading ? <CircularProgress /> : (
                    <Box sx={{ mt: 2 }}>
                        {/* Add Bar */}
                        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel>Add Service</InputLabel>
                                <Select
                                    value={newServiceId}
                                    label="Add Service"
                                    onChange={e => setNewServiceId(e.target.value)}
                                >
                                     {availableServices
                                        .filter(s => !services.find(msg => msg.service_id === s.service_id && msg.is_active !== false))
                                        .map(s => <MenuItem key={s.service_id} value={s.service_id}>{s.name}</MenuItem>)
                                    }
                                </Select>
                            </FormControl>
                            <Button variant="contained" onClick={handleAdd} disabled={!newServiceId}>Add</Button>
                        </Box>
                        
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#fafafa' }}>
                                    <TableRow>
                                        <TableCell>Service</TableCell>
                                        <TableCell>Included?</TableCell>
                                        <TableCell>Limit</TableCell>
                                        <TableCell>Discount</TableCell>
                                        <TableCell>Action</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {services.filter(s => s.is_active !== false).map(s => {
                                        const serviceName = s.service_name || availableServices.find(as => as.service_id === s.service_id)?.name || 'Unknown';
                                        return (
                                            <TableRow key={s.membership_service_id || s.service_id}>
                                                <TableCell>{serviceName}</TableCell>
                                                <TableCell>
                                                    <FormControlLabel 
                                                        control={<Checkbox checked={s.is_included} onChange={e => handleUpdate(s, { is_included: e.target.checked })} />}
                                                        label={s.is_included ? "Free" : "Paid"}
                                                    />
                                                </TableCell>
                                                <TableCell>
                                                    <TextField size="small" value={s.usage_limit || ''} onChange={e => handleUpdate(s, { usage_limit: e.target.value })} />
                                                </TableCell>
                                                <TableCell>
                                                    {!s.is_included && (
                                                        <TextField size="small" value={s.discount || ''} onChange={e => handleUpdate(s, { discount: e.target.value })} placeholder="e.g 10%" />
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <Button size="small" color="error" onClick={() => handleUpdate(s, { is_active: false })}>Remove</Button>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {services.filter(s => s.is_active !== false).length === 0 && (
                                        <TableRow><TableCell colSpan={5} align="center">No services configured.</TableCell></TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose}>Done</Button>
            </DialogActions>
        </Dialog>
    );
};
