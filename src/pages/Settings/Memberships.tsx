import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Divider,
  TextField,
  InputAdornment,
  Switch,
  FormControlLabel,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  Alert,
  Snackbar,
  Stack
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Save, 
  Delete,
  ChildCare, 
  Person, 
  Elderly, 
  Category,
  Settings
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { serviceCatalog, Service } from '../../services/serviceCatalog';
import { 
  membershipService, 
  MembershipProgram, 
  MembershipCategory, 
  MembershipService as IMembershipService
} from '../../services/membershipService';
import { PageHeader } from '../../components/Common/PageHeader';

export const Memberships = () => {
  const { currentLocationId } = useAuth();
  
  // Data State
  const [programs, setPrograms] = useState<MembershipProgram[]>([]);
  const [selectedProgramId, setSelectedProgramId] = useState<string>('');
  const [availableServices, setAvailableServices] = useState<Service[]>([]);
  
  // Selection State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  // UI State
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [openCreateProgram, setOpenCreateProgram] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);
  const [createProgramName, setCreateProgramName] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [draftCategory, setDraftCategory] = useState<MembershipCategory | null>(null);
  const [draftServices, setDraftServices] = useState<IMembershipService[]>([]);

  // Services State (Read-only view)
  const [categoryServices, setCategoryServices] = useState<IMembershipService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Computed: Active Program
  const activeProgram = programs.find(p => p.membership_program_id === selectedProgramId);
  
  // Computed: Active Category (from program or 'new' placeholder)
  const activeCategory = selectedCategoryId === 'new' 
    ? draftCategory 
    : activeProgram?.categories.find(c => c.category_id === selectedCategoryId);

  // --- Fetch Data ---
  const fetchData = async (silent = false) => {
    if (!currentLocationId) return;
    if (!silent) setLoading(true);
    try {
      const [allPrograms, allServices] = await Promise.all([
        membershipService.getMemberships(currentLocationId),
        serviceCatalog.getServices(currentLocationId)
      ]);
      setPrograms(allPrograms);
      setAvailableServices(allServices);

      // Select first program if none selected
      if (!selectedProgramId && allPrograms.length > 0) {
        setSelectedProgramId(allPrograms[0].membership_program_id!);
      }
    } catch (error) {
        console.error("Failed to fetch data", error);
        setError("Failed to load membership data.");
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentLocationId]);

  // Preselect first category when program changes
  useEffect(() => {
    if (activeProgram && activeProgram.categories.length > 0) {
        // Only switch if current selection is invalid for this program
        const valid = activeProgram.categories.find(c => c.category_id === selectedCategoryId);
        if (!valid && selectedCategoryId !== 'new') {
            setSelectedCategoryId(activeProgram.categories[0].category_id!);
        }
    } else if (activeProgram && activeProgram.categories.length === 0) {
        setSelectedCategoryId(null);
    }
    // Cancel editing on program switch
    setIsEditing(false);
    setDraftCategory(null);
  }, [selectedProgramId, activeProgram]);

  // Fetch Services when Category Changes (View Mode)
  useEffect(() => {
    if (selectedCategoryId && selectedCategoryId !== 'new') {
        setServicesLoading(true);
        membershipService.getServices(selectedCategoryId)
            .then((services) => {
                 setCategoryServices(services || []);
            })
            .catch(e => {
                console.error("Failed to load category services", e);
                setCategoryServices([]);
            })
            .finally(() => setServicesLoading(false));
    } else {
        setCategoryServices([]);
    }
  }, [selectedCategoryId]);


  // --- Actions ---

  const handleProgramChange = (progId: string) => {
      setSelectedProgramId(progId);
      setIsEditing(false);
  };

  const handleCategorySelect = (catId: string) => {
      if (isEditing) {
          // If editing, ideally we warn user. For now, we just reset.
          if (window.confirm("You have unsaved changes. Discard them?")) {
              setIsEditing(false);
              setDraftCategory(null);
              setSelectedCategoryId(catId);
          }
      } else {
          setSelectedCategoryId(catId);
      }
  };

  const handleCreateProgram = async () => {
      if(!currentLocationId || !createProgramName) return;
      setSaving(true);
      try {
          const newProgram: MembershipProgram = {
              location_id: currentLocationId,
              name: createProgramName,
              services: [], 
              categories: [
                  {
                      name: 'Individual',
                      is_active: true,
                      fees: [
                          { fee_type: 'JOINING', billing_cycle: 'ONE_TIME', amount: 0, is_active: true },
                          { fee_type: 'ANNUAL', billing_cycle: 'YEARLY', amount: 0, is_active: true }
                      ],
                      rules: [
                         { 
                             priority: 1, 
                             result: 'ALLOW', 
                             message: 'Eligibility Rule', 
                             condition_json: { minAdult: 1, maxAdult: 1 }
                         }
                      ]
                  }
              ],
              is_active: true
          };
          
          const created = await membershipService.saveMembershipProgram(newProgram);
          setPrograms(prev => [...prev, created]);
          setSelectedProgramId(created.membership_program_id!);
          setOpenCreateProgram(false);
          setCreateProgramName('');
          setSuccess("Membership Program created.");
      } catch (e: any) {
          setError("Failed to create program.");
      } finally {
          setSaving(false);
      }
  };

  const handleAddNewCategory = () => {
      if (!activeProgram) return;
      
      const newCategory: MembershipCategory = {
          name: "New Category",
          is_active: true,
          fees: [
              { fee_type: 'JOINING', billing_cycle: 'ONE_TIME', amount: 0, is_active: true },
              { fee_type: 'ANNUAL', billing_cycle: 'YEARLY', amount: 0, is_active: true }
          ],
          rules: [
             { 
                 priority: 1, 
                 result: 'ALLOW', 
                 message: 'Eligibility Rule', 
                 condition_json: { minAdult: 1, maxAdult: 1 } 
             }
          ]
      };
      
      setDraftCategory(newCategory);
      setDraftServices([]);
      setSelectedCategoryId('new');
      setIsEditing(true);
  };

  const handleStartEdit = () => {
      if (!activeCategory) return;
      setDraftCategory(JSON.parse(JSON.stringify(activeCategory)));
      setDraftServices(JSON.parse(JSON.stringify(categoryServices)));
      setIsEditing(true);
  };

  const handleCancelEdit = () => {
      setIsEditing(false);
      setDraftCategory(null);
      setDraftServices([]);
      if (selectedCategoryId === 'new') {
          if (activeProgram && activeProgram.categories.length > 0) {
              setSelectedCategoryId(activeProgram.categories[0].category_id!);
          } else {
              setSelectedCategoryId(null);
          }
      }
  };

  const handleSaveEdit = async () => {
      if (!activeProgram || !draftCategory) return;
      setSaving(true);
      
      try {
          // 1. Prepare Updated Program
          let updatedProgram: MembershipProgram;
          let targetCategoryId = draftCategory.category_id;

          if (selectedCategoryId === 'new') {
              updatedProgram = {
                  ...activeProgram,
                  categories: [...activeProgram.categories, draftCategory]
              };
          } else {
              updatedProgram = {
                  ...activeProgram,
                  categories: activeProgram.categories.map(c => 
                      c.category_id === draftCategory.category_id ? draftCategory : c
                  )
              };
          }

          // 2. Save Program (Categories)
          const savedProgram = await membershipService.saveMembershipProgram(updatedProgram);
          
          // 3. Resolve Category ID for Services
          if (selectedCategoryId === 'new') {
              // Find the new category ID. Attempt to use last or find by name match/structure
              const savedCat = savedProgram.categories[savedProgram.categories.length - 1];
              if (savedCat) targetCategoryId = savedCat.category_id;
          }

          // 4. Save Services (if we have a valid target ID)
          if (targetCategoryId && draftServices.length > 0) {
               // Ensure correct owner ID
               const servicesToSave = draftServices.map(s => ({
                   ...s,
                   membership_program_id: targetCategoryId!
               }));
               await membershipService.upsertServices(servicesToSave);
          }

          // 5. Cleanup
          await fetchData(true);
          
          if (targetCategoryId) {
               const freshServices = await membershipService.getServices(targetCategoryId);
               setCategoryServices(freshServices);
          }

          setSuccess("Changes saved successfully.");
          setIsEditing(false);
          setDraftCategory(null);
          
          if (selectedCategoryId === 'new' && targetCategoryId) {
               setSelectedCategoryId(targetCategoryId);
          }

      } catch (e) {
          console.error(e);
          setError("Failed to save changes.");
      } finally {
           setSaving(false);
      }
  };

  // --- Field Updaters (Draft) ---

  const updateDraftField = (field: keyof MembershipCategory, value: any) => {
      if (!draftCategory) return;
      setDraftCategory({ ...draftCategory, [field]: value });
  };

  const updateDraftFee = (type: 'JOINING' | 'ANNUAL', amount: number) => {
      if (!draftCategory) return;
      const newFees = draftCategory.fees.map(f => 
          f.fee_type === type ? { ...f, amount } : f
      );
      setDraftCategory({ ...draftCategory, fees: newFees });
  };
  
  const updateDraftRule = (ruleIndex: number, field: string, value: any) => {
      if (!draftCategory) return;
      const newRules = [...draftCategory.rules];
      const rule = { ...newRules[ruleIndex] };
      rule.condition_json = {
          ...rule.condition_json,
          [field]: value === '' ? undefined : Number(value)
      };
      newRules[ruleIndex] = rule;
      setDraftCategory({ ...draftCategory, rules: newRules });
  };

  // --- Service Updaters (Draft) ---

  const handleDraftAddService = () => {
      if (!newServiceId || !draftCategory) return;
      
      const newService: IMembershipService = {
          service_id: newServiceId,
          membership_program_id: selectedCategoryId === 'new' ? '' : selectedCategoryId!, 
          is_included: true,
          usage_limit: 'Unlimited', 
          is_part_of_base_plan: false,
          is_active: true
      };
      
      setDraftServices(prev => [...prev, newService]);
      setOpenAddService(false);
      setNewServiceId('');
  };

  const updateDraftService = (index: number, updates: Partial<IMembershipService>) => {
      const newServices = [...draftServices];
      newServices[index] = { ...newServices[index], ...updates };
      setDraftServices(newServices);
  };

  const removeDraftService = (index: number) => {
      // Soft delete
      updateDraftService(index, { is_active: false });
  };


  if (!currentLocationId) {
      return <Alert severity="warning">Please select a location.</Alert>;
  }

  // Helper render for Rules
  const renderRuleInputs = (categoryData: MembershipCategory, readOnly: boolean) => {
      const rule = categoryData.rules[0]; // Assume first rule
      if (!rule) return null;

      const renderGroup = (label: string, icon: React.ReactNode, minKey: string, maxKey: string) => (
          <Box sx={{ mb: 2 }} key={label}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                   <Box sx={{ bgcolor: '#e3f2fd', p: 0.5, borderRadius: '50%', color: '#1976d2' }}>
                       {icon}
                   </Box>
                   <Typography variant="body2" fontWeight={600} color="text.secondary">{label}</Typography>
              </Box>
              <Grid container spacing={2}>
                  <Grid size={{ xs: 6 }}>
                      {readOnly ? (
                           <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                               <Typography variant="caption" color="text.secondary">Min</Typography>
                               <Typography variant="body2" fontWeight={700} color="text.primary">
                                   {rule.condition_json[minKey] ?? '-'}
                               </Typography>
                           </Box>
                      ) : (
                          <TextField
                              label="Min" size="small" type="number" fullWidth
                              value={rule.condition_json[minKey] ?? ''}
                              onChange={(e) => updateDraftRule(0, minKey, e.target.value)}
                          />
                      )}
                  </Grid>
                  <Grid size={{ xs: 6 }}>
                       {readOnly ? (
                           <Box sx={{ p: 1, bgcolor: '#f5f5f5', borderRadius: 1 }}>
                               <Typography variant="caption" color="text.secondary">Max</Typography>
                               <Typography variant="body2" fontWeight={700} color="text.primary">
                                   {rule.condition_json[maxKey] ?? 'Unlimited'}
                               </Typography>
                           </Box>
                      ) : (
                          <TextField
                              label="Max" size="small" type="number" fullWidth
                              placeholder="No limit"
                              value={rule.condition_json[maxKey] ?? ''}
                              onChange={(e) => updateDraftRule(0, maxKey, e.target.value)}
                          />
                      )}
                  </Grid>
              </Grid>
          </Box>
      );

      return (
          <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>{renderGroup('Children', <ChildCare fontSize="small"/>, 'minChild', 'maxChild')}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{renderGroup('Adults', <Person fontSize="small"/>, 'minAdult', 'maxAdult')}</Grid>
              <Grid size={{ xs: 12, sm: 4 }}>{renderGroup('Seniors', <Elderly fontSize="small"/>, 'minSenior', 'maxSenior')}</Grid>
          </Grid>
      );
  };

  // Helper render for Fees
  const renderFees = (categoryData: MembershipCategory, readOnly: boolean) => {
      const joining = categoryData.fees.find(f => f.fee_type === 'JOINING');
      const annual = categoryData.fees.find(f => f.fee_type === 'ANNUAL');

      return (
          <Stack direction="row" spacing={3} sx={{ mt: 2 }}>
              <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700}>JOINING FEE</Typography>
                  {readOnly ? (
                      <Typography variant="h6" color="primary">${joining?.amount || 0}</Typography>
                  ) : (
                      <TextField
                           size="small" type="number"
                           value={joining?.amount || 0}
                           onChange={(e) => updateDraftFee('JOINING', Number(e.target.value))}
                           InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                           sx={{ mt: 1, width: 120 }}
                      />
                  )}
              </Box>
              <Box>
                   <Typography variant="caption" color="text.secondary" fontWeight={700}>ANNUAL FEE</Typography>
                   {readOnly ? (
                      <Typography variant="h6" color="primary">${annual?.amount || 0}</Typography>
                   ) : (
                      <TextField
                           size="small" type="number"
                           value={annual?.amount || 0}
                           onChange={(e) => updateDraftFee('ANNUAL', Number(e.target.value))}
                           InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                           sx={{ mt: 1, width: 120 }}
                      />
                   )}
              </Box>
          </Stack>
      );
  };


  return (
    <Box sx={{ p: 3 }}>
        <PageHeader 
            title="Membership Programs" 
            description="Manage membership tiers, fees, and eligibility rules."
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Memberships', active: true }
            ]}
            action={
                <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreateProgram(true)}>
                    New Program
                </Button>
            }
        />

        {/* Program Selector */}
        <Box sx={{ mb: 4, mt: 2 }}>
             <FormControl sx={{ minWidth: 300, bgcolor: 'white' }} size="small">
                 <InputLabel>Select Program</InputLabel>
                 <Select
                    value={activeProgram ? selectedProgramId : ''}
                    label="Select Program"
                    onChange={(e) => handleProgramChange(e.target.value)}
                 >
                     {programs.map(p => (
                         <MenuItem key={p.membership_program_id} value={p.membership_program_id}>{p.name}</MenuItem>
                     ))}
                     {programs.length === 0 && <MenuItem disabled>No Programs Available</MenuItem>}
                 </Select>
             </FormControl>
        </Box>

        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : activeProgram ? (
             <Grid container spacing={3}>
                 {/* Left Column: Categories List (4/12) */}
                 <Grid size={{ xs: 12, md: 4 }}>
                     <Paper sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                         <Box sx={{ p: 2, borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fafafa' }}>
                             <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#455a64', letterSpacing: 0.5 }}>CATEGORIES</Typography>
                             <Button 
                                 size="small" startIcon={<Add />} 
                                 onClick={handleAddNewCategory}
                                 disabled={isEditing}
                             >
                                 Add
                             </Button>
                         </Box>
                         <List sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                             {activeProgram.categories.map((cat) => (
                                 <ListItemButton 
                                     key={cat.category_id}
                                     selected={selectedCategoryId === cat.category_id}
                                     onClick={() => handleCategorySelect(cat.category_id!)}
                                     sx={{ 
                                         borderLeft: selectedCategoryId === cat.category_id ? '4px solid #1976d2' : '4px solid transparent',
                                         bgcolor: selectedCategoryId === cat.category_id ? '#f5f9ff !important' : 'inherit'
                                     }}
                                 >
                                     <ListItemIcon sx={{ minWidth: 36 }}>
                                         <Category fontSize="small" color={selectedCategoryId === cat.category_id ? 'primary' : 'action'} />
                                     </ListItemIcon>
                                     <ListItemText 
                                         primary={cat.name} 
                                         primaryTypographyProps={{ fontWeight: selectedCategoryId === cat.category_id ? 700 : 500, color: 'text.primary' }}
                                         secondary={cat.is_active === false ? <Typography variant="caption" color="error">Inactive</Typography> : null}
                                     />
                                 </ListItemButton>
                             ))}
                             {/* Show "New Category" item if creating */}
                             {selectedCategoryId === 'new' && (
                                 <ListItemButton 
                                     selected={true}
                                     sx={{ borderLeft: '4px solid #4caf50', bgcolor: '#f1f8e9 !important' }}
                                 >
                                     <ListItemIcon sx={{ minWidth: 36 }}><Add fontSize="small" /></ListItemIcon>
                                     <ListItemText primary="New Category" primaryTypographyProps={{ fontWeight: 700, fontStyle: 'italic', color: 'text.primary' }} />
                                 </ListItemButton>
                             )}
                         </List>
                     </Paper>
                 </Grid>

                 {/* Right Column: Configuration (8/12) */}
                 <Grid size={{ xs: 12, md: 8 }}>
                     <Paper sx={{ minHeight: 400, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                         {activeCategory || (selectedCategoryId === 'new' && draftCategory) ? (
                             <>
                                 {/* Header */}
                                 <Box sx={{ p: 2, borderBottom: '1px solid #eee', bgcolor: '#fafafa', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                     <Box>
                                        <Typography variant="caption" display="block" color="text.secondary" fontWeight={700}>CONFIGURATION</Typography>
                                        {isEditing ? (
                                             <TextField 
                                                 hiddenLabel variant="standard" 
                                                 value={draftCategory?.name || ''}
                                                 onChange={(e) => updateDraftField('name', e.target.value)}
                                                 inputProps={{ style: { fontSize: '1.25rem', fontWeight: 600 } }}
                                                 placeholder="Category Name"
                                             />
                                        ) : (
                                            <Typography variant="h6" fontWeight={600} color="#263238">{activeCategory?.name}</Typography>
                                        )}
                                     </Box>
                                     <Box>
                                         {!isEditing ? (
                                             <Button variant="outlined" startIcon={<Edit />} onClick={handleStartEdit}>
                                                 Edit Config
                                             </Button>
                                         ) : (
                                             <Stack direction="row" spacing={1}>
                                                 <Button variant="text" color="inherit" onClick={handleCancelEdit} disabled={saving}>
                                                     Cancel
                                                 </Button>
                                                 <Button variant="contained" startIcon={saving ? <CircularProgress size={20}/> : <Save />} onClick={handleSaveEdit} disabled={saving}>
                                                     Save Changes
                                                 </Button>
                                             </Stack>
                                         )}
                                     </Box>
                                 </Box>

                                 {/* Content */}
                                 <Box sx={{ p: 3, flex: 1, overflowY: 'auto' }}>
                                     {/* 1. General Settings */}
                                     {isEditing ? (
                                         <Box sx={{ mb: 4 }}>
                                             <FormControlLabel
                                                 control={
                                                     <Switch 
                                                         checked={draftCategory?.is_active !== false}
                                                         onChange={(e) => updateDraftField('is_active', e.target.checked)}
                                                     />
                                                 }
                                                 label="Active Status"
                                             />
                                             {renderFees(draftCategory!, false)}
                                         </Box>
                                     ) : (
                                         <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                            <Box>
                                                <Chip 
                                                    label={activeCategory?.is_active !== false ? "ACTIVE" : "INACTIVE"} 
                                                    color={activeCategory?.is_active !== false ? "success" : "default"} 
                                                    size="small" 
                                                    variant="outlined"
                                                    sx={{ mb: 1, fontWeight: 700 }}
                                                />
                                                {renderFees(activeCategory!, true)}
                                            </Box>
                                         </Box>
                                     )}
                                     
                                     <Divider sx={{ my: 3 }} />

                                     {/* 2. Eligibility Rules */}
                                     <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700, color: '#546e7a', textTransform: 'uppercase' }}>ELIGIBILITY RULES</Typography>
                                     <Box sx={{ mb: 4 }}>
                                         {renderRuleInputs(isEditing ? draftCategory! : activeCategory!, !isEditing)}
                                     </Box>

                                     <Divider sx={{ my: 3 }} />

                                     {/* 3. Included Services */}
                                     <Box sx={{ display: 'flex', justifyContent: 'space-between', items: 'center', mb: 2 }}>
                                         <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#546e7a', textTransform: 'uppercase' }}>BUNDLED SERVICES</Typography>
                                         {isEditing && (
                                             <Button size="small" startIcon={<Add />} onClick={() => setOpenAddService(true)}>Add Service</Button>
                                         )}
                                     </Box>
                                     
                                     {servicesLoading ? <CircularProgress size={24} /> : (
                                     <Grid container spacing={2}>
                                         {(isEditing ? draftServices : categoryServices)
                                             .filter(s => s.is_active !== false)
                                             .map((s, idx) => {
                                                 // Match service name
                                                 const serviceName = s.service_name || availableServices.find(as => as.service_id === s.service_id)?.name || 'Unknown Service';
                                                 return (
                                                     <Grid size={{ xs: 12 }} key={idx}>
                                                         <Paper variant="outlined" sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center' }}>
                                                             <Box sx={{ p: 1, bgcolor: '#e0f2f1', borderRadius: 1 }}>
                                                                 <Category fontSize="small" sx={{ color: '#00695c' }} />
                                                             </Box>
                                                             <Box sx={{ flex: 1 }}>
                                                                 <Typography variant="subtitle2" fontWeight={600} color="text.primary">{serviceName}</Typography>
                                                                 {isEditing ? (
                                                                     <Stack direction="row" spacing={2} sx={{ mt: 1, alignItems: 'center' }}>
                                                                         <FormControlLabel 
                                                                             control={<Switch size="small" checked={s.is_included} onChange={(e) => updateDraftService(idx, { is_included: e.target.checked })} />}
                                                                             label={<Typography variant="caption">Included</Typography>}
                                                                         />
                                                                         <TextField 
                                                                             size="small" variant="standard" placeholder="Limit"
                                                                             value={s.usage_limit || ''}
                                                                             onChange={(e) => updateDraftService(idx, { usage_limit: e.target.value })}
                                                                             sx={{ width: 100 }}
                                                                         />
                                                                         {!s.is_included && (
                                                                             <TextField 
                                                                                size="small" variant="standard" placeholder="Discount %"
                                                                                value={s.discount || ''}
                                                                                onChange={(e) => updateDraftService(idx, { discount: e.target.value })}
                                                                                sx={{ width: 100 }}
                                                                             />
                                                                         )}
                                                                     </Stack>
                                                                 ) : (
                                                                     <Typography variant="caption" color="text.secondary">
                                                                         {s.is_included ? `Included (${s.usage_limit})` : `Discount: ${s.discount || 'None'} (${s.usage_limit})`}
                                                                     </Typography>
                                                                 )}
                                                             </Box>
                                                             {isEditing && (
                                                                 <IconButton color="error" size="small" onClick={() => removeDraftService(idx)}>
                                                                     <Delete fontSize="small" />
                                                                 </IconButton>
                                                             )}
                                                         </Paper>
                                                     </Grid>
                                                 );
                                             })
                                         }
                                         {(isEditing ? draftServices : categoryServices).filter(s => s.is_active !== false).length === 0 && (
                                             <Grid size={{ xs: 12 }}>
                                                 <Typography variant="body2" color="text.secondary" align="center" sx={{ py: 3, fontStyle: 'italic', bgcolor: '#f9f9f9', borderRadius: 1 }}>
                                                     No services bundled with this category.
                                                 </Typography>
                                             </Grid>
                                         )}
                                     </Grid>
                                     )}

                                 </Box>
                             </>
                         ) : (
                             <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', p: 4 }}>
                                 <Settings sx={{ fontSize: 60, color: '#eceff1', mb: 2 }} />
                                 <Typography variant="h6" color="text.secondary">Select a Category</Typography>
                                 <Typography variant="body2" color="text.disabled" align="center">
                                     Select a membership category from the left panel to configure its fees, eligibility rules, and bundled services.
                                 </Typography>
                             </Box>
                         )}
                     </Paper>
                 </Grid>
             </Grid>
        ) : (
             <Paper sx={{ p: 4, textAlign: 'center' }}>
                 <Typography color="text.secondary">Please select or create a Membership Program.</Typography>
             </Paper>
        )}

        {/* Create Program Dialog */}
        <Dialog open={openCreateProgram} onClose={() => setOpenCreateProgram(false)}>
            <DialogTitle>Add Membership Program</DialogTitle>
            <DialogContent>
                <TextField 
                    autoFocus margin="dense" label="Program Name" fullWidth
                    value={createProgramName}
                    onChange={(e) => setCreateProgramName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenCreateProgram(false)}>Cancel</Button>
                <Button onClick={handleCreateProgram} variant="contained" disabled={!createProgramName || saving}>Create</Button>
            </DialogActions>
        </Dialog>

        {/* Add Service Dialog (using Draft Services if editing) */}
        <Dialog open={openAddService} onClose={() => setOpenAddService(false)}>
             <DialogTitle>Add Service to Category</DialogTitle>
             <DialogContent>
                 <FormControl fullWidth sx={{ mt: 2, minWidth: 300 }}>
                     <InputLabel>Select Service</InputLabel>
                     <Select
                         value={newServiceId}
                         label="Select Service"
                         onChange={(e) => setNewServiceId(e.target.value)}
                     >
                          {availableServices
                             // Filter out services already in the DRAFT list
                             .filter(s => !draftServices.find(ds => ds.service_id === s.service_id && ds.is_active !== false))
                             .map(s => (
                                 <MenuItem key={s.service_id} value={s.service_id}>{s.name}</MenuItem>
                             ))
                         }
                     </Select>
                 </FormControl>
             </DialogContent>
             <DialogActions>
                 <Button onClick={() => setOpenAddService(false)}>Cancel</Button>
                 <Button onClick={handleDraftAddService} variant="contained" disabled={!newServiceId}>Add</Button>
             </DialogActions>
        </Dialog>

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert severity="error">{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
            <Alert severity="success">{success}</Alert>
        </Snackbar>

    </Box>
  );
};
