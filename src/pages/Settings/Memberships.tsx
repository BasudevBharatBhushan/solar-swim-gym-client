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
  Switch,
  Snackbar,
  Alert,
  Grid,
  Chip,
  IconButton,
  Tooltip
} from '@mui/material';
import { Add, Edit, Close, Check, ChildCare, Person, Elderly } from '@mui/icons-material';
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
  const [openCreate, setOpenCreate] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);
  const [createName, setCreateName] = useState('');
  const [newServiceId, setNewServiceId] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<MembershipCategory | null>(null);

  // Computed: Active Program
  const activeProgram = programs.find(p => p.membership_program_id === selectedProgramId);
  
  // Computed: Active Category
  const activeCategory = activeProgram?.categories.find(c => c.category_id === selectedCategoryId);

  // Fetch Data
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
        // Only if no category selected or selected one not in this program
        const valid = activeProgram.categories.find(c => c.category_id === selectedCategoryId);
        if (!valid) {
            setSelectedCategoryId(activeProgram.categories[0].category_id!);
        }
    } else {
        setSelectedCategoryId(null);
    }
  }, [selectedProgramId, activeProgram]);


  // --- Handlers ---

  const handleProgramChange = (progId: string) => {
      setSelectedProgramId(progId);
  };

  const handleCreateProgram = async () => {
      if(!currentLocationId || !createName) return;
      setSaving(true);
      try {
          const newProgram: MembershipProgram = {
              location_id: currentLocationId,
              name: createName,
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
          
          // API call to create
          const created = await membershipService.saveMembershipProgram(newProgram);
          setPrograms(prev => [...prev, created]);
          setSelectedProgramId(created.membership_program_id!);
          setOpenCreate(false);
          setCreateName('');
          setSuccess("Membership Program created.");
      } catch (e: any) {
          setError("Failed to create program.");
      } finally {
          setSaving(false);
      }
  };
  
  // Start editing a category
  const startEditingCategory = (category: MembershipCategory) => {
      setEditingCategoryId(category.category_id || null);
      setEditForm(JSON.parse(JSON.stringify(category))); // Deep copy
  };

  const cancelEditingCategory = () => {
      setEditingCategoryId(null);
      setEditForm(null);
  };

  const saveCategoryEdit = async () => {
      if (!activeProgram || !editForm) return;
      
      let updatedProgram: MembershipProgram;
      
      if (editingCategoryId === 'new') {
          // Creating new category
          updatedProgram = { 
              ...activeProgram, 
              categories: [...activeProgram.categories, editForm] 
          };
      } else {
          // Updating existing category
          const newCats = activeProgram.categories.map(c => 
              c.category_id === editForm.category_id ? editForm : c
          );
          updatedProgram = { ...activeProgram, categories: newCats };
      }
      
      setSaving(true);
      try {
          const result = await saveProgramChange(updatedProgram);
          if (result) {
              setEditingCategoryId(null);
              setEditForm(null);
              setSuccess(editingCategoryId === 'new' ? "Category created." : "Category updated.");
              
              // If it was new, select the last one from results
              if (editingCategoryId === 'new' && result.categories.length > 0) {
                  const lastCat = result.categories[result.categories.length - 1];
                  if (lastCat.category_id) {
                      setSelectedCategoryId(lastCat.category_id);
                  }
              }
          }
      } catch (e) {
          setError("Failed to save changes.");
      } finally {
          setSaving(false);
      }
  };

  const handleEditFormChange = (field: keyof MembershipCategory, value: any) => {
      if (!editForm) return;
      setEditForm({ ...editForm, [field]: value });
  };

  const handleEditFeeChange = (feeIndex: number, amount: number) => {
      if (!editForm) return;
      const newFees = [...editForm.fees];
      newFees[feeIndex] = { ...newFees[feeIndex], amount };
      setEditForm({ ...editForm, fees: newFees });
  };

  const handleCreateCategory = () => {
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
      
      setEditForm(newCategory);
      setEditingCategoryId('new');
  };

  const saveProgramChange = async (updated: MembershipProgram): Promise<MembershipProgram | null> => {
      // Optimistic update
      setPrograms(prev => prev.map(p => p.membership_program_id === updated.membership_program_id ? updated : p));
      
      try {
         const result = await membershipService.saveMembershipProgram(updated);
         // Replace with server result to get IDs
         setPrograms(prev => prev.map(p => p.membership_program_id === updated.membership_program_id ? result : p));
         return result;
      } catch (e) {
         setError("Failed to save changes.");
         fetchData(true); // Revert
         return null;
      }
  };
  


  const updateRule = (catIndex: number, ruleIndex: number, field: string, value: any) => {
       if (!activeProgram) return;
       const newCats = [...activeProgram.categories];
       const newRules = [...newCats[catIndex].rules];
       const currentRule = newRules[ruleIndex];
       
       newRules[ruleIndex] = {
           ...currentRule,
           condition_json: {
               ...currentRule.condition_json,
               [field]: value === '' ? undefined : Number(value)
           }
       };
       newCats[catIndex] = { ...newCats[catIndex], rules: newRules };
       saveProgramChange({ ...activeProgram, categories: newCats });
  };
  
  // -- Bundled Services --
  const handleAddService = async () => {
      if(!newServiceId || !activeProgram) return;
      
      const newService: IMembershipService = {
          service_id: newServiceId,
          membership_program_id: activeProgram.membership_program_id,
          is_included: true,
          usage_limit: 'Unlimited', 
          is_part_of_base_plan: false,
          is_active: true
      };
      
      // We can use the upsert endpoint for services specifically, OR save the whole program.
      // Context says: "Upsert Membership Services via POST /api/v1/membership-services/upsert"
      // Let's use that for granular updates as it might differ from Program Save.
      try {
          await membershipService.upsertMembershipServices([newService]);
          await fetchData(true); // Silent refresh to get proper IDs
          setOpenAddService(false);
          setNewServiceId('');
      } catch(e) {
          setError("Failed to add service.");
      }
  };

  const updateService = async (service: IMembershipService, updates: Partial<IMembershipService>) => {
       const updated = { ...service, ...updates };
       // Optimistic? No, list is inside program.
       // Update program state locally
       if(activeProgram) {
            const newServices = activeProgram.services.map(s => s.membership_service_id === service.membership_service_id ? updated : s);
            setPrograms(prev => prev.map(p => p.membership_program_id === activeProgram.membership_program_id ? { ...p, services: newServices } : p));
       }
       
       try {
           await membershipService.upsertMembershipServices([updated]);
       } catch (e) {
           setError("Failed to update service.");
           fetchData();
       }
  };

  if (!currentLocationId) {
      return <Alert severity="warning">Please select a location.</Alert>;
  }

  return (
    <Box sx={{ p: 3 }}>
        <PageHeader 
            title="Membership Programs" 
            description="Manage membership tiers, fees, and eligibility rules."
            breadcrumbs={[
                { label: 'Settings', href: '/settings' },
                { label: 'Memberships', active: true }
            ]}
        />

        {/* Top Controls */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
             <FormControl sx={{ minWidth: 300 }} size="small">
                 <InputLabel>Select Program</InputLabel>
                 <Select
                    value={activeProgram ? selectedProgramId : ''}
                    label="Select Program"
                    onChange={(e) => handleProgramChange(e.target.value)}
                 >
                     {programs.map(p => (
                         <MenuItem key={p.membership_program_id} value={p.membership_program_id}>{p.name}</MenuItem>
                     ))}
                     {programs.length === 0 && <MenuItem disabled>No Programs</MenuItem>}
                 </Select>
             </FormControl>
             <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)}>
                 Add Membership Program
             </Button>
        </Box>

        {activeProgram && (
             <Box sx={{ mb: 4, p: 3, bgcolor: '#ffffff', borderRadius: 2, border: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
                 <Box>
                    <Typography variant="caption" sx={{ textTransform: 'uppercase', color: 'text.secondary', fontWeight: 'bold', letterSpacing: 1 }}>
                        Active Program
                    </Typography>
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1a237e', mt: 1 }}>
                        {activeProgram.name}
                    </Typography>
                 </Box>
             </Box>
        )}

        {loading ? <CircularProgress /> : activeProgram && (
            <>
                <Grid container spacing={3}>
                    {/* Left: Categories Table */}
                    <Grid size={{ xs: 12, md: 8 }}>
                        <Paper sx={{ p: 0, overflow: 'hidden', borderRadius: 1 }}>
                            <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#ffffff', borderBottom: '1px solid #f0f0f0' }}>
                                <Typography variant="button" sx={{ fontWeight: 700, color: '#37474f', fontSize: '0.875rem' }}>MEMBERSHIP CATEGORIES</Typography>
                                <Button 
                                    size="small" 
                                    startIcon={saving ? <CircularProgress size={16} /> : <Add />} 
                                    onClick={handleCreateCategory}
                                    disabled={saving}
                                    sx={{ fontWeight: 700, color: '#1976d2', textTransform: 'uppercase' }}
                                >
                                    {saving ? 'ADDING...' : 'ADD CATEGORY'}
                                </Button>
                            </Box>
                            <TableContainer>
                                <Table size="small">
                                    <TableHead sx={{ bgcolor: '#ffffff' }}>
                                        <TableRow>
                                            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', py: 1 }}>CATEGORY NAME</TableCell>
                                            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', py: 1 }}>JOINING FEE</TableCell>
                                            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', py: 1 }}>ANNUAL FEE</TableCell>
                                            <TableCell sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', py: 1 }}>STATUS</TableCell>
                                            <TableCell align="right" sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', py: 1 }}>ACTIONS</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {[...activeProgram.categories, ...(editingCategoryId === 'new' && editForm ? [editForm] : [])].map((cat, idx) => {
                                            const isEditing = editingCategoryId === (cat.category_id || 'new');
                                            // Make sure we use data from editForm if editing, else cat
                                            const data = isEditing && editForm ? editForm : cat;

                                            const joiningFee = data.fees.find(f => f.fee_type === 'JOINING');
                                            const annualFee = data.fees.find(f => f.fee_type === 'ANNUAL');
                                            
                                            const joiningIdx = data.fees.findIndex(f => f.fee_type === 'JOINING');
                                            const annualIdx = data.fees.findIndex(f => f.fee_type === 'ANNUAL');

                                            return (
                                                <TableRow 
                                                    key={cat.category_id || 'new-' + idx} 
                                                    hover
                                                    selected={selectedCategoryId === cat.category_id}
                                                    onClick={() => !isEditing && cat.category_id && setSelectedCategoryId(cat.category_id)}
                                                    sx={{ 
                                                        cursor: isEditing ? 'default' : 'pointer',
                                                        bgcolor: isEditing ? '#fff8e1 !important' : undefined 
                                                    }}
                                                >
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <TextField 
                                                                variant="outlined" 
                                                                value={data.name} 
                                                                onChange={(e) => handleEditFormChange('name', e.target.value)}
                                                                size="small"
                                                                sx={{ bgcolor: 'white' }}
                                                            />
                                                        ) : (
                                                            <Typography sx={{ fontWeight: 600, color: selectedCategoryId === cat.category_id ? '#1a237e' : '#455a64' }}>
                                                                {data.name}
                                                            </Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isEditing ? (
                                                            <TextField 
                                                                type="number"
                                                                variant="outlined"
                                                                value={joiningFee?.amount || 0} 
                                                                onChange={(e) => handleEditFeeChange(joiningIdx, Number(e.target.value))}
                                                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                                                sx={{ width: 100, bgcolor: 'white' }}
                                                                size="small"
                                                            />
                                                        ) : (
                                                            <Typography>${joiningFee?.amount || 0}</Typography>
                                                        )}
                                                    </TableCell>
                                                    <TableCell>
                                                         {isEditing ? (
                                                            <TextField 
                                                                type="number"
                                                                variant="outlined" 
                                                                value={annualFee?.amount || 0} 
                                                                onChange={(e) => handleEditFeeChange(annualIdx, Number(e.target.value))}
                                                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                                                sx={{ width: 100, bgcolor: 'white' }}
                                                                size="small"
                                                            />
                                                         ) : (
                                                             <Typography>${annualFee?.amount || 0}</Typography>
                                                         )}
                                                    </TableCell>
                                                    <TableCell>
                                                        {isEditing ? (
                                                             <Switch 
                                                                checked={data.is_active !== false}
                                                                onChange={(e) => handleEditFormChange('is_active', e.target.checked)}
                                                                size="small"
                                                            />
                                                        ) : (
                                                            <Chip 
                                                                label={data.is_active !== false ? "ACTIVE" : "INACTIVE"} 
                                                                sx={{ 
                                                                    height: 20, 
                                                                    fontSize: '0.6rem', 
                                                                    fontWeight: 800,
                                                                    borderRadius: 1,
                                                                    bgcolor: data.is_active !== false ? '#e8f5e9' : '#eceff1',
                                                                    color: data.is_active !== false ? '#4caf50' : '#78909c',
                                                                    '& .MuiChip-label': { px: 1 }
                                                                }}
                                                            />
                                                        )}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        {isEditing ? (
                                                            <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                                                                <Tooltip title="Save">
                                                                    <IconButton onClick={(e) => { e.stopPropagation(); saveCategoryEdit(); }} color="primary" size="small">
                                                                        <Check />
                                                                    </IconButton>
                                                                </Tooltip>
                                                                <Tooltip title="Cancel">
                                                                    <IconButton onClick={(e) => { e.stopPropagation(); cancelEditingCategory(); }} size="small">
                                                                        <Close />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            </Box>
                                                        ) : (
                                                            <Tooltip title="Edit Category">
                                                                <IconButton onClick={(e) => { e.stopPropagation(); startEditingCategory(cat); }} size="small">
                                                                    <Edit fontSize="small" />
                                                                </IconButton>
                                                            </Tooltip>
                                                        )}
                                                    </TableCell>
                                                </TableRow>
                                            );
                                        })}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Grid>

                    {/* Right: Rules Panel */}
                    <Grid size={{ xs: 12, md: 4 }}>
                         <Paper sx={{ p: 0, height: '100%', borderRadius: 1, overflow: 'hidden' }}>
                            <Box sx={{ p: 2, borderBottom: '1px solid #f0f0f0' }}>
                                <Typography variant="button" sx={{ fontWeight: 700, color: '#37474f', fontSize: '0.875rem' }}>
                                    ELIGIBILITY RULES
                                </Typography>
                                {activeCategory && (
                                    <Typography variant="caption" display="block" sx={{ color: '#90a4ae', mt: 0.5 }}>
                                        Configuration for: <span style={{ color: '#1976d2', fontWeight: 600 }}>{activeCategory.name}</span>
                                    </Typography>
                                )}
                            </Box>
                            
                            {activeCategory ? (
                                <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', gap: 3 }}>
                                    
                                    {/* Assume 1st rule is the main one for now */}
                                    {activeCategory.rules.length > 0 && (
                                        <>
                                            {/* Child Members */}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Box sx={{ bgcolor: '#e3f2fd', p: 0.5, borderRadius: '50%', display: 'flex' }}>
                                                        <ChildCare sx={{ fontSize: 18, color: '#1976d2' }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 700, color: '#455a64', fontSize: '0.9rem' }}>Child Members</Typography>
                                                </Box>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', mb: 0.5 }}>MIN COUNT</Typography>
                                                        <TextField 
                                                            size="small" type="number" fullWidth
                                                            value={activeCategory.rules[0].condition_json?.minChild ?? ''}
                                                            onChange={(e) => updateRule(
                                                                activeProgram.categories.indexOf(activeCategory), 
                                                                0, 'minChild', e.target.value
                                                            )}
                                                            inputProps={{ style: { fontSize: '0.9rem' } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', mb: 0.5 }}>MAX COUNT</Typography>
                                                        <TextField 
                                                            size="small" type="number" fullWidth
                                                            placeholder="No limit"
                                                            value={activeCategory.rules[0].condition_json?.maxChild ?? ''}
                                                            onChange={(e) => updateRule(
                                                                activeProgram.categories.indexOf(activeCategory), 
                                                                0, 'maxChild', e.target.value
                                                            )}
                                                            inputProps={{ style: { fontSize: '0.9rem' } }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>

                                            {/* Adult Members */}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Box sx={{ bgcolor: '#e3f2fd', p: 0.5, borderRadius: '50%', display: 'flex' }}>
                                                        <Person sx={{ fontSize: 18, color: '#1976d2' }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 700, color: '#455a64', fontSize: '0.9rem' }}>Adult Members</Typography>
                                                </Box>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', mb: 0.5 }}>MIN COUNT</Typography>
                                                        <TextField 
                                                            size="small" type="number" fullWidth
                                                            value={activeCategory.rules[0].condition_json?.minAdult ?? ''}
                                                            onChange={(e) => updateRule(
                                                                activeProgram.categories.indexOf(activeCategory), 
                                                                0, 'minAdult', e.target.value
                                                            )}
                                                            inputProps={{ style: { fontSize: '0.9rem' } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', mb: 0.5 }}>MAX COUNT</Typography>
                                                        <TextField 
                                                            size="small" type="number" fullWidth
                                                            placeholder="No limit"
                                                            value={activeCategory.rules[0].condition_json?.maxAdult ?? ''}
                                                            onChange={(e) => updateRule(
                                                                activeProgram.categories.indexOf(activeCategory), 
                                                                0, 'maxAdult', e.target.value
                                                            )}
                                                            inputProps={{ style: { fontSize: '0.9rem' } }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>

                                            {/* Senior Members */}
                                            <Box>
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                                                    <Box sx={{ bgcolor: '#e3f2fd', p: 0.5, borderRadius: '50%', display: 'flex' }}>
                                                        <Elderly sx={{ fontSize: 18, color: '#1976d2' }} />
                                                    </Box>
                                                    <Typography sx={{ fontWeight: 700, color: '#455a64', fontSize: '0.9rem' }}>Senior Members</Typography>
                                                </Box>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', mb: 0.5 }}>MIN COUNT</Typography>
                                                        <TextField 
                                                            size="small" type="number" fullWidth
                                                            value={activeCategory.rules[0].condition_json?.minSenior ?? ''}
                                                            onChange={(e) => updateRule(
                                                                activeProgram.categories.indexOf(activeCategory), 
                                                                0, 'minSenior', e.target.value
                                                            )}
                                                            inputProps={{ style: { fontSize: '0.9rem' } }}
                                                        />
                                                    </Grid>
                                                    <Grid size={{ xs: 6 }}>
                                                        <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#90a4ae', textTransform: 'uppercase', mb: 0.5 }}>MAX COUNT</Typography>
                                                        <TextField 
                                                            size="small" type="number" fullWidth
                                                            placeholder="No limit"
                                                            value={activeCategory.rules[0].condition_json?.maxSenior ?? ''}
                                                            onChange={(e) => updateRule(
                                                                activeProgram.categories.indexOf(activeCategory), 
                                                                0, 'maxSenior', e.target.value
                                                            )}
                                                            inputProps={{ style: { fontSize: '0.9rem' } }}
                                                        />
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </>
                                    )}
                                    
                                </Box>
                            ) : (
                                <Box sx={{ p: 4, textAlign: 'center' }}>
                                    <Typography variant="body2" color="text.secondary">
                                        Select a category to configure rules.
                                    </Typography>
                                </Box>
                            )}
                         </Paper>
                    </Grid>
                </Grid>

                 {/* Bundled Services */}
                 <Box sx={{ mt: 4 }}>
                    <Paper sx={{ overflow: 'hidden' }}>
                      <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', bgcolor: '#f5f5f5', borderBottom: '1px solid #e0e0e0' }}>
                           <Typography variant="subtitle1" fontWeight="bold">Bundled Services (Included in {activeProgram.name})</Typography>
                           <Button size="small" startIcon={<Add />} onClick={() => setOpenAddService(true)}>Add Service</Button>
                      </Box>
                      <TableContainer>
                          <Table>
                              <TableHead>
                                  <TableRow>
                                      <TableCell>Service Name</TableCell>
                                      <TableCell>Included?</TableCell>
                                      <TableCell>Usage Limit</TableCell>
                                      <TableCell>Discount</TableCell>
                                      <TableCell align="right">Actions</TableCell>
                                  </TableRow>
                              </TableHead>
                              <TableBody>
                                   {activeProgram.services.map(bs => {
                                       const serviceName = bs.service_name || availableServices.find(s => s.service_id === bs.service_id)?.name || 'Unknown Service';
                                       return (
                                           <TableRow key={bs.membership_service_id}>
                                               <TableCell>{serviceName}</TableCell>
                                               <TableCell>
                                                    <FormControlLabel 
                                                        control={
                                                            <Checkbox 
                                                                checked={bs.is_included} 
                                                                onChange={(e) => updateService(bs, { is_included: e.target.checked })}
                                                            />
                                                        } 
                                                        label={bs.is_included ? "Free" : "Payable"}
                                                    />
                                               </TableCell>
                                               <TableCell>
                                                    <TextField 
                                                        size="small"
                                                        value={bs.usage_limit || ''}
                                                        placeholder="Unlimited"
                                                        onChange={(e) => updateService(bs, { usage_limit: e.target.value })}
                                                    />
                                               </TableCell>
                                               <TableCell>
                                                     {bs.is_included ? (
                                                        <Chip label="FREE" color="success" size="small" />
                                                     ) : (
                                                        <TextField 
                                                            size="small"
                                                            value={bs.discount || ''}
                                                            placeholder="e.g. 10%"
                                                            onChange={(e) => updateService(bs, { discount: e.target.value })}
                                                        />
                                                     )}
                                               </TableCell>
                                               <TableCell align="right">
                                                   <Button color="error" size="small" onClick={() => updateService(bs, { is_active: false })}>Remove</Button>
                                               </TableCell>
                                           </TableRow>
                                       )
                                   })}
                                   {activeProgram.services.length === 0 && (
                                       <TableRow>
                                           <TableCell colSpan={5} align="center">No bundled services added.</TableCell>
                                       </TableRow>
                                   )}
                              </TableBody>
                          </Table>
                      </TableContainer>
                    </Paper>
                 </Box>
            </>
        )}

        {/* Create Dialog */}
        <Dialog open={openCreate} onClose={() => setOpenCreate(false)}>
            <DialogTitle>Add Membership Program</DialogTitle>
            <DialogContent>
                <TextField 
                    autoFocus
                    margin="dense"
                    label="Program Name"
                    fullWidth
                    value={createName}
                    onChange={(e) => setCreateName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenCreate(false)}>Cancel</Button>
                <Button onClick={handleCreateProgram} variant="contained" disabled={!createName || saving}>
                    {saving ? <CircularProgress size={24} /> : "Create"}
                </Button>
            </DialogActions>
        </Dialog>

         {/* Add Service Dialog */}
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
                            // Filter out already added services
                            .filter(s => activeProgram ? !activeProgram.services.find(bs => bs.service_id === s.service_id && bs.is_active !== false) : true)
                            .map(s => (
                                <MenuItem key={s.service_id} value={s.service_id}>{s.name}</MenuItem>
                            ))
                        }
                    </Select>
                </FormControl>
            </DialogContent>
             <DialogActions>
                <Button onClick={() => setOpenAddService(false)}>Cancel</Button>
                <Button onClick={handleAddService} variant="contained" disabled={!newServiceId}>Add</Button>
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
