
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
    Box, 
    Typography, 
    Grid, 
    Card, 
    CardContent,
    CardMedia, 
    Button, 
    Tabs, 
    Tab, 
    CircularProgress,
    Checkbox,
    Chip,
    Paper,
    Divider,
    Stack,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    FormGroup,
    FormControlLabel,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    IconButton,
    Tooltip,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import StarIcon from '@mui/icons-material/Star';

import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { basePriceService, BasePrice } from '../../services/basePriceService';
import { membershipService, MembershipProgram } from '../../services/membershipService';
import { serviceCatalog, Service } from '../../services/serviceCatalog';
import { billingService } from '../../services/billingService';
import { crmService } from '../../services/crmService';
import { useConfig } from '../../context/ConfigContext';
import { getAgeGroupName } from '../../lib/ageUtils';


interface CartItem {
    id: string; // unique key
    type: 'BASE' | 'MEMBERSHIP' | 'SERVICE';
    referenceId: string; // base_price_id, category_id, service_id/pack_id
    name: string;
    price: number;
    description?: string;
    // Metadata for creation
    metadata?: any;
    coverage?: { profile_id: string; name: string; age_group?: string }[];
}

export const Marketplace = () => {
    const { accountId: paramAccountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const { currentLocationId, userParams, role } = useAuth();
    const { ageGroups } = useConfig();

    const accountId = paramAccountId || userParams?.account_id;
    const isMember = role === 'MEMBER' || role === 'USER';

    
    // Data States
    const [loading, setLoading] = useState(true);
    const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
    const [membershipPrograms, setMembershipPrograms] = useState<MembershipProgram[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // UI States
    const [tabValue, setTabValue] = useState(0);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Account Context (for coverage selection)
    const [profiles, setProfiles] = useState<any[]>([]);
    const [primaryProfileId, setPrimaryProfileId] = useState<string | null>(null);

    // Coverage Dialog States
    const [coverageDialogOpen, setCoverageDialogOpen] = useState(false);
    const [pendingItem, setPendingItem] = useState<CartItem | null>(null);
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);

    useEffect(() => {
        const loadData = async () => {
            if (!currentLocationId || !accountId) return;
            setLoading(true);
            try {
                // Fetch Account to get Primary Profile
                try {
                    const accountRes = await crmService.getAccountDetails(accountId, currentLocationId || undefined);
                    const accountData = accountRes.data || accountRes;
                    
                    // Normalize profiles key and sort primary first
                    const rawProfs = accountData.profiles || accountData.profile || [];
                    const profs = [...rawProfs].sort((a, b) => {
                        if (a.is_primary && !b.is_primary) return -1;
                        if (!a.is_primary && b.is_primary) return 1;
                        return 0;
                    });
                    setProfiles(profs);
                    const primary = profs.find((p: any) => p.is_primary);
                    setPrimaryProfileId(primary ? primary.profile_id : (profs[0]?.profile_id || null));
                } catch (err) {
                    console.warn("Marketplace: Failed to fetch account details. Using current user fallback.", err);
                    if (userParams && userParams.profile_id) {
                         setProfiles([{
                            profile_id: userParams.profile_id,
                            first_name: userParams.first_name,
                            last_name: userParams.last_name,
                            date_of_birth: userParams.date_of_birth,
                            is_primary: userParams.is_primary ?? true // Default to true if missing, or use param
                        }]);
                        setPrimaryProfileId(userParams.profile_id);
                    }
                }


                // Fetch Catalog Data
                const [bpData, mpData, servicesData] = await Promise.all([
                    basePriceService.getAll(currentLocationId),
                    membershipService.getMemberships(currentLocationId),
                    serviceCatalog.getServices(currentLocationId)
                ]);

                setBasePrices(bpData.prices || []);
                setMembershipPrograms(mpData || []);
                
                // Enrich services with packs and prices
                const rawServices = Array.isArray(servicesData) ? servicesData : (servicesData.data || []);
                const enrichedServices = await Promise.all(rawServices.map(async (s: any) => {
                    const serviceId = s.service_id;
                    const serviceName = s.name || s.service_name || 'Unnamed Service';
                    
                    try {
                        const packsRes = await serviceCatalog.getServicePacks(serviceId, currentLocationId);
                        const packs = Array.isArray(packsRes) ? packsRes : (packsRes.data || []);
                        
                        const enrichedPacks = await Promise.all(packs.map(async (p: any) => {
                            try {
                                const pricesRes = await serviceCatalog.getPackPrices(p.service_pack_id, currentLocationId);
                                return { ...p, prices: Array.isArray(pricesRes) ? pricesRes : (pricesRes.data || []) };
                            } catch (err) {
                                return { ...p, prices: [] };
                            }
                        }));
                        return { ...s, name: serviceName, packs: enrichedPacks };
                    } catch (err) {
                        return { ...s, name: serviceName, packs: [] };
                    }
                }));
                setServices(enrichedServices);
                
            } catch (error) {
                console.error("Failed to load marketplace data", error);
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, [currentLocationId, accountId]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const isInCart = (id: string) => cart.some(i => i.id === id);

    const openCoverageDialog = (item: CartItem) => {
        if (isInCart(item.id)) {
            removeFromCart(item.id);
            return;
        }
        setPendingItem(item);
        setSelectedProfileIds(primaryProfileId ? [primaryProfileId] : []);
        setCoverageDialogOpen(true);
    };

    const handleConfirmCoverage = () => {
        if (pendingItem && selectedProfileIds.length > 0) {
            const coverage = selectedProfileIds.map(id => {
                const profile = profiles.find(p => p.profile_id === id);
                return {
                    profile_id: id,
                    name: profile?.first_name || 'Unknown',
                    age_group: getAgeGroupName(profile?.date_of_birth, ageGroups)
                };
            });
            
            setCart(prev => [...prev, { ...pendingItem, coverage }]);
        }

        setCoverageDialogOpen(false);
        setPendingItem(null);
    };

    const removeFromCart = (id: string) => {
        setCart(prev => prev.filter(i => i.id !== id));
    };

    const handleCheckout = async () => {
        if (!accountId || !currentLocationId) return;
        setSubmitting(true);
        try {
            const promises = cart.map(item => {
                return billingService.createSubscription({
                    account_id: accountId,
                    location_id: currentLocationId,
                    subscription_type: item.type === 'MEMBERSHIP' ? 'MEMBERSHIP_FEE' : (item.type === 'SERVICE' ? 'ADDON_SERVICE' : item.type),
                    reference_id: item.referenceId,
                    unit_price_snapshot: item.price,
                    total_amount: item.price,
                    coverage: item.coverage?.map((c, index) => ({ 
                        profile_id: c.profile_id, 
                        role: index === 0 ? 'PRIMARY' : 'ADD_ON' 
                    })) || [],
                    ...(item.metadata || {})
                }, currentLocationId || undefined);
            });

            await Promise.all(promises);
            navigate(isMember ? '/portal' : `/admin/accounts/${accountId}`);
        } catch (error) {
            console.error("Failed to create subscriptions", error);
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    return (
        <Box sx={{ p: 3 }}>
             <PageHeader
                title="Marketplace"
                breadcrumbs={isMember ? [
                    { label: 'My Account', href: '/portal' },
                    { label: 'Shop', active: true }
                ] : [
                    { label: 'Dashboard', href: '/' },
                    { label: 'Accounts', href: '/admin/accounts' },
                    { label: 'Detail', href: `/admin/accounts/${accountId}` },
                    { label: 'Shop', active: true }
                ]}
                action={
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate(isMember ? '/portal' : `/admin/accounts/${accountId}`)}
                        variant="outlined"
                    >
                        Back
                    </Button>
                }
            />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                     <Paper elevation={0} sx={{ 
                        width: '100%', 
                        mb: 2, 
                        borderRadius: 4, 
                        border: '1px solid', 
                        borderColor: 'divider',
                        overflow: 'hidden'
                    }}>
                        <Tabs 
                            value={tabValue} 
                            onChange={handleTabChange} 
                            sx={{ 
                                borderBottom: 1, 
                                borderColor: 'divider',
                                px: 2,
                                bgcolor: '#f8fafc',
                                '& .MuiTab-root': {
                                    textTransform: 'none',
                                    fontWeight: 600,
                                    fontSize: '0.95rem',
                                    minHeight: 64,
                                    px: 3
                                }
                            }}
                        >
                            <Tab label="Base Plans" />
                            <Tab label="Memberships" />
                            <Tab label="Services" />
                        </Tabs>
                        
                        <Box sx={{ p: 0 }}>
                            {/* Base Plans */}
                            {tabValue === 0 && (
                                <TableContainer>
                                    <Table sx={{ minWidth: 650 }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Plan / Age Group</TableCell>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Role</TableCell>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }} align="right">Price</TableCell>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">Select</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {Object.entries(basePrices.reduce((acc, bp) => {
                                                const key = bp.name;
                                                if (!acc[key]) acc[key] = [];
                                                acc[key].push(bp);
                                                return acc;
                                            }, {} as Record<string, BasePrice[]>)).map(([groupName, prices]) => {
                                                // Sort prices: "Adult" first, then by min_age
                                                const sortedPrices = [...prices].sort((a, b) => {
                                                    const nameA = a.age_group_name?.toLowerCase() || '';
                                                    const nameB = b.age_group_name?.toLowerCase() || '';
                                                    
                                                    if (nameA.includes('adult') && !nameB.includes('adult')) return -1;
                                                    if (!nameA.includes('adult') && nameB.includes('adult')) return 1;
                                                    
                                                    // Fallback to min_age if possible
                                                    const ageGroupA = ageGroups.find(ag => ag.age_group_id === a.age_group_id);
                                                    const ageGroupB = ageGroups.find(ag => ag.age_group_id === b.age_group_id);
                                                    
                                                    return (ageGroupA?.min_age || 0) - (ageGroupB?.min_age || 0);
                                                });

                                                return (
                                                    <React.Fragment key={groupName}>
                                                        <TableRow sx={{ bgcolor: 'primary.50' }}>
                                                            <TableCell colSpan={4} sx={{ py: 1.5 }}>
                                                                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'primary.main', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                                    {groupName}
                                                                </Typography>
                                                            </TableCell>
                                                        </TableRow>
                                                        {sortedPrices.map(bp => (
                                                            <TableRow 
                                                                key={bp.base_price_id}
                                                                hover
                                                                sx={{ 
                                                                    bgcolor: isInCart(bp.base_price_id!) ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                                                                    '&:last-child td, &:last-child th': { border: 0 }
                                                                }}
                                                            >
                                                                <TableCell sx={{ pl: 4 }}>
                                                                    <Typography variant="body2" fontWeight={500}>{bp.age_group_name || 'Generic'}</Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Chip 
                                                                        label={bp.role} 
                                                                        size="small" 
                                                                        sx={{ 
                                                                            borderRadius: 1, 
                                                                            fontSize: '0.7rem', 
                                                                            fontWeight: 600,
                                                                            bgcolor: bp.role === 'PRIMARY' ? 'primary.100' : 'grey.100',
                                                                            color: bp.role === 'PRIMARY' ? 'primary.main' : 'grey.700'
                                                                        }} 
                                                                    />
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2" fontWeight={700} color="primary.main">
                                                                        ${bp.price.toFixed(2)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Checkbox 
                                                                        checked={isInCart(bp.base_price_id!)}
                                                                        onChange={() => openCoverageDialog({
                                                                            id: bp.base_price_id!,
                                                                            type: 'BASE',
                                                                            referenceId: bp.base_price_id!,
                                                                            name: `${bp.name} (${bp.age_group_name})`,
                                                                            price: bp.price,
                                                                            metadata: { subscription_term_id: bp.subscription_term_id }
                                                                        })}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        ))}
                                                    </React.Fragment>
                                                );
                                            })}
                                            {basePrices.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                                        <Typography color="text.secondary">No base plans found.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                </TableContainer>
                            )}

                             {/* Memberships */}
                             {tabValue === 1 && (
                                 <TableContainer>
                                    <Table sx={{ minWidth: 650 }}>
                                        <TableHead>
                                            <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Program / Category</TableCell>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }}>Breakdown</TableCell>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }} align="right">Total</TableCell>
                                                <TableCell sx={{ fontWeight: 700, py: 2 }} align="center">Select</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {membershipPrograms.map(mp => (
                                                <>
                                                    <TableRow key={mp.membership_program_id} sx={{ bgcolor: 'secondary.50' }}>
                                                        <TableCell colSpan={4} sx={{ py: 1.5 }}>
                                                            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: 'secondary.main', textTransform: 'uppercase', letterSpacing: '0.025em' }}>
                                                                {mp.name}
                                                            </Typography>
                                                        </TableCell>
                                                    </TableRow>
                                                    {mp.categories.map(cat => {
                                                        const total = cat.fees.reduce((acc, f) => acc + f.amount, 0);
                                                        return (
                                                            <TableRow 
                                                                key={cat.category_id}
                                                                hover
                                                                sx={{ 
                                                                    bgcolor: isInCart(cat.category_id!) ? 'rgba(25, 118, 210, 0.04)' : 'inherit',
                                                                    '&:last-child td, &:last-child th': { border: 0 }
                                                                }}
                                                            >
                                                                <TableCell sx={{ pl: 4 }}>
                                                                    <Typography variant="body2" fontWeight={600}>{cat.name}</Typography>
                                                                </TableCell>
                                                                <TableCell>
                                                                    <Stack direction="row" spacing={1}>
                                                                        {cat.fees.map(f => (
                                                                            <Tooltip key={f.membership_fee_id} title={f.billing_cycle}>
                                                                                <Chip 
                                                                                    label={`${f.fee_type}: $${f.amount}`} 
                                                                                    size="small" 
                                                                                    variant="outlined"
                                                                                    sx={{ fontSize: '0.65rem', borderRadius: 1 }}
                                                                                />
                                                                            </Tooltip>
                                                                        ))}
                                                                    </Stack>
                                                                </TableCell>
                                                                <TableCell align="right">
                                                                    <Typography variant="body2" fontWeight={700} color="primary.main">
                                                                        ${total.toFixed(2)}
                                                                    </Typography>
                                                                </TableCell>
                                                                <TableCell align="center">
                                                                    <Checkbox 
                                                                        checked={isInCart(cat.category_id!)}
                                                                        onChange={() => openCoverageDialog({
                                                                            id: cat.category_id!,
                                                                            type: 'MEMBERSHIP',
                                                                            referenceId: cat.category_id!,
                                                                            name: `${mp.name} - ${cat.name}`,
                                                                            price: total
                                                                        })}
                                                                    />
                                                                </TableCell>
                                                            </TableRow>
                                                        );
                                                    })}
                                                </>
                                            ))}
                                            {membershipPrograms.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                                                        <Typography color="text.secondary">No membership programs found.</Typography>
                                                    </TableCell>
                                                </TableRow>
                                            )}
                                        </TableBody>
                                    </Table>
                                 </TableContainer>
                            )}

                              {/* Services */}
                             {tabValue === 2 && (
                                 <Grid container spacing={3} sx={{ p: 3 }}>
                                     {services.filter(s => s.packs && s.packs.length > 0).map(s => (
                                         <Grid size={{ xs: 12, md: 6 }} key={s.service_id}>
                                            <Card variant="outlined" sx={{ 
                                                height: '100%', 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                borderRadius: 3,
                                                overflow: 'hidden',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    boxShadow: '0 12px 20px -8px rgba(0, 0, 0, 0.15)',
                                                    borderColor: 'primary.light'
                                                }
                                            }}>
                                                <CardMedia
                                                    component="img"
                                                    height="180"
                                                    image={s.image_url || 'https://images.unsplash.com/photo-1530549387074-dcb41904791e?q=80&w=600'}
                                                    alt={s.name}
                                                    sx={{ bgcolor: '#f1f5f9' }}
                                                />
                                                <CardContent sx={{ flexGrow: 1, p: 3 }}>
                                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                                        <Typography variant="h6" sx={{ fontWeight: 700, color: 'text.primary' }}>
                                                            {s.name}
                                                        </Typography>
                                                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 0.5 }}>
                                                            <Chip 
                                                                label={s.service_type || 'Service'} 
                                                                size="small" 
                                                                variant="filled"
                                                                sx={{ 
                                                                    borderRadius: '6px', 
                                                                    fontSize: '0.65rem', 
                                                                    fontWeight: 700,
                                                                    bgcolor: 'primary.main',
                                                                    color: 'white',
                                                                    height: 20
                                                                }} 
                                                            />
                                                            <Typography variant="caption" sx={{ fontWeight: 600, color: 'text.secondary', fontSize: '0.65rem' }}>
                                                                TYPE: {String(s.service_type || 'Standard').toUpperCase()}
                                                            </Typography>
                                                        </Box>
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: '3em' }}>
                                                        {s.description || 'No description provided.'}
                                                    </Typography>
                                                    
                                                    <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                                                    
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                                        Available Packs
                                                    </Typography>
                                                    
                                                    <Stack spacing={1.5}>
                                                        {s.packs!.map((p: any) => {
                                                            const minPrice = p.prices && p.prices.length > 0 
                                                                ? Math.min(...p.prices.map((pr: any) => parseFloat(pr.price)))
                                                                : 0;
                                                            
                                                            return (
                                                                <Box 
                                                                    key={p.service_pack_id}
                                                                    sx={{ 
                                                                        p: 2, 
                                                                        borderRadius: 1.5,
                                                                        bgcolor: isInCart(p.service_pack_id) ? 'primary.50' : '#f8fafc',
                                                                        border: '1px solid',
                                                                        borderColor: isInCart(p.service_pack_id) ? 'primary.main' : '#e2e8f0',
                                                                        display: 'flex',
                                                                        justifyContent: 'space-between',
                                                                        alignItems: 'center',
                                                                        transition: 'all 0.2s'
                                                                    }}
                                                                >
                                                                    <Box>
                                                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                                {p.name}
                                                                            </Typography>
                                                                            {p.is_waiver_free_allowed && (
                                                                                <Chip 
                                                                                    label="WAIVER ELIGIBLE" 
                                                                                    size="small" 
                                                                                    sx={{ 
                                                                                        height: 16, 
                                                                                        fontSize: '0.55rem', 
                                                                                        fontWeight: 800, 
                                                                                        bgcolor: '#fff7ed', 
                                                                                        color: '#c2410c', 
                                                                                        borderRadius: '4px',
                                                                                        '& .MuiChip-label': { px: 0.5 }
                                                                                    }} 
                                                                                />
                                                                            )}
                                                                        </Box>
                                                                        <Typography variant="caption" color="text.secondary">
                                                                            {p.classes ? `${p.classes} Classes` : ''} 
                                                                            {p.classes && (p.duration_days || p.duration_months) ? ' • ' : ''}
                                                                            {p.duration_months ? `${p.duration_months} Month(s)` : (p.duration_days ? `${p.duration_days} Day(s)` : '')}
                                                                        </Typography>
                                                                    </Box>
                                                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                                        <Typography variant="h6" color="primary.main" sx={{ fontWeight: 700 }}>
                                                                            ${minPrice.toFixed(2)}
                                                                        </Typography>
                                                                        <Checkbox 
                                                                            size="small"
                                                                            checked={isInCart(p.service_pack_id)}
                                                                            onChange={() => openCoverageDialog({
                                                                                id: p.service_pack_id!,
                                                                                type: 'SERVICE',
                                                                                referenceId: p.service_pack_id!,
                                                                                name: `${s.name} - ${p.name}`,
                                                                                price: minPrice,
                                                                                metadata: {
                                                                                    subscription_term_id: p.prices?.[0]?.subscription_term_id
                                                                                }
                                                                            })}
                                                                        />
                                                                    </Box>
                                                                </Box>
                                                            );
                                                        })}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                         </Grid>
                                     ))}
                                     {services.filter(s => s.packs && s.packs.length > 0).length === 0 && (
                                         <Grid size={12}>
                                             <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                                 No services with packs found for this location.
                                             </Typography>
                                         </Grid>
                                     )}
                                 </Grid>
                             )}
                        </Box>
                     </Paper>
                </Grid>

                {/* Cart / Summary - Sticky Sidebar */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper 
                        elevation={0} 
                        sx={{ 
                            p: 3, 
                            position: 'sticky', 
                            top: 24, 
                            borderRadius: 4, 
                            border: '1px solid', 
                            borderColor: 'divider',
                            bgcolor: '#f8fafc'
                        }}
                    >
                        <Box display="flex" alignItems="center" gap={1.5} mb={2.5}>
                            <Box sx={{ 
                                bgcolor: 'primary.main', 
                                color: 'white', 
                                p: 1, 
                                borderRadius: 2,
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center'
                            }}>
                                <ShoppingCartIcon fontSize="small" />
                            </Box>
                            <Typography variant="h6" fontWeight={700}>Selection Summary</Typography>
                        </Box>
                        
                        {cart.length === 0 ? (
                             <Box sx={{ 
                                 py: 4, 
                                 textAlign: 'center', 
                                 bgcolor: 'white', 
                                 borderRadius: 3, 
                                 border: '1px dashed', 
                                 borderColor: 'divider' 
                             }}>
                                 <Typography color="text.secondary" variant="body2">No items selected yet</Typography>
                                 <Typography color="text.disabled" variant="caption">Select plans from the catalog</Typography>
                             </Box>
                        ) : (
                            <Box>
                                <Stack spacing={2} sx={{ mb: 3 }}>
                                    {cart.map(item => (
                                        <Box key={item.id} sx={{ 
                                            p: 2, 
                                            bgcolor: 'white', 
                                            borderRadius: 3, 
                                            border: '1px solid', 
                                            borderColor: 'divider',
                                            position: 'relative'
                                        }}>
                                            <IconButton 
                                                size="small" 
                                                onClick={() => removeFromCart(item.id)}
                                                sx={{ position: 'absolute', top: 8, right: 8, color: 'text.disabled' }}
                                            >
                                                <Typography variant="caption" sx={{ fontSize: '14px' }}>×</Typography>
                                            </IconButton>
                                            <Typography variant="subtitle2" sx={{ fontWeight: 700, pr: 3 }}>{item.name}</Typography>
                                            <Typography variant="body2" color="primary.main" fontWeight={700} sx={{ mt: 0.5 }}>
                                                ${item.price.toFixed(2)}
                                            </Typography>
                                            
                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, mt: 1.5 }}>
                                                {item.coverage?.map(c => (
                                                    <Chip 
                                                        key={c.profile_id}
                                                        label={`${c.name}`}
                                                        size="small"
                                                        sx={{ 
                                                            height: 22, 
                                                            fontSize: '0.65rem',
                                                            bgcolor: '#f1f5f9',
                                                            color: 'text.primary',
                                                            fontWeight: 600,
                                                            borderRadius: 1
                                                        }}
                                                    />
                                                ))}
                                            </Box>
                                        </Box>
                                    ))}
                                </Stack>
                                
                                <Divider sx={{ mb: 2, borderStyle: 'dashed' }} />
                                
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, px: 1 }}>
                                    <Typography variant="h6" fontWeight={600}>Total Amount</Typography>
                                    <Typography variant="h5" color="primary.main" fontWeight={800}>
                                        ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                    </Typography>
                                </Box>
                                
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    size="large"
                                    onClick={handleCheckout}
                                    disabled={submitting}
                                    sx={{ 
                                        borderRadius: 3, 
                                        py: 2, 
                                        fontWeight: 800,
                                        boxShadow: '0 10px 15px -3px rgba(25, 118, 210, 0.3)',
                                        textTransform: 'none',
                                        fontSize: '1rem'
                                    }}
                                >
                                    {submitting ? 'Processing...' : 'Confirm Enrollment'}
                                </Button>
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'center', mt: 2 }}>
                                    Prices include all applicable taxes and fees.
                                </Typography>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>

            {/* Coverage Selection Dialog */}
            <Dialog 
                open={coverageDialogOpen} 
                onClose={() => setCoverageDialogOpen(false)}
                maxWidth="xs"
                fullWidth
                PaperProps={{ sx: { borderRadius: 3, p: 1 } }}
            >
                <DialogTitle sx={{ fontWeight: 700 }}>Who is this for?</DialogTitle>
                <DialogContent>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                        Select the family members who will use this {pendingItem?.type.toLowerCase()}.
                    </Typography>
                    <FormGroup>
                        {profiles.map(profile => (
                            <FormControlLabel
                                key={profile.profile_id}
                                control={
                                    <Checkbox 
                                        checked={selectedProfileIds.includes(profile.profile_id)}
                                        onChange={(e) => {
                                            if (e.target.checked) {
                                                setSelectedProfileIds(prev => [...prev, profile.profile_id]);
                                            } else {
                                                setSelectedProfileIds(prev => prev.filter(id => id !== profile.profile_id));
                                            }
                                        }}
                                    />
                                }
                                label={
                                    <Box display="flex" alignItems="center" gap={1}>
                                        <Typography variant="body2">
                                            {profile.first_name + ' ' + (profile.last_name || '')}
                                        </Typography>
                                        <Chip 
                                            label={getAgeGroupName(profile.date_of_birth, ageGroups)} 
                                            size="small" 
                                            sx={{ height: 18, fontSize: '0.6rem' }} 
                                        />
                                        {profile.is_primary && <StarIcon sx={{ fontSize: 14, color: '#f59e0b' }} />}
                                    </Box>
                                }
                                sx={{ mb: 1 }}
                            />
                        ))}
                    </FormGroup>
                </DialogContent>
                <DialogActions sx={{ p: 3 }}>
                    <Button onClick={() => setCoverageDialogOpen(false)} color="inherit" sx={{ fontWeight: 600 }}>
                        Cancel
                    </Button>
                    <Button 
                        onClick={handleConfirmCoverage} 
                        variant="contained" 
                        disabled={selectedProfileIds.length === 0}
                        sx={{ fontWeight: 700, px: 4, borderRadius: 2 }}
                    >
                        Confirm
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
