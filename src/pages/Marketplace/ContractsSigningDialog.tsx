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
import { MembershipProgram } from '../../services/membershipService';
import { BasePrice } from '../../services/basePriceService';

// Need a simple formatter if formatCurrency isn't exported from ageUtils
const fmtCurr = (value: number) => `$${(value || 0).toFixed(2)}`;

interface ContractsSigningDialogProps {
    open: boolean;
    onClose: () => void;
    onSuccess: () => void;
    cart: CartItem[];
    templates: WaiverTemplate[];
    primaryProfile: any; // { first_name, last_name, guardian_name, date_of_birth, etc. }
    locationId: string;
    subscriptionTerms?: any[]; // For term name resolution
    companyConfig?: { name?: string; address?: string };
    cardLast4?: string;
    mandatoryMode?: boolean;
    previewMode?: boolean;
    /** Base prices from /api/v1/base-prices — used to fill membership contract variables */
    basePrices?: BasePrice[];
    /** Membership programs from /api/v1/memberships — used for JoningFee / AnnualFee */
    membershipPrograms?: MembershipProgram[];
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
    companyConfig,
    cardLast4,
    mandatoryMode,
    previewMode,
    basePrices = [],
    membershipPrograms = [],
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

    // DOB from primaryProfile
    const primaryDob = primaryProfile?.date_of_birth
        ? new Date(primaryProfile.date_of_birth).toLocaleDateString()
        : 'N/A';

    const cName = companyConfig?.name || 'Company Name';
    const cAddress = companyConfig?.address || 'Company Address';

