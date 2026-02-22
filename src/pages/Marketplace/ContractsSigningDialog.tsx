import { useState, useRef, useEffect } from 'react';
import {
    Box,
    Button,
    Dialog,
    DialogContent,
    DialogTitle,
    DialogActions,
    Grid,
    IconButton,
    Typography,
    Alert,
    Checkbox,
    FormControlLabel,
    List,
    ListItem,
    ListItemButton,
    Chip,
    CircularProgress,
    useTheme,
    useMediaQuery
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';

import { WaiverPreview } from '../../components/Waiver/WaiverPreview';
import { SignaturePad, SignaturePadRef, getSignatureBlob } from '../../components/Waiver/SignaturePad';
import { waiverService, WaiverTemplate } from '../../services/waiverService';
import { CartItem } from '../../types/marketplace';

// Need a simple formatter if formatCurrency isn't exported from ageUtils
const fmtCurr = (value: number) => `$${(value || 0).toFixed(2)}`;

interface ContractsSigningDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cart: CartItem[];
    templates: WaiverTemplate[];
    primaryProfile: any; // { first_name, last_name, guardian_name, etc. }
    locationId: string;
    subscriptionTerms?: any[]; // For term name resolution
    companyConfig?: { name?: string; address?: string };
}

interface ContractState {
    id: string; // unique ID for the contract item (could match cart item id)
    cartItem: CartItem;
    template: WaiverTemplate;
    content: string; // The dynamically replaced content
    isSigned: boolean;
    signatureUrl: string | null;
    agreed: boolean;
    error: string | null;
    loading: boolean;
}

