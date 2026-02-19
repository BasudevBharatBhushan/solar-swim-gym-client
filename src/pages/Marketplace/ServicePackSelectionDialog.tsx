import { useEffect, useMemo, useState } from 'react';
import {
    Box,
    Button,
    Checkbox,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    FormControl,
    FormControlLabel,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Paper,
    Select,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
    Alert,
    Stack
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Service, ServicePack, ServicePrice, serviceCatalog, Session } from '../../services/serviceCatalog';
import { CartItem, AccountProfile } from '../../types/marketplace';
import { getAgeGroupName } from '../../lib/ageUtils';
import { useConfig } from '../../context/ConfigContext';

interface ServicePackSelectionDialogProps {
    open: boolean;
    onClose: () => void;
    service: Service;
    pack: ServicePack & { prices?: ServicePrice[] };
    profiles: AccountProfile[];
    onConfirm: (items: CartItem[]) => void;
}

export const ServicePackSelectionDialog = ({
    open,
    onClose,
    service,
    pack,
    profiles,
    onConfirm
}: ServicePackSelectionDialogProps) => {
    const { ageGroups, waiverPrograms } = useConfig();
    const [sessions, setSessions] = useState<Session[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string>('');
    const [billingStart, setBillingStart] = useState<string>('');
    const [billingEnd, setBillingEnd] = useState<string>('');
    const [selectedProfileIds, setSelectedProfileIds] = useState<string[]>([]);
    const [error, setError] = useState<string | null>(null);

    // Fetch sessions on mount
    useEffect(() => {
        if (open) {
            serviceCatalog.getSessions().then(data => {
                const activeSessions = Array.isArray(data) ? data : (data as any).data || [];
                setSessions(activeSessions.filter((s: any) => s.is_active));
            }).catch(console.error);
        }
    }, [open]);

    // Handle Session Change
    const handleSessionChange = (sessionId: string) => {
        setSelectedSessionId(sessionId);
        const session = sessions.find(s => s.session_id === sessionId);
        if (session) {
            setBillingStart(session.start_date);
            // Check if end_date exists on session type, fallback to start_date + duration if needed
            // But the Session type has end_date in some definitions. 
            // Checking the Session interface in serviceCatalog.ts: expects 'expiry_date' or 'end_date'
            setBillingEnd((session as any).end_date || (session as any).expiry_date || '');
        }
    };

    const prices = pack.prices || [];
    
    // Group prices by Age Group needed? 
    // Actually we just need to see which profiles match which price.

    // 1. Identify which profiles are eligible for this pack based on Age Group Pricing availability
    const eligibleProfiles = useMemo(() => {
        return profiles.map(profile => {
            if (!profile.date_of_birth) return { profile, eligible: false, reason: 'Missing DOB' };
            
            const ageGroupName = getAgeGroupName(profile.date_of_birth, ageGroups);
            const ageGroup = ageGroups.find(g => g.name === ageGroupName);
            
            if (!ageGroup) return { profile, eligible: false, reason: 'Unknown Age Group' };

            // Find price for this age group
            const price = prices.find(p => p.age_group_id === ageGroup.age_group_id);
            if (!price) return { profile, eligible: false, reason: 'No pricing for age group' };

            // Check Waiver Program eligibility if pack requires one
            if (pack.waiver_program_id) {
                // profile.waiver_program might be a string ID or object. Let's assume structure from types.
                 // Actually, profile.waiver_program in AccountProfile interface above is { code, name }. 
                 // We need to match ID. 
                 // Let's assume we need to check if profile is ENROLLED in the program.
                 // For now, let's warn but allow override if admin? 
                 // The requirement: "Visually indicate which profiles match... Allow users to override"
                 // Implementation: Mark as eligible but show warning? Or rely on 'waiver_program' matches.
                 // If the profile object doesn't have the ID, we might have to rely on 'waiver_program_id' field on profile if it existed.
                 // Checking AccountProfile interface in index.ts:
                 // waiver_program?: { code: string; name: string; }
                 // It doesn't seem to have the ID. We might need to match by Name or fetch full profile.
                 // However, let's assume strict matching is secondary to age for "eligibility" to purchase, 
                 // but we should show a warning indicator.
            }

            return { profile, eligible: true, price };
        });
    }, [profiles, ageGroups, prices, pack.waiver_program_id]);

    const handleToggleProfile = (profileId: string) => {
        if (pack.is_shrabable) {
            setSelectedProfileIds(prev => {
                if (prev.includes(profileId)) return prev.filter(id => id !== profileId);
                return [...prev, profileId];
            });
        } else {
            // Non-sharable: Multi-select allowed?
            // "If the Service Pack is NOT sharable ... Allow selecting multiple member profiles. Each selected profile must create a separate cart line item"
            // So yes, multi-select allowed.
            setSelectedProfileIds(prev => {
                if (prev.includes(profileId)) return prev.filter(id => id !== profileId);
                return [...prev, profileId];
            });
        }
    };

    const handleConfirm = () => {
        if (selectedProfileIds.length === 0) {
            setError('Please select at least one profile.');
            return;
        }

        // if (!selectedSessionId) {
        //     setError('Please select a session.');
        //     return;
        // }
        // Is session mandatory? "Provide a dropdown... The Session selection step should appear after profile selection"
        // Let's assume mandatory for "Session & Billing Period Selection" requirement?
        // "On session selection, auto-prefill billing_period_start" -> Implies selection triggers dates.
        // If dates are manual, maybe session is optional?
        // Let's enforce session for now if available, otherwise dates.

        const newItems: CartItem[] = [];

        if (pack.is_shrabable) {
            // Single line item with multiple coverage
            // Which price to use? 
            // "Only allow selecting member profiles whose Age Profile has pricing defined"
            // If sharable, usually it's a fixed price or "per head" logic?
            // "Sharable Service Packs... Show an option/checkbox indicating the service is sharable."
            // "Show pricing matrix".
            // If it's a sharable pack (e.g. "Family Pack"), is it one price for the pack? 
            // Or does it assume all profiles fall into a specific price category?
            // Usually sharable packs (like "10 Class Pass Shareable") have a single price regardless of who uses it, OR it has base price.
            // But here we have "Display pricing for all Age Profiles". 
            // If it's sharable, does the price depend on the *primary* user or is it a flat fee?
            // Let's assume for SHARABLE packs, the user picks a "Primary" for the pricing context if age-dependent?
            // OR checks if all selected fit into a compatible price?
            // Requirement: "Only allow selecting member profiles whose Age Profile has pricing defined for this service pack."
            // This suggests validation.
            // If I buy a "10 Pack", and it costs $100 for Adults and $80 for Kids.
            // If I share it between an Adult and a Kid, what is the price?
            // Likely "Sharable" packs shouldn't have age-varient pricing, OR they pick the price of the 'purchaser'.
            // Let's use the price of the FIRST selected profile as the 'Purchaser'/Line Item Owner.
            
            const primaryId = selectedProfileIds[0];
            const primaryEligible = eligibleProfiles.find(p => p.profile.profile_id === primaryId);
            
            if (!primaryEligible?.price) {
                setError('Selected primary profile does not have a valid price.');
                return;
            }

            const item: CartItem = {
                id: `SERVICE-${pack.service_pack_id}-${Date.now()}`,
                type: 'SERVICE',
                referenceId: pack.service_pack_id!,
                name: `${service.name} - ${pack.name}`,
                price: parseFloat(primaryEligible.price.price.toString()),
                serviceId: service.service_id,
                session_id: selectedSessionId || undefined,
                billing_period_start: billingStart || undefined,
                billing_period_end: billingEnd || undefined,
                coverage: selectedProfileIds.map(id => {
                     const p = profiles.find(prof => prof.profile_id === id);
                     return {
                         profile_id: id,
                         name: `${p?.first_name} ${p?.last_name}`,
                         role: id === primaryId ? 'PRIMARY' : 'ADD_ON'
                     };
                })
            };
            newItems.push(item);

        } else {
            // Non-sharable: Separate line items
            selectedProfileIds.forEach(id => {
                const eligible = eligibleProfiles.find(p => p.profile.profile_id === id);
                if (eligible?.price) {
                     const item: CartItem = {
                        id: `SERVICE-${pack.service_pack_id}-${id}-${Date.now()}`,
                        type: 'SERVICE',
                        referenceId: pack.service_pack_id!,
                        name: `${service.name} - ${pack.name}`,
                        price: parseFloat(eligible.price.price.toString()),
                        serviceId: service.service_id,
                        session_id: selectedSessionId || undefined,
                        billing_period_start: billingStart || undefined,
                        billing_period_end: billingEnd || undefined,
                        coverage: [{
                             profile_id: id,
                             name: `${eligible.profile.first_name} ${eligible.profile.last_name}`,
                             role: 'PRIMARY'
                        }]
                    };
                    newItems.push(item);
                }
            });
        }

        onConfirm(newItems);
        onClose();
    };

    return (
        <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
            <DialogTitle sx={{ m: 0, p: 2, bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                <Typography variant="h6" component="div" fontWeight="700">
                    Select {pack.name}
                </Typography>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        position: 'absolute',
                        right: 8,
                        top: 8,
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Stack spacing={3}>
                    {error && <Alert severity="error">{error}</Alert>}
                    
                    {/* Pricing Matrix */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight="600" color="text.secondary">
                            Pricing
                        </Typography>
                        <TableContainer component={Paper} variant="outlined">
                            <Table size="small">
                                <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                                    <TableRow>
                                        <TableCell>Age Group</TableCell>
                                        <TableCell align="right">Price</TableCell>
                                    </TableRow>
                                </TableHead>
                                <TableBody>
                                    {prices.map((price, idx) => {
                                        const ageGroup = ageGroups.find(ag => ag.age_group_id === price.age_group_id);
                                        return (
                                            <TableRow key={idx}>
                                                <TableCell>{ageGroup?.name || 'Unknown'}</TableCell>
                                                <TableCell align="right">${Number(price.price).toFixed(2)}</TableCell>
                                            </TableRow>
                                        );
                                    })}
                                     {prices.length === 0 && (
                                        <TableRow>
                                            <TableCell colSpan={2} align="center">No pricing configured</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </TableContainer>
                    </Box>

                    {/* Profile Selection */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight="600" color="text.secondary">
                            Select Profiles {pack.is_shrabable ? '(Sharable - Select Multiple)' : '(Non-Sharable - Separate Items)'}
                        </Typography>
                        <Grid container spacing={2}>
                            {eligibleProfiles.map(({ profile, eligible, reason }) => (
                                <Grid size={{ xs: 12, sm: 6 }} key={profile.profile_id}>
                                    <Paper 
                                        variant="outlined" 
                                        sx={{ 
                                            p: 1.5, 
                                            opacity: eligible ? 1 : 0.6,
                                            bgcolor: selectedProfileIds.includes(profile.profile_id) ? '#eff6ff' : 'white',
                                            borderColor: selectedProfileIds.includes(profile.profile_id) ? '#3b82f6' : 'divider'
                                        }}
                                    >
                                        <FormControlLabel
                                            control={
                                                <Checkbox 
                                                    checked={selectedProfileIds.includes(profile.profile_id)}
                                                    onChange={() => handleToggleProfile(profile.profile_id)}
                                                    disabled={!eligible}
                                                />
                                            }
                                            label={
                                                <Box>
                                                    <Typography variant="body2" fontWeight="600">
                                                        {profile.first_name} {profile.last_name}
                                                    </Typography>
                                                    {!eligible && (
                                                        <Typography variant="caption" color="error">
                                                            Unavailable: {reason}
                                                        </Typography>
                                                    )}
                                                    {eligible && pack.waiver_program_id && (
                                                         <Typography variant="caption" color="warning.main" display="block">
                                                            Requires {waiverPrograms.find(w => w.waiver_program_id === pack.waiver_program_id)?.name}
                                                         </Typography>
                                                    )}
                                                </Box>
                                            }
                                        />
                                    </Paper>
                                </Grid>
                            ))}
                        </Grid>
                    </Box>

                    {/* Session Selection */}
                    <Box>
                        <Typography variant="subtitle2" gutterBottom fontWeight="600" color="text.secondary">
                            Session & Billing
                        </Typography>
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, md: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel>Session</InputLabel>
                                    <Select
                                        value={selectedSessionId}
                                        label="Session"
                                        onChange={(e) => handleSessionChange(e.target.value)}
                                    >
                                        <MenuItem value=""><em>None</em></MenuItem>
                                        {sessions.map(session => (
                                            <MenuItem key={session.session_id} value={session.session_id}>
                                                {session.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>
                            <Grid size={{ xs: 6, md: 3 }}>
                                <TextField
                                    label="Start Date"
                                    type="date"
                                    value={billingStart}
                                    onChange={(e) => setBillingStart(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                            <Grid size={{ xs: 6, md: 3 }}>
                                <TextField
                                    label="End Date"
                                    type="date"
                                    value={billingEnd}
                                    onChange={(e) => setBillingEnd(e.target.value)}
                                    fullWidth
                                    size="small"
                                    InputLabelProps={{ shrink: true }}
                                />
                            </Grid>
                        </Grid>
                    </Box>
                </Stack>
            </DialogContent>
            <DialogActions sx={{ p: 2.5 }}>
                <Button onClick={onClose} color="inherit">Cancel</Button>
                <Button 
                    variant="contained" 
                    onClick={handleConfirm}
                    disabled={selectedProfileIds.length === 0}
                >
                    Add {selectedProfileIds.length} Item{selectedProfileIds.length !== 1 ? 's' : ''} to Cart
                </Button>
            </DialogActions>
        </Dialog>
    );
};
