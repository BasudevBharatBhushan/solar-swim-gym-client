
import { useState, useEffect, useRef } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Grid,
  TextField,
  Chip,
  IconButton,
  InputAdornment,
  Checkbox,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Switch,
  Stack,
  Tabs,
  Tab,
  Alert,
  Snackbar,
  MenuItem,
  Select,
  FormControl,
  FormControlLabel,
  FormGroup,
  FormHelperText,
  Drawer,
  Tooltip,
  Avatar,
  CircularProgress
} from '@mui/material';
import { 
  Add, 
  FilterList, 
  Download, 
  Edit, 
  Delete, 
  LocalOffer, 
  MonetizationOn, 
  CalendarToday,
  Close,
  TrendingUp
} from '@mui/icons-material';
import { PageHeader } from '../../components/Common/PageHeader';
import { discountService, Discount } from '../../services/discountService';
import { serviceCatalog, Service } from '../../services/serviceCatalog';
import { basePriceService, BasePrice } from '../../services/basePriceService';
import { membershipService, MembershipCategory } from '../../services/membershipService';
import { useAuth } from '../../context/AuthContext';

export const DiscountCodes = () => {
    const { currentLocationId: locationId, userParams } = useAuth();
    const [tabValue, setTabValue] = useState(0);
    const [discounts, setDiscounts] = useState<Discount[]>([]);
    const [services, setServices] = useState<Service[]>([]);
    const [membershipPlans, setMembershipPlans] = useState<BasePrice[]>([]);
    const [membershipCategories, setMembershipCategories] = useState<MembershipCategory[]>([]);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    
    // Form State
    const [editingDiscountId, setEditingDiscountId] = useState<string | null>(null);
    const [discountName, setDiscountName] = useState('');
    const [discountType, setDiscountType] = useState<'Percentage' | 'Flat'>('Percentage');
    const [discountValue, setDiscountValue] = useState('');
    const [discountScope, setDiscountScope] = useState<'GLOBAL' | 'SERVICE' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP_FEE'>('GLOBAL');
    const [selectedReferenceIds, setSelectedReferenceIds] = useState<string[]>([]);
    const [isActive, setIsActive] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success'|'error', text: string } | null>(null);

    const nameInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (locationId) {
            loadInitialData();
        }
    }, [locationId]);

    const loadInitialData = async () => {
        if (!locationId) return;
        setLoading(true);
        try {
            const [discountRes, serviceRes, planRes, membershipRes] = await Promise.allSettled([
                discountService.getAllDiscounts(locationId),
                serviceCatalog.getServices(locationId),
                basePriceService.getAll(locationId),
                membershipService.getMemberships(locationId)
            ]);

            if (discountRes.status === 'fulfilled') {
                setDiscounts(discountRes.value || []);
            } else {
                console.error("Failed to load discounts", discountRes.reason);
            }

            if (serviceRes.status === 'fulfilled') {
                const servicesList = unwrapArray(serviceRes.value, ['services']);
                setServices(servicesList);
            } else {
                console.error("Failed to load services", serviceRes.reason);
            }

            if (planRes.status === 'fulfilled') {
                const planPrices = unwrapArray(planRes.value, ['prices']);
                setMembershipPlans(planPrices);
            } else {
                console.error("Failed to load membership plans", planRes.reason);
            }

            if (membershipRes.status === 'fulfilled') {
                const membershipPrograms = unwrapArray(membershipRes.value, ['programs', 'memberships']);
                const categories = membershipPrograms.flatMap((p: any) => p.categories || []);
                setMembershipCategories(categories);
            } else {
                console.error("Failed to load membership categories", membershipRes.reason);
            }
        } finally {
            setLoading(false);
        }
    };

    const loadDiscounts = async () => {
        if (!locationId) return;
        try {
            const data = await discountService.getAllDiscounts(locationId!);
            setDiscounts(data || []);
        } catch (error) {
            console.error("Failed to load discounts", error);
        }
    };

    const unwrapArray = (value: any, keys: string[] = []) => {
        if (Array.isArray(value)) return value;
        if (Array.isArray(value?.data)) return value.data;
        if (Array.isArray(value?.data?.data)) return value.data.data;
        for (const key of keys) {
            if (Array.isArray(value?.[key])) return value[key];
            if (Array.isArray(value?.data?.[key])) return value.data[key];
            if (Array.isArray(value?.data?.data?.[key])) return value.data.data[key];
        }
        return [];
    };

    const getScopeLabel = (scope: 'GLOBAL' | 'SERVICE' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP_FEE' | null) => {
        if (!scope || scope === 'GLOBAL') return 'Applicable to All';
        return {
            'SERVICE': 'Service',
            'MEMBERSHIP_PLAN': 'Membership Plan',
            'MEMBERSHIP_FEE': 'Membership Fees'
        }[scope] ?? 'Item';
    };

    const getScopeLabelPlural = (scope: 'GLOBAL' | 'SERVICE' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP_FEE' | null) => {
        if (!scope || scope === 'GLOBAL') return 'Applicable to All';
        return {
            'SERVICE': 'Services',
            'MEMBERSHIP_PLAN': 'Membership Plans',
            'MEMBERSHIP_FEE': 'Membership Fees'
        }[scope] ?? 'Items';
    };

    const getScopeItems = (scope: 'SERVICE' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP_FEE') => {
        if (scope === 'SERVICE') {
            return services
                .filter((s) => !!s.service_id)
                .map((s) => ({ id: s.service_id as string, label: s.name || 'Unnamed Service', referenceIds: [s.service_id as string] }));
        }
        if (scope === 'MEMBERSHIP_FEE') {
            const grouped = new Map<string, string[]>();
            membershipPlans
                .filter((p) => !!p.base_price_id)
                .forEach((p) => {
                    const label = (p.name || 'Unnamed Plan').trim();
                    const list = grouped.get(label) || [];
                    list.push(p.base_price_id as string);
                    grouped.set(label, list);
                });
            return Array.from(grouped.entries()).map(([label, ids]) => ({
                id: label,
                label,
                referenceIds: ids
            }));
        }
        return membershipCategories
            .filter((c) => !!c.category_id)
            .map((c) => ({ id: c.category_id as string, label: c.name || 'Unnamed Category', referenceIds: [c.category_id as string] }));
    };

    const getReferenceName = (scope: 'SERVICE' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP_FEE', referenceId: string) => {
        if (scope === 'SERVICE') {
            return services.find(s => s.service_id === referenceId)?.name || 'Unknown Service';
        }
        if (scope === 'MEMBERSHIP_FEE') {
            return membershipPlans.find(p => p.base_price_id === referenceId)?.name || 'Unknown Plan';
        }
        return membershipCategories.find(c => c.category_id === referenceId)?.name || 'Unknown Category';
    };

    const toggleReferenceId = (referenceIds: string[]) => {
        setSelectedReferenceIds((prev) => (
            referenceIds.every((id) => prev.includes(id))
                ? prev.filter((id) => !referenceIds.includes(id))
                : Array.from(new Set([...prev, ...referenceIds]))
        ));
    };

    const handleEditClick = (discount: Discount) => {
        setEditingDiscountId(discount.discount_id);
        setDiscountName(discount.discount_code);
        
        const isPercentage = discount.discount.includes('%');
        setDiscountType(isPercentage ? 'Percentage' : 'Flat');
        setDiscountValue(discount.discount.replace('%', ''));
        
        // New logic
        const scope = (discount.discount_category ?? discount.applicable_refs?.[0]?.discount_category ?? 'GLOBAL') as 'GLOBAL' | 'SERVICE' | 'MEMBERSHIP_PLAN' | 'MEMBERSHIP_FEE';
        setDiscountScope(scope);
        const applicableIds = scope === 'GLOBAL'
            ? []
            : (discount.applicable_refs && discount.applicable_refs.length > 0)
                ? discount.applicable_refs
                    .filter(ref => ref.discount_category === scope)
                    .map(ref => ref.reference_id)
                : discount.reference_id
                    ? [discount.reference_id]
                    : [];
        setSelectedReferenceIds(applicableIds);
        
        setIsActive(discount.is_active);
        setStartDate(discount.start_date ? discount.start_date.split('T')[0] : '');
        setEndDate(discount.end_date ? discount.end_date.split('T')[0] : '');
        setIsDrawerOpen(true);
    };

    const handleNewClick = () => {
        resetForm();
        setIsDrawerOpen(true);
    };

    const resetForm = () => {
        setEditingDiscountId(null);
        setDiscountName('');
        setTabValue(0);
        setDiscountType('Percentage');
        setDiscountValue('');
        setDiscountScope('GLOBAL');
        setSelectedReferenceIds([]);
        setIsActive(true);
        setStartDate('');
        setEndDate('');
    };

    const handleSaveDiscount = async () => {
        if (!locationId) {
            setMessage({ type: 'error', text: 'No location selected' });
            return;
        }
        if (!discountName || !discountValue) {
            setMessage({ type: 'error', text: 'Please fill in all required fields' });
            return;
        }

        setLoading(true);
        setMessage(null);
        try {
            const finalValue = discountType === 'Percentage' ? `${discountValue}%` : discountValue;
            const staffName = userParams ? `${userParams.first_name || ''} ${userParams.last_name || ''}`.trim() : 'Admin';
            
            const payload: Partial<Discount> = {
                discount_code: discountName,
                discount: finalValue,
                is_active: isActive,
                staff_name: staffName,
                location_id: locationId,
                start_date: startDate || null,
                end_date: endDate || null
            };

            if (discountScope === 'GLOBAL') {
                payload.discount_category = null;
                payload.reference_id = null;
                payload.applicable_refs = [];
            } else {
                payload.discount_category = discountScope;
                payload.reference_id = selectedReferenceIds.length === 1 ? selectedReferenceIds[0] : null;
                payload.applicable_refs = selectedReferenceIds.map((referenceId) => ({
                    discount_category: discountScope,
                    reference_id: referenceId
                }));
            }

            if (editingDiscountId) {
                payload.discount_id = editingDiscountId;
            }

            await discountService.createDiscount(locationId!, payload);
            
            setMessage({ 
                type: 'success', 
                text: editingDiscountId ? 'Discount updated successfully' : 'Discount created successfully' 
            });
            
            setIsDrawerOpen(false);
            resetForm();
            loadDiscounts();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save discount' });
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteDiscount = async (discount: Discount) => {
        if (!locationId || !discount.discount_id) return;
        const confirmed = window.confirm(`Delete discount code "${discount.discount_code}"?`);
        if (!confirmed) return;

        setLoading(true);
        setMessage(null);
        try {
            await discountService.deleteDiscount(locationId, discount.discount_id);
            setMessage({ type: 'success', text: 'Discount deleted successfully' });
            loadDiscounts();
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to delete discount' });
        } finally {
            setLoading(false);
        }
    };

    const filteredDiscounts = discounts.filter(d => {
        if (tabValue === 1) return d.is_active;
        if (tabValue === 2) return !d.is_active;
        return true;
    });

    const activeCount = discounts.filter(d => d.is_active).length;
    const scopedItems = discountScope === 'GLOBAL' ? [] : getScopeItems(discountScope);

    return (
        <Box sx={{ p: { xs: 2, md: 4 }, maxWidth: 1400, mx: 'auto' }}>
            <PageHeader 
                title="Promotions & Discounts"
                description="Manage seasonal offers, referral codes, and special program discounts."
                breadcrumbs={[
                    { label: 'Settings', href: '/admin/settings' },
                    { label: 'Discounts', active: true }
                ]}
                action={
                    <Button 
                        variant="contained" 
                        startIcon={<Add />}
                        onClick={handleNewClick}
                        sx={{ 
                            textTransform: 'none', 
                            fontWeight: 800, 
                            bgcolor: '#3b82f6',
                            boxShadow: '0 4px 12px rgba(59, 130, 246, 0.25)',
                            borderRadius: '10px',
                            px: 3,
                            py: 1,
                            '&:hover': { bgcolor: '#2563eb' }
                        }}
                    >
                        Create Discount
                    </Button>
                }
            />

            {message && (
                <Snackbar open={true} autoHideDuration={4000} onClose={() => setMessage(null)} anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}>
                    <Alert variant="filled" severity={message.type} onClose={() => setMessage(null)} sx={{ borderRadius: '10px' }}>
                        {message.text}
                    </Alert>
                </Snackbar>
            )}

            <Grid container spacing={3}>
                <Grid size={12}>
                    <Paper 
                        elevation={0}
                        sx={{ 
                            borderRadius: '16px', 
                            border: '1px solid #e2e8f0', 
                            overflow: 'hidden',
                            bgcolor: '#ffffff'
                        }}
                    >
                        {/* Status Bar */}
                        <Box sx={{ p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Tabs 
                                value={tabValue} 
                                onChange={(_: any, v: any) => setTabValue(v)}
                                sx={{ 
                                    minHeight: 0,
                                    '& .MuiTab-root': { 
                                        textTransform: 'none', 
                                        fontWeight: 700, 
                                        minHeight: 40,
                                        px: 3,
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        color: '#64748b',
                                        '&.Mui-selected': { color: '#3b82f6', bgcolor: '#eff6ff' }
                                    },
                                    '& .MuiTabs-indicator': { display: 'none' }
                                }}
                            >
                                <Tab label={`All Codes (${discounts.length})`} />
                                <Tab label={`Active (${activeCount})`} />
                                <Tab label="Archived" />
                            </Tabs>

                            <Stack direction="row" spacing={1.5}>
                                <Tooltip title="Filter discounts">
                                    <IconButton size="small" sx={{ border: '1px solid #e2e8f0', p: 1, borderRadius: '8px' }}>
                                        <FilterList fontSize="small" sx={{ color: '#64748b' }} />
                                    </IconButton>
                                </Tooltip>
                                <Button 
                                    variant="outlined" 
                                    startIcon={<Download />} 
                                    size="small" 
                                    sx={{ 
                                        textTransform: 'none', 
                                        color: '#64748b', 
                                        borderColor: '#e2e8f0',
                                        fontWeight: 600,
                                        borderRadius: '8px',
                                        px: 2
                                    }}
                                >
                                    Export CSV
                                </Button>
                            </Stack>
                        </Box>

                        <TableContainer sx={{ minHeight: 400 }}>
                            <Table stickyHeader>
                                <TableHead>
                                    <TableRow>
                                        <TableCell sx={{ bgcolor: '#ffffff', color: '#94a3b8', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Discount Code</TableCell>
                                        <TableCell sx={{ bgcolor: '#ffffff', color: '#94a3b8', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Type & Value</TableCell>
                                        <TableCell sx={{ bgcolor: '#ffffff', color: '#94a3b8', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Status</TableCell>
                                        <TableCell sx={{ bgcolor: '#ffffff', color: '#94a3b8', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Validity Period</TableCell>
                                        <TableCell sx={{ bgcolor: '#ffffff', color: '#94a3b8', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Applicable For</TableCell>
                                        <TableCell align="right" sx={{ bgcolor: '#ffffff', color: '#94a3b8', fontWeight: 800, fontSize: '0.7rem', textTransform: 'uppercase', py: 2 }}>Actions</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {loading && discounts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <CircularProgress size={30} sx={{ mb: 2 }} />
                                                <Typography variant="body2" color="text.secondary">Fetching discounts...</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredDiscounts.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                                                <Box sx={{ opacity: 0.3, mb: 2 }}>
                                                    <LocalOffer sx={{ fontSize: 48 }} />
                                                </Box>
                                                <Typography variant="body1" fontWeight={600} color="text.secondary">No discounts found</Typography>
                                                <Typography variant="caption" color="text.secondary">Try adjusting your filters or create a new code.</Typography>
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredDiscounts.map((discount) => {
                                        const isPercentage = discount.discount.includes('%');
                                        const displayValue = isPercentage ? discount.discount : `$${discount.discount}`;
                                        
                                        return (
                                        <TableRow key={discount.discount_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                            <TableCell>
                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', bgcolor: '#f1f5f9', px: 1.5, py: 0.75, borderRadius: '6px', display: 'inline-block', border: '1px solid #e2e8f0', letterSpacing: '0.5px' }}>
                                                    {discount.discount_code}
                                                </Typography>
                                            </TableCell>
                                            <TableCell>
                                                <Stack direction="row" spacing={1.5} alignItems="center">
                                                    <Avatar sx={{ bgcolor: isPercentage ? '#eff6ff' : '#ecfdf5', color: isPercentage ? '#3b82f6' : '#10b981', width: 32, height: 32 }}>
                                                        {isPercentage ? <TrendingUp sx={{ fontSize: 16 }} /> : <MonetizationOn sx={{ fontSize: 16 }} />}
                                                    </Avatar>
                                                    <Box>
                                                        <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>{displayValue}</Typography>
                                                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 500 }}>{isPercentage ? 'Percentage' : 'Flat Amount'}</Typography>
                                                    </Box>
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Chip 
                                                    label={discount.is_active ? 'ACTIVE' : 'ARCHIVED'} 
                                                    size="small"
                                                    variant="filled"
                                                    sx={{ 
                                                        bgcolor: discount.is_active ? '#dcfce7' : '#f1f5f9', 
                                                        color: discount.is_active ? '#166534' : '#64748b',
                                                        fontWeight: 800,
                                                        fontSize: '0.65rem',
                                                        borderRadius: '6px',
                                                        height: 24,
                                                        '& .MuiChip-label': { px: 1.5 }
                                                    }} 
                                                />
                                            </TableCell>
                                            <TableCell>
                                                <Stack spacing={0.5}>
                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                        <CalendarToday sx={{ fontSize: 14, color: '#94a3b8' }} />
                                                        <Typography variant="caption" sx={{ color: '#475569', fontWeight: 600 }}>
                                                            {discount.start_date ? new Date(discount.start_date).toLocaleDateString(undefined, { dateStyle: 'medium' }) : 'No start date'}
                                                        </Typography>
                                                    </Box>
                                                    {discount.end_date && (
                                                        <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700, ml: 3 }}>
                                                            Exp: {new Date(discount.end_date).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                                                        </Typography>
                                                    )}
                                                </Stack>
                                            </TableCell>
                                            <TableCell>
                                                <Typography variant="body2" sx={{ color: '#334155', fontWeight: 700, fontSize: '0.8rem' }}>
                                                    {(() => {
                                                        const category = discount.discount_category ?? discount.applicable_refs?.[0]?.discount_category ?? null;
                                                        if (!category) return 'Applicable to All';

                                                        const scopeLabel = getScopeLabel(category);
                                                        const applicableRefs = (discount.applicable_refs || [])
                                                            .filter(ref => ref.discount_category === category)
                                                            .map(ref => ref.reference_id);
                                                        const referenceIds = applicableRefs.length > 0
                                                            ? applicableRefs
                                                            : discount.reference_id
                                                                ? [discount.reference_id]
                                                                : [];

                                                        if (referenceIds.length === 0) {
                                                            return `${scopeLabel}: Applicable to All`;
                                                        }

                                                        let names = referenceIds.map((id) => getReferenceName(category, id));
                                                        if (category === 'MEMBERSHIP_FEE') {
                                                            names = Array.from(new Set(names));
                                                        }
                                                        const maxNames = 2;
                                                        const displayNames = names.slice(0, maxNames).join(', ');
                                                        const extraCount = names.length - maxNames;
                                                        return `${scopeLabel}: ${displayNames}${extraCount > 0 ? ` +${extraCount} more` : ''}`;
                                                    })()}
                                                </Typography>
                                                <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 500 }}>Added by {discount.staff_name || 'Admin'}</Typography>
                                            </TableCell>
                                            <TableCell align="right">
                                                <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                    <Tooltip title="Edit Discount">
                                                        <IconButton size="small" onClick={() => handleEditClick(discount)} sx={{ color: '#64748b', '&:hover': { color: '#3b82f6', bgcolor: '#eff6ff' } }}>
                                                            <Edit fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                    <Tooltip title="Delete">
                                                        <IconButton
                                                            size="small"
                                                            onClick={() => handleDeleteDiscount(discount)}
                                                            sx={{ color: '#64748b', '&:hover': { color: '#ef4444', bgcolor: '#fef2f2' } }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </TableCell>
                                        </TableRow>
                                    )})}
                                </TableBody>
                            </Table>
                        </TableContainer>
                        
                        <Box sx={{ p: 2, display: 'flex', justifyContent: 'center', borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                                {filteredDiscounts.length} promotional codes listed
                            </Typography>
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {/* Side Drawer for Form */}
            <Drawer
                anchor="right"
                open={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                ModalProps={{
                    BackdropProps: { sx: { backgroundColor: 'rgba(15, 23, 42, 0.08)' } }
                }}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 450 }, border: 'none', bgcolor: '#ffffff', boxShadow: '-10px 0 25px rgba(15,23,42,0.06)' }
                }}
            >
                <Box sx={{ p: 0, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Drawer Header */}
                    <Box sx={{ p: 3, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Box>
                            <Typography variant="h6" fontWeight={800} color="#1e293b">
                                {editingDiscountId ? 'Edit Discount' : 'New Discount Code'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary" fontWeight={500}>
                                Configure promotional rule parameters
                            </Typography>
                        </Box>
                        <IconButton onClick={() => setIsDrawerOpen(false)} sx={{ bgcolor: '#fff', border: '1px solid #e2e8f0' }}>
                            <Close />
                        </IconButton>
                    </Box>

                    {/* Drawer Content */}
                    <Box sx={{ p: 3, flexGrow: 1, overflowY: 'auto' }}>
                        <Stack spacing={4}>
                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    Discount Code Name
                                </Typography>
                                <TextField 
                                    fullWidth 
                                    inputRef={nameInputRef}
                                    placeholder="E.G. WELCOME2026" 
                                    value={discountName}
                                    onChange={(e) => setDiscountName(e.target.value)}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc' } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    Discount Logic
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={6}>
                                        <Paper 
                                            elevation={0}
                                            onClick={() => setDiscountType('Percentage')}
                                            sx={{ 
                                                p: 2, 
                                                cursor: 'pointer',
                                                borderRadius: '12px',
                                                border: '2px solid',
                                                borderColor: discountType === 'Percentage' ? '#3b82f6' : '#e2e8f0',
                                                bgcolor: discountType === 'Percentage' ? '#f0f9ff' : '#ffffff',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { borderColor: '#3b82f6', bgcolor: '#f8fafc' }
                                            }}
                                        >
                                           <Avatar sx={{ bgcolor: discountType === 'Percentage' ? '#3b82f6' : '#f1f5f9', color: discountType === 'Percentage' ? '#fff' : '#64748b', mb: 1.5, width: 36, height: 36 }}>
                                                <LocalOffer sx={{ fontSize: 18 }} />
                                           </Avatar>
                                           <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>Percentage</Typography>
                                           <Typography variant="caption" sx={{ color: '#94a3b8' }}>Deduct % off total</Typography>
                                        </Paper>
                                    </Grid>
                                    <Grid size={6}>
                                        <Paper 
                                            elevation={0}
                                            onClick={() => setDiscountType('Flat')}
                                            sx={{ 
                                                p: 2, 
                                                cursor: 'pointer',
                                                borderRadius: '12px',
                                                border: '2px solid',
                                                borderColor: discountType === 'Flat' ? '#10b981' : '#e2e8f0',
                                                bgcolor: discountType === 'Flat' ? '#f0fdf4' : '#ffffff',
                                                transition: 'all 0.2s ease',
                                                '&:hover': { borderColor: '#10b981', bgcolor: '#f8fafc' }
                                            }}
                                        >
                                           <Avatar sx={{ bgcolor: discountType === 'Flat' ? '#10b981' : '#f1f5f9', color: discountType === 'Flat' ? '#fff' : '#64748b', mb: 1.5, width: 36, height: 36 }}>
                                                <MonetizationOn sx={{ fontSize: 18 }} />
                                           </Avatar>
                                           <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b' }}>Flat Amount</Typography>
                                           <Typography variant="caption" sx={{ color: '#94a3b8' }}>Fixed dollar value</Typography>
                                        </Paper>
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    Discount Value
                                </Typography>
                                <TextField 
                                    fullWidth 
                                    value={discountValue}
                                    onChange={(e) => setDiscountValue(e.target.value)}
                                    type="number"
                                    placeholder="0.00"
                                    InputProps={{
                                        startAdornment: <InputAdornment position="start" sx={{ fontWeight: 800, color: '#1e293b' }}>{discountType === 'Percentage' ? '%' : '$'}</InputAdornment>
                                    }}
                                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                />
                            </Box>

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    Discount Scope
                                </Typography>
                                <FormControl fullWidth sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: '#f8fafc' } }}>
                                    <Select
                                        value={discountScope}
                                        onChange={(e: any) => {
                                            setDiscountScope(e.target.value);
                                            setSelectedReferenceIds([]); // Reset selections when scope changes
                                        }}
                                        sx={{ color: '#1e293b', fontWeight: 600 }}
                                    >
                                        <MenuItem value="GLOBAL">Applicable to All</MenuItem>
                                        <MenuItem value="SERVICE">Service</MenuItem>
                                        <MenuItem value="MEMBERSHIP_PLAN">Membership Plan</MenuItem>
                                        <MenuItem value="MEMBERSHIP_FEE">Membership Fees</MenuItem>
                                    </Select>
                                </FormControl>
                            </Box>

                            {discountScope !== 'GLOBAL' && (
                                <Box>
                                    <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                        Applicable Items
                                    </Typography>
                                    <FormControl fullWidth sx={{ borderRadius: '10px', bgcolor: '#f8fafc', border: '1px solid #e2e8f0', p: 1.5 }}>
                                        <FormGroup>
                                            {scopedItems.length === 0 && (
                                                <Typography variant="body2" color="text.secondary" sx={{ py: 1 }}>
                                                    No items available for this category.
                                                </Typography>
                                            )}
                                            {scopedItems.map((item) => {
                                                const selectedCount = item.referenceIds.filter((id) => selectedReferenceIds.includes(id)).length;
                                                const isChecked = selectedCount === item.referenceIds.length && item.referenceIds.length > 0;
                                                const isIndeterminate = selectedCount > 0 && selectedCount < item.referenceIds.length;
                                                return (
                                                <FormControlLabel
                                                    key={item.id}
                                                    control={
                                                        <Checkbox
                                                            checked={isChecked}
                                                            indeterminate={isIndeterminate}
                                                            onChange={() => toggleReferenceId(item.referenceIds)}
                                                            size="small"
                                                        />
                                                    }
                                                    label={item.label}
                                                />
                                            )})}
                                        </FormGroup>
                                        <FormHelperText sx={{ mt: 1 }}>
                                            Leave all unchecked to apply to all items in this category.
                                        </FormHelperText>
                                    </FormControl>
                                </Box>
                            )}

                            <Box>
                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#64748b', mb: 1.5, display: 'block', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '1px' }}>
                                    Validity Period
                                </Typography>
                                <Grid container spacing={2}>
                                    <Grid size={6}>
                                        <TextField 
                                            fullWidth 
                                            type="date"
                                            label="Start Date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                    <Grid size={6}>
                                        <TextField 
                                            fullWidth 
                                            type="date"
                                            label="Expiry Date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                                        />
                                    </Grid>
                                </Grid>
                            </Box>

                            <Box sx={{ p: 2, bgcolor: '#fdf2f2', borderRadius: '10px', border: '1px solid #fecaca', display: 'flex', gap: 2, alignItems: 'center' }}>
                                <Switch 
                                    checked={isActive} 
                                    onChange={(e: any) => setIsActive(e.target.checked)}
                                    color="success"
                                />
                                <Box>
                                    <Typography variant="body2" fontWeight={800} color="#991b1b">Active & Discoverable</Typography>
                                    <Typography variant="caption" color="#b91c1c">Turn off to archive and prevent new usage.</Typography>
                                </Box>
                            </Box>
                        </Stack>
                    </Box>

                    {/* Drawer Footer */}
                    <Box sx={{ p: 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc' }}>
                        <Stack direction="row" spacing={2}>
                            <Button 
                                fullWidth 
                                variant="outlined" 
                                onClick={() => setIsDrawerOpen(false)}
                                sx={{ color: '#64748b', borderColor: '#e2e8f0', borderRadius: '10px', textTransform: 'none', fontWeight: 700, py: 1.5 }}
                            >
                                Cancel
                            </Button>
                            <Button 
                                fullWidth 
                                variant="contained" 
                                onClick={handleSaveDiscount}
                                disabled={loading}
                                sx={{ bgcolor: '#3b82f6', borderRadius: '10px', textTransform: 'none', fontWeight: 800, py: 1.5, boxShadow: 'none' }}
                            >
                                {loading ? 'Processing...' : editingDiscountId ? 'Update Promotion' : 'Activate Discount'}
                            </Button>
                        </Stack>
                    </Box>
                </Box>
            </Drawer>
        </Box>
    );
};