    // Extract dynamic variables
    useEffect(() => {
        if (!open || cart.length === 0 || templates.length === 0) return;

        // Find the BASE (membership fee) item to determine the subscription_term_id
        const baseItem = cart.find(c => c.type === 'BASE');
        const membershipFeeTermId = baseItem?.subscriptionTermId || null;

        // Find the matching BasePrice entry using the term id from the BASE cart item
        const matchedBasePrice = basePrices.find(
            bp => bp.subscription_term_id === membershipFeeTermId
        );

        // Membership plan category ID from the MEMBERSHIP cart item
        const membershipItem = cart.find(c => c.type === 'MEMBERSHIP');
        const membershipCategoryId = membershipItem?.membershipCategoryId || null;

        // Look up joining/annual fees from membershipPrograms
        let joiningFeeAmt = 0;
        let annualFeeAmt = 0;
        if (membershipCategoryId) {
            for (const prog of membershipPrograms) {
                const cat = (prog.categories || []).find(
                    (c: any) => c.category_id === membershipCategoryId
                );
                if (cat) {
                    const joinFeeEntry = (cat.fees || []).find(
                        (f: any) => f.fee_type === 'JOINING'
                    );
                    const annualFeeEntry = (cat.fees || []).find(
                        (f: any) => f.fee_type === 'ANNUAL'
                    );
                    joiningFeeAmt = joinFeeEntry?.amount ?? 0;
                    annualFeeAmt = annualFeeEntry?.amount ?? 0;
                    break;
                }
            }
        }

        // Build membership contract variables from matched BasePrice
        const lengthOfContract = matchedBasePrice?.duration_months ?? 0;
        const automaticRenewalTerm = matchedBasePrice?.recurrence_unit_value ?? 0;
        const membershipFeePrice = matchedBasePrice?.price ?? 0;
        const subscriptionTermName = matchedBasePrice?.term_name ?? 'N/A';
        const monthlyDues =
            automaticRenewalTerm === 1
                ? fmtCurr(membershipFeePrice)
                : 'N/A';

        const newContracts: ContractState[] = [];

        cart.forEach(item => {
            let matchedTemplate: WaiverTemplate | undefined;

            if (item.type === 'SERVICE') {
                matchedTemplate = templates.find(t => t.service_id === item.serviceId);
            } else if (item.type === 'MEMBERSHIP') {
                // New logic: match by template_category === 'Membership' AND subterm_id === membershipFeeTermId
                if (membershipFeeTermId) {
                    matchedTemplate = templates.find(
                        t =>
                            t.template_category === 'Membership' &&
                            t.subterm_id === membershipFeeTermId
                    );
                }
                // Fallback: match by membership_category_id
                if (!matchedTemplate) {
                    matchedTemplate = templates.find(
                        t => t.membership_category_id === item.membershipCategoryId
                    );
                }
                // Last resort: any Membership category template
                if (!matchedTemplate) {
                    matchedTemplate = templates.find(
                        t => t.template_category === 'Membership'
                    );
                }
            } else if (item.type === 'BASE') {
                matchedTemplate = templates.find(t => t.base_price_id === item.referenceId);
            }

            if (matchedTemplate) {
                let content = matchedTemplate.content || '';

                const coveredProfile = (item.coverage || [])[0];
                const specificName = coveredProfile ? coveredProfile.name : primaryName;

                // DOB: first try covered profile, then primaryProfile
                let specificDob = primaryDob;
                if (coveredProfile?.date_of_birth) {
                    specificDob = new Date(coveredProfile.date_of_birth).toLocaleDateString();
                } else if (item.type === 'MEMBERSHIP' || item.type === 'BASE') {
                    specificDob = primaryDob;
                }

                const coveredNames =
                    (item.coverage || []).map((c: any) => c.name).join(', ') || 'N/A';
                const coveredAg =
                    (item.coverage || []).map((c: any) => c.age_group).filter(Boolean).join(', ') ||
                    'N/A';

                const primaryPlan = cart.find(
                    c =>
                        c.type === 'BASE' &&
                        (c.metadata?.role === 'PRIMARY' || c.name.toLowerCase().includes('primary'))
                );
                const feeItem = cart.find(c => c.type === 'MEMBERSHIP');

                const breakdownParts: string[] = [];
                cart.filter(c => c.type === 'BASE').forEach(p => {
                    const termName =
                        (subscriptionTerms || []).find(
                            t => t.subscription_term_id === p.subscriptionTermId
                        )?.name || 'Recurring';
                    breakdownParts.push(
                        `<li><strong>Membership Fee (${(p.metadata?.role === 'PRIMARY' || p.name.toLowerCase().includes('primary')) ? 'Primary' : 'Add-on'}):</strong> ${p.name} (${termName}) - <strong>${fmtCurr(p.price)}</strong></li>`
                    );
                });
                if (feeItem) {
                    breakdownParts.push(
                        `<li><strong>${feeItem.feeType === 'ANNUAL' ? 'Renewal' : 'Joining'} Fee:</strong> ${feeItem.name} - <strong>${fmtCurr(feeItem.price)}</strong></li>`
                    );
                }
                const breakdownHtml = `<ul style="margin-top: 8px; margin-bottom: 8px; padding-left: 20px; list-style-type: disc;">${breakdownParts.join('')}</ul>`;

                // ── Standard person variables ───────────────────────────────
                content = content.replace(/\[FullName\]/ig, specificName);
                content = content.replace(/\[GuardianName\]/ig, guardianName || 'N/A');
                content = content.replace(/\[CurrentDate\]/ig, currentDate);
                content = content.replace(/\[DOB\]/ig, specificDob);
                content = content.replace(/\[Relationship\]/ig, 'Guardian');
                content = content.replace(/\[company_name\]/ig, cName);
                content = content.replace(/\[company_address\]/ig, cAddress);
                content = content.replace(/\[CardLast4\]/ig, cardLast4 || 'N/A');
                content = content.replace(/\[AcceptSignature\]/ig, '[AcceptSignature]'); // PRESERVE for WaiverPreview split logic

                // ── Service Metrics ─────────────────────────────────────────
                content = content.replace(
                    /\[service_name\]/ig,
                    String(item.metadata?.service_name || item.name || 'N/A')
                );
                content = content.replace(
                    /\[service_category\]/ig,
                    String(item.metadata?.service_category || 'N/A')
                );
                content = content.replace(
                    /\[service_type\]/ig,
                    String(item.metadata?.service_type || 'N/A')
                );
                content = content.replace(
                    /\[service_pack_name\]/ig,
                    String(item.metadata?.service_pack_name || item.name || 'N/A')
                );
                content = content.replace(/\[lession_registration_fee\]/ig, String(fmtCurr(0)));
                content = content.replace(
                    /\[special_program\]/ig,
                    String(item.metadata?.special_program || 'None')
                );
                content = content.replace(
                    /\[classes\]/ig,
                    item.metadata?.classes ? String(item.metadata.classes) : 'N/A'
                );

                const durationMap: string[] = [];
                if (item.metadata?.duration_months) durationMap.push(`${item.metadata.duration_months} Months`);
                if (item.metadata?.duration_days) durationMap.push(`${item.metadata.duration_days} Days`);
                content = content.replace(
                    /\[service_pack_duration\]/ig,
                    durationMap.length > 0 ? durationMap.join(', ') : 'N/A'
                );

                content = content.replace(/\[price\]/ig, String(fmtCurr(item.price)));
                content = content.replace(
                    /\[is_sharable\]/ig,
                    item.metadata?.is_shrabable ? 'Yes' : 'No'
                );
                content = content.replace(/\[shared_proriles\]/ig, coveredNames);
                content = content.replace(/\[age_profile\]/ig, coveredAg);

                const usageLimit = item.metadata?.max_uses_per_period
                    ? `${item.metadata.max_uses_per_period} Uses / ${item.metadata.usage_period_length || 1} ${item.metadata.usage_period_unit || 'Period'}`
                    : 'Unlimited';
                content = content.replace(/\[usage_limit\]/ig, usageLimit);
                content = content.replace(/\[service_start_date\]/ig, currentDate);
                content = content.replace(/\[service_end_date\]/ig, 'N/A');

                // ── Legacy membership variables (kept for compatibility) ────
                const joiningItem = cart.find(c => c.type === 'MEMBERSHIP' && c.feeType === 'JOINING');
                const annualItem = cart.find(c => c.type === 'MEMBERSHIP' && c.feeType === 'ANNUAL');
                const accountJoiningFee = joiningItem
                    ? joiningItem.price
                    : cart.reduce((max, c) => Math.max(max, Number(c.metadata?.joiningFee) || 0), 0);
                const accountAnnualFee = annualItem
                    ? annualItem.price
                    : cart.reduce((max, c) => Math.max(max, Number(c.metadata?.annualFee) || 0), 0);

                let itemDuration = 0;
                const iTerm = (subscriptionTerms || []).find(
                    t => t.subscription_term_id === item.subscriptionTermId
                );
                if (iTerm) {
                    itemDuration = iTerm.duration_months || 0;
                }

                const displayTerm = itemDuration > 0 ? `${itemDuration} Month` : 'N/A';
                const installmentsCount = itemDuration > 0 ? 12 / itemDuration : 1;

                // Membership Metrics
                const planDisplayName = (primaryPlan?.name || item.name || 'N/A').replace(
                    / \(Joining\)| \(Annual\)/ig,
                    ''
                );
                content = content.replace(/\[membership_plan\]/ig, planDisplayName);

                const termName = iTerm?.name || (item.feeType === 'ANNUAL' ? 'Annual Renewal' : 'Membership');
                content = content.replace(/\[subscription_term\]/ig, termName);
                content = content.replace(/\[start_date\]/ig, currentDate);
                content = content.replace(/\[end_date\]/ig, 'Open-ended');

                content = content.replace(/\[InitialTerm\]/ig, displayTerm);
                content = content.replace(/\[InitiationFeeAmount\]/ig, fmtCurr(accountJoiningFee));
                content = content.replace(/\[TotalMembershipFee\]/ig, fmtCurr(item.price));
                content = content.replace(/\[NumberOfInstallments\]/ig, String(installmentsCount));
                content = content.replace(/\[InstallmentAmount\]/ig, fmtCurr(item.price));
                content = content.replace(/\[AutomaticRenewalTerm\]/ig, displayTerm);
                content = content.replace(/\[AnnualRenewalFee\]/ig, fmtCurr(accountAnnualFee));

                content = content.replace(/\[membership_fee_breakdown\]/ig, breakdownHtml);
                content = content.replace(/\[membershp_fee_breakdown\]/ig, breakdownHtml);
                content = content.replace(/\[profile_coverage\]/ig, coveredNames);

                // ── NEW membership contract variables (from base-prices API) ─
                content = content.replace(
                    /\[LengthOfContract\]/ig,
                    lengthOfContract > 0 ? `${lengthOfContract} Month${lengthOfContract !== 1 ? 's' : ''}` : 'N/A'
                );
                content = content.replace(
                    /\[AutomaticRenewalTerm\]/ig,
                    automaticRenewalTerm > 0
                        ? `${automaticRenewalTerm} Month${automaticRenewalTerm !== 1 ? 's' : ''}`
                        : 'N/A'
                );
                content = content.replace(
                    /\[MembershipFee\]/ig,
                    membershipFeePrice > 0 ? fmtCurr(membershipFeePrice) : 'N/A'
                );
                content = content.replace(/\[SubscriptionTerm\]/ig, subscriptionTermName);
                content = content.replace(/\[MonthlyDues\]/ig, monthlyDues);

                // ── Joining / Annual Fee (from memberships API) ────────────
                content = content.replace(
                    /\[JoningFee\]/ig,
                    joiningFeeAmt > 0 ? fmtCurr(joiningFeeAmt) : 'N/A'
                );
                // Also handle common misspelling "JoiningFee"
                content = content.replace(
                    /\[JoiningFee\]/ig,
                    joiningFeeAmt > 0 ? fmtCurr(joiningFeeAmt) : 'N/A'
                );
                content = content.replace(
                    /\[AnnualFee\]/ig,
                    annualFeeAmt > 0 ? fmtCurr(annualFeeAmt) : 'N/A'
                );

                newContracts.push({
                    id: item.id,
                    cartItem: item,
                    template: matchedTemplate,
                    content,
                    isSigned: false,
                    signatureUrl: null,
                    agreed: false,
                    error: null,
                    loading: false,
                });
            }
        });

        setContracts(newContracts);
        setActiveTab(0);
    }, [open, cart, templates, primaryName, guardianName, currentDate, cName, cAddress, subscriptionTerms, cardLast4, locationId, basePrices, membershipPrograms, primaryDob]);



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
            if (!blob) throw new Error('Failed to capture signature');

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
                        signatureUrl: sigResponse.signature_url,
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
            console.error('Signing failed', err);
            setContracts(prev => {
                const next = [...prev];
                next[activeTab] = {
                    ...next[activeTab],
                    loading: false,
                    error: err.message || 'Signing failed',
                };
                return next;
            });
        }
    };

    const handleCompleteAll = async () => {
        setIsSubmitting(true);
        try {
            // Upload all signed waivers
            await Promise.all(
                contracts.map(async c => {
                    if (!c.isSigned || !c.signatureUrl) return;

                    const payload = {
                        profile_id: primaryProfile?.profile_id || null, // Best effort
                        waiver_template_id: c.template.waiver_template_id,
                        waiver_type: c.cartItem.type === 'SERVICE' ? 'SERVICE' : 'MEMBERSHIP',
                        content: c.content,
                        signatureUrl: c.signatureUrl, // Assuming waiverService allows signatureUrl direct, yes it does per schema
                        signature_url: c.signatureUrl,
                    };

                    await waiverService.upsertSignedWaiver(payload as any, locationId);
                })
            );

            onSuccess();
        } catch (err) {
            console.error('Failed to save final contracts', err);
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
                sx: { borderRadius: 3, overflow: 'hidden', height: isMobile ? '100%' : '85vh', maxHeight: '100%' },
            }}
        >
            <DialogTitle
                sx={{
                    m: 0,
                    p: 2,
                    bgcolor: '#f8fafc',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ bgcolor: 'primary.main', p: 0.8, borderRadius: 1, display: 'flex' }}>
                        <HistoryEduIcon sx={{ color: 'white', fontSize: 20 }} />
                    </Box>
                    <Typography variant="h6" fontWeight={800}>
                        Review & Sign Contracts
                    </Typography>
                </Box>
                <IconButton
                    onClick={onClose}
                    size="small"
                    disabled={isSubmitting}
                    sx={{ display: mandatoryMode ? 'none' : 'inline-flex' }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>

            <DialogContent sx={{ p: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                <Grid
                    container
                    sx={{
                        flex: 1,
                        height: '100%',
                        overflow: 'hidden',
                        flexDirection: isMobile ? 'column' : 'row',
                    }}
                >
                    {/* Sidebar Tabs */}
                    <Grid
                        size={{ xs: 12, md: 3 }}
                        sx={{
                            borderRight: isMobile ? 'none' : '1px solid #e2e8f0',
                            borderBottom: isMobile ? '1px solid #e2e8f0' : 'none',
                            bgcolor: '#f8fafc',
                            overflowY: 'auto',
                            maxHeight: isMobile ? '200px' : '100%',
                            height: isMobile ? 'auto' : '100%',
                        }}
                    >
                        {!isMobile && (
                            <Box sx={{ p: 2, borderBottom: '1px solid #e2e8f0', bgcolor: '#fff' }}>
                                <Typography
                                    variant="subtitle2"
                                    sx={{
                                        color: 'text.secondary',
                                        fontWeight: 700,
                                        textTransform: 'uppercase',
                                        fontSize: '0.7rem',
                                        letterSpacing: '0.05em',
                                    }}
                                >
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
                                            '&.Mui-selected': { bgcolor: 'primary.50' },
                                        }}
                                    >
                                        <Box sx={{ width: '100%', mb: 0.5 }}>
                                            <Typography
                                                variant="body2"
                                                fontWeight={activeTab === idx ? 700 : 600}
                                                color={activeTab === idx ? 'primary.main' : 'text.primary'}
                                            >
                                                {c.cartItem.name}
                                            </Typography>
                                        </Box>
                                        <Box display="flex" justifyContent="space-between" width="100%">
                                            <Chip
                                                label={c.cartItem.type}
                                                size="small"
                                                sx={{
                                                    height: 16,
                                                    fontSize: '0.6rem',
                                                    fontWeight: 700,
                                                    bgcolor: '#e2e8f0',
                                                    color: '#64748b',
                                                }}
                                            />
                                            {c.isSigned && (
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                    <CheckCircleIcon color="success" sx={{ fontSize: 14 }} />
                                                    <Typography variant="caption" color="success.main" fontWeight={700}>
                                                        Signed
                                                    </Typography>
                                                </Box>
                                            )}
                                        </Box>
                                    </ListItemButton>
                                </ListItem>
                            ))}
                        </List>
                    </Grid>

                    {/* Editor Area */}
                    <Grid
                        size={{ xs: 12, md: 9 }}
                        sx={{
                            display: 'flex',
                            flexDirection: 'column',
                            overflow: 'hidden',
                            bgcolor: '#fff',
                            minHeight: 0,
                            height: isMobile ? 'auto' : '100%',
                        }}
                    >
                        <Box sx={{ flex: 1, overflowY: 'auto', p: isMobile ? 2 : 4, minHeight: 0 }}>
                            {currentContract.error && (
                                <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>
                                    {currentContract.error}
                                </Alert>
                            )}

                            {currentContract.isSigned && (
                                <Alert
                                    severity="success"
                                    sx={{
                                        mb: 3,
                                        borderRadius: 2,
                                        bgcolor: 'success.50',
                                        border: '1px solid',
                                        borderColor: 'success.100',
                                    }}
                                >
                                    <Typography variant="body2" fontWeight={600} color="success.800">
                                        You have successfully signed this contract.
                                    </Typography>
                                </Alert>
                            )}

                            <WaiverPreview
                                content={currentContract.content}
                                data={{
                                    first_name: primaryName.split(' ')[0],
                                    last_name: primaryName.split(' ')[1] || '',
                                    guardian_name: guardianName,
                                }}
                                agreed={currentContract.agreed}
                                onAgreeChange={handleAgreeChange}
                                hideCheckbox={true}
                                fullHeight={true}
                                signatureComponent={
                                    previewMode ? null : !currentContract.isSigned ? (
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
                                            width={isMobile ? 340 : 500}
                                            height={150}
                                        />
                                    ) : currentContract.signatureUrl ? (
                                        <Box
                                            sx={{
                                                p: 2,
                                                border: '1px solid #e2e8f0',
                                                borderRadius: 2,
                                                bgcolor: '#f8fafc',
                                                display: 'flex',
                                                flexDirection: 'column',
                                                alignItems: 'center',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="success.main"
                                                fontWeight={700}
                                                sx={{
                                                    mb: 1,
                                                    textTransform: 'uppercase',
                                                    letterSpacing: '0.05em',
                                                }}
                                            >
                                                Digital Signature Captured
                                            </Typography>
                                            <Box
                                                sx={{ bgcolor: '#fff', p: 1, borderRadius: 1, border: '1px solid #e2e8f0' }}
                                            >
                                                <img
                                                    src={currentContract.signatureUrl}
                                                    alt="Signature"
                                                    style={{
                                                        maxWidth: '100%',
                                                        height: 'auto',
                                                        maxHeight: '120px',
                                                        display: 'block',
                                                    }}
                                                />
                                            </Box>
                                        </Box>
                                    ) : (
                                        <Box
                                            sx={{
                                                p: 3,
                                                bgcolor: 'success.50',
                                                borderRadius: 2,
                                                textAlign: 'center',
                                                border: '1px dashed',
                                                borderColor: 'success.300',
                                            }}
                                        >
                                            <Typography variant="body2" color="success.main" fontWeight={700}>
                                                ✓ Signature confirmed
                                            </Typography>
                                        </Box>
                                    )
                                }
                            />
                        </Box>

                        {!currentContract.isSigned && !previewMode && (
                            <Box
                                sx={{
                                    p: isMobile ? 2 : 3,
                                    borderTop: '1px solid #e2e8f0',
                                    bgcolor: '#f8fafc',
                                    display: 'flex',
                                    flexDirection: isMobile ? 'column' : 'row',
                                    justifyContent: 'space-between',
                                    alignItems: isMobile ? 'stretch' : 'center',
                                    gap: 2,
                                }}
                            >
                                <FormControlLabel
                                    control={
                                        <Checkbox
                                            checked={currentContract.agreed}
                                            onChange={e => handleAgreeChange(e.target.checked)}
                                            color="primary"
                                        />
                                    }
                                    label={
                                        <Typography variant="body1" sx={{ fontWeight: 700 }}>
                                            I have read and agree to all terms
                                        </Typography>
                                    }
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

            {((allSigned && !previewMode) || previewMode) && (
                <DialogActions
                    sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0', justifyContent: 'center' }}
                >
                    {previewMode ? (
                        <Button
                            variant="contained"
                            size="large"
                            onClick={onClose}
                            sx={{
                                px: 6,
                                py: 1.5,
                                borderRadius: 3,
                                fontWeight: 800,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                            }}
                        >
                            Close Preview
                        </Button>
                    ) : (
                        <Button
                            variant="contained"
                            size="large"
                            color="success"
                            onClick={handleCompleteAll}
                            disabled={isSubmitting}
                            startIcon={
                                isSubmitting ? (
                                    <CircularProgress size={20} color="inherit" />
                                ) : (
                                    <CheckCircleIcon />
                                )
                            }
                            sx={{
                                px: 6,
                                py: 1.5,
                                borderRadius: 3,
                                fontWeight: 800,
                                textTransform: 'none',
                                fontSize: '1.1rem',
                            }}
                        >
                            {isSubmitting ? 'Finalizing...' : 'All Contracts Signed - Proceed to Payment'}
                        </Button>
                    )}
                </DialogActions>
            )}
        </Dialog>
    );
};
