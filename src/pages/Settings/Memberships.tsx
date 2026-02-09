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
  Stack,
  Checkbox
} from '@mui/material';
import { 
  Add, 
  Edit, 
  Save, 
  Delete,
  ChildCare, 
  Person, 
  Elderly, 
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
        // Fetch services using the Category ID. 
        // Note: The database column in 'membership_service' is confusingly named 'membership_program_id' 
        // but it points to category_id. We pass selectedCategoryId (the category UUID) here.
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
          
          // 3. Resolve Category ID for Services (Category ID is passed as membership_program_id in payload)
          if (selectedCategoryId === 'new') {
              // Find the new category ID by matching the name from our draft
              const savedCat = savedProgram.categories.find(c => c.name === draftCategory.name);
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

        <Grid container spacing={3} sx={{ mt: 1 }}>
            {[
                { label: 'JOINING FEE', type: 'JOINING' as const, fee: joining },
                { label: 'ANNUAL FEE', type: 'ANNUAL' as const, fee: annual }
            ].map((item) => (
                <Grid size={{ xs: 12, sm: 6 }} key={item.type}>
                    {readOnly ? (
                        <Paper elevation={0} sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderRadius: 3 }}>
                            <Typography variant="caption" display="block" color="#64748b" fontWeight={700} sx={{ mb: 1 }}>
                                {item.label}
                            </Typography>
                            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                                ${item.fee?.amount || 0}
                            </Typography>
                        </Paper>
                    ) : (
                        <TextField
                             label={item.label}
                             type="number"
                             fullWidth
                             variant="filled"
                             value={item.fee?.amount || 0}
                             onChange={(e) => updateDraftFee(item.type, Number(e.target.value))}
                             InputProps={{
                                 startAdornment: <InputAdornment position="start">$</InputAdornment>,
                                 disableUnderline: true,
                                 sx: { borderRadius: 2, bgcolor: '#f8fafc', fontSize: '1.1rem', fontWeight: 600 }
                             }}
                        />
                    )}
                </Grid>
            ))}
        </Grid>
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
        {activeProgram && (
             <Box sx={{ mb: 4 }}>
                 <Typography variant="h5" sx={{ textTransform: 'uppercase', color: '#1e293b', fontWeight: 900, letterSpacing: '-0.025em' }}>
                     {activeProgram.name}
                 </Typography>
             </Box>
        )}

        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : activeProgram ? (
             <Grid container spacing={3}>
                 {/* Left Column: Categories List (4/12) */}
                 <Grid size={{ xs: 12, md: 4 }} sx={{ height: '100%' }}>
                     <Paper sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                         <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #f0f4f8' }}>
                             <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                                 CATEGORIES
                             </Typography>
                         </Box>
                         <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                             {activeProgram.categories.map((cat) => {
                                 const isSelected = selectedCategoryId === cat.category_id;
                                 return (
                                     <ListItemButton 
                                         key={cat.category_id}
                                         selected={isSelected}
                                         onClick={() => handleCategorySelect(cat.category_id!)}
                                         sx={{ 
                                             pl: 2,
                                             py: 1.5,
                                             position: 'relative',
                                             '&.Mui-selected': {
                                                 bgcolor: '#f1f5f9',
                                                 '&:hover': { bgcolor: '#e2e8f0' }
                                             },
                                             borderLeft: isSelected ? '4px solid #4f46e5' : '4px solid transparent'
                                         }}
                                     >
                                         <ListItemText 
                                             primary={cat.name} 
                                             secondary={cat.is_active === false ? 'Inactive' : 'Active Category'}
                                             sx={{
                                                 m: 0,
                                                 '& .MuiListItemText-primary': { 
                                                     color: isSelected ? '#1e293b' : '#334155',
                                                     fontWeight: isSelected ? 800 : 600,
                                                     fontSize: '0.925rem'
                                                 },
                                                 '& .MuiListItemText-secondary': {
                                                     color: cat.is_active === false ? '#ef4444' : '#64748b',
                                                     fontSize: '0.75rem',
                                                     fontWeight: 500
                                                 }
                                             }}
                                         />
                                     </ListItemButton>
                                 );
                             })}
                             
                             {/* New Category Item */}
                             {selectedCategoryId === 'new' && (
                                <ListItemButton 
                                    selected={true}
                                    sx={{ 
                                        pl: 2, py: 1.5,
                                        bgcolor: '#f1f5f9',
                                        borderLeft: '4px solid #10b981'
                                    }}
                                >
                                    <ListItemText 
                                        primary="New Category"
                                        secondary="Unsaved Draft"
                                        sx={{
                                            '& .MuiListItemText-primary': { fontWeight: 800, color: '#1e293b' },
                                            '& .MuiListItemText-secondary': { color: '#10b981', fontSize: '0.75rem' }
                                        }}
                                    />
                                </ListItemButton>
                             )}
                             
                             {/* Add Button in List */}
                             {!isEditing && (
                                <Box sx={{ p: 2 }}>
                                    <Button 
                                        fullWidth variant="outlined" startIcon={<Add />} 
                                        onClick={handleAddNewCategory}
                                        sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, borderColor: '#e2e8f0', color: '#64748b', '&:hover': { borderColor: '#94a3b8', color: '#475569' } }}
                                    >
                                        Add Category
                                    </Button>
                                </Box>
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
                                 <Box sx={{ p: 4, borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                     <Box>
                                        <Typography variant="caption" sx={{ textTransform: 'uppercase', color: '#64748b', fontWeight: 800, letterSpacing: '0.05em' }}>
                                             {activeProgram.name}
                                        </Typography>
                                        <Box sx={{ mt: 1 }}>
                                            {isEditing ? (
                                                <TextField 
                                                    hiddenLabel
                                                    variant="standard" 
                                                    value={draftCategory?.name || ''}
                                                    onChange={(e) => updateDraftField('name', e.target.value)}
                                                    inputProps={{ style: { fontSize: '2.125rem', fontWeight: 900, textTransform: 'uppercase', color: '#1e293b' } }}
                                                    placeholder="CATEGORY NAME"
                                                    fullWidth
                                                />
                                            ) : (
                                                <Typography variant="h4" sx={{ fontWeight: 900, color: '#1e293b', textTransform: 'uppercase' }}>
                                                    {activeCategory?.name}
                                                </Typography>
                                            )}
                                        </Box>
                                     </Box>
                                     <Box>
                                         {!isEditing ? (
                                             <Button 
                                                 variant="outlined" 
                                                 startIcon={<Edit />} 
                                                 onClick={handleStartEdit}
                                                 sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, color: '#1e293b', borderColor: '#e2e8f0' }}
                                             >
                                                 Edit Category
                                             </Button>
                                         ) : (
                                             <Box sx={{ display: 'flex', gap: 1 }}>
                                                 <Chip label="Editing Mode" color="warning" sx={{ fontWeight: 700 }} />
                                             </Box>
                                         )}
                                     </Box>
                                 </Box>

                                 {/* Content */}
                                 <Box sx={{ p: 4, flex: 1, overflowY: 'auto' }}>
                                     
                                     {/* 1. Pricing Configuration */}
                                     <Box sx={{ mb: 6 }}>
                                         <Typography variant="caption" sx={{ fontWeight: 800, mb: 3, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                             PRICING & STATUS
                                         </Typography>
                                         
                                         {isEditing ? (
                                              <Box sx={{ mb: 3, p: 2, bgcolor: '#f8fafc', borderRadius: 2 }}>
                                                  <FormControlLabel
                                                      control={
                                                          <Switch 
                                                              checked={draftCategory?.is_active !== false}
                                                              onChange={(e) => updateDraftField('is_active', e.target.checked)}
                                                          />
                                                      }
                                                      label={<Typography fontWeight={600}>Active Status</Typography>}
                                                  />
                                              </Box>
                                         ) : (
                                              <Box sx={{ mb: 3 }}>
                                                  <Chip 
                                                      label={activeCategory?.is_active !== false ? "ACTIVE" : "INACTIVE"} 
                                                      sx={{ 
                                                          bgcolor: activeCategory?.is_active !== false ? '#dcfce7' : '#f1f5f9', 
                                                          color: activeCategory?.is_active !== false ? '#166534' : '#64748b', 
                                                          fontWeight: 800,
                                                          borderRadius: '6px'
                                                      }} 
                                                  />
                                              </Box>
                                         )}
                                         
                                         {renderFees(isEditing ? draftCategory! : activeCategory!, !isEditing)}
                                     </Box>

                                     {/* 2. Eligibility Rules */}
                                     <Box sx={{ mb: 6 }}>
                                         <Typography variant="caption" sx={{ fontWeight: 800, mb: 3, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block' }}>
                                             ELIGIBILITY RULES
                                         </Typography>
                                         {renderRuleInputs(isEditing ? draftCategory! : activeCategory!, !isEditing)}
                                     </Box>

                                     {/* 3. Bundled Services */}
                                     <Box>
                                         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                                             <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                 BUNDLED SERVICES
                                             </Typography>
                                             {isEditing && (
                                                 <Button 
                                                     size="small" 
                                                     startIcon={<Add />} 
                                                     variant="contained"
                                                     onClick={() => setOpenAddService(true)}
                                                     sx={{ textTransform: 'none', borderRadius: 2, bgcolor: '#0f172a' }}
                                                 >
                                                     Add Service
                                                 </Button>
                                             )}
                                         </Box>
                                         
                                         {servicesLoading ? <CircularProgress size={24} /> : (
                                         <Stack spacing={2}>
                                             {(isEditing ? draftServices : categoryServices)
                                                 .filter(s => s.is_active !== false)
                                                 .map((svc, idx) => {
                                                     const serviceRef = availableServices.find(as => as.service_id === svc.service_id);
                                                     const name = svc.service_name || serviceRef?.name || 'Unknown Service';
                                                     const description = serviceRef?.description || '';
                                                     
                                                     return (
                                                         <Paper key={idx} elevation={0} sx={{ 
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
                                                                 </Box>
                                                                 
                                                                 {!isEditing && (
                                                                     <Stack direction="row" spacing={1} alignItems="center">
                                                                         {svc.is_included ? (
                                                                             <Chip label="INCLUDED" size="small" sx={{ bgcolor: '#10b981', color: 'white', fontWeight: 800, fontSize: '0.65rem', height: 24, borderRadius: '6px' }} />
                                                                         ) : (
                                                                             svc.discount ? <Chip label={`${svc.discount} OFF`} size="small" sx={{ bgcolor: '#f59e0b', color: 'white', fontWeight: 800, fontSize: '0.65rem', height: 24, borderRadius: '6px' }} /> : null
                                                                         )}
                                                                         <Box sx={{ bgcolor: '#f1f5f9', px: 1.5, py: 0.5, borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                                                             <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, fontSize: '0.7rem' }}>
                                                                                 Limit: <Box component="span" sx={{ color: '#1e293b' }}>{svc.usage_limit || 'Unlimited'}</Box>
                                                                             </Typography>
                                                                         </Box>
                                                                     </Stack>
                                                                 )}
                                                             </Box>

                                                             {isEditing && (
                                                                 <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                                                     <FormControlLabel 
                                                                         control={
                                                                             <Checkbox 
                                                                                 checked={svc.is_included}
                                                                                 onChange={(e) => updateDraftService(idx, { is_included: e.target.checked, discount: e.target.checked ? '' : svc.discount })}
                                                                                 sx={{ '&.Mui-checked': { color: '#0f172a' } }}
                                                                             />
                                                                         }
                                                                         label={<Box><Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Included (Free)</Typography></Box>}
                                                                     />
                                                                     <Divider orientation="vertical" flexItem variant="middle" />
                                                                     <TextField 
                                                                         label="Usage Limit" size="small" placeholder="Unlimited"
                                                                         value={svc.usage_limit || ''}
                                                                         onChange={(e) => updateDraftService(idx, { usage_limit: e.target.value })}
                                                                         sx={{ width: 140, bgcolor: 'white' }}
                                                                     />
                                                                     {!svc.is_included && (
                                                                         <TextField 
                                                                             label="Discount" size="small" placeholder="e.g. 50%"
                                                                             value={svc.discount || ''}
                                                                             onChange={(e) => updateDraftService(idx, { discount: e.target.value })}
                                                                             sx={{ width: 140, bgcolor: 'white' }}
                                                                         />
                                                                     )}
                                                                     <Box sx={{ flex: 1 }} />
                                                                     <IconButton size="small" onClick={() => removeDraftService(idx)} sx={{ color: '#ef4444', bgcolor: '#fff', border: '1px solid #fecaca' }}>
                                                                         <Delete fontSize="small" />
                                                                     </IconButton>
                                                                 </Box>
                                                             )}
                                                         </Paper>
                                                     );
                                                 })
                                             }
                                             {(isEditing ? draftServices : categoryServices).filter(s => s.is_active !== false).length === 0 && (
                                                 <Paper variant="outlined" sx={{ p: 4, textAlign: 'center', bgcolor: '#f8fafc', borderStyle: 'dashed' }}>
                                                     <Typography variant="body2" color="text.secondary">
                                                         No bundled services configured. Add a service to get started.
                                                     </Typography>
                                                 </Paper>
                                             )}
                                         </Stack>
                                         )}
                                     </Box>
                                 </Box>
                                 
                                 {/* Footer Actions */}
                                 {isEditing && (
                                    <Box sx={{ p: 3, borderTop: '1px solid #f1f5f9', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                                        <Button 
                                            variant="text" color="inherit" 
                                            onClick={handleCancelEdit} 
                                            disabled={saving}
                                            sx={{ borderRadius: 2, fontWeight: 700, color: '#1e293b' }}
                                        >
                                            Cancel
                                        </Button>
                                        <Button 
                                            variant="contained" 
                                            onClick={handleSaveEdit} 
                                            disabled={saving} 
                                            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <Save />}
                                            sx={{ borderRadius: 2, fontWeight: 700, px: 4, bgcolor: '#4f46e5', '&:hover': { bgcolor: '#4338ca' } }}
                                        >
                                            Save Changes
                                        </Button>
                                    </Box>
                                 )}
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
