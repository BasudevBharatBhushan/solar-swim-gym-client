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
  Settings,
  ContentCopy
} from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';
import { ServicePackSelector } from '../../components/Service/ServicePackSelector';
import { serviceCatalog, Service, ServicePack } from '../../services/serviceCatalog';
import { 
  membershipService, 
  MembershipProgram, 
  MembershipCategory, 
  MembershipService as IMembershipService
} from '../../services/membershipService';

export const Memberships = () => {
  const { currentLocationId, locations, role } = useAuth();
  const { waiverPrograms, dropdownValues, ageGroups } = useConfig();
  
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
  const [openEditProgramName, setOpenEditProgramName] = useState(false);
  const [openAddService, setOpenAddService] = useState(false);
  const [createProgramName, setCreateProgramName] = useState('');
  const [editProgramName, setEditProgramName] = useState('');

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
  
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Edit Mode State
  const [isEditing, setIsEditing] = useState(false);
  const [draftCategory, setDraftCategory] = useState<MembershipCategory | null>(null);
  const [draftServices, setDraftServices] = useState<IMembershipService[]>([]);

  // Services State (Read-only view)
  const [categoryServices, setCategoryServices] = useState<IMembershipService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(false);

  // Service Independent Edit State
  const [editingServiceId, setEditingServiceId] = useState<string | null>(null);
  const [serviceEditState, setServiceEditState] = useState<Partial<IMembershipService>>({});

  // Duplication State
  const [openDuplicateCategory, setOpenDuplicateCategory] = useState(false);
  const [duplicateCategoryForm, setDuplicateCategoryForm] = useState<Partial<MembershipCategory>>({});
  const [duplicateTargetLocationId, setDuplicateTargetLocationId] = useState<string | null>(null);
  const [duplicateTargetProgramId, setDuplicateTargetProgramId] = useState<string | null>(null);
  const [targetPrograms, setTargetPrograms] = useState<MembershipProgram[]>([]);
  const [loadingTargetPrograms, setLoadingTargetPrograms] = useState(false);

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
        membershipService.getServices(selectedCategoryId, currentLocationId || undefined)
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

  // Fetch Packs for Reviewed Services (since getServices is metadata only)
  useEffect(() => {
    if (categoryServices.length === 0 || availableServices.length === 0) return;

    const servicesNeedingPacks = categoryServices
        .map(s => s.service_id)
        .filter((id): id is string => !!id)
        .filter((id, idx, self) => self.indexOf(id) === idx) // Unique
        .filter(id => {
            const svc = availableServices.find(as => as.service_id === id);
            return svc && !svc.packs;
        });
    
    if (servicesNeedingPacks.length === 0) return;

    Promise.all(servicesNeedingPacks.map(async (id) => {
        try {
            const data = await serviceCatalog.getServicePacks(id, currentLocationId || undefined);
            const packs = Array.isArray(data) ? data : (data.data || []);
            return { id, packs };
        } catch (e) {
            console.error(`Failed to load packs for service ${id}`, e);
            return { id, packs: [] };
        }
    })).then((results) => {
        setAvailableServices(prev => prev.map(s => {
            const res = results.find(r => r.id === s.service_id);
            if (res) {
                return { ...s, packs: res.packs };
            }
            return s;
        }));
    });
  }, [categoryServices, availableServices]);


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
                             condition_json: {}
                         }
                      ]
                  }
              ],
              is_active: true
          };
          
          const created = await membershipService.saveMembershipProgram(newProgram, currentLocationId || undefined);
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

  const handleOpenEditProgramName = () => {
      if (!activeProgram) return;
      setEditProgramName(activeProgram.name || '');
      setOpenEditProgramName(true);
  };

  const handleUpdateProgramName = async () => {
      if (!activeProgram || !currentLocationId) return;
      const nextName = editProgramName.trim();
      if (!nextName) return;

      setSaving(true);
      try {
          const payload: any = {
              membership_program_id: activeProgram.membership_program_id,
              location_id: currentLocationId,
              name: nextName
          };

          await membershipService.saveMembershipProgram(payload, currentLocationId || undefined);
          setPrograms(prev =>
              prev.map(program =>
                  program.membership_program_id === activeProgram.membership_program_id
                      ? { ...program, name: nextName }
                      : program
              )
          );
          setOpenEditProgramName(false);
          setSuccess('Membership Program name updated.');
      } catch (e: any) {
          setError(e?.message || 'Failed to update program name.');
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
                 condition_json: {} 
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

      // Validation: Total members allowed must be set
      const rawAllowed = String(draftCategory.members_allowed ?? '');
      if (rawAllowed === '' || draftCategory.members_allowed === undefined) {
          setError("Total members allowed is required.");
          return;
      }

      // Validation: sum(min_i) must be <= members_allowed
      const totalAllowed = Number(draftCategory.members_allowed);
      const rule = draftCategory.rules[0];
      let minSum = 0;
      let hasEmptyRule = false;

      if (rule) {
          ageGroups
              .filter(g => !g.age_group_category || g.age_group_category === 'Membership')
              .forEach(group => {
                  const min = rule.condition_json[`min_${group.age_group_id}`];
                  const max = rule.condition_json[`max_${group.age_group_id}`];
                  
                  if (String(min ?? '') === '' || String(max ?? '') === '') {
                      hasEmptyRule = true;
                  }

                  minSum += Number(min || 0);
              });
      }

      if (hasEmptyRule) {
          setError("All age group rules must have a value (set to 0 if not applicable).");
          return;
      }

      if (minSum > totalAllowed) {
          setError(`Minimum required members (${minSum}) exceed total members allowed (${totalAllowed}) for this plan.`);
          return;
      }

      setSaving(true);
      
      try {
          // 1. Prepare Updated Program
          let updatedProgram: MembershipProgram;
          let targetCategoryId = draftCategory.category_id;

          // Sanitize fees (convert empty string to 0)
          const sanitizedCategory: MembershipCategory = {
              ...draftCategory,
              members_allowed: totalAllowed,
              fees: draftCategory.fees.map((f: any) => ({
                  ...f,
                  amount: f.amount === '' ? 0 : Number(f.amount)
              }))
          };

          if (selectedCategoryId === 'new') {
              updatedProgram = {
                  ...activeProgram,
                  categories: [...activeProgram.categories, sanitizedCategory]
              };
          } else {
              updatedProgram = {
                  ...activeProgram,
                  categories: activeProgram.categories.map(c => 
                      c.category_id === sanitizedCategory.category_id ? sanitizedCategory : c
                  )
              };
          }

          // 2. Save Program (Categories)
          const savedProgram = await membershipService.saveMembershipProgram(updatedProgram, currentLocationId || undefined);
          
          // 3. Resolve Category ID for Services (Category ID is passed as membership_program_id in payload)
          if (selectedCategoryId === 'new') {
              // Find the new category ID by matching the name from our draft
              const savedCat = savedProgram.categories.find(c => c.name === sanitizedCategory.name);
              if (savedCat) targetCategoryId = savedCat.category_id;
          }

          // 4. Save Services (ONLY if we are creating a NEW category)
          // For existing categories, services are managed independently.
          if (selectedCategoryId === 'new' && targetCategoryId && draftServices.length > 0) {
               // Ensure correct owner ID
               const servicesToSave = draftServices.map(s => ({
                   ...s,
                   membership_program_id: targetCategoryId!
               }));
               await membershipService.upsertServices(servicesToSave, currentLocationId || undefined);
          }

          // 5. Cleanup
          await fetchData(true);
          
          if (targetCategoryId) {
               const freshServices = await membershipService.getServices(targetCategoryId, currentLocationId || undefined);
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

  const updateDraftFee = (type: 'JOINING' | 'ANNUAL', amount: any) => {
      if (!draftCategory) return;
      const newFees = draftCategory.fees.map(f => 
          f.fee_type === type ? { ...f, amount: amount === '' ? '' : Number(amount) } : f
      );
      setDraftCategory({ ...draftCategory, fees: newFees as any });
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



  const handleDeleteCategory = (categoryId: string) => {
      setDeleteConfirm({
          open: true,
          title: 'Delete Category?',
          message: 'Are you sure you want to delete this category? All associated fees and rules will be removed.',
          onConfirm: async () => {
              try {
                  await membershipService.deleteMembershipCategory(categoryId, currentLocationId || undefined);
                  setSuccess("Category deleted.");
                  // Select another category or none
                  setSelectedCategoryId('');
                  setDraftCategory(null);
                  setIsEditing(false);
                  await fetchData(true);
              } catch (e: any) {
                  setError(e.message || "Failed to delete category.");
              } finally {
                   setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
          }
      });
  };

  const handleDeleteServiceLink = (service: IMembershipService) => {
       setDeleteConfirm({
          open: true,
          title: 'Remove Service?',
          message: `Are you sure you want to remove "${service.service_name || 'this service'}" from this category?`,
          onConfirm: async () => {
              if (!service.membership_service_id) return;
              try {
                  await membershipService.deleteServiceLink(service.membership_service_id, currentLocationId || undefined);
                  setSuccess("Service removed.");
                  if (selectedCategoryId && selectedCategoryId !== 'new') {
                      const freshServices = await membershipService.getServices(selectedCategoryId, currentLocationId || undefined);
                      setCategoryServices(freshServices);
                  }
                  // Also update draft services if editing
                  if (isEditing && draftCategory) {
                      setDraftServices(prev => prev.filter(s => s.membership_service_id !== service.membership_service_id));
                  }
              } catch (e: any) {
                  setError(e.message || "Failed to remove service.");
              } finally {
                   setDeleteConfirm(prev => ({ ...prev, open: false }));
              }
          }
      });
  };

  const handleAddServiceSubmit = async (service: Service, pack: ServicePack) => {
      if (selectedCategoryId === 'new') {
          // Check duplicates in draft
          if (draftServices.some(s => s.service_id === service.service_id && s.service_pack_id === pack.service_pack_id && s.is_active !== false)) {
             setError("Service Pack already added.");
             return;
          }

          // DRAFT MODE
          const newService: IMembershipService = {
              service_id: service.service_id,
              service_pack_id: pack.service_pack_id!,
              membership_program_id: '', 
              is_included: true,
              usage_limit: 'Unlimited', 
              is_part_of_base_plan: false,
              is_active: true,
              service_name: service.name,
              service_pack_name: pack.name
          };
          setDraftServices(prev => [...prev, newService]);
          setOpenAddService(false);
      } else if (activeCategory) {
          // LIVE MODE
          try {
              const newService: IMembershipService = {
                  service_id: service.service_id,
                  service_pack_id: pack.service_pack_id!,
                  membership_program_id: activeCategory.category_id!,
                  is_included: true,
                  usage_limit: 'Unlimited',
                  is_active: true
              };
              await membershipService.upsertServices([newService], currentLocationId || undefined);
              setSuccess("Service added.");
              setOpenAddService(false);
              // Refresh
              if (selectedCategoryId) {
                  const fresh = await membershipService.getServices(selectedCategoryId, currentLocationId || undefined);
                  setCategoryServices(fresh);
              }
          } catch (e: any) {
              setError(e.message || "Failed to add service.");
          }
      }
  };

  const handleUpdateServiceLive = async (serviceId: string) => {
      if (!selectedCategoryId || selectedCategoryId === 'new') return;
      
      const original = categoryServices.find(s => s.membership_service_id === serviceId);
      if (!original) return;

      const updated = { ...original, ...serviceEditState };

      try {
           await membershipService.upsertServices([updated], currentLocationId || undefined);
           setSuccess("Service updated.");
           setEditingServiceId(null);
           setServiceEditState({});
           // Refresh
           const fresh = await membershipService.getServices(selectedCategoryId, currentLocationId || undefined);
           setCategoryServices(fresh);
      } catch (e: any) {
           setError(e.message || "Failed to update service.");
      }
  };

  const handleStartEditServiceLive = (service: IMembershipService) => {
      setEditingServiceId(service.membership_service_id || null);
       setServiceEditState({
           usage_limit: service.usage_limit,
           is_included: service.is_included,
           discount: service.discount
       });
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


  const handleStartDuplicateCategory = async () => {
      if (!activeCategory || !activeProgram) return;
      
      setDuplicateCategoryForm({
          ...activeCategory,
          category_id: undefined, // Clear ID for new creation
          name: `${activeCategory.name} (Copy)`
      });
      setDuplicateTargetLocationId(currentLocationId);
      setDuplicateTargetProgramId(selectedProgramId);
      setOpenDuplicateCategory(true);
      
      // Load programs for current location immediately
      if (currentLocationId) {
          setLoadingTargetPrograms(true);
          try {
              const progs = await membershipService.getMemberships(currentLocationId);
              setTargetPrograms(progs);
          } catch (e) {
              console.error(e);
          } finally {
              setLoadingTargetPrograms(false);
          }
      }
  };

  const handleDuplicateLocationChange = async (locId: string) => {
      setDuplicateTargetLocationId(locId);
      setDuplicateTargetProgramId(null);
      setLoadingTargetPrograms(true);
      try {
          const progs = await membershipService.getMemberships(locId);
          setTargetPrograms(progs);
          // Auto-select first program if available
          if (progs.length > 0) {
              setDuplicateTargetProgramId(progs[0].membership_program_id!);
          }
      } catch (e) {
          setError("Failed to load programs for this location.");
      } finally {
          setLoadingTargetPrograms(false);
      }
  };

  const handleDuplicateCategorySubmit = async () => {
      if (!duplicateTargetProgramId || !duplicateCategoryForm.name) return;
      
      setSaving(true);
      try {
          // 1. Get the target program
          const targetProg = targetPrograms.find(p => p.membership_program_id === duplicateTargetProgramId);
          if (!targetProg) throw new Error("Target program not found.");

          // 2. Prepare the new category (strip IDs from fees and rules too)
          const newCategory: MembershipCategory = {
              ...duplicateCategoryForm as MembershipCategory,
              category_id: undefined,
              fees: (duplicateCategoryForm.fees || []).map(f => ({ ...f, membership_fee_id: undefined })),
              rules: (duplicateCategoryForm.rules || []).map(r => ({ ...r, rule_id: undefined }))
          };

          // 3. Update program with new category
          const updatedProgram: MembershipProgram = {
              ...targetProg,
              categories: [...targetProg.categories, newCategory]
          };

          // 4. Save
          await membershipService.saveMembershipProgram(updatedProgram, duplicateTargetLocationId || undefined);
          
          setSuccess(`Category duplicated to ${targetProg.name}`);
          setOpenDuplicateCategory(false);
          
          // If we duplicated to the CURRENT location, refresh the data
          if (duplicateTargetLocationId === currentLocationId) {
              await fetchData(true);
          }
      } catch (e: any) {
          setError(e.message || "Failed to duplicate category.");
      } finally {
          setSaving(false);
      }
  };


  if (!currentLocationId) {
      return <Alert severity="warning">Please select a location.</Alert>;
  }

  // Helper render for Rules
  const renderRuleInputs = (categoryData: MembershipCategory, readOnly: boolean) => {
      const rule = categoryData.rules[0];
      if (!rule) return null;

      const TOTAL = Number(categoryData.members_allowed || 0);
      const relevantAgeGroups = ageGroups.filter(g => !g.age_group_category || g.age_group_category === 'Membership');
      
      // Calculate used_min
      const used_min = relevantAgeGroups.reduce((acc, group) => {
          const val = rule.condition_json[`min_${group.age_group_id}`];
          return acc + (String(val ?? '') === '' ? 0 : Number(val || 0));
      }, 0);

      const getGroupIcon = (name: string) => {
          const n = name.toLowerCase();
          if (n.includes('infant') || n.includes('baby')) return '🍼';
          if (n.includes('child') || n.includes('kid')) return '🧒';
          if (n.includes('junior') || n.includes('teen') || n.includes('youth')) return '🎓';
          if (n.includes('senior') || n.includes('elder')) return '🧓';
          return '👤';
      };

      const getGroupColor = (name: string) => {
          const n = name.toLowerCase();
          if (n.includes('infant') || n.includes('baby')) return { bg: '#eff6ff', color: '#3b82f6' };
          if (n.includes('child') || n.includes('kid')) return { bg: '#f0fdf4', color: '#16a34a' };
          if (n.includes('junior') || n.includes('teen') || n.includes('youth')) return { bg: '#f0fdf4', color: '#16a34a' };
          if (n.includes('senior') || n.includes('elder')) return { bg: '#fff7ed', color: '#ea580c' };
          return { bg: '#eff6ff', color: '#3b82f6' };
      };

      const renderGroupCard = (group: any) => {
          const minKey = `min_${group.age_group_id}`;
          const maxKey = `max_${group.age_group_id}`;
          const minVal = rule.condition_json[minKey];
          const maxVal = rule.condition_json[maxKey];
          const ageRange = `${group.min_age} - ${group.max_age} years`;
          const { bg, color } = getGroupColor(group.name);
          const icon = getGroupIcon(group.name);

          return (
            <Grid size={{ xs: 12, md: 6 }} key={group.age_group_id}>
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  border: '1px solid #e2e8f0',
                  bgcolor: 'white',
                  height: '100%',
                  transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
                  '&:hover': { borderColor: '#93c5fd', boxShadow: '0 2px 12px rgba(59,130,246,0.08)' }
                }}
              >
                {/* Card Header */}
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2.5 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Box sx={{ bgcolor: bg, borderRadius: 2, p: 1, fontSize: '1.2rem', lineHeight: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', width: 38, height: 38 }}>
                      {icon}
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a', lineHeight: 1.2 }}>
                        {group.name}
                      </Typography>
                      <Typography variant="caption" sx={{ color: color, fontWeight: 600 }}>
                        {ageRange}
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ color: '#cbd5e1', fontSize: '1rem' }}>
                    ℹ️
                  </Box>
                </Box>

                {/* Rule Sentence */}
                {readOnly ? (
                  <Box>
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 2 }}>
                      This plan must include at least <Box component="span" sx={{ fontWeight: 800, color: '#0f172a', bgcolor: '#f1f5f9', px: 1, py: 0.25, borderRadius: 1 }}>{minVal || 0}</Box>{' '}
                      {group.name}(s), and can include up to
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#475569', lineHeight: 2 }}>
                      <Box component="span" sx={{ fontWeight: 800, color: '#0f172a', bgcolor: '#f1f5f9', px: 1, py: 0.25, borderRadius: 1 }}>{maxVal || 0}</Box>{' '}
                      {group.name}(s).
                    </Typography>
                  </Box>
                ) : (
                  <Box>
                    <Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: 'wrap', rowGap: 1, mb: 1 }}>
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>This plan must include at least</Typography>
                      <TextField
                        size="small"
                        type="number"
                        value={minVal ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { updateDraftRule(0, minKey, ''); return; }
                          const val = Number(raw);
                          if (val < 0) return;
                          const prevMin = String(minVal ?? '');
                          const otherMinSum = used_min - (prevMin === '' ? 0 : Number(minVal || 0));
                          if (val + otherMinSum > TOTAL) {
                            alert(`Violation: Sum of minimums (${val + otherMinSum}) cannot exceed total allowed (${TOTAL}).`);
                            return;
                          }
                          updateDraftRule(0, minKey, val);
                        }}
                        sx={{
                          width: 70,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#f8fafc',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#cbd5e1 !important', borderWidth: '1px !important' },
                            '&:hover fieldset': { borderColor: '#94a3b8 !important' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6 !important' },
                            '& input': { textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', py: 0.75 }
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>{group.name}(s), and can include up to</Typography>
                    </Stack>
                    <Stack direction="row" spacing={1} alignItems="center">
                      <TextField
                        size="small"
                        type="number"
                        value={maxVal ?? ''}
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (raw === '') { updateDraftRule(0, maxKey, ''); return; }
                          const val = Number(raw);
                          if (val < 0) return;
                          if (val > TOTAL) {
                            alert(`Violation: Max cannot exceed total plan capacity (${TOTAL}).`);
                            return;
                          }
                          const prevMin = String(minVal ?? '');
                          if (prevMin !== '' && val < Number(minVal)) {
                            alert(`Violation: Max cannot be less than the minimum required (${minVal}).`);
                            return;
                          }
                          updateDraftRule(0, maxKey, val);
                        }}
                        sx={{
                          width: 70,
                          '& .MuiOutlinedInput-root': {
                            bgcolor: '#f8fafc',
                            borderRadius: 2,
                            '& fieldset': { borderColor: '#cbd5e1 !important', borderWidth: '1px !important' },
                            '&:hover fieldset': { borderColor: '#94a3b8 !important' },
                            '&.Mui-focused fieldset': { borderColor: '#3b82f6 !important' },
                            '& input': { textAlign: 'center', fontWeight: 800, fontSize: '0.9rem', py: 0.75 }
                          }
                        }}
                      />
                      <Typography variant="body2" sx={{ color: '#475569', fontWeight: 500 }}>{group.name}(s).</Typography>
                    </Stack>
                  </Box>
                )}
              </Paper>
            </Grid>
          );
      };

      return (
        <Box>
          {/* Rules Configuration Header */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#0f172a', mb: 0.5 }}>
              Rules Configuration
            </Typography>
            <Typography variant="body2" sx={{ color: '#64748b' }}>
              Set the capacity and age-specific requirements for this plan.
            </Typography>
          </Box>

          {/* Total Members Allowed */}
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#0f172a', mb: 1.5 }}>
              Total Members Allowed
            </Typography>
            {readOnly ? (
              <Paper elevation={0} sx={{ px: 2, py: 1.5, borderRadius: 3, border: '1px solid #e2e8f0', display: 'inline-flex', alignItems: 'center', gap: 1.5, minWidth: 160 }}>
                <Typography sx={{ fontSize: '1.1rem' }}>👥</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#0f172a' }}>{TOTAL}</Typography>
              </Paper>
            ) : (
              <Box sx={{ maxWidth: 280 }}>
                <Paper elevation={0} sx={{ px: 2, py: 1, borderRadius: 3, border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <Typography sx={{ fontSize: '1.1rem' }}>👥</Typography>
                  <TextField
                    variant="standard"
                    type="number"
                    placeholder="e.g. 4"
                    value={categoryData.members_allowed ?? ''}
                    onChange={(e) => {
                      const val = e.target.value === '' ? '' : Number(e.target.value);
                      updateDraftField('members_allowed', val);
                    }}
                    InputProps={{ disableUnderline: true }}
                    sx={{ flex: 1, '& input': { fontWeight: 800, fontSize: '1rem', color: '#0f172a' } }}
                  />
                </Paper>
                <Typography variant="caption" sx={{ color: '#64748b', mt: 0.75, display: 'block', fontStyle: 'italic' }}>
                  This defines the total seat capacity for the entire group plan.
                </Typography>
              </Box>
            )}
          </Box>

          {/* Age Group Cards */}
          <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#0f172a' }}>
              Dynamic Eligibility Rules
            </Typography>
          </Box>

          <Grid container spacing={2}>
            {relevantAgeGroups.map(group => renderGroupCard(group))}
          </Grid>

          {!readOnly && (
            <Box sx={{ mt: 3, p: 2, bgcolor: '#fffbeb', borderRadius: 3, border: '1px solid #fef3c7', display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
              <Typography>💡</Typography>
              <Typography variant="caption" sx={{ color: '#92400e', fontWeight: 600, lineHeight: 1.6 }}>
                Rule Enforcement: The system will validate that the sum of minimum required members does not exceed the total capacity on save.
              </Typography>
            </Box>
          )}
        </Box>
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
                             value={item.fee?.amount ?? ''}
                             onChange={(e) => updateDraftFee(item.type, e.target.value)}
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
            title={activeProgram ? activeProgram.name : "Membership Programs"}
            description="Manage membership tiers, fees, and eligibility rules."
            breadcrumbs={[
                { label: 'Settings', href: '/admin/settings' },
                { label: 'Memberships', active: true }
            ]}
            titleSx={activeProgram ? { 
                textTransform: 'uppercase', 
                color: '#1e40af', 
                fontWeight: 900, 
                letterSpacing: '-0.01em',
                fontSize: '2.2rem'
            } : undefined}
            action={
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                    <FormControl sx={{ minWidth: 250, bgcolor: 'white' }} size="small">
                        <InputLabel>Select Program</InputLabel>
                        <Select
                            value={activeProgram ? selectedProgramId : ''}
                            label="Select Program"
                            onChange={(e) => handleProgramChange(e.target.value as string)}
                        >
                            {programs.map(p => (
                                <MenuItem key={p.membership_program_id} value={p.membership_program_id}>{p.name}</MenuItem>
                            ))}
                            {programs.length === 0 && <MenuItem disabled>No Programs Available</MenuItem>}
                        </Select>
                    </FormControl>
                    <Button 
                        variant="outlined"
                        startIcon={<Edit />}
                        onClick={handleOpenEditProgramName}
                        disabled={!activeProgram || saving}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        Edit Program
                    </Button>
                    <Button 
                        variant="contained" 
                        startIcon={<Add />} 
                        onClick={() => setOpenCreateProgram(true)}
                        sx={{ whiteSpace: 'nowrap' }}
                    >
                        New Program
                    </Button>
                </Box>
            }
        />

        <Dialog open={openCreateProgram} onClose={() => setOpenCreateProgram(false)}>
            <DialogTitle>Create New Membership Program</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Program Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={createProgramName}
                    onChange={(e) => setCreateProgramName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenCreateProgram(false)}>Cancel</Button>
                <Button variant="contained" onClick={handleCreateProgram} disabled={!createProgramName}>
                    Create
                </Button>
            </DialogActions>
        </Dialog>

        <Dialog open={openEditProgramName} onClose={() => setOpenEditProgramName(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Membership Program Name</DialogTitle>
            <DialogContent>
                <TextField
                    autoFocus
                    margin="dense"
                    label="Program Name"
                    type="text"
                    fullWidth
                    variant="outlined"
                    value={editProgramName}
                    onChange={(e) => setEditProgramName(e.target.value)}
                />
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenEditProgramName(false)} disabled={saving}>Cancel</Button>
                <Button
                    variant="contained"
                    onClick={handleUpdateProgramName}
                    disabled={!editProgramName.trim() || saving}
                >
                    Save
                </Button>
            </DialogActions>
        </Dialog>

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


        {loading ? (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
        ) : activeProgram ? (
             <Grid container spacing={3}>
                 {/* Left Column: Categories List (4/12) */}
                 <Grid size={{ xs: 12, md: 4 }} sx={{ display: 'flex' }}>
                     <Paper sx={{ flex: 1, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                         <Box sx={{ p: 2, bgcolor: '#fff', borderBottom: '1px solid #f0f4f8' }}>
                             <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em' }}>
                                 CATEGORIES
                             </Typography>
                         </Box>
                         <List sx={{ flex: 1, overflowY: 'auto', p: 0 }}>
                             {[...activeProgram.categories]
                                 .sort((a, b) => Number(a.members_allowed || 0) - Number(b.members_allowed || 0))
                                 .map((cat) => {
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
                                        Add
                                    </Button>
                                </Box>
                             )}
                         </List>
                     </Paper>
                 </Grid>

                 {/* Right Column: Configuration (8/12) */}
                 <Grid size={{ xs: 12, md: 8 }} sx={{ display: 'flex' }}>
                     <Paper sx={{ flex: 1, minHeight: 400, borderRadius: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
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
                                             <Box sx={{ display: 'flex', gap: 1 }}>
                                               <Button 
                                                   variant="outlined" 
                                                   startIcon={<Edit />} 
                                                   onClick={handleStartEdit}
                                                   sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 700, px: 3, color: '#1e293b', borderColor: '#e2e8f0' }}
                                               >
                                                   Edit
                                               </Button>
                                               <Button
                                                    variant="outlined"
                                                    startIcon={<ContentCopy />}
                                                    onClick={handleStartDuplicateCategory}
                                                    sx={{ 
                                                        borderRadius: 2, 
                                                        textTransform: 'none', 
                                                        fontWeight: 700,
                                                        px: 3,
                                                        color: '#6366f1',
                                                        borderColor: '#e0e7ff',
                                                        '&:hover': { bgcolor: '#f5f7ff', borderColor: '#c7d2fe' }
                                                    }}
                                                >
                                                    Duplicate
                                                </Button>
                                               <Button 
                                                    variant="outlined" 
                                                    startIcon={<Delete />} 
                                                    onClick={() => activeCategory?.category_id && handleDeleteCategory(activeCategory.category_id)}
                                                    sx={{ 
                                                        color: '#ef4444', 
                                                        borderColor: '#fecaca', 
                                                        borderRadius: 2, 
                                                        textTransform: 'none', 
                                                        fontWeight: 700,
                                                        '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' }
                                                    }}
                                                >
                                                    Delete
                                                </Button>
                                           </Box>
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
                                               <Box sx={{ mb: 3, p: 3, bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0' }}>
                                                    <FormControlLabel
                                                        control={
                                                            <Switch 
                                                                checked={draftCategory?.is_active !== false}
                                                                onChange={(e) => updateDraftField('is_active', e.target.checked)}
                                                            />
                                                        }
                                                        label={<Typography fontWeight={700} color="#1e293b">Active Status</Typography>}
                                                    />
                                               </Box>
                                          ) : (
                                               <Box sx={{ mb: 3, display: 'flex', gap: 2, alignItems: 'center' }}>
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
                                             {/* Always allow Adding Service unless in pure view mode AND it's not a new category. 
                                                 Actually we want to allow adding services in view mode for existing categories now.
                                             */}
                                             {(selectedCategoryId === 'new' || !isEditing) && (
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
                                             {(selectedCategoryId === 'new' ? draftServices : categoryServices)
                                                 .filter(s => s.is_active !== false)
                                                 .map((svc, idx) => {
                                                     const serviceRef = availableServices.find(as => as.service_id === svc.service_id);
                                                     const packRef = serviceRef?.packs?.find(p => p.service_pack_id === svc.service_pack_id);
                                                     const displayServiceName = svc.service_name || serviceRef?.name || 'Unknown Service';
                                                     const displayPackName = svc.service_pack_name || packRef?.name || (svc.service_pack_id ? 'Unknown Pack' : null);
                                                     const name = displayPackName ? `${displayServiceName} - ${displayPackName}` : displayServiceName;
                                                     
                                                     const description = serviceRef?.description || '';
                                                     const itemKey = svc.membership_service_id || idx;
                                                     
                                                     const isEditingThis = editingServiceId === svc.membership_service_id;
                                                     const isDraft = selectedCategoryId === 'new';
                                                     
                                                     const classes = svc.classes || packRef?.classes;
                                                     const students = svc.students_allowed || packRef?.students_allowed;
                                                     const waiverId = svc.waiver_program_id || packRef?.waiver_program_id;
                                                     const wName = waiverId ? waiverPrograms.find(w => w.waiver_program_id === waiverId)?.name : null;

                                                     const isShrabable = svc.is_shrabable ?? packRef?.is_shrabable;
                                                     const maxUses = svc.max_uses_per_period ?? packRef?.max_uses_per_period;
                                                     const unit = svc.usage_period_unit ?? packRef?.usage_period_unit;
                                                     const length = svc.usage_period_length ?? packRef?.usage_period_length;
                                                     const enforceLimit = svc.enforce_usage_limit ?? packRef?.enforce_usage_limit;

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
                                                                      <Stack direction="row" spacing={1} sx={{ mt: 1, flexWrap: 'wrap', rowGap: 1 }}>
                                                                          {(serviceRef?.type || "Group") && (
                                                                              <Chip 
                                                                                  label={(dropdownValues?.find(v => v.module?.toLowerCase() === "services" && v.label?.toUpperCase() === "TYPE" && v.value?.toLowerCase() === serviceRef?.type?.toLowerCase())?.value || serviceRef?.type || "Group").toUpperCase()} 
                                                                                  size="small" 
                                                                                  sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#f1f5f9', color: '#64748b', borderRadius: '4px' }} 
                                                                              />
                                                                          )}
                                                                          {(serviceRef?.service_type || "Training") && (
                                                                              <Chip 
                                                                                  label={(dropdownValues?.find(v => v.module?.toLowerCase() === "services" && v.label?.toUpperCase() === "CATEGORY" && v.value?.toLowerCase() === serviceRef?.service_type?.toLowerCase())?.value || serviceRef?.service_type || "Training").toUpperCase()} 
                                                                                  size="small" 
                                                                                  sx={{ height: 20, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#eff6ff', color: '#3b82f6', borderRadius: '4px' }} 
                                                                              />
                                                                          )}
                                                                          {!!classes && <Chip label={`${classes} CLASSES`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '4px' }} />}
                                                                          {!!students && <Chip label={`${students} STUDENTS`} size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 700, fontSize: '0.65rem', height: 20, borderRadius: '4px' }} />}
                                                                          {wName && <Chip label={wName.toUpperCase()} size="small" sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 800, fontSize: '0.65rem', height: 20, borderRadius: '4px' }} />}
                                                                          {isShrabable && <Chip label="SHARABLE" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f0fdf4', color: '#16a34a', borderRadius: '4px' }} />}
                                                                          {!!maxUses && (
                                                                               <Chip 
                                                                                   label={`${maxUses} USES / ${length || 1} ${unit}`} 
                                                                                   size="small" 
                                                                                   sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#f0f9ff', color: '#0284c7', borderRadius: '4px' }} 
                                                                               />
                                                                           )}
                                                                          {enforceLimit && (
                                                                              <Chip label="STRICT" size="small" sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, bgcolor: '#fef2f2', color: '#ef4444', borderRadius: '4px' }} />
                                                                          )}
                                                                      </Stack>
                                                                 </Box>
                                                                 
                                                                 {!isEditingThis && (
                                                                     <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" rowGap={1}>
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
                                                                         
                                                                         {/* Mode Specific Controls */}
                                                                         {isDraft ? (
                                                                            <Button 
                                                                                size="small" 
                                                                                variant="outlined"
                                                                                startIcon={<Delete fontSize="small" />}
                                                                                onClick={() => removeDraftService(idx)} 
                                                                                sx={{ borderRadius: 2, textTransform: 'none', fontWeight: 600, color: '#ef4444', borderColor: '#fecaca', '&:hover': { bgcolor: '#fef2f2', borderColor: '#fca5a5' } }}
                                                                            >
                                                                                Remove
                                                                            </Button>
                                                                         ) : (
                                                                            <>
                                                                                 {/* LIVE MODE Edit/Delete */}
                                                                                 {!isEditing && (
                                                                                     <>
                                                                                         <Button
                                                                                              size="small"
                                                                                              variant="outlined"
                                                                                              startIcon={<Edit fontSize="small" />}
                                                                                              onClick={() => handleStartEditServiceLive(svc)}
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
                                                                                     </>
                                                                                 )}
                                                                            </>
                                                                         )}
                                                                     </Stack>
                                                                 )}
                                                             </Box>

                                                             {/* Independent Edit Mode (LIVE Only) */}
                                                             {isEditingThis && !isDraft && (
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
                                                                        label={<Box><Typography variant="body2" sx={{ fontWeight: 600, color: '#0f172a' }}>Included (Free)</Typography></Box>}
                                                                    />
                                                                    <Divider orientation="vertical" flexItem variant="middle" />
                                                                    <TextField 
                                                                        label="Usage Limit" size="small" placeholder="Unlimited"
                                                                        value={serviceEditState.usage_limit ?? svc.usage_limit ?? ''}
                                                                        onChange={(e) => setServiceEditState(prev => ({ ...prev, usage_limit: e.target.value }))}
                                                                        sx={{ width: 140, bgcolor: 'white' }}
                                                                    />
                                                                    {!(serviceEditState.is_included ?? svc.is_included) && (
                                                                        <Stack direction="row" spacing={1}>
                                                                            <TextField 
                                                                                label="Discount ($)" size="small" placeholder="Amount"
                                                                                 value={!((serviceEditState.discount ?? svc.discount) || '').includes('%') ? (serviceEditState.discount ?? svc.discount) || '' : ''}
                                                                                 onChange={(e) => {
                                                                                     const val = e.target.value;
                                                                                     if (!/^\d*\.?\d*$/.test(val)) return;
                                                                                     setServiceEditState(prev => ({ ...prev, discount: val }));
                                                                                 }}
                                                                                disabled={((serviceEditState.discount ?? svc.discount) || '').includes('%')}
                                                                                InputProps={{ startAdornment: <InputAdornment position="start">$</InputAdornment> }}
                                                                                sx={{ width: 120, bgcolor: 'white' }}
                                                                            />
                                                                            <TextField 
                                                                                label="Discount (%)" size="small" placeholder="Percent"
                                                                                 value={((serviceEditState.discount ?? svc.discount) || '').includes('%') ? ((serviceEditState.discount ?? svc.discount) || '').replace('%', '') : ''}
                                                                                 onChange={(e) => {
                                                                                     const val = e.target.value;
                                                                                     if (!/^\d*\.?\d*$/.test(val)) return;
                                                                                     setServiceEditState(prev => ({ ...prev, discount: val ? `${val}%` : '' }));
                                                                                 }}
                                                                                disabled={!!(serviceEditState.discount ?? svc.discount) && !(serviceEditState.discount ?? svc.discount)?.includes('%')}
                                                                                InputProps={{ endAdornment: <InputAdornment position="end">%</InputAdornment> }}
                                                                                sx={{ width: 120, bgcolor: 'white' }}
                                                                            />
                                                                        </Stack>
                                                                    )}
                                                                    <Box sx={{ flex: 1 }} />
                                                                    <Stack direction="row" spacing={1}>
                                                                         <Button size="small" variant="contained" onClick={() => handleUpdateServiceLive(svc.membership_service_id!)}>Save</Button>
                                                                         <Button size="small" onClick={() => { setEditingServiceId(null); setServiceEditState({}); }}>Cancel</Button>
                                                                    </Stack>
                                                                 </Box>
                                                             )}

                                                             {/* DRAFT Mode Edit (Inline controls always visible for Draft?) 
                                                                 Actually for draft it's easier to keep the old style or just allowing delete.
                                                                 Let's keep it simple for draft: Delete only, or maybe rudimentary edit.
                                                                 The original implementation had inline editing for draft.
                                                                 Let's re-implement inline editing for DRAFT mode.
                                                             */}
                                                             {isDraft && (
                                                                <Box sx={{ mt: 2, p: 2, bgcolor: '#f8fafc', borderRadius: 2, display: 'flex', alignItems: 'center', gap: 3, flexWrap: 'wrap' }}>
                                                                     <FormControlLabel 
                                                                         control={
                                                                             <Checkbox 
                                                                                 checked={svc.is_included}
                                                                                 onChange={(e) => updateDraftService(idx, { is_included: e.target.checked, discount: e.target.checked ? '' : svc.discount })}
                                                                             />
                                                                         }
                                                                         label={<Typography variant="body2">Included</Typography>}
                                                                     />
                                                                      <Divider orientation="vertical" flexItem variant="middle" />
                                                                      <TextField 
                                                                         label="Limit" size="small" value={svc.usage_limit || ''}
                                                                         onChange={(e) => updateDraftService(idx, { usage_limit: e.target.value })}
                                                                         sx={{ width: 120, bgcolor: 'white' }}
                                                                      />
                                                                      {!svc.is_included && (
                                                                          <TextField 
                                                                              label="Discount" size="small" value={svc.discount || ''}
                                                                              onChange={(e) => updateDraftService(idx, { discount: e.target.value })}
                                                                              sx={{ width: 120, bgcolor: 'white' }}
                                                                          />
                                                                      )}
                                                                </Box>
                                                             )}
                                                         </Paper>
                                                     );
                                                 })
                                             }
                                             {(selectedCategoryId === 'new' ? draftServices : categoryServices).filter(s => s.is_active !== false).length === 0 && (
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
        <Dialog open={openCreateProgram} onClose={() => setOpenCreateProgram(false)} maxWidth="sm" fullWidth>
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

        {/* Add Service Dialog (replaced by Selector) */}
        <ServicePackSelector 
              open={openAddService}
              onClose={() => setOpenAddService(false)}
              onSelect={handleAddServiceSubmit}
              locationId={currentLocationId || ''}
        />

        <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
            <Alert severity="error">{error}</Alert>
        </Snackbar>
        <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
            <Alert severity="success">{success}</Alert>
        </Snackbar>


        {/* Duplicate Category Dialog */}
        <Dialog open={openDuplicateCategory} onClose={() => setOpenDuplicateCategory(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Duplicate Membership Category</DialogTitle>
            <DialogContent>
                 <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
                     {role && ['admin', 'superadmin'].includes(role.toLowerCase()) && (
                         <FormControl fullWidth>
                            <InputLabel>Target Location</InputLabel>
                            <Select
                                value={duplicateTargetLocationId || ''}
                                label="Target Location"
                                onChange={e => handleDuplicateLocationChange(e.target.value as string)}
                            >
                                {locations.map(loc => (
                                    <MenuItem key={loc.location_id} value={loc.location_id}>{loc.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                     )}

                    <FormControl fullWidth disabled={loadingTargetPrograms}>
                        <InputLabel>Target Membership Program</InputLabel>
                        <Select
                            value={duplicateTargetProgramId || ''}
                            label="Target Membership Program"
                            onChange={e => setDuplicateTargetProgramId(e.target.value)}
                        >
                            {targetPrograms.map(p => (
                                <MenuItem key={p.membership_program_id} value={p.membership_program_id}>{p.name}</MenuItem>
                            ))}
                            {targetPrograms.length === 0 && !loadingTargetPrograms && <MenuItem disabled>No Programs in this location</MenuItem>}
                        </Select>
                        {loadingTargetPrograms && <CircularProgress size={16} sx={{ position: 'absolute', right: 30, top: 'calc(50% - 8px)' }} />}
                    </FormControl>

                     <TextField 
                        label="New Category Name"
                        placeholder="e.g. Individual (Copy)"
                        fullWidth
                        value={duplicateCategoryForm.name || ''}
                        onChange={e => setDuplicateCategoryForm({...duplicateCategoryForm, name: e.target.value})}
                    />
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
                        This will copy the name, fees, and eligibility rules. Bundled services must be configured separately for the new category.
                    </Typography>
                 </Box>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => setOpenDuplicateCategory(false)}>Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleDuplicateCategorySubmit}
                    disabled={saving || !duplicateCategoryForm.name?.trim() || !duplicateTargetProgramId || loadingTargetPrograms}
                >
                    {saving ? <CircularProgress size={24} /> : "Duplicate"}
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
};
