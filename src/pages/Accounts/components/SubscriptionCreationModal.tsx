
import { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, Button, 
    Grid, Typography, Box, Tabs, Tab, Card, CardContent, 
    Radio, Checkbox, CircularProgress
} from '@mui/material';
import { basePriceService, BasePrice } from '../../../services/basePriceService';
import { membershipService, MembershipProgram, MembershipCategory } from '../../../services/membershipService';
import { billingService } from '../../../services/billingService';
import { useAuth } from '../../../context/AuthContext';

interface SubscriptionCreationModalProps {
    open: boolean;
    onClose: () => void;
    accountId: string;
    profileId: string;
    onSuccess: () => void;
}

export const SubscriptionCreationModal = ({ open, onClose, accountId, profileId, onSuccess }: SubscriptionCreationModalProps) => {
    const { currentLocationId, loginId, userParams } = useAuth();
    const staffName = `${userParams?.first_name || ''} ${userParams?.last_name || ''}`.trim();

    const [activeTab, setActiveTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    
    // Data
    const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
    const [membershipPrograms, setMembershipPrograms] = useState<MembershipProgram[]>([]);

    // Selection
    const [selectedBasePriceId, setSelectedBasePriceId] = useState<string | null>(null);
    const [selectedCategoryIds, _setSelectedCategoryIds] = useState<string[]>([]);

    useEffect(() => {
        if (open && currentLocationId) {
            loadMarketplaceData();
        }
    }, [open, currentLocationId]);

    const loadMarketplaceData = async () => {
        if (!currentLocationId) return;
        setLoading(true);
        try {
            const [bpData, mpData] = await Promise.all([
                basePriceService.getAll(currentLocationId),
                membershipService.getMemberships(currentLocationId)
            ]);
            
            setBasePrices(bpData.prices || []);
            setMembershipPrograms(mpData || []);
        } catch (error) {
            console.error("Failed to load marketplace data", error);
        } finally {
            setLoading(false);
        }
    };

    const handleToggleCategory = (categoryId: string) => {
        if (!categoryId) return;
        _setSelectedCategoryIds(prev => 
            prev.includes(categoryId) 
                ? prev.filter(id => id !== categoryId)
                : [...prev, categoryId]
        );
    };

    const handleCreate = async () => {
        if (!currentLocationId || !accountId) return;
        setSubmitting(true);
        try {
            const promises: Promise<any>[] = [];

            // 1. Base Plan Subscription
            if (selectedBasePriceId) {
                const bp = basePrices.find(p => p.base_price_id === selectedBasePriceId);
                if (bp) {
                    promises.push(billingService.createSubscription({
                        account_id: accountId,
                        location_id: currentLocationId,
                        subscription_type: 'MEMBERSHIP_FEE',
                        reference_id: bp.base_price_id,
                        subscription_term_id: bp.subscription_term_id,
                        unit_price_snapshot: bp.price,
                        total_amount: bp.price,
                        coverage: [{ profile_id: profileId, role: 'PRIMARY' }],
                        staff_id: loginId || null,
                        staff_name: staffName || null
                    }));
                }
            }

            // 2. Membership Categories
             selectedCategoryIds.forEach(catId => {
                const cat = membershipPrograms.flatMap(p => p.categories).find(c => c.category_id === catId);
                if (cat) {
                    const totalFees = cat.fees?.reduce((sum, f) => sum + f.amount, 0) || 0;
                     promises.push(billingService.createSubscription({
                        account_id: accountId,
                        location_id: currentLocationId,
                        subscription_type: 'MEMBERSHIP_FEE',
                        reference_id: cat.category_id,
                        unit_price_snapshot: totalFees,
                        total_amount: totalFees,
                        coverage: [{ profile_id: profileId, role: 'PRIMARY' }],
                        staff_id: loginId || null,
                        staff_name: staffName || null
                    }));
                }
            });

            await Promise.all(promises);

            onSuccess();
            onClose();
        } catch (error) {
            console.error("Failed to create subscription", error);
        } finally {
            setSubmitting(false);
        }
    };

    const formatPrice = (price: number) => `$${price.toFixed(2)}`;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle>Create Subscription</DialogTitle>
            <DialogContent dividers>
                {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                        <CircularProgress />
                    </Box>
                ) : (
                    <Box>
                        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ mb: 2 }}>
                            <Tab label="Base Plans" />
                            <Tab label="Memberships" />
                        </Tabs>

                        {/* Base Plans Tab */}
                        {activeTab === 0 && (
                            <Grid container spacing={2}>
                                {basePrices.map((bp) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={bp.base_price_id}>
                                        <Card variant="outlined" sx={{ 
                                            borderColor: selectedBasePriceId === bp.base_price_id ? 'primary.main' : 'divider',
                                            bgcolor: selectedBasePriceId === bp.base_price_id ? 'primary.50' : 'background.paper',
                                            cursor: 'pointer'
                                        }} onClick={() => setSelectedBasePriceId(bp.base_price_id || null)}>
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="h6">{bp.name}</Typography>
                                                    <Radio 
                                                        checked={selectedBasePriceId === bp.base_price_id} 
                                                        value={bp.base_price_id}
                                                        name="base-price-radio"
                                                        onChange={() => setSelectedBasePriceId(bp.base_price_id || null)}
                                                    />
                                                </Box>
                                                <Typography variant="subtitle1" color="primary" fontWeight="bold">
                                                    {formatPrice(bp.price)}
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary">
                                                    {bp.age_group_name} • {bp.role}
                                                </Typography>
                                            </CardContent>
                                        </Card>
                                    </Grid>
                                ))}
                                {basePrices.length === 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography color="text.secondary" align="center">No Base Plans configured.</Typography>
                                    </Grid>
                                )}
                            </Grid>
                        )}

                        {/* Memberships Tab */}
                        {activeTab === 1 && (
                             <Grid container spacing={2}>
                                {membershipPrograms.flatMap(mp => mp.categories).map((cat: MembershipCategory) => (
                                    <Grid size={{ xs: 12, sm: 6 }} key={cat.category_id}>
                                         <Card variant="outlined">
                                            <CardContent>
                                                <Box display="flex" justifyContent="space-between" alignItems="center">
                                                    <Typography variant="h6">{cat.name}</Typography>
                                                    <Checkbox 
                                                        checked={selectedCategoryIds.includes(cat.category_id || '')}
                                                        onChange={() => handleToggleCategory(cat.category_id || '')}
                                                    /> 
                                                </Box>
                                                <Typography variant="body2" color="text.secondary">
                                                    {cat.fees?.map(f => `${f.fee_type}: ${formatPrice(f.amount)}`).join(', ')}
                                                </Typography>
                                            </CardContent>
                                         </Card>
                                    </Grid>
                                ))}
                                {membershipPrograms.length === 0 && (
                                    <Grid size={{ xs: 12 }}>
                                        <Typography color="text.secondary" align="center">No Membership Programs found.</Typography>
                                    </Grid>
                                )}
                             </Grid>
                        )}
                    </Box>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={submitting}>Cancel</Button>
                <Button 
                    onClick={handleCreate} 
                    variant="contained" 
                    disabled={submitting || (!selectedBasePriceId && selectedCategoryIds.length === 0)}
                >
                    {submitting ? 'Processing...' : 'Create Subscription'}
                </Button>
            </DialogActions>
        </Dialog>
    );
};