export const ContractsSigningDialog = ({
    open,
    onClose,
    onSuccess,
    cart,
    templates,
    primaryProfile,
    locationId,
    subscriptionTerms = [],
    companyConfig
}: ContractsSigningDialogProps) => {
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('md'));
    const signaturePadRef = useRef<SignaturePadRef>(null);

    const [activeTab, setActiveTab] = useState(0);
    const [contracts, setContracts] = useState<ContractState[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const primaryName = `${primaryProfile?.first_name || ''} ${primaryProfile?.last_name || ''}`.trim();
    const guardianName = primaryProfile?.guardian_name || 'N/A';
    const currentDate = new Date().toLocaleDateString();

    const cName = companyConfig?.name || 'Company Name';
    const cAddress = companyConfig?.address || 'Company Address';

    // Extract dynamic variables
    useEffect(() => {
        if (!open) return;

        const newContracts: ContractState[] = [];

        cart.forEach(item => {
            let matchedTemplate: WaiverTemplate | undefined;

            if (item.type === 'SERVICE') {
                matchedTemplate = templates.find(t => t.service_id === item.serviceId);
            } else if (item.type === 'MEMBERSHIP') {
                matchedTemplate = templates.find(t => t.membership_category_id === item.membershipCategoryId);
            }

            if (matchedTemplate) {
                // Replace variables
                let content = matchedTemplate.content || '';

                // Standard
                content = content.replace(/\[FullName\]/g, primaryName);
                content = content.replace(/\[GuardianName\]/g, guardianName);
                content = content.replace(/\[CurrentDate\]/g, currentDate);
                content = content.replace(/\[company_name\]/g, cName);
                content = content.replace(/\[company_address\]/g, cAddress);

                // Specific variables based on type
                if (item.type === 'SERVICE') {
                    content = content.replace(/\[service_name\]/g, String(item.metadata?.service_name || item.name || 'Unknown Service'));
                    content = content.replace(/\[service_category\]/g, String(item.metadata?.service_category || 'N/A'));
                    content = content.replace(/\[service_type\]/g, String(item.metadata?.service_type || 'N/A'));
                    content = content.replace(/\[service_pack_name\]/g, String(item.metadata?.service_pack_name || item.name || 'Unknown Pack'));
                    content = content.replace(/\[lession_registration_fee\]/g, String(fmtCurr(0))); // Usually 0 in cart context unless split out
                    content = content.replace(/\[special_program\]/g, String(item.metadata?.special_program || 'None'));
                    
                    const classes = item.metadata?.classes ? String(item.metadata.classes) : 'N/A';
                    content = content.replace(/\[classes\]/g, classes);
                    
                    const durationMap: any = [];
                    if (item.metadata?.duration_months) durationMap.push(`${item.metadata.duration_months} Months`);
                    if (item.metadata?.duration_days) durationMap.push(`${item.metadata.duration_days} Days`);
                    const durStr = durationMap.length > 0 ? durationMap.join(', ') : 'N/A';
                    content = content.replace(/\[service_pack_duration\]/g, durStr);
                    
                    content = content.replace(/\[price\]/g, String(fmtCurr(item.price)));
                    content = content.replace(/\[is_sharable\]/g, item.metadata?.is_shrabable ? 'Yes' : 'No');
                    
                    const coveredNames = (item.coverage || []).map((c: any) => c.name).join(', ') || 'N/A';
                    content = content.replace(/\[shared_proriles\]/g, coveredNames);
                    
                    const usageLimit = item.metadata?.max_uses_per_period 
                        ? `${item.metadata.max_uses_per_period} Uses / ${item.metadata.usage_period_length || 1} ${item.metadata.usage_period_unit || 'Period'}`
                        : 'Unlimited';
                    content = content.replace(/\[usage_limit\]/g, usageLimit);
                    
                    content = content.replace(/\[service_start_date\]/g, currentDate);
                    content = content.replace(/\[service_end_date\]/g, 'N/A'); // Would need calculation

                    const coveredAg = (item.coverage || []).map((c: any) => c.age_group).filter(Boolean).join(', ') || 'N/A';
                    content = content.replace(/\[age_profile\]/g, coveredAg);

                } else if (item.type === 'MEMBERSHIP') {
                    content = content.replace(/\[membership_plan\]/g, String(item.name || 'Unknown Plan'));
                    content = content.replace(/\[subscription_term\]/g, item.feeType === 'ANNUAL' ? 'Annual Renewal' : 'Joining Strategy');
                    content = content.replace(/\[start_date\]/g, currentDate);
                    content = content.replace(/\[end_date\]/g, 'Open-ended'); // Usually open-ended until cancelled
                    
                    // Detailed breakdown
                    const breakdownParts: string[] = [];
                    
                    // 1. Primary Base Plans
                    const primaryPlans = cart.filter(c => c.type === 'BASE' && c.name.toLowerCase().includes('primary'));
                    primaryPlans.forEach(p => {
                        const termName = subscriptionTerms.find(t => t.subscription_term_id === p.subscriptionTermId)?.name || 'Recurring';
                        breakdownParts.push(`<li><strong>Membership Fee (Primary):</strong> ${p.name} (${termName}) - <strong>${fmtCurr(p.price)}</strong></li>`);
                    });

                    // 2. Add-on Base Plans
                    const addonPlans = cart.filter(c => c.type === 'BASE' && c.name.toLowerCase().includes('add_on'));
                    addonPlans.forEach(p => {
                        const termName = subscriptionTerms.find(t => t.subscription_term_id === p.subscriptionTermId)?.name || 'Recurring';
                        breakdownParts.push(`<li><strong>Add-on Fee:</strong> ${p.name} (${termName}) - <strong>${fmtCurr(p.price)}</strong></li>`);
                    });

                    // 3. Joining/Admission fees (the item itself)
                    breakdownParts.push(`<li><strong>${item.feeType === 'ANNUAL' ? 'Renewal' : 'Joining'} Fee:</strong> ${item.name} - <strong>${fmtCurr(item.price)}</strong></li>`);

                    const breakdownHtml = `<ul style="margin-top: 8px; margin-bottom: 8px; padding-left: 20px; list-style-type: disc;">${breakdownParts.join('')}</ul>`;
                    content = content.replace(/\[membership_fee_breakdown\]|\[membershp_fee_breakdown\]/g, breakdownHtml);
                    
                    const coveredNames = (item.coverage || []).map((c: any) => c.name).join(', ') || 'N/A';
                    content = content.replace(/\[profile_coverage\]/g, coveredNames);
                }

                newContracts.push({
                    id: item.id,
                    cartItem: item,
                    template: matchedTemplate,
                    content,
                    isSigned: false,
                    signatureUrl: null,
                    agreed: false,
                    error: null,
                    loading: false
                });
            }
        });

        setContracts(newContracts);
        setActiveTab(0);
    }, [open, cart, templates, primaryName, guardianName, currentDate, cName, cAddress]);

    const handleAgreeChange = (checked: boolean) => {
        setContracts(prev => {
            const next = [...prev];
            next[activeTab] = { ...next[activeTab], agreed: checked };
            return next;
        });
    };

    const handleSignCurrent = async () => {
        const contract = contracts[activeTab];
        if (!contract || !signaturePadRef.current) return;

        if (signaturePadRef.current.isEmpty()) {
            setContracts(prev => {
                const next = [...prev];
                next[activeTab] = { ...next[activeTab], error: 'Please sign to continue.' };
                return next;
            });
            return;
        }

        const canvas = signaturePadRef.current.getCanvas();
        if (!canvas) return;

        setContracts(prev => {
            const next = [...prev];
            next[activeTab] = { ...next[activeTab], loading: true, error: null };
            return next;
        });

        try {
            const blob = await getSignatureBlob(canvas);
            if (!blob) throw new Error("Failed to capture signature");

            const reader = new FileReader();
            reader.readAsDataURL(blob);
            reader.onloadend = async () => {
                const base64 = reader.result as string;
                
                const sigResponse = await waiverService.uploadSignature(base64);
                
                // Keep the signature URL and mark as signed
                setContracts(prev => {
                    const next = [...prev];
                    next[activeTab] = { 
                        ...next[activeTab], 
                        loading: false, 
                        isSigned: true, 
                        signatureUrl: sigResponse.signature_url 
                    };
                    return next;
                });

                // Auto advance if next available
                const nextIndex = contracts.findIndex((c, idx) => idx > activeTab && !c.isSigned);
                if (nextIndex !== -1) {
                    setTimeout(() => setActiveTab(nextIndex), 500);
                }
            };

        } catch (err: any) {
            console.error("Signing failed", err);
            setContracts(prev => {
                const next = [...prev];
                next[activeTab] = { ...next[activeTab], loading: false, error: err.message || "Signing failed" };
                return next;
            });
        }
    };

    const handleCompleteAll = async () => {
        setIsSubmitting(true);
        try {
            // Upload all signed waivers
            await Promise.all(contracts.map(async (c) => {
                if (!c.isSigned || !c.signatureUrl) return;

                const payload = {
                    profile_id: primaryProfile?.profile_id || null, // Best effort
                    waiver_template_id: c.template.waiver_template_id,
                    waiver_type: c.cartItem.type === 'SERVICE' ? 'SERVICE' : 'MEMBERSHIP',
                    content: c.content,
                    signatureUrl: c.signatureUrl, // Assuming waiverService allows signatureUrl direct, yes it does per schema
                    signature_url: c.signatureUrl
                };

                await waiverService.upsertSignedWaiver(payload as any, locationId);
            }));

            onSuccess();
        } catch (err) {
            console.error("Failed to save final contracts", err);
            // Handle error globally
        } finally {
            setIsSubmitting(false);
        }
    };

    if (contracts.length === 0) {
        return null; // Should not be opened if 0 contracts
    }

    const currentContract = contracts[activeTab];
    const allSigned = contracts.every(c => c.isSigned);

    return (
        <Dialog 
            open={open} 
            onClose={onClose} 
            maxWidth="lg" 
            fullWidth
            PaperProps={{
                sx: { borderRadius: 3, overflow: 'hidden', height: isMobile ? '100%' : '85vh', maxHeight: '100%' }
            }}
        >
            <DialogTitle sx={{ 
                m: 0, 
                p: 2, 
                bgcolor: '#f8fafc',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'space-between',
                borderBottom: '1px solid',
                borderColor: 'divider'
            }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ bgcolor: 'primary.main', p: 0.8, borderRadius: 1, display: 'flex' }}>
                        <HistoryEduIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                        Review & Sign Contracts
                    </Typography>
                </Box>
                <IconButton onClick={onClose} size="small" disabled={isSubmitting}>
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Grid container sx={{ flex: 1, height: '100%', overflow: 'hidden', flexDirection: isMobile ? 'column' : 'row' }}>
                    
                    {/* Sidebar Tabs */}
                    <Grid size={{ xs: 12, md: 3 }} sx={{ 
                        borderRight: isMobile ? 'none' : '1px solid #e2e8f0', 
                        borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                        bgcolor: '#f8fafc',
                        overflowY: 'auto',
                        maxHeight: isMobile ? '200px' : '100%',
                        height: isMobile ? 'auto' : '100%'
                    }}>
                        {!isMobile && (
                            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                                <Typography variant="subtitle2" sx={{ color: 'text.secondary', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.7rem', letterSpacing: '0.05em' }}>
                                    Required Signatures ({contracts.length})
                                </Typography>
                            </Box>
                        )}

                        <List disablePadding>
                            {contracts.map((c, idx) => (
                                <ListItem key={c.id} disablePadding>
                                    <ListItemButton 
                                        selected={activeTab === idx} 
                                        onClick={() => setActiveTab(idx)}
                                        sx={{ 
                                            flexDirection: 'column', 
                                            alignItems: 'flex-start',
                                            borderLeft: activeTab === idx ? '4px solid' : '4px solid transparent',
                                            borderColor: 'primary.main',
                                            py: 2,
                                            px: 2,
                                            transition: 'all 0.2s',
                                            '&.Mui-selected': { bgcolor: 'primary.50' }
                                        }}
                                    >
                                        <Box sx={{ width: '100%', mb: 0.5 }}>
                                            <Typography variant="body2" fontWeight={activeTab === idx ? 700 : 600} color={activeTab === idx ? 'primary.main' : 'text.primary'}>
                                                {c.cartItem.name}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" width="100%">
                                            <Chip label={c.cartItem.type} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 700, bgcolor: '#e2e8f0', color: '#64748b' }} />
                                            {c.isSigned && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" color="success.main" fontWeight={700}>Signed</Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Grid>

                    {/* Editor Area */}
                    <Grid size={{ xs: 12, md: 9 }} sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', bgcolor: '#fff', minHeight: 0, height: isMobile ? 'auto' : '100%' }}>
                        <Box sx={{ flex: 1, overflowY: 'auto', p: isMobile ? 2 : 4, minHeight: 0 }}>
                            {currentContract.error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{currentContract.error}</Alert>
                            )}

                            {currentContract.isSigned && (
                                <Alert severity="success" sx={{ mb: 3, borderRadius: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.100' }}>
                                    <Typography variant="body2" fontWeight={600} color="success.800">
                                        You have successfully signed this contract.
                                    </Typography>
                                </Alert>
                            )}

                            <WaiverPreview 
                                content={currentContract.content}
                                data={{ first_name: primaryName.split(' ')[0], last_name: primaryName.split(' ')[1] || '', guardian_name: guardianName }}
                                agreed={currentContract.agreed}
                                onAgreeChange={handleAgreeChange}
                                hideCheckbox={true}
                                fullHeight={true}
                                signatureComponent={
                                    !currentContract.isSigned ? (
                                        <SignaturePad 
                                            key={currentContract.id} 
                                            ref={signaturePadRef}
                                            onEnd={() => {
                                                 setContracts(prev => {
                                                    const next = [...prev];
                                                    next[activeTab] = { ...next[activeTab], error: null };
                                                    return next;
                                                 });
                                            }} 
                                            width={isMobile ? Math.min(window.innerWidth - 64, 500) : 500}
                                            height={150}
                                        />
                                    ) : currentContract.signatureUrl ? (
                                        <Box sx={{ p: 2, border: '1px solid #e2e8f0', borderRadius: 2, bgcolor: '#f8fafc', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                            <Typography variant="caption" color="success.main" fontWeight={700} sx={{ mb: 1, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                                Digital Signature Captured
                                            </Typography>
                                            <Box sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #e2e8f0' }}>
                                                <img 
                                                    src={currentContract.signatureUrl} 
                                                    alt="Signature" 
                                                    style={{ maxWidth: '100%', height: 'auto', maxHeight: '120px', display: 'block' }} 
                                                />
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box sx={{ p: 3, bgcolor: 'success.50', borderRadius: 2, textAlign: 'center', border: '1px dashed', borderColor: 'success.300' }}>
                                            <Typography variant="body2" color="success.main" fontWeight={700}>✓ Signature confirmed</Typography>
                                        </Box>
                                    )
                                }
                            />
                        </Box>

                        {!currentContract.isSigned && (
                            <Box sx={{ p: isMobile ? 2 : 3, borderTop: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', flexDirection: isMobile ? 'column' : 'row', justifyContent: 'space-between', alignItems: isMobile ? 'stretch' : 'center', gap: 2 }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            checked={currentContract.agreed} 
                                            onChange={(e) => handleAgreeChange(e.target.checked)} 
                                            color="primary"
                                        />
                                    }
                                    label={<Typography variant="body1" sx={{ fontWeight: 700 }}>I have read and agree to all terms</Typography>}
                                />
                                <Button
                                    variant="contained"
                                    size="large"
                                    onClick={handleSignCurrent}
                                    disabled={!currentContract.agreed || currentContract.loading}
                                    sx={{ px: 6, py: 2, borderRadius: 3, fontWeight: 800, textTransform: 'none' }}
                                >
                                    {currentContract.loading ? 'Signing...' : 'Sign Contract'}
                                </Button>
                            </Box>
                        )}
                    </Grid>
                </Grid>
            </DialogContent>

            {allSigned && (
                <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'center' }}>
                    <Button
                        variant="contained"
                        size="large"
                        color="success"
                        onClick={handleCompleteAll}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : <CheckCircleIcon />}
                        sx={{ px: 6, py: 1.5, borderRadius: 3, fontWeight: 800, textTransform: 'none', fontSize: '1.1rem' }}
                    >
                        {isSubmitting ? 'Finalizing...' : 'All Contracts Signed - Proceed to Payment'}
                    </Button>
                </DialogActions>
            )}
        </Dialog>
    );
};
