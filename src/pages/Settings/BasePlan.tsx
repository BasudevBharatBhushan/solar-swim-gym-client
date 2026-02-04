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
  const [bundledServices, setBundledServices] = useState<MembershipService[]>([]);
  const [availableServices, setAvailableServices] = useState<any[]>([]); // For dropdown

  const [openCreate, setOpenCreate] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);
  const [newServiceId, setNewServiceId] = useState('');
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
      
      // Use new dedicated endpoint for bundled services
      const bundledData = await membershipService.getBasePlanServices(currentLocationId);
      setBundledServices(bundledData);

      // Fetch all services for the dropdown to add new bundled services
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
  
  // Sort rows? Maybe by Plan Name, then Role, then Age.
  const uniqueRows = Array.from(uniqueRowsMap.values()).sort((a, b) => {
      if (a.planName !== b.planName) return a.planName.localeCompare(b.planName);
      if (a.role !== b.role) return a.role.localeCompare(b.role);
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
      
      // If value is 0 or empty, maybe delete? Assuming upsert handles it.
      
      const payload: BasePrice = {
          base_price_id: existing?.base_price_id,
          location_id: currentLocationId,
          name: row.planName,
          role: row.role,
          age_group_id: row.ageGroupId,
          subscription_term_id: termId,
          price: val,
          is_active: true // Default active when adding
      };

      try {
          const result = await basePriceService.upsert(payload);
          // Update local state
          setBasePrices(prev => {
              // Also if we created a new one, remove potential dupes if logic fails, but filter by ID is safe
              // If it was a create, existing ID was undefined.
              // Logic check: if we just created, we need to match by keys to replace local "placeholder"? 
              // Actually fetching again or selective update is better.
              // Simple approach: remove the record matching keys, add result.
              const filtered = prev.filter(p => !(p.name === row.planName && p.role === row.role && p.age_group_id === row.ageGroupId && p.subscription_term_id === termId));
              return [...filtered, result];
          });
      } catch (e) {
          console.error("Save failed", e);
      }
  };


  const handleRoleUpdate = async (row: RowKey, newRole: 'PRIMARY' | 'ADD_ON') => {
      if (!currentLocationId) return;
      if (row.role === newRole) return;

      // Find all prices that belong to this logical "row"
      const matchingPrices = basePrices.filter(p => 
          p.name === row.planName && 
          p.role === row.role && 
          p.age_group_id === row.ageGroupId
      );

      // Optimistic Update
      const oldPrices = [...basePrices];
      setBasePrices(prev => prev.map(p => {
          if (p.name === row.planName && p.role === row.role && p.age_group_id === row.ageGroupId) {
              return { ...p, role: newRole };
          }
          return p;
      }));

      try {
          // Update each record in the background
          const promises = matchingPrices.map(p => {
              const { age_group_name, term_name, ...cleanPrice } = p;
              const payload: BasePrice = {
                  ...cleanPrice,
                  role: newRole
              };
              return basePriceService.upsert(payload);
          });

          await Promise.all(promises);
          setSuccess(`Role updated to ${newRole === 'PRIMARY' ? 'Primary' : 'AddOn'}`);
      } catch (e) {
          console.error("Failed to update role", e);
          setError("Failed to update role. Reverting...");
          setBasePrices(oldPrices); // Revert on failure
      }
  };


  const handleBundledServiceUpdate = async (service: MembershipService, updates: Partial<MembershipService>) => {
      if (!currentLocationId) return;
      
      const updated = { ...service, ...updates };

      // Optimistic Update
      setBundledServices(prev => prev.map(s => s.membership_service_id === service.membership_service_id ? updated : s));

      try {
          // Use the new upsert endpoint which handles stripping IDs and setting base plan flag
          await membershipService.upsertMembershipServices([updated]);
      } catch (e) {
          console.error("Bundled service update failed", e);
          // Revert?
      }
  };

    const handleAddBundledService = async () => {
        if (!currentLocationId || !newServiceId) return;

        const newService: MembershipService = {
            service_id: newServiceId,
            is_included: true,
            usage_limit: 'Unlimited',
            is_part_of_base_plan: true,
            is_active: true,
            membership_program_id: null
        };

        try {
            await membershipService.upsertMembershipServices([newService]);
            // Refresh list
            const updatedList = await membershipService.getBasePlanServices(currentLocationId);
            setBundledServices(updatedList);
            setOpenAddService(false);
            setNewServiceId('');
        } catch (e) {
            console.error("Failed to add service", e);
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
             const result = await basePriceService.upsert(payload);
             setBasePrices(prev => [...prev, result]);
             setSuccess("Base plan row created successfully.");
             setOpenCreate(false);
             // Reset form for next time
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
                  description="Configure base plan pricing for different age groups and subscription terms."
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

        {loading ? <CircularProgress /> : Object.keys(rowsByPlan).map(planName => (
            <Paper key={planName} sx={{ mb: 4, overflow: 'hidden' }}>
                 <Box sx={{ bgcolor: '#e3f2fd', p: 2, borderBottom: '1px solid #e0e0e0' }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{planName}</Typography>
                </Box>
                <TableContainer>
                    <Table size="small">
                        <TableHead>
                            <TableRow sx={{ bgcolor: '#f5f5f5' }}>
                                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Age Group</TableCell>
                                {subscriptionTerms.map(term => (
                                    <TableCell key={term.subscription_term_id} sx={{ fontWeight: 'bold' }} align="center">
                                        {term.name}
                                    </TableCell>
                                ))}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {rowsByPlan[planName].map(row => (
                                <TableRow key={getRowId(row)}>
                                    <TableCell>
                                        <Select
                                            size="small"
                                            value={row.role}
                                            onChange={(e) => handleRoleUpdate(row, e.target.value as 'PRIMARY' | 'ADD_ON')}
                                            sx={{ 
                                                minWidth: 100,
                                                bgcolor: row.role === 'PRIMARY' ? 'rgba(33, 150, 243, 0.08)' : 'rgba(156, 39, 176, 0.08)',
                                                color: row.role === 'PRIMARY' ? '#1976d2' : '#9c27b0',
                                                fontWeight: 'bold',
                                                '& .MuiOutlinedInput-notchedOutline': {
                                                    borderColor: row.role === 'PRIMARY' ? 'rgba(25, 118, 210, 0.3)' : 'rgba(156, 39, 176, 0.3)',
                                                },
                                                '& .MuiSelect-select': {
                                                    py: 0.5,
                                                    fontSize: '0.875rem'
                                                }
                                            }}
                                        >
                                            <MenuItem value="PRIMARY" sx={{ color: '#1976d2', fontWeight: 'bold' }}>Primary</MenuItem>
                                            <MenuItem value="ADD_ON" sx={{ color: '#9c27b0', fontWeight: 'bold' }}>AddOn</MenuItem>
                                        </Select>
                                    </TableCell>
                                    <TableCell>{ageGroups.find(g => g.age_group_id === row.ageGroupId)?.name}</TableCell>
                                    {subscriptionTerms.map(term => {
                                        const priceObj = getPrice(row, term.subscription_term_id);
                                        return (
                                            <TableCell key={term.subscription_term_id} align="center">
                                                <TextField 
                                                    size="small"
                                                    type="number"
                                                    defaultValue={priceObj?.price || ''}
                                                    placeholder="-"
                                                    onBlur={(e) => {
                                                        const val = parseFloat(e.target.value);
                                                        if (!isNaN(val) && val !== priceObj?.price) {
                                                            handlePriceSave(row, term.subscription_term_id, val);
                                                        }
                                                    }}
                                                    sx={{ width: 100 }}
                                                    InputProps={{
                                                        startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                    }}
                                                />
                                            </TableCell>
                                        )
                                    })}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        ))}

        {/* --- Bundled Services --- */}
        <Box sx={{ mt: 6 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold' }}>Base Plan Bundled Services</Typography>
                
                <Button 
                    variant="outlined" 
                    startIcon={<Add />} 
                    onClick={() => setOpenAddService(true)}
                    sx={{ 
                        borderColor: '#e0e0e0',
                        color: 'text.primary',
                        '&:hover': {
                            borderColor: '#bdbdbd',
                            bgcolor: 'rgba(0,0,0,0.04)'
                        }
                    }}
                >
                    Add Service
                </Button>
            </Box>
            <Paper>
                 <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Service Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Included?</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Usage Limit</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>
                                    Discount
                                    <Typography variant="caption" display="block" sx={{ fontWeight: 'normal', color: 'text.secondary', fontSize: '0.75rem' }}>
                                        (Add % for percentage, otherwise fixed amount)
                                    </Typography>
                                </TableCell>
                            </TableRow>
                        </TableHead>
                         <TableBody>
                            {bundledServices.map(bs => {
                                const serviceName = bs.service_name || availableServices.find(s => s.service_id === bs.service_id)?.name || 'Unknown Service';
                                return (
                                    <TableRow key={bs.membership_service_id}>
                                        <TableCell>{serviceName}</TableCell>
                                        <TableCell>
                                            <FormControlLabel 
                                                control={
                                                    <Checkbox 
                                                        checked={bs.is_included} 
                                                        onChange={(e) => handleBundledServiceUpdate(bs, { is_included: e.target.checked })}
                                                    />
                                                } 
                                                label={bs.is_included ? "Free / Included" : "Payable"}
                                            />
                                        </TableCell>
                                        <TableCell>
                                            <TextField 
                                                size="small"
                                                value={bs.usage_limit || ''}
                                                placeholder="Unlimited"
                                                onChange={(e) => handleBundledServiceUpdate(bs, { usage_limit: e.target.value })}
                                            />
                                        </TableCell>
                                        <TableCell>
                                             {/* If included, show 'Free' or disabled discount? user says 'if is included that flag it as free' */}
                                             {bs.is_included ? (
                                                  <Chip label="FREE" color="success" size="small" />
                                             ) : (
                                                  <TextField 
                                                    size="small"
                                                    value={bs.discount || ''}
                                                    placeholder="e.g. 10%"
                                                    onChange={(e) => handleBundledServiceUpdate(bs, { discount: e.target.value })}
                                                />
                                             )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                            {/* Dummy Add Row if needed, but user said 'Add' controls */}
                            {bundledServices.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} align="center">No bundled services found.</TableCell>
                                </TableRow>
                            )}
                         </TableBody>
                    </Table>
                </TableContainer>
            </Paper>
        </Box>
        
        {/* Create Dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Add Base Plan Row</DialogTitle>
            <DialogContent>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                     <TextField 
                        label="Plan Name"
                        fullWidth
                        value={createForm.name || ''}
                        onChange={e => setCreateForm({...createForm, name: e.target.value})}
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
        {/* Add Bundled Service Dialog */}
        <Dialog open={openAddService} onClose={() => setOpenAddService(false)}>
            <DialogTitle>Add Bundled Service</DialogTitle>
            <DialogContent>
                <FormControl fullWidth sx={{ mt: 2, minWidth: 300 }}>
                    <InputLabel>Select Service</InputLabel>
                    <Select
                        value={newServiceId}
                        label="Select Service"
                        onChange={(e) => setNewServiceId(e.target.value)}
                    >
                        {availableServices
                            .filter(s => !bundledServices.find(bs => bs.service_id === s.service_id))
                            .map(s => (
                                <MenuItem key={s.service_id} value={s.service_id}>{s.name}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenAddService(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleAddBundledService} disabled={!newServiceId}>
                    Add
                </Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
            <Alert severity="success" onClose={() => setSuccess(null)} variant="filled">{success}</Alert>
        </Snackbar>
    </Box>
  );
};
