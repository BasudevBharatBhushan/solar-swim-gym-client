import { useState, useEffect, useMemo } from 'react';
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
  const { ageGroups, subscriptionTerms, dropdownValues } = useConfig();
  
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
  const [editedPlanName, setEditedPlanName] = useState('');
  const [bundledServices, setBundledServices] = useState<MembershipService[]>([]);
  const [bundledServicesLoading, setBundledServicesLoading] = useState(false);

  // -- Service Management State --
  const [isAddingService, setIsAddingService] = useState(false);
  const [newServiceId, setNewServiceId] = useState('');
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceEditState, setServiceEditState] = useState<Partial<MembershipService>>({});


  // -- Feedback --
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // -- Create Dialog State --
  const [openCreate, setOpenCreate] = useState(false);
  const [createForm, setCreateForm] = useState<Partial<BasePrice>>({
    role: 'PRIMARY',
    is_active: true
  });

  // -- Delete Confirmation State --
  const [deleteConfirm, setDeleteConfirm] = useState<{
      open: boolean;
      title: string;
      message: string;
      onConfirm: () => Promise<void>;
  }>({
      open: false,
      title: '',
      message: '',
      onConfirm: async () => {}
  });

  // --- 1. Fetch Data ---
  const fetchData = async () => {
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
  };

  useEffect(() => {
    fetchData();
  }, [currentLocationId]);

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
        setEditingServiceId(null);
        setServiceEditState({});
    }
  }, [selectedProfile]);

  const loadBundledServices = async (profile: ProfileKey) => {
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
              setBundledServices(services);
          } catch (e) {
              console.error(e);
          } finally {
              setBundledServicesLoading(false);
          }
      } else {
          setBundledServices([]);
      }
  };

  // --- 4. Helpers ---
  const getAgeGroupName = (id: string) => ageGroups.find(g => g.age_group_id === id)?.name || 'Unknown';
  
  const getExistingPrice = (profile: ProfileKey, termId: string) => {
      return basePrices.find(p => 
          p.name === profile.planName && 
          p.role === profile.role && 
          p.age_group_id === profile.ageGroupId && 
          p.subscription_term_id === termId
      );
  };

  // --- 5. Handlers ---
  
  const handleStartEdit = () => {
    if (!selectedProfile) return;
    
    // Initialize edited prices from current state
    const prices: Record<string, number> = {};
    subscriptionTerms.forEach(t => {
        const existing = getExistingPrice(selectedProfile, t.subscription_term_id);
        if (existing) prices[t.subscription_term_id] = existing.price;
    });
    setEditedPrices(prices);
    setEditedPlanName(selectedProfile.planName);
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setIsEditing(false);
    setEditedPrices({});
    setEditedPlanName('');
    // Re-load services to reset changes
    if (selectedProfile) loadBundledServices(selectedProfile);
  };

  const handleSaveChanges = async () => {
      if (!selectedProfile || !currentLocationId) return;
      const trimmedPlanName = editedPlanName.trim();
      if (!trimmedPlanName) {
          setError("Plan name is required.");
          return;
      }
      setIsSaving(true);
      
      try {
        const nameChanged = trimmedPlanName !== selectedProfile.planName;
        const updatedProfile: ProfileKey = {
            ...selectedProfile,
            planName: trimmedPlanName
        };
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
            if (existing && existing.price === price && !nameChanged) continue;
            
            pricesPayload.push({
                base_price_id: existing?.base_price_id,
                location_id: currentLocationId,
                name: trimmedPlanName, // CRITICAL: Backend needs this for uniqueness
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


        // 2. Services are now handled independently. No longer saved here.

        // Final Refresh
        await fetchData(); // Full refresh
        // Services refresh
        setSelectedProfile(updatedProfile);
        loadBundledServices(updatedProfile);

        setSuccess("Changes saved successfully.");
        setIsEditing(false);
        setEditedPlanName('');

      } catch (e) {
          console.error(e);
          setError("Failed to save changes.");
      } finally {
          setIsSaving(false);
      }
  };

  const handleCreateProfile = async () => {
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
  };

  const handleDeleteProfile = () => {
      if (!selectedProfile) return;
      setDeleteConfirm({
          open: true,
          title: 'Delete Base Plan?',
          message: `Are you sure you want to delete the "${selectedProfile.planName}" (${selectedProfile.role}) plan? This will remove all pricing variations and bundled services. This action cannot be undone.`,
          onConfirm: async () => {
              if (!selectedProfile) return;
              try {
                  // Find a representative ID
                  const priceRecord = basePrices.find(p => 
                      p.name === selectedProfile.planName && 
                      p.role === selectedProfile.role && 
                      p.age_group_id === selectedProfile.ageGroupId
                  );
                  
                  if (priceRecord?.base_price_id) {
                      await basePriceService.delete(priceRecord.base_price_id, currentLocationId || undefined);
                      setSuccess("Base Plan deleted.");
                      setSelectedProfile(null);
                      await fetchData();
                  } else {
                      setError("Could not find plan ID to delete.");
                  }
              } catch (e: any) {
                  setError(e.message || "Failed to delete plan.");
              } finally {
                  setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
          }
      });
  };

  const handleDeleteServiceLink = (service: MembershipService) => {
      setDeleteConfirm({
          open: true,
          title: 'Remove Service?',
          message: `Are you sure you want to remove "${service.service_name || 'this service'}" from this plan?`,
          onConfirm: async () => {
              if (!service.membership_service_id) return;
              try {
                  await membershipService.deleteServiceLink(service.membership_service_id, currentLocationId || undefined);
                  setSuccess("Service removed.");
                  if (selectedProfile) loadBundledServices(selectedProfile);
              } catch (e: any) {
                  setError(e.message || "Failed to remove service.");
              } finally {
                  setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
          }
      });
  };

  const handleAddService = async () => {
      if (!selectedProfile || !newServiceId || !currentLocationId) return;
      
      // Find the ID to attach to
      const priceRecord = basePrices.find(p => 
          p.name === selectedProfile.planName && 
          p.role === selectedProfile.role && 
          p.age_group_id === selectedProfile.ageGroupId &&
          p.base_price_id
      );

      if (!priceRecord?.base_price_id) {
          setError("Cannot add service: Plan not fully initialized. Please save the plan first.");
          return;
      }

      setBundledServicesLoading(true);
      try {
          const newService: MembershipService = {
              service_id: newServiceId,
              membership_program_id: priceRecord.base_price_id,
              is_included: true,
              usage_limit: 'Unlimited',
              is_active: true
          };

          await membershipService.upsertServices([newService], currentLocationId);
          setSuccess("Service added.");
          setIsAddingService(false);
          setNewServiceId('');
          await loadBundledServices(selectedProfile);
      } catch (e: any) {
          setError(e.message || "Failed to add service.");
      } finally {
          setBundledServicesLoading(false);
      }
  };

  const handleUpdateService = async (serviceId: string) => {
      if (!selectedProfile || !currentLocationId) return;
      
      // Find original service to merge with
      const original = bundledServices.find(s => s.membership_service_id === serviceId);
      if (!original) return;

      const updated = { ...original, ...serviceEditState };

      setBundledServicesLoading(true);
      try {
           await membershipService.upsertServices([updated], currentLocationId);
           setSuccess("Service updated.");
           setEditingServiceId(null);
           setServiceEditState({});
           await loadBundledServices(selectedProfile);
      } catch (e: any) {
           setError(e.message || "Failed to update service.");
      } finally {
           setBundledServicesLoading(false);
      }
  };

  const handleStartEditService = (service: MembershipService) => {
      setEditingServiceId(service.membership_service_id || null);
      setServiceEditState({
          usage_limit: service.usage_limit,
          is_included: service.is_included,
          discount: service.discount
      });
  };


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
                    onClick={() => setOpenCreate(true)}
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
                                            onClick={() => setSelectedProfile(profile)}
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
                                     <Stack
                                        direction="row"
                                        spacing={2}
                                        alignItems="center"
                                        sx={{ mt: 2, flexWrap: 'wrap', rowGap: 1.5 }}
                                     >
                                        {isEditing ? (
                                            <TextField
                                                label="Plan Name"
                                                value={editedPlanName}
                                                onChange={(e) => setEditedPlanName(e.target.value)}
                                                size="medium"
                                                sx={{
                                                    minWidth: { xs: '100%', sm: 380, md: 440 },
                                                    maxWidth: { xs: '100%', md: 520 }
                                                }}
                                            />
                                        ) : (
                                            <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                                                {selectedProfile.planName}
                                            </Typography>
                                        )}
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
                                        <Box sx={{ display: 'flex', gap: 1 }}>
                                            <Button
                                                variant="outlined"
                                                startIcon={<Delete />}
                                                onClick={handleDeleteProfile}
                                                sx={{ 
                                                    color: '#ef4444', 
                                                    borderColor: '#fecaca', 
                                                    borderRadius: 2, 
                                                    textTransform: 'none', 
                                                    fontWeight: 700,
                                                    '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' }
                                                }}
                                            >
                                                Delete Plan
                                            </Button>
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
                                        </Box>
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
                                             const existingPrice = getExistingPrice(selectedProfile!, term.subscription_term_id);
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
                                                            onChange={(e) => {
                                                                const val = e.target.value;
                                                                const numVal = val === '' ? 0 : parseFloat(val);
                                                                setEditedPrices(prev => ({ ...prev, [term.subscription_term_id]: numVal }));
                                                            }}
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
                                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                              BUNDLED SERVICES
                                          </Typography>
                                          <Button 
                                              startIcon={<Add />} 
                                              size="small" 
                                              variant="outlined" 
                                              onClick={() => setIsAddingService(true)}
                                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700 }}
                                          >
                                              Add Service
                                          </Button>
                                      </Box>

                                      {bundledServicesLoading ? <CircularProgress size={24} /> : (
                                          <Box>
                                              {/* Add Service Area (Inline or Dialog - doing inline expand for now) */}
                                              {isAddingService && (
                                                  <Paper variant="outlined" sx={{ p: 2, mb: 3, bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                                                      <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 700 }}>Add New Service</Typography>
                                                      <Box sx={{ display: 'flex', gap: 2 }}>
                                                          <FormControl size="small" fullWidth>
                                                              <InputLabel>Select Service</InputLabel>
                                                              <Select
                                                                  label="Select Service"
                                                                  value={newServiceId}
                                                                  onChange={(e) => setNewServiceId(e.target.value)}
                                                              >
                                                                  {allServices
                                                                      .filter(s => !bundledServices.find(bs => bs.service_id === s.service_id && bs.is_active !== false))
                                                                      .map(s => {
                                                                          const typeLabel = dropdownValues?.find(v => 
                                                                              v.module?.toLowerCase() === 'services' && 
                                                                              v.label?.toUpperCase() === 'TYPE' && 
                                                                              v.value?.toLowerCase() === s.type?.toLowerCase()
                                                                          )?.value || s.type || 'Group';

                                                                          const catLabel = dropdownValues?.find(v => 
                                                                              v.module?.toLowerCase() === 'services' && 
                                                                              v.label?.toUpperCase() === 'CATEGORY' && 
                                                                              v.value?.toLowerCase() === s.service_type?.toLowerCase()
                                                                          )?.value || s.service_type || 'Training';

                                                                          return (
                                                                              <MenuItem key={s.service_id} value={s.service_id}>
                                                                                  {s.name} [{typeLabel}] ({catLabel})
                                                                              </MenuItem>
                                                                          );
                                                                      })
                                                                  }
                                                              </Select>
                                                          </FormControl>
                                                          <Button variant="contained" onClick={handleAddService} disabled={!newServiceId}>Add</Button>
                                                          <Button onClick={() => { setIsAddingService(false); setNewServiceId(''); }}>Cancel</Button>
                                                      </Box>
                                                  </Paper>
                                              )}

                                              <Stack spacing={2}>
                                                  {bundledServices.filter(s => s.is_active !== false).map((svc, idx) => {
                                                      // ... existing service rendering ...
                                                      
                                                      const serviceRef = allServices.find(as => as.service_id === svc.service_id);
                                                      const name = svc.service_name || serviceRef?.name || 'Unknown Service';
                                                      const description = serviceRef?.description || '';
                                                      const itemKey = svc.membership_service_id || (svc.service_id + idx);
                                                      
                                                      const isFree = svc.is_included;
                                                      const isEditingThis = editingServiceId === svc.membership_service_id;

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
                                                                      <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                                          {(serviceRef?.type || 'Group') && (
                                                                              <Chip 
                                                                                  label={(dropdownValues?.find(v => 
                                                                                      v.module?.toLowerCase() === 'services' && 
                                                                                      v.label?.toUpperCase() === 'TYPE' && 
                                                                                      v.value?.toLowerCase() === serviceRef?.type?.toLowerCase()
                                                                                  )?.value || serviceRef?.type || 'Group').toUpperCase()} 
                                                                                  size="small" 
                                                                                  sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} 
                                                                              />
                                                                          )}
                                                                          {(serviceRef?.service_type || 'Training') && (
                                                                              <Chip 
                                                                                  label={(dropdownValues?.find(v => 
                                                                                      v.module?.toLowerCase() === 'services' && 
                                                                                      v.label?.toUpperCase() === 'CATEGORY' && 
                                                                                      v.value?.toLowerCase() === serviceRef?.service_type?.toLowerCase()
                                                                                  )?.value || serviceRef?.service_type || 'Training').toUpperCase()} 
                                                                                  size="small" 
                                                                                  sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#3b82f6', borderRadius: '4px' }} 
                                                                              />
                                                                          )}
                                                                      </Stack>
                                                                  </Box>
                                                                  
                                                                  {/* View Mode Tags & Actions */}
                                                                  {!isEditingThis && (
                                                                      <Stack direction="row" spacing={1} alignItems="center">
                                                                          {svc.is_included ? (
                                                                              <Chip label="INCLUDED" size="small" sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 800, fontSize: '0.65rem', height: 24, borderRadius: '6px' }} />
                                                                          ) : (
                                                                              svc.discount ? (
                                                                                 <Chip 
                                                                                     label={svc.discount.includes('%') ? `${svc.discount} OFF` : `$${svc.discount} OFF`} 
                                                                                     size="small" 
                                                                                     sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 800, fontSize: '0.65rem', height: 24, borderRadius: '6px' }} 
                                                                                 />
                                                                              ) : null
                                                                          )}
                                                                          
                                                                          <Box sx={{ bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                             <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                                                                                 Limit: <Box component="span" sx={{ color: '#1e293b' }}>{svc.usage_limit || 'Unlimited'}</Box>
                                                                             </Typography>
                                                                          </Box>
                                                                          
                                                                          <Button 
                                              size="small" 
                                              variant="outlined"
                                              startIcon={<Edit fontSize="small" />}
                                              onClick={() => handleStartEditService(svc)}
                                              sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#64748b', borderColor: '#e2e8f0' }}
                                          >
                                              Edit
                                          </Button>
                                          <Button
                                             size="small"
                                             variant="outlined"
                                             startIcon={<Delete fontSize="small" />}
                                             onClick={() => handleDeleteServiceLink(svc)}
                                             sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#94a3b8', borderColor: '#e2e8f0', '&:hover': { color: '#ef4444', borderColor: '#fecaca', bgcolor: '#fef2f2' } }}
                                          >
                                              Remove
                                          </Button>
                                                                      </Stack>
                                                                  )}
                                                              </Box>
                                                              
                                                              {/* Independent Edit Mode */}
                                                              {isEditingThis && (
                                                                  <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                                                     
                                                                     <FormControlLabel 
                                                                         control={
                                                                             <Checkbox 
                                                                                 checked={serviceEditState.is_included ?? svc.is_included}
                                                                                 onChange={(e) => {
                                                                                     const checked = e.target.checked;
                                                                                     setServiceEditState(prev => ({ 
                                                                                         ...prev, 
                                                                                         is_included: checked,
                                                                                         discount: checked ? '' : (prev.discount ?? svc.discount)
                                                                                     }));
                                                                                 }}
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
 
                                                                     <Box>
                                                                         <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600 }}>Usage Limit</Typography>
                                                                         <TextField 
                                                                             hiddenLabel
                                                                             size="small"
                                                                             placeholder="Unlimited"
                                                                             value={serviceEditState.usage_limit ?? svc.usage_limit ?? ''}
                                                                             onChange={(e) => setServiceEditState(prev => ({ ...prev, usage_limit: e.target.value }))}
                                                                             sx={{ width: 140, bgcolor: 'white' }}
                                                                         />
                                                                     </Box>
 
                                                                     {!(serviceEditState.is_included ?? svc.is_included) && (
                                                                         <Box>
                                                                            <Typography variant="caption" sx={{ display: 'block', mb: 0.5, color: '#64748b', fontWeight: 600 }}>Discount</Typography>
                                                                            <Stack direction="row" spacing={1}>
                                                                                 <TextField 
                                                                                     size="small" placeholder="$"
                                                                                     value={!((serviceEditState.discount ?? svc.discount) || '').includes('%') ? (serviceEditState.discount ?? svc.discount) || '' : ''}
                                                                                     onChange={(e) => {
                                                                                         const val = e.target.value;
                                                                                         if (!/^\d*\.?\d*$/.test(val)) return;
                                                                                         setServiceEditState(prev => ({ ...prev, discount: val }));
                                                                                     }}
                                                                                     disabled={((serviceEditState.discount ?? svc.discount) || '').includes('%')}
                                                                                     sx={{ width: 80, bgcolor: 'white' }}
                                                                                 />
                                                                                 <TextField 
                                                                                     size="small" placeholder="%"
                                                                                     value={((serviceEditState.discount ?? svc.discount) || '').includes('%') ? ((serviceEditState.discount ?? svc.discount) || '').replace('%', '') : ''}
                                                                                     onChange={(e) => {
                                                                                         const val = e.target.value;
                                                                                         if (!/^\d*\.?\d*$/.test(val)) return;
                                                                                         setServiceEditState(prev => ({ ...prev, discount: val ? `${val}%` : '' }));
                                                                                     }}
                                                                                     disabled={!!(serviceEditState.discount ?? svc.discount) && !(serviceEditState.discount ?? svc.discount)?.includes('%')}
                                                                                     sx={{ width: 80, bgcolor: 'white' }}
                                                                                 />
                                                                            </Stack>
                                                                         </Box>
                                                                     )}
                                                                     
                                                                     <Box sx={{ flex: 1 }} />
                                                                     
                                                                     <Stack direction="row" spacing={1}>
                                                                         <Button size="small" variant="contained" onClick={() => handleUpdateService(svc.membership_service_id!)}>Save</Button>
                                                                         <Button size="small" onClick={() => { setEditingServiceId(null); setServiceEditState({}); }}>Cancel</Button>
                                                                     </Stack>
                                                                  </Box>
                                                              )}
                                                          </Paper>
                                                      );
                                                  })}
                                                  {bundledServices.filter(s => s.is_active !== false).length === 0 && !isAddingService && (
                                                      <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                                                          <Typography variant="body2" color="text.secondary">
                                                              No bundled services configured. Click "Add Service" to configure.
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
                                        disabled={isSaving || !editedPlanName.trim()} 
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
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Base Plan</DialogTitle>
            <DialogContent>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                     <TextField 
                        label="Plan Name"
                        placeholder="e.g. Gold"
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
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        Create with an initial price point:
                    </Typography>
                     <FormControl fullWidth>
                        <InputLabel>Term</InputLabel>
                        <Select
                            value={createForm.subscription_term_id || ''}
                            label="Term"
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
                        InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment>, inputProps: { min: 0 } }}
                    />
                 </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleCreateProfile}
                    disabled={isSaving || !createForm.name || !createForm.age_group_id || !createForm.subscription_term_id}
                >
                    {isSaving ? <CircularProgress size={24} /> : "Create"}
                </Button>
            </DialogActions>
        </Dialog>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert severity="error" onClose={() => setError(null)} variant="filled">{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
            <Alert severity="success" onClose={() => setSuccess(null)} variant="filled">{success}</Alert>
        </Snackbar>
        <Dialog
            open={deleteConfirm.open}
            onClose={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}
        >
            <DialogTitle>{deleteConfirm.title}</DialogTitle>
            <DialogContent>
                <Typography>{deleteConfirm.message}</Typography>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setDeleteConfirm(prev => ({ ...prev, open: false }))}>Cancel</Button>
                <Button onClick={deleteConfirm.onConfirm} color="error" variant="contained">Delete</Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
};
