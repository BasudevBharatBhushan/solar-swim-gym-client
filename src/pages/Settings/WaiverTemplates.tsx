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
  Tooltip
} from '@mui/material';
import { 
    Save, 
    Assignment, 
    Edit, 
    ExpandLess, 
    ExpandMore,
    Pool, 
    Face, 
    Gavel, 
    Loyalty, 
    CardMembership,
    Info,
    Visibility
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
import { PageHeader } from '../../components/Common/PageHeader';
import { apiClient } from '../../services/apiClient';

// --- Types ---
interface WaiverTemplate {
  waiver_template_id?: string;
  content: string;
  is_active: boolean;
  ageprofile_id?: string;
  subterm_id?: string;
  service_id?: string;
  base_price_id?: string;
  membership_category_id?: string;
}

interface TargetEntity {
  id: string;
  name: string;
}

export const WaiverTemplates = () => {
  const { currentLocationId } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();

  // --- State ---
  // Store targets per category to avoid re-fetching constantly
  const [categoryData, setCategoryData] = useState<Record<string, TargetEntity[]>>({});
  const [expandedCategory, setExpandedCategory] = useState<string | null>('service'); // Default open first
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string>(''); // To know which cat the selected target belongs to
  const [selectedTargetId, setSelectedTargetId] = useState<string>('');
  
  const [template, setTemplate] = useState<WaiverTemplate | null>(null);
  const [editorContent, setEditorContent] = useState('');
  
  const [loadingCategory, setLoadingCategory] = useState<string | null>(null);
  const [loadingTemplate, setLoadingTemplate] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error', message: string } | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);

  // --- Categories ---
  const categories = useMemo(() => [
    { label: 'Services', key: 'service', icon: <Pool /> },
    { label: 'Age Profiles', key: 'ageprofile', icon: <Face /> },
    { label: 'Term Policies', key: 'subterm', icon: <Gavel /> },
    { label: 'Base Plans', key: 'base_price', icon: <Loyalty /> },
    { label: 'Memberships', key: 'membership_category', icon: <CardMembership /> }
  ], []);

  // --- Data Fetching Helper ---
  const fetchCategoryData = async (catKey: string) => {
      if (!currentLocationId) return;
      if (categoryData[catKey]) return; // Already loaded

      setLoadingCategory(catKey);
      try {
        let data: TargetEntity[] = [];
        switch (catKey) {
          case 'ageprofile':
            data = (ageGroups || []).map(g => ({ id: g.age_group_id, name: g.name }));
            break;
          case 'subterm':
            data = (subscriptionTerms || []).map(t => ({ id: t.subscription_term_id, name: t.name }));
            break;
          case 'service':
            try {
                const svcsResponse = await serviceCatalog.getServices(currentLocationId);
                const svcs = Array.isArray(svcsResponse) ? svcsResponse : (svcsResponse.data || svcsResponse.services || []);
                data = svcs.map((s: any) => ({ id: s.service_id || s.id, name: s.name }));
            } catch (e) {
                console.warn("Failed to fetch", e);
            }
            break;
          case 'base_price':
            try {
                const bpsResponse = await basePriceService.getAll(currentLocationId);
                let prices: any[] = [];
                if (bpsResponse && Array.isArray(bpsResponse.prices)) prices = bpsResponse.prices;
                else if (Array.isArray(bpsResponse)) prices = bpsResponse;

                const uniqueMap = new Map();
                prices.forEach((p: any) => {
                    const key = `${p.name} (${p.role})`; 
                    if(!uniqueMap.has(key)) uniqueMap.set(key, p);
                });
                
                data = Array.from(uniqueMap.values()).map((p: any) => ({ 
                    id: p.base_price_id!, 
                    name: `${p.name} - ${p.role} (${p.age_group_name || 'Group'})` 
                }));
            } catch (e) {
                console.warn("Failed to fetch", e);
            }
            break;
          case 'membership_category':
            try {
                const progsResponse = await membershipService.getMemberships(currentLocationId);
                let progs: any[] = [];
                if (Array.isArray(progsResponse)) progs = progsResponse;
                else if (progsResponse && Array.isArray((progsResponse as any).memberships)) progs = (progsResponse as any).memberships;
                else if (progsResponse && Array.isArray((progsResponse as any).data)) progs = (progsResponse as any).data;

                data = progs.flatMap(p => (p.categories || []).map((c: any) => ({
                    id: c.category_id!,
                    name: `${p.name} - ${c.name}`
                })));
            } catch (e) {
                 console.warn("Failed to fetch", e);
            }
            break;
        }
        setCategoryData(prev => ({ ...prev, [catKey]: data }));
      } catch (err) {
          console.error(err);
      } finally {
          setLoadingCategory(null);
      }
  };

  // --- Handlers ---
  const handleToggleCategory = (catKey: string) => {
      if (expandedCategory === catKey) {
          setExpandedCategory(null);
      } else {
          setExpandedCategory(catKey);
          fetchCategoryData(catKey);
      }
  };

  const handleSelectTarget = (catKey: string, targetId: string) => {
      setSelectedCategoryKey(catKey);
      setSelectedTargetId(targetId);
  };

  // --- Initial Load ---
  useEffect(() => {
      // Load initial category if set
      if (expandedCategory && !categoryData[expandedCategory]) {
          fetchCategoryData(expandedCategory);
      }
  }, [currentLocationId, expandedCategory]); // eslint-disable-line

  // --- Fetch Template ---
  useEffect(() => {
    if (!selectedTargetId || !currentLocationId || !selectedCategoryKey) return;

    const fetchTemplate = async () => {
      setLoadingTemplate(true);
      try {
        const res = await apiClient.get('/waiver-templates');
        const AllTemplates = res.data || res;
        
        const targetField = `${selectedCategoryKey}_id`;
        const found = Array.isArray(AllTemplates) ? AllTemplates.find((t: any) => t[targetField] === selectedTargetId) : null;
        
        if (found) {
            setTemplate(found);
            setEditorContent(found.content || '');
        } else {
            setTemplate({ is_active: true, content: '' }); 
            setEditorContent('');
        }

      } catch (err) {
        console.error(err);
        setFeedback({ type: 'error', message: 'Failed to load template.' });
      } finally {
        setLoadingTemplate(false);
      }
    };

    fetchTemplate();
  }, [selectedTargetId, selectedCategoryKey, currentLocationId]);


  // --- Save ---
  const handleSave = async () => {
      if (!selectedTargetId || !currentLocationId || !selectedCategoryKey) return;
      
      setIsSaving(true);
      try {
          const targetField = `${selectedCategoryKey}_id`;
          
          const payload = {
              waiver_template_id: template?.waiver_template_id,
              content: editorContent,
              is_active: true,
              [targetField]: selectedTargetId,
              location_id: currentLocationId
          };

          await apiClient.post('/waiver-templates/upsert', payload, { headers: { 'x-location-id': currentLocationId } });
          setFeedback({ type: 'success', message: 'Waiver template saved successfully.' });
      } catch (err) {
          console.error(err);
          setFeedback({ type: 'error', message: 'Failed to save template.' });
      } finally {
          setIsSaving(false);
      }
  };

  return (
    <Box sx={{ pb: 5 }}>
        <PageHeader 
            title="Waiver Templates" 
            description="Manage legal waivers and disclaimers for services, memberships, and plans."
            breadcrumbs={[
                { label: 'Settings', href: '/admin/settings' },
                { label: 'Waiver Templates', active: true }
            ]}
        />
        
        <Grid container spacing={3}>
            {/* Left Column: Collapsible Navigation */}
            <Grid size={{ xs: 12, md: 3 }}>
                <Paper sx={{ height: '100%', borderRadius: 2, overflow: 'hidden', border: '1px solid #e2e8f0', bgcolor: '#fff' }} elevation={0}>
                    <Box sx={{ p: 2, borderBottom: '1px solid #f1f5f9', bgcolor: '#f8fafc' }}>
                         <Typography variant="overline" fontWeight={800} sx={{ color: '#64748b !important' }}>
                             CATEGORIES
                         </Typography>
                    </Box>
                    <List component="nav" sx={{ p: 0 }}>
                        {categories.map((cat) => {
                            const isExpanded = expandedCategory === cat.key;
                            const isLoading = loadingCategory === cat.key;
                            const items = categoryData[cat.key] || [];

                            return (
                                <Box key={cat.key} sx={{ borderBottom: '1px solid #f1f5f9' }}>
                                    <ListItemButton onClick={() => handleToggleCategory(cat.key)} sx={{ py: 2 }}>
                                        <ListItemIcon sx={{ minWidth: 40, color: isExpanded ? '#3b82f6 !important' : '#64748b !important' }}>
                                            {cat.icon}
                                        </ListItemIcon>
                                        <ListItemText 
                                            primary={cat.label} 
                                            primaryTypographyProps={{ 
                                                fontWeight: 800, 
                                                sx: { color: isExpanded ? '#3b82f6 !important' : '#1e293b !important' }
                                            }}
                                        />
                                        {isLoading ? <CircularProgress size={20} /> : (isExpanded ? <ExpandLess sx={{ color: '#64748b !important' }} /> : <ExpandMore sx={{ color: '#64748b !important' }} />)}
                                    </ListItemButton>
                                    <Collapse in={isExpanded} timeout="auto" unmountOnExit>
                                        <List component="div" disablePadding sx={{ bgcolor: '#f8fafc' }}>
                                            {!isLoading && items.length === 0 && (
                                                <Typography variant="caption" sx={{ p: 2, display: 'block', textAlign: 'center', color: '#94a3b8 !important' }}>
                                                    No items found
                                                </Typography>
                                            )}
                                            {items.map((item) => {
                                                const isSelected = selectedTargetId === item.id && selectedCategoryKey === cat.key;
                                                return (
                                                    <ListItemButton 
                                                        key={item.id} 
                                                        sx={{ pl: 4, bgcolor: isSelected ? '#eff6ff' : 'transparent', borderLeft: isSelected ? '3px solid #3b82f6' : '3px solid transparent' }}
                                                        onClick={() => handleSelectTarget(cat.key, item.id)}
                                                    >
                                                        <ListItemText 
                                                            primary={item.name} 
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
                {selectedTargetId ? (
                    <Paper sx={{ p: 0, borderRadius: 2, border: '1px solid #e2e8f0', minHeight: 600, display: 'flex', flexDirection: 'column' }} elevation={0}>
                        {/* Enhanced Toolbar / Header */}
                        <Box sx={{ 
                            p: 3, 
                            borderBottom: '1px solid #e2e8f0',
                            bgcolor: '#f8fafc',
                            borderTopLeftRadius: 8,
                            borderTopRightRadius: 8
                        }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                <Box sx={{ flex: 1 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                        <Assignment sx={{ fontSize: 20, color: '#64748b' }} />
                                        <Typography variant="overline" sx={{ 
                                            fontSize: '0.7rem', 
                                            fontWeight: 700, 
                                            letterSpacing: '0.1em',
                                            color: '#64748b !important'
                                        }}>
                                            WAIVER TEMPLATE EDITOR
                                        </Typography>
                                    </Box>
                                    <Typography variant="h5" sx={{ 
                                        fontWeight: 800, 
                                        mb: 2,
                                        color: '#0f172a !important'
                                    }}>
                                        {categories.find(c => c.key === selectedCategoryKey)?.label || 'Template'}
                                    </Typography>
                                    
                                    {/* Target Details Card */}
                                    <Paper sx={{ 
                                        bgcolor: '#fff', 
                                        border: '1px solid #e2e8f0',
                                        p: 2,
                                        borderRadius: 2,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.05)'
                                    }} elevation={0}>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                                            <Box>
                                                <Typography variant="caption" sx={{ 
                                                    color: '#64748b !important', 
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    Category
                                                </Typography>
                                                <Typography variant="body2" sx={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b !important' }}>
                                                    {categories.find(c => c.key === selectedCategoryKey)?.label}
                                                </Typography>
                                            </Box>
                                            <Box sx={{ 
                                                width: '1px', 
                                                height: '32px', 
                                                bgcolor: '#e2e8f0' 
                                            }} />
                                            <Box sx={{ flex: 1 }}>
                                                <Typography variant="caption" sx={{ 
                                                    color: '#64748b !important', 
                                                    fontSize: '0.65rem',
                                                    fontWeight: 600,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em'
                                                }}>
                                                    Target
                                                </Typography>
                                                <Typography variant="body1" sx={{ 
                                                    fontWeight: 800, 
                                                    fontSize: '1.1rem',
                                                    color: '#0f172a !important'
                                                }}>
                                                    {categoryData[selectedCategoryKey]?.find(t => t.id === selectedTargetId)?.name || 'Unknown'}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </Paper>
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
                                        disabled={isSaving || loadingTemplate}
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
                                        {isSaving ? 'Saving...' : 'Save Changes'}
                                    </Button>
                                </Box>
                            </Box>
                        </Box>

                         {/* Instructions Banner */}
                         <Alert severity="info" icon={<Info fontSize="inherit" />} sx={{ mx: 3, mt: 3, mb: 1, borderRadius: 2 }}>
                            <Typography variant="caption" fontWeight={600} sx={{ color: '#1e293b !important' }}>
                                 Dynamic Variables: Use <code>[FullName]</code>, <code>[GuardianName]</code> to insert the participant's name. Use <code>[AcceptSignature]</code> to accept signature. Use <code>[CurrentDate]</code> for current date.
                            </Typography>
                        </Alert>

                        {/* Editor Area */}
                        <Box sx={{ flex: 1, p: 3, bgcolor: '#fff' }}>
                            {loadingTemplate ? (
                                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 400 }}>
                                    <CircularProgress />
                                </Box>
                            ) : (
                                <Box sx={{ 
                                    height: '100%', 
                                    '& .quill': { height: 'calc(100% - 42px)', display: 'flex', flexDirection: 'column' },
                                    '& .ql-container': { flex: 1, fontSize: '1rem', fontFamily: 'inherit', borderBottomLeftRadius: 8, borderBottomRightRadius: 8 },
                                    '& .ql-toolbar': { borderTopLeftRadius: 8, borderTopRightRadius: 8, bgcolor: '#f8fafc' },
                                    '& .ql-editor': { minHeight: 400 }
                                }}>
                                    <ReactQuill 
                                        theme="snow"
                                        value={editorContent}
                                        onChange={setEditorContent}
                                        modules={{
                                            toolbar: [
                                                [{ 'header': [1, 2, 3, false] }],
                                                ['bold', 'italic', 'underline', 'strike'],
                                                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                                                ['link', 'clean']
                                            ]
                                        }}
                                    />
                                </Box>
                            )}
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
                            Select a target to edit waiver
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#94a3b8', maxWidth: 400, textAlign: 'center', mt: 1 }}>
                            Expand a category on the left and select an item to configure its waiver template.
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#94a3b8', mt: 2, bgcolor: '#e2e8f0', px: 1, py: 0.5, borderRadius: 1 }}>
                            Pro Tip: You can drag and drop images into the editor.
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
