import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  Alert,
  Snackbar,
  Grid,
  List,
  ListItemButton,
  ListItemText,
  Collapse,
  ListItemIcon,
  IconButton,
  Tooltip,
  TextField,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Accordion,
  AccordionSummary,
  AccordionDetails
} from '@mui/material';
import { 
    Save, 
    Assignment, 
    ExpandLess, 
    ExpandMore,
    Pool, 
    Face, 
    Loyalty, 
    CardMembership,
    Info,
    Visibility,
    Add
} from '@mui/icons-material';
import { 
    Dialog, 
    DialogTitle, 
    DialogContent, 
    DialogActions 
} from '@mui/material';
import { WaiverPreview } from '../../components/Waiver/WaiverPreview';
import ReactQuill from 'react-quill-new';
import 'react-quill-new/dist/quill.snow.css';
import { useConfig } from '../../context/ConfigContext';
import { useAuth } from '../../context/AuthContext';
import { serviceCatalog } from '../../services/serviceCatalog';
import { basePriceService } from '../../services/basePriceService';
import { membershipService } from '../../services/membershipService';
import { waiverService, GroupedWaiverTemplate, BatchUpsertWaiverPayload } from '../../services/waiverService';
import { PageHeader } from '../../components/Common/PageHeader';

// --- Types ---
interface TargetEntity {
  id: string;
  name: string;
}

const TEMPLATE_CATEGORIES = [
    { label: 'Services', value: 'SERVICE', icon: <Pool /> },
    { label: 'Memberships', value: 'MEMBERSHIP', icon: <CardMembership /> },
    { label: 'Base Plans', value: 'BASE_PLAN', icon: <Loyalty /> },
    { label: 'Age Profiles', value: 'AGE_PROFILE', icon: <Face /> },
];

