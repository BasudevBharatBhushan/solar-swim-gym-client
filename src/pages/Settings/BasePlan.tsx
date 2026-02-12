import { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  ListSubheader,
  Divider,
  TextField,
  InputAdornment,
  CircularProgress,
  IconButton,
  Chip,
  FormControlLabel,
  Checkbox,
  Snackbar,
  Alert,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Add, Edit, Save, Delete } from '@mui/icons-material';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { basePriceService, BasePrice } from '../../services/basePriceService';
import { serviceCatalog, Service } from '../../services/serviceCatalog';
import { membershipService, MembershipService } from '../../services/membershipService';
import { PageHeader } from '../../components/Common/PageHeader';

// --- Types ---
interface ProfileKey {
  planName: string;
  role: 'PRIMARY' | 'ADD_ON';
  ageGroupId: string;
}

export const BasePlan = () => {
  const { currentLocationId } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();
  
  // -- Data State --
  const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
  const [allServices, setAllServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(false);

  // -- UI State --
  const [selectedProfile, setSelectedProfile] = useState<ProfileKey | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // -- Edit State --
  const [editedPrices, setEditedPrices] = useState<Record<string, number>>({}); // termId -> price
  const [editedServices, setEditedServices] = useState<MembershipService[]>([]);
  const [bundledServicesLoading, setBundledServicesLoading] = useState(false);

  // -- Feedback --
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // -- Create Dialog State --
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<BasePrice>>({
    role: 'PRIMARY',
    is_active: true
  });

  // --- 1. Fetch Data ---
  const fetchData = useCallback(async () => {
    if (!currentLocationId) return;
    setLoading(true);
    try {
      const [pricesData, servicesData] = await Promise.all([
        basePriceService.getAll(currentLocationId),
        serviceCatalog.getServices(currentLocationId)
      ]);
      setBasePrices(pricesData.prices);
      const services = servicesData.data || servicesData;
      setAllServices(Array.isArray(services) ? services : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load data.");
    } finally {
      setLoading(false);
    }
  }, [currentLocationId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const ageGroupsWithProfiles = useMemo(() => {
    const groups: Record<string, ProfileKey[]> = {};
    
    // Identify unique profiles
    const uniqueKeys = new Set<string>();
    const profiles: ProfileKey[] = [];

    basePrices.forEach(p => {
      const keyStr = `${p.name}-${p.role}-${p.age_group_id}`;
      if (!uniqueKeys.has(keyStr)) {
        uniqueKeys.add(keyStr);
        profiles.push({
          planName: p.name,
          role: p.role as 'PRIMARY' | 'ADD_ON',
          ageGroupId: p.age_group_id
        });
      }
    });

    // Sort: PRIMARY first, then by Name
    profiles.sort((a, b) => {
        if (a.role !== b.role) return a.role === 'PRIMARY' ? -1 : 1;
        return a.planName.localeCompare(b.planName);
    });

    // Group by Age Group ID
    profiles.forEach(p => {
        if (!groups[p.ageGroupId]) groups[p.ageGroupId] = [];
        groups[p.ageGroupId].push(p);
    });

    // Sort the groups: "Adult" first, then by min_age
    return Object.entries(groups).sort(([idA], [idB]) => {
        const agA = ageGroups.find(g => g.age_group_id === idA);
        const agB = ageGroups.find(g => g.age_group_id === idB);
        
        const isAdultA = agA?.name.toLowerCase().includes('adult');
        const isAdultB = agB?.name.toLowerCase().includes('adult');
        
        if (isAdultA && !isAdultB) return -1;
        if (!isAdultA && isAdultB) return 1;
        
        return (agA?.min_age || 0) - (agB?.min_age || 0);
    }).map(([id, profiles]) => ({ ageGroupId: id, profiles }));
  }, [basePrices, ageGroups]);

  const loadBundledServices = useCallback(async (profile: ProfileKey) => {
      // Find a representative base_price_id for this profile
      // We assume services are attached to the 'profile', meaning any term's ID *should* work if backend links them,
      // or we pick one to be the 'master'. Existing logic used *any* ID found.
      const priceRecord = basePrices.find(p => 
          p.name === profile.planName && 
          p.role === profile.role && 
          p.age_group_id === profile.ageGroupId
      );

      if (priceRecord?.base_price_id) {
          setBundledServicesLoading(true);
          try {
              const services = await membershipService.getServices(priceRecord.base_price_id, currentLocationId || undefined);
              setEditedServices(services);
          } catch (e) {
              console.error(e);
          } finally {
              setBundledServicesLoading(false);
          }
      } else {
          setEditedServices([]);
      }
  }, [basePrices, currentLocationId]);

  // --- 3. Selection Logic ---
  // Select first profile on load
  useEffect(() => {
    if (ageGroupsWithProfiles.length > 0 && !selectedProfile) {
        // Select first profile of first group
        if (ageGroupsWithProfiles[0].profiles.length > 0) {
            setSelectedProfile(ageGroupsWithProfiles[0].profiles[0]);
        }
    }
  }, [ageGroupsWithProfiles, selectedProfile]);

  // When selection changes, reset edit mode and load bundled services
  useEffect(() => {
    if (selectedProfile) {
        setIsEditing(false);
        setEditedPrices({});
        loadBundledServices(selectedProfile);
    }
  }, [selectedProfile, loadBundledServices]);

  // --- 4. Helpers ---
  const getAgeGroupName = useCallback((id: string) => ageGroups.find(g => g.age_group_id === id)?.name || 'Unknown', [ageGroups]);
  
  const getExistingPrice = useCallback((profile: ProfileKey, termId: string) => {
      return basePrices.find(p => 
          p.name === profile.planName && 
          p.role === profile.role && 
          p.age_group_id === profile.ageGroupId && 
          p.subscription_term_id === termId
      );
  }, [basePrices]);

  // --- 5. Handlers ---
  
  const handleStartEdit = useCallback(() => {
    if (!selectedProfile) return;
    
    // Initialize edited prices from current state
    const prices: Record<string, number> = {};
    subscriptionTerms.forEach(t => {
        const existing = getExistingPrice(selectedProfile, t.subscription_term_id);
        if (existing) prices[t.subscription_term_id] = existing.price;
    });
    setEditedPrices(prices);
    setIsEditing(true);
  }, [selectedProfile, subscriptionTerms, getExistingPrice]);

  const handleCancelEdit = useCallback(() => {
    setIsEditing(false);
    setEditedPrices({});
    // Re-load services to reset changes
    if (selectedProfile) loadBundledServices(selectedProfile);
  }, [selectedProfile, loadBundledServices]);

  const handleSaveChanges = useCallback(async () => {
      if (!selectedProfile || !currentLocationId) return;
      setIsSaving(true);
      
      try {
        // 1. Save Prices (Bulk Upsert)
        const pricesPayload: BasePrice[] = [];
        for (const [termId, price] of Object.entries(editedPrices)) {
            const existing = getExistingPrice(selectedProfile, termId);
            
             // Explicitly verify ID matches expected plan if found
            if (existing && existing.name !== selectedProfile.planName) {
                console.error("CRITICAL MISMATCH: Found price ID for wrong plan!", existing, selectedProfile);
                continue; 
            }
            
            // Only add to payload if changed or new
            if (existing && existing.price === price) continue;
            
            pricesPayload.push({
                base_price_id: existing?.base_price_id,
                location_id: currentLocationId,
                name: selectedProfile.planName, // CRITICAL: Backend needs this for uniqueness
                role: selectedProfile.role,     // CRITICAL: Backend needs this for uniqueness
                age_group_id: selectedProfile.ageGroupId,
                subscription_term_id: termId,
                price: isNaN(price) ? 0 : price,
                is_active: true
            });
        }

        if (pricesPayload.length > 0) {
            console.log("Saving Bulk Price Payload:", pricesPayload);
            // Send as { location_id, prices: [...] }
            await basePriceService.upsert({
                location_id: currentLocationId,
                prices: pricesPayload
            }, currentLocationId || undefined);
        }

        // 2. Save Services
        // We need a base_price_id to attach services to.
        // If we just created prices, we might need to wait, but usually there's at least one existing.
        // Refresh base prices to get new IDs if any
        const refreshedPrices = await basePriceService.getAll(currentLocationId);
        setBasePrices(refreshedPrices.prices);
        
        // Find owner ID from refreshed data
        const ownerId = refreshedPrices.prices.find(p => 
            p.name === selectedProfile.planName && 
            p.role === selectedProfile.role && 
            p.age_group_id === selectedProfile.ageGroupId &&
            p.base_price_id // Ensure it has an ID
        )?.base_price_id;

        if (ownerId && editedServices.length > 0) {
            // Ensure all services have the correct ownerId
            const servicesPayload = editedServices.map(s => ({
                ...s,
                membership_program_id: ownerId
            }));
            await membershipService.upsertServices(servicesPayload, currentLocationId || undefined);
        }

        // Final Refresh
        await fetchData(); // Full refresh
        // Services refresh
        if (selectedProfile) loadBundledServices(selectedProfile);

        setSuccess("Changes saved successfully.");
        setIsEditing(false);

      } catch (e) {
          console.error(e);
          setError("Failed to save changes.");
      } finally {
          setIsSaving(false);
      }
  }, [selectedProfile, currentLocationId, editedPrices, getExistingPrice, editedServices, fetchData, loadBundledServices]);

  const handleCreateProfile = useCallback(async () => {
    if(!createForm.name || !createForm.age_group_id || !createForm.subscription_term_id || !currentLocationId) return;
    
    setIsSaving(true);
    const priceValue = Number(createForm.price || 0);
    
    // Construct bulk payload for creation as well
    const payload = {
        location_id: currentLocationId,
        prices: [{
            ...createForm,
            location_id: currentLocationId, // Ensure location_id is in the object
            price: priceValue,
            name: createForm.name!,     // Assert non-null as per check above
            role: createForm.role!      // Assert non-null as per check above
        } as BasePrice]
    };

    try {
        await basePriceService.upsert(payload, currentLocationId || undefined);
        await fetchData();
        setSuccess("Base Plan created.");
        setOpenCreate(false);
        setCreateForm({ role: 'PRIMARY', is_active: true });
    } catch (e) {
        console.error("Create failed:", e);
        setError("Failed to create Base Plan.");
    } finally {
        setIsSaving(false);
    }
  }, [createForm, currentLocationId, fetchData]);
  const handleOpenCreateDialog = useCallback(() => {
      setOpenCreate(true);
  }, []);
  const handleCloseCreateDialog = useCallback(() => {
      setOpenCreate(false);
  }, []);
  const handleCreateFormChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const { name, value } = e.target;
      if (name === 'price') {
          setCreateForm(prev => ({ ...prev, price: Number(value) }));
          return;
      }
      setCreateForm(prev => ({ ...prev, [name]: value }));
  }, []);
  const handleCreateRoleChange = useCallback((e: SelectChangeEvent<string>) => {
      const roleValue = e.target.value as 'PRIMARY' | 'ADD_ON';
      setCreateForm(prev => ({ ...prev, role: roleValue }));
  }, []);
  const handleCreateAgeGroupChange = useCallback((e: SelectChangeEvent<string>) => {
      setCreateForm(prev => ({ ...prev, age_group_id: e.target.value }));
  }, []);
  const handleCreateTermChange = useCallback((e: SelectChangeEvent<string>) => {
      setCreateForm(prev => ({ ...prev, subscription_term_id: e.target.value }));
  }, []);
  const handleCloseError = useCallback(() => {
      setError(null);
  }, []);
  const handleCloseSuccess = useCallback(() => {
      setSuccess(null);
  }, []);
  const handleProfileSelect = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
      const key = e.currentTarget.dataset.profileKey;
      if (!key) return;
      const [planName, role, ageGroupId] = key.split('|');
      setSelectedProfile({
          planName,
          role: role as 'PRIMARY' | 'ADD_ON',
          ageGroupId
      });
  }, []);
  const handleTermPriceChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const termId = e.currentTarget.dataset.termId;
      if (!termId) return;
      const val = e.target.value;
      const numVal = val === '' ? 0 : parseFloat(val);
      setEditedPrices(prev => ({ ...prev, [termId]: numVal }));
  }, []);
  const handleAddBundledService = useCallback((e: SelectChangeEvent<string>) => {
      const svcId = e.target.value as string;
      setEditedServices(prev => [
          ...prev,
          {
              service_id: svcId,
              is_included: true,
              usage_limit: 'Unlimited',
              is_active: true
          }
      ]);
  }, []);
  const handleEditedServiceIncludedChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      if (!Number.isFinite(index)) return;
      setEditedServices(prev => {
          const copy = [...prev];
          const svc = copy[index];
          if (!svc) return prev;
          const newDiscount = e.target.checked ? '' : svc.discount;
          copy[index] = { ...svc, is_included: e.target.checked, discount: newDiscount };
          return copy;
      });
  }, []);
  const handleEditedServiceUsageLimitChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      if (!Number.isFinite(index)) return;
      setEditedServices(prev => {
          const copy = [...prev];
          const svc = copy[index];
          if (!svc) return prev;
          copy[index] = { ...svc, usage_limit: e.target.value };
          return copy;
      });
  }, []);
  const handleEditedServiceDiscountAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      if (!Number.isFinite(index)) return;
      const val = e.target.value;
      if (!/^\d*\.?\d*$/.test(val)) return;
      setEditedServices(prev => {
          const copy = [...prev];
          const svc = copy[index];
          if (!svc) return prev;
          copy[index] = { ...svc, discount: val };
          return copy;
      });
  }, []);
  const handleEditedServiceDiscountPercentChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      if (!Number.isFinite(index)) return;
      const val = e.target.value;
      if (!/^\d*\.?\d*$/.test(val)) return;
      setEditedServices(prev => {
          const copy = [...prev];
          const svc = copy[index];
          if (!svc) return prev;
          copy[index] = { ...svc, discount: val ? `${val}%` : '' };
          return copy;
      });
  }, []);
  const handleEditedServiceRemove = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
      const index = Number(e.currentTarget.dataset.index);
      if (!Number.isFinite(index)) return;
      setEditedServices(prev => {
          const copy = [...prev];
          const svc = copy[index];
          if (!svc) return prev;
          if (svc.membership_service_id) {
              copy[index] = { ...svc, is_active: false };
          } else {
              copy.splice(index, 1);
          }
          return copy;
      });
  }, []);


  // --- Render ---

  if (!currentLocationId) return <Alert severity="warning">Please select a location.</Alert>;

  return (
    <Box sx={{ p: 3 }}>
        <PageHeader 
            title="Base Plans & Pricing" 
            description="Manage base plans, pricing matrices, and bundled services."
            breadcrumbs={[
                { label: 'Settings', href: '/admin/settings' },
                { label: 'Base Plans & Pricing', active: true }
            ]}
            action={
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={handleOpenCreateDialog}
                    sx={{ 
                        borderRadius: '8px', // Reduced from 2 (default 8px usually, but making sure it's explicit small) or just 1
                        textTransform: 'none', 
                        fontWeight: 700,
                        px: 3,
                        bgcolor: '#4182f9',
                        '&:hover': { bgcolor: '#3a75e0' }
                    }}
                >
                    New Base Plan
                </Button>
            }
        />
        
        <Grid container spacing={3}>
            {/* Left Column: Plan List */}
            <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                <Paper sx={{ flex: 1, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
                    <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #f0f4f8' }}>
                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                            BASE PLANS
                        </Typography>
                    </Box>
                    <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                        {loading && <Box sx={{ p: 2, textAlign: 'center' }}><CircularProgress size={24} /></Box>}
                        
                        {ageGroupsWithProfiles.map(group => (
                            <Box key={group.ageGroupId}>
                                <ListSubheader sx={{ bgcolor: '#fff', fontWeight: 900, color: '#0f172a', lineHeight: '48px', fontSize: '1.1rem', letterSpacing: '-0.02em', borderBottom: '1px solid #f1f5f9' }}>
                                    {getAgeGroupName(group.ageGroupId)}
                                </ListSubheader>
                                {group.profiles.map(profile => {
                                    const isSelected = selectedProfile?.planName === profile.planName && 
                                                     selectedProfile?.role === profile.role && 
                                                     selectedProfile?.ageGroupId === profile.ageGroupId;
                                    return (
                                        <ListItemButton 
                                            key={`${profile.role}-${profile.ageGroupId}-${profile.planName}`}
                                            selected={isSelected}
                                            onClick={handleProfileSelect}
                                            data-profile-key={`${profile.planName}|${profile.role}|${profile.ageGroupId}`}
                                            sx={{ 
                                                py: 2, 
                                                px: 2.5, 
                                                borderBottom: '1px solid #f8fafc',
                                                '&.Mui-selected': { 
                                                    borderRight: '3px solid #3b82f6',
                                                    bgcolor: '#f0f9ff'
                                                },
                                                transition: 'all 0.2s',
                                                '&:hover': { bgcolor: '#f8fafc' } // Hover when not selected
                                            }}
                                        >
                                            <ListItemText 
                                                primary={profile.planName}
                                                secondary={profile.role === 'PRIMARY' ? 'Primary Member' : 'Add-on Member'}
                                                sx={{
                                                    m: 0,
                                                    '& .MuiListItemText-primary': { 
                                                        color: isSelected ? '#3b82f6' : '#1e293b',
                                                        fontWeight: isSelected ? 800 : 600,
                                                        fontSize: '0.925rem'
                                                    },
                                                    '& .MuiListItemText-secondary': {
                                                        color: '#64748b',
                                                        fontSize: '0.75rem',
                                                        fontWeight: 500,
                                                        mt: 0.5
                                                    }
                                                }}
                                            />
                                        </ListItemButton>
                                    );
                                })}
                            </Box>
                        ))}
                        {ageGroupsWithProfiles.length === 0 && !loading && (
                             <Box sx={{ p: 3, textAlign: 'center' }}>
                                 <Typography variant="caption" color="text.secondary">No plans found.</Typography>
                             </Box>
                        )}
                    </List>
                </Paper>
            </Grid>

            {/* Right Column: Details & Editing */}
            <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
                <Paper sx={{ flex: 1, minHeight: 400, display: 'flex', flexDirection: 'column', borderRadius: 2, overflow: 'hidden' }}>
                    {selectedProfile ? (
                        <>
                             {/* Header Section */}
                             <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                 <Box>
                                     <Typography variant="caption" sx={{ textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                                         {getAgeGroupName(selectedProfile.ageGroupId)}
                                     </Typography>
                                     <Stack direction="row" spacing={2} alignItems="center" sx={{ mt: 1 }}>
                                        <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                                            {selectedProfile.planName} 
                                        </Typography>
                                        <Chip 
                                            label={selectedProfile.role} 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: '#f1f5f9', 
                                                color: '#475569', 
                                                fontWeight: 800, 
                                                borderRadius: '6px',
                                                fontSize: '0.7rem',
                                                height: 24
                                            }} 
                                        />
                                     </Stack>
                                 </Box>
                                 <Box>
                                    {!isEditing && (
                                        <Button 
                                            variant="outlined" 
                                            startIcon={<Edit />} 
                                            onClick={handleStartEdit}
                                            sx={{ 
                                                borderRadius: 2, 
                                                textTransform: 'none', 
                                                fontWeight: 700,
                                                px: 3,
                                                color: '#1e293b',
                                                borderColor: '#e2e8f0'
                                            }}
                                        >
                                            Edit Plan
                                        </Button>
                                    )}
                                 </Box>
                             </Box>

                             {/* Content Scrollable */}
                             <Box sx={{ flex: 1, overflowY: 'auto', p: 4 }}>
                                 
                                 {/* Section 1: Pricing Configuration */}
                                 <Paper elevation={0} sx={{ p: 4, mb: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                                     <Typography variant="caption" sx={{ fontWeight: 800, mb: 3, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                         PRICING CONFIGURATION
                                     </Typography>
                                     <Grid container spacing={3}>
                                         {subscriptionTerms.length === 0 && (
                                             <Grid size={{ xs: 12 }}>
                                                 <Typography variant="body2" sx={{ color: '#64748b', textAlign: 'center', py: 4 }}>
                                                     No subscription terms configured.
                                                 </Typography>
                                             </Grid>
                                         )}
                                         {subscriptionTerms.map(term => {
                                             const existingPrice = getExistingPrice(selectedProfile, term.subscription_term_id);
                                             const priceValue = isEditing 
                                                 ? (editedPrices[term.subscription_term_id] ?? (existingPrice?.price || ''))
                                                 : existingPrice?.price;
                                             
                                             const isRecurring = term.payment_mode === 'RECURRING';
                                             const unitValue = term.recurrence_unit_value || 1;
                                             const unit = isRecurring ? (term.recurrence_unit || 'Month') : '';
                                             const cycleText = isRecurring ? `${unitValue} ${unit.toLowerCase()}${unitValue > 1 ? 's' : ''}` : '';

                                             return (
                                                 <Grid size={{ xs: 12, sm: 4 }} key={term.subscription_term_id}>
                                                     {isEditing ? (
                                                         <TextField 
                                                            label={term.name}
                                                            type="number"
                                                            fullWidth
                                                            variant="filled"
                                                            value={priceValue}
                                                            onChange={handleTermPriceChange}
                                                            inputProps={{ 'data-term-id': term.subscription_term_id }}
                                                            InputProps={{
                                                                startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                                                disableUnderline: true,
                                                                sx: { borderRadius: 2, bgcolor: '#f1f5f9' }
                                                            }}
                                                             helperText={isRecurring ? `Recurring every ${cycleText}` : 'Pay in full'}
                                                         />
                                                     ) : (
                                                         <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #f1f5f9' }}>
                                                             <Typography variant="caption" display="block" color="#64748b" fontWeight={700} sx={{ mb: 1 }}>
                                                                 {term.name}
                                                             </Typography>
                                                             <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                                                 {priceValue !== undefined ? `$${priceValue}` : '-'}
                                                             </Typography>
                                                             {isRecurring && priceValue !== undefined && (
                                                                 <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, mt: 0.5, display: 'block' }}>
                                                                     / {cycleText}
                                                                 </Typography>
                                                             )}
                                                         </Paper>
                                                     )}
                                                 </Grid>
                                             );
                                         })}
                                     </Grid>
                                 </Paper>

                                 {/* Section 2: Bundled Services */}
                                 <Paper elevation={0} sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                                     <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
                                         BUNDLED SERVICES
                                     </Typography>

                                     {bundledServicesLoading ? <CircularProgress size={24} /> : (
                                         <Box>
                                             {isEditing && (
                                                 <FormControl size="small" sx={{ mb: 3, width: 300 }}>
                                                     <InputLabel>Add Service</InputLabel>
                                                     <Select
                                                        label="Add Service"
                                                        value=""
                                                        onChange={handleAddBundledService}
                                                     >
                                                         {allServices
                                                            .filter(s => !editedServices.find(es => es.service_id === s.service_id && es.is_active !== false))
                                                            .map(s => <MenuItem key={s.service_id} value={s.service_id}>{s.name}</MenuItem>)
                                                         }
                                                     </Select>
                                                 </FormControl>
                                             )}

                                             <Stack spacing={2}>
                                                 {editedServices.filter(s => s.is_active !== false).map((svc, idx) => {
                                                     const serviceRef = allServices.find(as => as.service_id === svc.service_id);
                                                     const name = svc.service_name || serviceRef?.name || 'Unknown Service';
                                                     const description = serviceRef?.description || '';
                                                     const itemKey = svc.membership_service_id || (svc.service_id + idx);
                                                     
                                                     const isFree = svc.is_included;

                                                     return (
                                                         <Paper key={itemKey} elevation={0} sx={{ 
                                                             p: 3, 
                                                             display: 'flex', 
                                                             flexDirection: 'column',
                                                             gap: 2,
                                                             bgcolor: '#fff', 
                                                             border: '1px solid #e2e8f0', 
                                                             borderRadius: 3 
                                                         }}>
                                                             <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                                                 <Box>
                                                                     <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#0f172a' }}>{name}</Typography>
                                                                     {description && (
                                                                         <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block', maxWidth: 500 }}>
                                                                             {description}
                                                                         </Typography>
                                                                     )}
                                                                     {serviceRef?.type && (
                                                                         <Chip 
                                                                             label={serviceRef.type} 
                                                                             size="small" 
                                                                             sx={{ 
                                                                                 mt: 1, 
                                                                                 height: 20, 
                                                                                 fontSize: '0.6rem', 
                                                                                 fontWeight: 700, 
                                                                                 bgcolor: '#f1f5f9', 
                                                                                 color: '#64748b',
                                                                                 borderRadius: '4px'
                                                                             }} 
                                                                         />
                                                                     )}
                                                                 </Box>
                                                                 
                                                                 {/* View Mode Tags */}
                                                                 {!isEditing && (
                                                                     <Stack direction="row" spacing={1} alignItems="center">
                                                                         {isFree ? (
                                                                             <Chip 
                                                                                label="INCLUDED" 
                                                                                size="small" 
                                                                                sx={{ 
                                                                                    bgcolor: '#10b981', 
                                                                                    color: 'white', 
                                                                                    fontWeight: 800, 
                                                                                    fontSize: '0.65rem', 
                                                                                    height: 24,
                                                                                    borderRadius: '6px'
                                                                                }} 
                                                                             />
                                                                         ) : (
                                                                             svc.discount ? (
                                                                                <Chip 
                                                                                    label={svc.discount.includes('%') ? `${svc.discount} OFF` : `$${svc.discount} OFF`} 
                                                                                    size="small" 
                                                                                    sx={{ 
                                                                                        bgcolor: '#f59e0b', 
                                                                                        color: 'white', 
                                                                                        fontWeight: 800, 
                                                                                        fontSize: '0.65rem', 
                                                                                        height: 24,
                                                                                        borderRadius: '6px'
                                                                                    }} 
                                                                                />
                                                                             ) : null
                                                                         )}
                                                                         
                                                                         <Box sx={{ bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                            <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                                                                                Limit: <Box component="span" sx={{ color: '#1e293b' }}>{svc.usage_limit || 'Unlimited'}</Box>
                                                                            </Typography>
                                                                         </Box>
                                                                     </Stack>
                                                                 )}
                                                             </Box>
                                                             
                                                             {/* Edit Mode Controls */}
                                                             {isEditing && (
                                                                 <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                                                    
                                                                    {/* Is Included / Free */}
                                                                    <FormControlLabel 
                                                                        control={
                                                                            <Checkbox 
                                                                                checked={svc.is_included}
                                                                                onChange={handleEditedServiceIncludedChange}
                                                                                inputProps={{ 'data-index': idx }}
                                                                                sx={{ '&.Mui-checked': { color: '#0f172a' } }}
                                                                            />
                                                                        }
                                                                        label={
                                                                            <Box>
                                                                                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Included (Free)</Typography>
                                                                                <Typography variant="caption" sx={{ color: '#64748b' }}>Full 100% discount</Typography>
                                                                            </Box>
                                                                        }
                                                                    />

                                                                    <Divider orientation="vertical" flexItem variant="middle" />

                                                                    {/* Usage Limit */}
                                                                    <Box>
                                                                        <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600 }}>Usage Limit</Typography>
                                                                        <TextField 
                                                                            hiddenLabel
                                                                            variant="outlined"
                                                                            size="small"
                                                                            placeholder="Unlimited"
                                                                            value={svc.usage_limit || ''}
                                                                            onChange={handleEditedServiceUsageLimitChange}
                                                                            inputProps={{ 'data-index': idx }}
                                                                            sx={{ width: 140, bgcolor: 'white' }}
                                                                        />
                                                                    </Box>

                                                                    {/* Discount - Only if NOT included */}
                                                                    {!svc.is_included && (
                                                                        <>
                                                                            <Divider orientation="vertical" flexItem variant="middle" />
                                                                            <Box>
                                                                                <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600 }}>Discount (Optional)</Typography>
                                                                                <Stack direction="row" spacing={1}>
                                                                                    {/* Dual Field Implementation */}
                                                                                    <TextField
                                                                                        hiddenLabel
                                                                                        variant="outlined"
                                                                                        size="small"
                                                                                        placeholder="Amount"
                                                                                        value={!((svc.discount || '').includes('%')) ? svc.discount || '' : ''}
                                                                                        onChange={handleEditedServiceDiscountAmountChange}
                                                                                        inputProps={{ 'data-index': idx }}
                                                                                        disabled={(svc.discount || '').includes('%')}
                                                                                        InputProps={{
                                                                                            startAdornment: <InputAdornment position="start">$</InputAdornment>
                                                                                        }}
                                                                                        sx={{ width: 100, bgcolor: !((svc.discount || '').includes('%')) ? 'white' : '#f1f5f9' }}
                                                                                    />
                                                                                     <TextField
                                                                                        hiddenLabel
                                                                                        variant="outlined"
                                                                                        size="small"
                                                                                        placeholder="Percent"
                                                                                        value={(svc.discount || '').includes('%') ? (svc.discount || '').replace('%', '') : ''}
                                                                                        onChange={handleEditedServiceDiscountPercentChange}
                                                                                        inputProps={{ 'data-index': idx }}
                                                                                        disabled={!!svc.discount && !svc.discount.includes('%')}
                                                                                        InputProps={{
                                                                                            endAdornment: <InputAdornment position="end">%</InputAdornment>
                                                                                        }}
                                                                                        sx={{ width: 100, bgcolor: (svc.discount || '').includes('%') ? 'white' : '#f1f5f9' }}
                                                                                    />
                                                                                </Stack>
                                                                            </Box>
                                                                        </>
                                                                    )}

                                                                    <Box sx={{ flex: 1 }} />

                                                                    <IconButton 
                                                                        size="medium" 
                                                                        onClick={handleEditedServiceRemove}
                                                                        data-index={idx}
                                                                        sx={{ 
                                                                            color: '#ef4444', 
                                                                            bgcolor: '#fff', 
                                                                            border: '1px solid #fecaca',
                                                                            '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' } 
                                                                        }}
                                                                    >
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
                                                                 </Box>
                                                             )}
                                                         </Paper>
                                                     );
                                                 })}
                                                 {editedServices.filter(s => s.is_active !== false).length === 0 && (
                                                     <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                                                         <Typography variant="body2" color="text.secondary">
                                                             No bundled services configured. Add a service to get started.
                                                         </Typography>
                                                     </Paper>
                                                 )}
                                             </Stack>
                                         </Box>
                                     )}
                                 </Paper>
                             </Box>

                             {/* Footer Actions */}
                             {isEditing && (
                                <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                    <Button 
                                        variant="text" 
                                        color="inherit" 
                                        onClick={handleCancelEdit} 
                                        disabled={isSaving}
                                        sx={{ borderRadius: 2, fontWeight: 700, color: '#1e293b' }}
                                    >
                                        Cancel
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        onClick={handleSaveChanges} 
                                        disabled={isSaving} 
                                        startIcon={isSaving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                                        sx={{ 
                                            borderRadius: 2, 
                                            fontWeight: 700, 
                                            px: 4,
                                            bgcolor: '#4f46e5',
                                            '&:hover': { bgcolor: '#4338ca' }
                                        }}
                                    >
                                        Save Changes
                                    </Button>
                                </Box>
                             )}
                        </>
                    ) : (
                        <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Typography color="text.secondary">Select a Base Plan to details.</Typography>
                        </Box>
                    )}
                </Paper>
            </Grid>
        </Grid>

        {/* Create Dialog (Preserved) */}
        <Dialog open={openCreate} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Base Plan</DialogTitle>
            <DialogContent>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                     <TextField 
                        label="Plan Name"
                        placeholder="e.g. Gold"
                        fullWidth
                        name="name"
                        value={createForm.name || ''}
                        onChange={handleCreateFormChange}
                    />
                     <FormControl fullWidth>
                        <InputLabel>Role</InputLabel>
                        <Select 
                            value={createForm.role || ''} 
                            label="Role"
                            onChange={handleCreateRoleChange}
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
                            onChange={handleCreateAgeGroupChange}
                        >
                             {ageGroups.map(g => (
                                <MenuItem key={g.age_group_id} value={g.age_group_id}>{g.name}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Create with an initial price point:
                    </Typography>
                     <FormControl fullWidth>
                        <InputLabel>Term</InputLabel>
                        <Select
                            value={createForm.subscription_term_id || ''}
                            label="Term"
                            onChange={handleCreateTermChange}
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
                        name="price"
                        value={createForm.price || ''}
                        onChange={handleCreateFormChange}
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0 } }}
                    />
                 </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleCloseCreateDialog}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleCreateProfile}
                    disabled={isSaving || !createForm.name || !createForm.age_group_id || !createForm.subscription_term_id}
                >
                    {isSaving ? <CircularProgress size={24} /> : "Create"}
                </Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={handleCloseError}>
            <Alert severity="error" onClose={handleCloseError} variant="filled">{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={handleCloseSuccess}>
            <Alert severity="success" onClose={handleCloseSuccess} variant="filled">{success}</Alert>
        </Snackbar>
    </Box>
  );
};
