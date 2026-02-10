
import { useEffect, useState } from 'react';
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
    Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { basePriceService, BasePrice } from '../../services/basePriceService';
import { membershipService, MembershipProgram } from '../../services/membershipService';
import { serviceCatalog, Service } from '../../services/serviceCatalog';
import { billingService } from '../../services/billingService';
import { crmService } from '../../services/crmService';

interface CartItem {
    id: string; // unique key
    type: 'BASE' | 'MEMBERSHIP' | 'SERVICE';
    referenceId: string; // base_price_id, category_id, service_id/pack_id
    name: string;
    price: number;
    description?: string;
    // Metadata for creation
    metadata?: any;
}

export const Marketplace = () => {
    const { accountId } = useParams<{ accountId: string }>();
    const navigate = useNavigate();
    const { currentLocationId } = useAuth();
    
    // Data States
    const [loading, setLoading] = useState(true);
    const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
    const [membershipPrograms, setMembershipPrograms] = useState<MembershipProgram[]>([]);
    const [services, setServices] = useState<Service[]>([]);

    // UI States
    const [tabValue, setTabValue] = useState(0);
    const [cart, setCart] = useState<CartItem[]>([]);
    const [submitting, setSubmitting] = useState(false);
    
    // Account Context (for coverage selection later)
    const [primaryProfileId, setPrimaryProfileId] = useState<string | null>(null);

    useEffect(() => {
        const loadData = async () => {
            if (!currentLocationId || !accountId) return;
            setLoading(true);
            try {
                // Fetch Account to get Primary Profile
                const accountRes = await crmService.getAccountDetails(accountId, currentLocationId || undefined);
                const accountData = accountRes.data || accountRes;
                
                // Normalize profiles key
                const profiles = accountData.profiles || accountData.profile || [];
                const primary = profiles.find((p: any) => p.is_primary);
                setPrimaryProfileId(primary ? primary.profile_id : (profiles[0]?.profile_id || null));

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

    const addToCart = (item: CartItem) => {
        setCart(prev => {
            if (prev.find(i => i.id === item.id)) {
                return prev.filter(i => i.id !== item.id);
            }
            return [...prev, item];
        });
    };

    const isInCart = (id: string) => cart.some(i => i.id === id);

    const handleCheckout = async () => {
        if (!accountId || !currentLocationId || !primaryProfileId) return;
        setSubmitting(true);
        try {
            const promises = cart.map(item => {
                return billingService.createSubscription({
                    account_id: accountId,
                    location_id: currentLocationId,
                    subscription_type: item.type === 'MEMBERSHIP' ? 'MEMBERSHIP_FEE' : (item.type === 'SERVICE' ? 'ADDON_SERVICE' : item.type), // Mapping type
                    reference_id: item.referenceId,
                    unit_price_snapshot: item.price,
                    total_amount: item.price,
                    coverage: [{ profile_id: primaryProfileId, role: 'PRIMARY' }],
                    ...(item.metadata || {})
                }, currentLocationId || undefined);
            });

            await Promise.all(promises);
            navigate(`/admin/accounts/${accountId}`);
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
                breadcrumbs={[
                    { label: 'Dashboard', href: '/admin/settings' },
                    { label: 'Accounts', href: '/admin/accounts' },
                    { label: 'Detail', href: `/admin/accounts/${accountId}` },
                    { label: 'Shop', active: true }
                ]}
                action={
                    <Button 
                        startIcon={<ArrowBackIcon />} 
                        onClick={() => navigate(`/admin/accounts/${accountId}`)}
                        variant="outlined"
                    >
                        Back
                    </Button>
                }
            />

            <Grid container spacing={3}>
                <Grid size={{ xs: 12, md: 8 }}>
                     <Paper sx={{ width: '100%', mb: 2 }}>
                        <Tabs value={tabValue} onChange={handleTabChange} sx={{ borderBottom: 1, borderColor: 'divider' }}>
                            <Tab label="Base Plans" />
                            <Tab label="Memberships" />
                            <Tab label="Services" />
                        </Tabs>
                        
                        <Box sx={{ p: 3 }}>
                            {/* Base Plans */}
                            {tabValue === 0 && (
                                <Grid container spacing={2}>
                                    {basePrices.map(bp => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={bp.base_price_id}>
                                            <Card variant="outlined" sx={{ 
                                                borderColor: isInCart(bp.base_price_id!) ? 'primary.main' : 'divider',
                                                bgcolor: isInCart(bp.base_price_id!) ? 'primary.50' : 'background.paper',
                                                transition: 'all 0.2s'
                                            }}>
                                                <CardContent>
                                                    <Box display="flex" justifyContent="space-between" alignItems="start">
                                                        <Box>
                                                            <Typography variant="h6">{bp.name}</Typography>
                                                            <Typography variant="subtitle2" color="text.secondary">
                                                                {bp.age_group_name} • {bp.role}
                                                            </Typography>
                                                        </Box>
                                                        <Checkbox 
                                                            checked={isInCart(bp.base_price_id!)}
                                                            onChange={() => addToCart({
                                                                id: bp.base_price_id!,
                                                                type: 'BASE',
                                                                referenceId: bp.base_price_id!,
                                                                name: bp.name,
                                                                price: bp.price,
                                                                metadata: { subscription_term_id: bp.subscription_term_id }
                                                            })}
                                                        />
                                                    </Box>
                                                    <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                                                        ${bp.price.toFixed(2)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}

                             {/* Memberships */}
                             {tabValue === 1 && (
                                <Grid container spacing={2}>
                                    {membershipPrograms.flatMap(mp => mp.categories).map(cat => (
                                        <Grid size={{ xs: 12, sm: 6 }} key={cat.category_id}>
                                            <Card variant="outlined" sx={{
                                                borderColor: isInCart(cat.category_id!) ? 'primary.main' : 'divider',
                                                bgcolor: isInCart(cat.category_id!) ? 'primary.50' : 'background.paper'
                                            }}>
                                                <CardContent>
                                                    <Box display="flex" justifyContent="space-between" alignItems="start">
                                                        <Box>
                                                            <Typography variant="h6">{cat.name}</Typography>
                                                            <Typography variant="body2" color="text.secondary">
                                                                {cat.fees.map(f => `${f.fee_type}: $${f.amount}`).join(', ')}
                                                            </Typography>
                                                        </Box>
                                                        <Checkbox 
                                                             checked={isInCart(cat.category_id!)}
                                                             onChange={() => addToCart({
                                                                 id: cat.category_id!,
                                                                 type: 'MEMBERSHIP',
                                                                 referenceId: cat.category_id!,
                                                                 name: cat.name,
                                                                 price: cat.fees.reduce((acc, f) => acc + f.amount, 0)
                                                             })}
                                                        />
                                                    </Box>
                                                    <Typography variant="h5" color="primary" sx={{ mt: 2 }}>
                                                        ${cat.fees.reduce((acc, f) => acc + f.amount, 0).toFixed(2)}
                                                    </Typography>
                                                </CardContent>
                                            </Card>
                                        </Grid>
                                    ))}
                                </Grid>
                            )}

                              {/* Services */}
                             {tabValue === 2 && (
                                 <Grid container spacing={3}>
                                     {services.map(s => (
                                         <Grid size={{ xs: 12, md: 6 }} key={s.service_id}>
                                            <Card variant="outlined" sx={{ 
                                                height: '100%', 
                                                display: 'flex', 
                                                flexDirection: 'column',
                                                borderRadius: 2,
                                                overflow: 'hidden',
                                                border: '1px solid',
                                                borderColor: 'divider',
                                                transition: 'all 0.3s ease',
                                                '&:hover': {
                                                    boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
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
                                                        <Chip 
                                                            label={s.service_type || 'Service'} 
                                                            size="small" 
                                                            variant="outlined"
                                                            sx={{ 
                                                                borderRadius: '6px', 
                                                                fontSize: '0.65rem', 
                                                                fontWeight: 700,
                                                                color: 'primary.main',
                                                                borderColor: 'primary.light'
                                                            }} 
                                                        />
                                                    </Box>
                                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3, minHeight: '3em' }}>
                                                        {s.description || 'No description provided.'}
                                                    </Typography>
                                                    
                                                    <Divider sx={{ my: 2, borderStyle: 'dashed' }} />
                                                    
                                                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary', textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                                        Available Packs
                                                    </Typography>
                                                    
                                                    <Stack spacing={1.5}>
                                                        {s.packs && s.packs.length > 0 ? (
                                                            s.packs.map((p: any) => {
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
                                                                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                                                                                {p.name}
                                                                            </Typography>
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
                                                                                onChange={() => addToCart({
                                                                                    id: p.service_pack_id!,
                                                                                    type: 'SERVICE',
                                                                                    referenceId: p.service_pack_id!,
                                                                                    name: `${s.name} - ${p.name}`,
                                                                                    price: minPrice,
                                                                                    metadata: {
                                                                                        service_id: s.service_id,
                                                                                        // For services, the first price is used as a default if no term selected
                                                                                        subscription_term_id: p.prices?.[0]?.subscription_term_id
                                                                                    }
                                                                                })}
                                                                            />
                                                                        </Box>
                                                                    </Box>
                                                                );
                                                            })
                                                        ) : (
                                                            <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                                                                No packs available for this service.
                                                            </Typography>
                                                        )}
                                                    </Stack>
                                                </CardContent>
                                            </Card>
                                         </Grid>
                                     ))}
                                     {services.length === 0 && (
                                         <Grid size={12}>
                                             <Typography color="text.secondary" align="center" sx={{ py: 4 }}>
                                                 No services found for this location.
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
                    <Paper sx={{ p: 3, position: 'sticky', top: 20 }}>
                        <Box display="flex" alignItems="center" gap={1} mb={2}>
                            <ShoppingCartIcon color="primary" />
                            <Typography variant="h6">Comparison / Selection</Typography>
                        </Box>
                        <Divider sx={{ mb: 2 }} />
                        
                        {cart.length === 0 ? (
                             <Typography color="text.secondary">No items selected.</Typography>
                        ) : (
                            <Box>
                                {cart.map(item => (
                                    <Box key={item.id} sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                                        <Typography variant="body2">{item.name}</Typography>
                                        <Typography variant="body2" fontWeight="bold">${item.price.toFixed(2)}</Typography>
                                    </Box>
                                ))}
                                <Divider sx={{ my: 2 }} />
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                                    <Typography variant="h6">Total</Typography>
                                    <Typography variant="h6" color="primary">
                                        ${cart.reduce((sum, item) => sum + item.price, 0).toFixed(2)}
                                    </Typography>
                                </Box>
                                
                                <Button 
                                    fullWidth 
                                    variant="contained" 
                                    size="large"
                                    onClick={handleCheckout}
                                    disabled={submitting}
                                >
                                    {submitting ? 'Creating...' : 'Create Subscriptions'}
                                </Button>
                            </Box>
                        )}
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
};