export const WaiverTemplates = () => {
  const { currentLocationId } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();

  // --- Initial Data loading ---
  const [groupedTemplates, setGroupedTemplates] = useState<GroupedWaiverTemplate[]>([]);
  const [catalogs, setCatalogs] = useState<{
      services: TargetEntity[];
      memberships: TargetEntity[];
      basePrices: TargetEntity[];
  }>({ services: [], memberships: [], basePrices: [] });

  const [loadingInitial, setLoadingInitial] = useState(true);

  // --- UI State ---
  const [expandedCategory, setExpandedCategory] = useState<string | null>('SERVICE');
  
  // --- Form State ---
  const [selectedTemplate, setSelectedTemplate] = useState<GroupedWaiverTemplate | null>(null);
  const [isNewTemplate, setIsNewTemplate] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [templateCategory, setTemplateCategory] = useState('SERVICE');
  const [editorContent, setEditorContent] = useState('');
  const [assignments, setAssignments] = useState({
      service_ids: [] as string[],
      membership_category_ids: [] as string[],
      base_price_ids: [] as string[],
      ageprofile_ids: [] as string[],
      subterm_ids: [] as string[]
  });

  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- Dynamic Variables Extraction ---
  const dynamicVariables = useMemo(() => {
    const regex = /\[(.*?)\]/g;
    const matches = editorContent.matchAll(regex);
    const vars = new Set<string>();
    for (const match of matches) {
      if (match[1] && !['FullName', 'GuardianName', 'AcceptSignature', 'CurrentDate'].includes(match[1])) {
        vars.add(match[1]);
      }
    }
    return Array.from(vars);
  }, [editorContent]);


  // --- Fetch Data ---
  useEffect(() => {
    if (!currentLocationId) return;

    const fetchAllData = async () => {
        setLoadingInitial(true);
        try {
            // Fetch Templates
            let templatesData: GroupedWaiverTemplate[] = [];
            try {
                // If endpoint throws because it doesn't exist yet we handle it gracefully, but assuming backend is ready
                const res = await waiverService.getGroupedWaiverTemplates(currentLocationId);
                // Type handling if backend wraps it
                templatesData = Array.isArray(res) ? res : ((res as any).data || []);
            } catch (err) {
                console.error("Failed to load grouped templates", err);
            }

            // Fetch Catalogs
            let svcs: TargetEntity[] = [];
            let mems: TargetEntity[] = [];
            let bps: TargetEntity[] = [];

            try {
                const svcsRes = await serviceCatalog.getServices(currentLocationId);
                const s = Array.isArray(svcsRes) ? svcsRes : (svcsRes.data || svcsRes.services || []);
                svcs = s.map((item: any) => ({ id: item.service_id || item.id, name: item.name }));
            } catch (e) { console.warn('Services fetch err', e); }

            try {
                const bpsRes = await basePriceService.getAll(currentLocationId);
                let prices = Array.isArray(bpsRes) ? bpsRes : (bpsRes.prices || []);
                const uniqueMap = new Map();
                prices.forEach((p: any) => {
                    const key = `${p.name} (${p.role})`; 
                    if(!uniqueMap.has(key)) uniqueMap.set(key, p);
                });
                bps = Array.from(uniqueMap.values()).map((p: any) => ({ 
                    id: p.base_price_id!, 
                    name: `${p.name} - ${p.role} (${p.age_group_name || 'Group'})` 
                }));
            } catch (e) { console.warn('Base prices fetch err', e); }

            try {
                const progsRes: any = await membershipService.getMemberships(currentLocationId);
                let progs = Array.isArray(progsRes) ? progsRes : (progsRes.memberships || progsRes.data || []);
                mems = progs.flatMap((p: any) => (p.categories || []).map((c: any) => ({
                    id: c.category_id!,
                    name: `${p.name} - ${c.name}`
                })));
            } catch (e) { console.warn('Memberships fetch err', e); }

            setGroupedTemplates(templatesData);
            setCatalogs({ services: svcs, memberships: mems, basePrices: bps });
            setLoadingInitial(false);

        } catch (err) {
            console.error(err);
            setLoadingInitial(false);
        }
    };
    fetchAllData();
  }, [currentLocationId]);


  // --- Selection Handlers ---
  const handleAddNew = () => {
      setSelectedTemplate(null);
      setIsNewTemplate(true);
      setTemplateName('');
      setTemplateCategory('SERVICE');
      setEditorContent('');
      setAssignments({
          service_ids: [],
          membership_category_ids: [],
          base_price_ids: [],
          ageprofile_ids: [],
          subterm_ids: []
      });
  };

  const handleSelectTemplate = (template: GroupedWaiverTemplate) => {
      setSelectedTemplate(template);
      setIsNewTemplate(false);
      setTemplateName(template.template_name || '');
      setTemplateCategory(template.template_category || 'SERVICE');
      setEditorContent(template.content || '');
      setAssignments({
          service_ids: template.assignments?.service_ids || [],
          membership_category_ids: template.assignments?.membership_category_ids || [],
          base_price_ids: template.assignments?.base_price_ids || [],
          ageprofile_ids: template.assignments?.ageprofile_ids || [],
          subterm_ids: template.assignments?.subterm_ids || []
      });
  };

  const handleToggleAssignment = (type: keyof typeof assignments, id: string) => {
      setAssignments(prev => {
          const arr = prev[type];
          if (arr.includes(id)) {
              return { ...prev, [type]: arr.filter(itemId => itemId !== id) };
          } else {
              return { ...prev, [type]: [...arr, id] };
          }
      });
  };

  // --- Save ---
  const handleSave = async () => {
      if (!templateName.trim()) {
          setFeedback({ type: 'error', message: 'Template name is required.' });
          return;
      }
      if (!currentLocationId) return;
      
      setIsSaving(true);
      try {
          const payload: BatchUpsertWaiverPayload = {
              template_name: templateName.trim(),
              template_category: templateCategory,
              content: editorContent,
              location_id: currentLocationId,
              assignments
          };

          await waiverService.batchUpsertWaiverTemplate(payload);
          setFeedback({ type: 'success', message: 'Waiver template saved successfully.' });

          // Refresh the list
          const res = await waiverService.getGroupedWaiverTemplates(currentLocationId);
          const templatesData = Array.isArray(res) ? res : ((res as any).data || []);
          setGroupedTemplates(templatesData);
          
          if (isNewTemplate) {
              setIsNewTemplate(false);
              const newlySaved = templatesData.find((t: GroupedWaiverTemplate) => t.template_name === payload.template_name);
              if (newlySaved) setSelectedTemplate(newlySaved);
          }

      } catch (err) {
          console.error(err);
          setFeedback({ type: 'error', message: 'Failed to save template.' });
      } finally {
          setIsSaving(false);
      }
  };


  // --- Render Helpers ---
  const templatesByCategory = useMemo(() => {
      const grouped: Record<string, GroupedWaiverTemplate[]> = {};
      TEMPLATE_CATEGORIES.forEach(c => grouped[c.value] = []);
      groupedTemplates.forEach(t => {
          // Fallback missing categories to SERVICE
          const cat = t.template_category || 'SERVICE';
          if (!grouped[cat]) grouped[cat] = [];
          grouped[cat].push(t);
      });
      return grouped;
  }, [groupedTemplates]);

  if (loadingInitial) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
              <CircularProgress />
          </Box>
      );
  }

  return (
    <Box sx={{ pb: 5 }}>
        <PageHeader 
            title="Waiver & Contract Templates" 
            description="Manage and assign legal documents across services, memberships, and plans."
            breadcrumbs={[
                { label: 'Settings', href: '/admin/settings' },
                { label: 'Waiver Templates', active: true }
            ]}
        />
        
        <Grid container spacing={3}>
            {/* Left Column: List of Templates */}
            <Grid size={{ xs: 12, md: 3 }}>
                <Paper sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#fff', display: 'flex', flexDirection: 'column' }} elevation={0}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                         <Typography variant="overline" fontWeight={800} sx={{ color: '#64748b !important' }}>
                             TEMPLATES PORTAL
                         </Typography>
                         <Tooltip title="Add New Template">
                             <IconButton size="small" onClick={handleAddNew} sx={{ bgcolor: '#eff6ff', color: '#3b82f6', '&:hover': { bgcolor: '#dbeafe' } }}>
                                 <Add fontSize="small" />
                             </IconButton>
                         </Tooltip>
                    </Box>
                    <List component="nav" sx={{ p: 0, flex: 1, overflowY: 'auto' }}>
                        {TEMPLATE_CATEGORIES.map((cat) => {
                            const isExpanded = expandedCategory === cat.value;
                            const items = templatesByCategory[cat.value] || [];

                            return (
                                <Box key={cat.value} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <ListItemButton onClick={() => setExpandedCategory(isExpanded ? null : cat.value)} sx={{ py: 2 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: isExpanded ? '#3b82f6 !important' : '#64748b !important' }}>
                                            {cat.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={cat.label} 
                                            secondary={`${items.length} Template${items.length === 1 ? '' : 's'}`}
                                            primaryTypographyProps={{ 
                                                fontWeight: 800, 
                                                sx: { color: isExpanded ? '#3b82f6 !important' : '#1e293b !important' }
                                            }}
                                            secondaryTypographyProps={{ sx: { fontSize: '0.7rem' } }}
                                        />
                                        {isExpanded ? <ExpandLess sx={{ color: '#64748b !important' }} /> : <ExpandMore sx={{ color: '#64748b !important' }} />}
                                    </ListItemButton>
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding sx={{ bgcolor: '#f8fafc' }}>
                                            {items.length === 0 && (
                                                <Typography variant="caption" sx={{ p: 2, display: 'block', textAlign: 'center', color: '#94a3b8 !important' }}>
                                                    No templates found
                                                </Typography>
                                            )}
                                            {items.map((item) => {
                                                const isSelected = selectedTemplate?.template_name === item.template_name && !isNewTemplate;
                                                return (
                                                    <ListItemButton 
                                                        key={item.template_name} 
                                                        sx={{ pl: 4, bgcolor: isSelected ? '#eff6ff' : 'transparent', borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent' }}
                                                        onClick={() => handleSelectTemplate(item)}
                                                    >
                                                        <ListItemText 
                                                            primary={item.template_name || 'Unnamed Template'} 
                                                            primaryTypographyProps={{ 
                                                                variant: 'body2', 
                                                                fontWeight: isSelected ? 700 : 500,
                                                                sx: { color: isSelected ? '#0f172a !important' : '#475569 !important' }
                                                            }}
                                                        />
                                                    </ListItemButton>
                                                );
                                            })}
                                        </List>
                                    </Collapse>
                                </Box>
                            );
                        })}
                    </List>
                </Paper>
            </Grid>

            {/* Right Column: Editor */}
            <Grid size={{ xs: 12, md: 9 }}>
                {selectedTemplate || isNewTemplate ? (
                    <Paper sx={{ p: 0, borderRadius: 2, border: '1px solid #e2e8f0', minHeight: 600, display: 'flex', flexDirection: 'column' }} elevation={0}>
                        {/* Editor Header */}
                        <Box sx={{ 
                            p: 3, 
                            borderBottom: '1px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ flex: 1, display: 'flex', gap: 2 }}>
                                    <TextField
                                        label="Template Variable Name"
                                        size="small"
                                        value={templateName}
                                        onChange={(e) => setTemplateName(e.target.value)}
                                        disabled={!isNewTemplate} // Restrict editing existing template names to avoid splitting groups accidentally
                                        sx={{ bgcolor: '#fff', width: 300 }}
                                        required
                                        helperText={!isNewTemplate ? 'Cannot rename existing template identifiers.' : ''}
                                    />
                                    <FormControl size="small" sx={{ width: 200, bgcolor: '#fff' }}>
                                        <InputLabel>Category</InputLabel>
                                        <Select
                                            value={templateCategory}
                                            label="Category"
                                            onChange={(e) => setTemplateCategory(e.target.value)}
                                        >
                                            {TEMPLATE_CATEGORIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
                                        </Select>
                                    </FormControl>
                                </Box>
                                
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, ml: 3 }}>
                                    <Tooltip title="Use dynamic variables to insert participant's name, guardian name, and current date dynamically.">
                                        <IconButton 
                                            size="small" 
                                            sx={{ 
                                                bgcolor: '#fff', 
                                                color: '#64748b',
                                                border: '1px solid #e2e8f0',
                                                '&:hover': { bgcolor: '#f1f5f9', borderColor: '#cbd5e1' }
                                            }}
                                        >
                                            <Info />
                                        </IconButton>
                                    </Tooltip>
                                    <Button 
                                        variant="outlined" 
                                        startIcon={<Visibility />} 
                                        onClick={() => setIsPreviewOpen(true)}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 700, 
                                            borderRadius: 2,
                                            borderColor: '#e2e8f0',
                                            color: '#64748b',
                                            px: 3,
                                            '&:hover': { 
                                                bgcolor: '#f1f5f9',
                                                borderColor: '#cbd5e1'
                                            }
                                        }}
                                    >
                                        Preview
                                    </Button>
                                    <Button 
                                        variant="contained" 
                                        startIcon={<Save />} 
                                        onClick={handleSave}
                                        disabled={isSaving}
                                        sx={{ 
                                            textTransform: 'none', 
                                            fontWeight: 700, 
                                            borderRadius: 2,
                                            bgcolor: '#0f172a',
                                            color: '#fff',
                                            px: 3,
                                            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                            '&:hover': { 
                                                bgcolor: '#1e293b',
                                                boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                                            },
                                            '&:disabled': {
                                                bgcolor: '#cbd5e1',
                                                color: '#94a3b8'
                                            }
                                        }}
                                    >
                                        {isSaving ? 'Saving...' : 'Save Template'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                        {/* Instructions Banner */}
                        <Alert severity="info" icon={<Info fontSize="inherit" />} sx={{ mx: 3, mt: 3, mb: 1, borderRadius: 2 }}>
                            <Box>
                                <Typography variant="caption" fontWeight={600} sx={{ color: '#1e293b !important', display: 'block', mb: 0.5 }}>
                                    Standard Variables: Use <code>[FullName]</code>, <code>[GuardianName]</code>, <code>[AcceptSignature]</code>, <code>[CurrentDate]</code>.
                                </Typography>
                                {dynamicVariables.length > 0 && (
                                    <Typography variant="caption" fontWeight={600} sx={{ color: '#3b82f6 !important' }}>
                                        Detected Variables in Document: {dynamicVariables.map((v, i) => (
                                            <code key={i} style={{ marginLeft: i === 0 ? 0 : '4px' }}>[{v}]</code>
                                        ))}
                                    </Typography>
                                )}
                            </Box>
                        </Alert>

                        {/* Editor Area */}
                        <Box sx={{ flex: 1, p: 3, bgcolor: '#fff', borderBottom: '1px solid #e2e8f0' }}>
                            <Box sx={{ 
                                height: 350, 
                                '& .quill': { height: 'calc(100% - 42px)', display: 'flex', flexDirection: 'column' },
                                '& .ql-container': { flex: 1, fontSize: '1rem', fontFamily: 'inherit', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                                '& .ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8, bgcolor: '#f8fafc' },
                                '& .ql-editor': { minHeight: 300 }
                            }}>
                                <ReactQuill 
                                    theme="snow"
                                    value={editorContent}
                                    onChange={setEditorContent}
                                    modules={{
                                        toolbar: [
                                            [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
                                            ['bold', 'italic', 'underline', 'strike', 'blockquote'],
                                            [{ 'color': [] }, { 'background': [] }],
                                            [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                            [{ 'script': 'sub'}, { 'script': 'super' }],
                                            [{ 'indent': '-1'}, { 'indent': '+1' }],
                                            [{ 'direction': 'rtl' }, { 'align': [] }],
                                            ['link', 'image', 'clean']
                                        ]
                                    }}
                                />
                            </Box>
                        </Box>

                        {/* Assignments Section */}
                        <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 }}>
                            <Typography variant="overline" fontWeight={800} sx={{ color: '#64748b !important', display: 'block', mb: 2 }}>
                                ASSIGN TO TARGETS
                            </Typography>
                            
                            <Grid container spacing={2}>
                                {/* Services */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Accordion elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography fontWeight={700}>Services ({assignments.service_ids.length})</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
                                            {catalogs.services.map(s => (
                                                <FormControlLabel 
                                                    key={s.id} 
                                                    control={<Checkbox size="small" checked={assignments.service_ids.includes(s.id)} onChange={() => handleToggleAssignment('service_ids', s.id)} />} 
                                                    label={<Typography variant="body2">{s.name}</Typography>} 
                                                    sx={{ display: 'flex', m: 0 }}
                                                />
                                            ))}
                                            {catalogs.services.length === 0 && <Typography variant="caption" color="textSecondary">No services available</Typography>}
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>

                                {/* Memberships */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Accordion elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography fontWeight={700}>Memberships ({assignments.membership_category_ids.length})</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
                                            {catalogs.memberships.map(m => (
                                                <FormControlLabel 
                                                    key={m.id} 
                                                    control={<Checkbox size="small" checked={assignments.membership_category_ids.includes(m.id)} onChange={() => handleToggleAssignment('membership_category_ids', m.id)} />} 
                                                    label={<Typography variant="body2">{m.name}</Typography>} 
                                                    sx={{ display: 'flex', m: 0 }}
                                                />
                                            ))}
                                            {catalogs.memberships.length === 0 && <Typography variant="caption" color="textSecondary">No memberships available</Typography>}
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>

                                {/* Base Plans */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Accordion elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography fontWeight={700}>Base Plans ({assignments.base_price_ids.length})</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
                                            {catalogs.basePrices.map(b => (
                                                <FormControlLabel 
                                                    key={b.id} 
                                                    control={<Checkbox size="small" checked={assignments.base_price_ids.includes(b.id)} onChange={() => handleToggleAssignment('base_price_ids', b.id)} />} 
                                                    label={<Typography variant="body2">{b.name}</Typography>} 
                                                    sx={{ display: 'flex', m: 0 }}
                                                />
                                            ))}
                                            {catalogs.basePrices.length === 0 && <Typography variant="caption" color="textSecondary">No base plans available</Typography>}
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>

                                {/* Age Profiles */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Accordion elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography fontWeight={700}>Age Profiles ({assignments.ageprofile_ids.length})</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
                                            {(ageGroups || []).map(a => (
                                                <FormControlLabel 
                                                    key={a.age_group_id} 
                                                    control={<Checkbox size="small" checked={assignments.ageprofile_ids.includes(a.age_group_id)} onChange={() => handleToggleAssignment('ageprofile_ids', a.age_group_id)} />} 
                                                    label={<Typography variant="body2">{a.name}</Typography>} 
                                                    sx={{ display: 'flex', m: 0 }}
                                                />
                                            ))}
                                            {(!ageGroups || ageGroups.length === 0) && <Typography variant="caption" color="textSecondary">No age profiles available</Typography>}
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>

                                {/* Terms / Policies */}
                                <Grid size={{ xs: 12, md: 6 }}>
                                    <Accordion elevation={0} sx={{ border: '1px solid #e2e8f0' }}>
                                        <AccordionSummary expandIcon={<ExpandMore />}>
                                            <Typography fontWeight={700}>Term Policies ({assignments.subterm_ids.length})</Typography>
                                        </AccordionSummary>
                                        <AccordionDetails sx={{ maxHeight: 200, overflowY: 'auto', p: 1 }}>
                                            {(subscriptionTerms || []).map(t => (
                                                <FormControlLabel 
                                                    key={t.subscription_term_id} 
                                                    control={<Checkbox size="small" checked={assignments.subterm_ids.includes(t.subscription_term_id)} onChange={() => handleToggleAssignment('subterm_ids', t.subscription_term_id)} />} 
                                                    label={<Typography variant="body2">{t.name}</Typography>} 
                                                    sx={{ display: 'flex', m: 0 }}
                                                />
                                            ))}
                                            {(!subscriptionTerms || subscriptionTerms.length === 0) && <Typography variant="caption" color="textSecondary">No terms available</Typography>}
                                        </AccordionDetails>
                                    </Accordion>
                                </Grid>
                            </Grid>
                        </Box>

                    </Paper>
                ) : (
                    <Paper 
                        sx={{ 
                            p: 6, 
                            borderRadius: 2, 
                            border: '1px dashed #e2e8f0', 
                            height: '100%', 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: '#f8fafc'
                        }} 
                        elevation={0}
                    >
                        <Assignment sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
                        <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 700 }}>
                            Select or Create a Template
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 400, textAlign: 'center', mt: 1 }}>
                            Click on a template from the left portal to manage its content and target assignments, or click the + icon to make a new one.
                        </Typography>
                    </Paper>
                )}
            </Grid>
        </Grid>

        <Snackbar 
            open={!!feedback} 
            autoHideDuration={6000} 
            onClose={() => setFeedback(null)}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        >
            <Alert severity={feedback?.type || 'info'} onClose={() => setFeedback(null)} sx={{ fontWeight: 600 }}>
                {feedback?.message}
            </Alert>
        </Snackbar>

        <Dialog 
            open={isPreviewOpen} 
            onClose={() => setIsPreviewOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3 }
            }}
        >
            <DialogTitle sx={{ 
                bgcolor: '#f8fafc', 
                borderBottom: '1px solid #e2e8f0',
                display: 'flex',
                alignItems: 'center',
                gap: 1
            }}>
                <Visibility sx={{ color: '#64748b' }} />
                <Typography variant="h6" fontWeight={800}>Template Preview</Typography>
            </DialogTitle>
            <DialogContent sx={{ p: 4, mt: 2 }}>
                <Typography variant="caption" sx={{ color: '#94a3b8', mb: 3, display: 'block' }}>
                    This is a preview of how the waiver will appear to users. Dynamic variables have been replaced with sample data.
                </Typography>
                <WaiverPreview 
                    content={editorContent}
                    data={{
                        first_name: 'John',
                        last_name: 'Doe',
                        guardian_name: 'Jane Doe'
                    }}
                    agreed={false}
                    onAgreeChange={() => {}}
                    signatureComponent={
                        <Box sx={{ 
                            height: 100, 
                            display: 'flex', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            bgcolor: '#f8fafc',
                            border: '1px dashed #cbd5e1',
                            borderRadius: 1,
                            color: '#94a3b8'
                        }}>
                            Signature Pad Placeholder
                        </Box>
                    }
                />
            </DialogContent>
            <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
                <Button 
                    onClick={() => setIsPreviewOpen(false)}
                    variant="contained"
                    sx={{ 
                        bgcolor: '#0f172a', 
                        fontWeight: 700, 
                        borderRadius: 2,
                        textTransform: 'none',
                        px: 4
                    }}
                >
                    Close Preview
                </Button>
            </DialogActions>
        </Dialog>
    </Box>
  );
};
