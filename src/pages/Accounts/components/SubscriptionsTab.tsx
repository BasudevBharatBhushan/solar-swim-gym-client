import { useEffect, useState, useRef, useCallback } from 'react';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Stack,
  Divider,
  Button,
  Tooltip,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useAuth } from '../../../context/AuthContext';
import { billingService } from '../../../services/billingService';
import { serviceCatalog } from '../../../services/serviceCatalog';
import { basePriceService, BasePrice } from '../../../services/basePriceService';
import { membershipService, MembershipProgram } from '../../../services/membershipService';
import { waiverService } from '../../../services/waiverService';
import { Subscription, Profile } from '../../../types';
import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroupName } from '../../../lib/ageUtils';
import { SubscriptionManageDialog } from './SubscriptionManageDialog';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import SendIcon from '@mui/icons-material/Send';
import { emailService } from '../../../services/emailService';
import { EmailComposer } from '../../../components/Email/EmailComposer';
import PrintIcon from '@mui/icons-material/Print';
import EmailIcon from '@mui/icons-material/Email';
import { GenerateWaiverDialog } from './GenerateWaiverDialog';
import { WaiverPreview } from '../../../components/Waiver/WaiverPreview';
import { SignaturePad, SignaturePadRef, getSignatureBlob } from '../../../components/Waiver/SignaturePad';
import { resolveWaiverTemplates, getSubscriptionWaiverContext } from '../../../utils/waiverUtils';
import { WaiverTemplate } from '../../../services/waiverService';
// removed invalid snackbarService



interface SubscriptionsTabProps {
  accountId: string;
  selectedProfileId: string | null;
  profiles: Profile[];
}

export const SubscriptionsTab = ({ accountId, selectedProfileId, profiles }: SubscriptionsTabProps) => {
  const { currentLocationId, role, locations } = useAuth();
  const { ageGroups, subscriptionTerms } = useConfig();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({});
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({}); // To store extra pack details if needed
  const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
  const [membershipPrograms, setMembershipPrograms] = useState<MembershipProgram[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Manage dialog state
  const [manageOpen, setManageOpen] = useState(false);
  const [managedSub, setManagedSub] = useState<any>(null);

  const [pendingTemplate, setPendingTemplate] = useState<WaiverTemplate | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [isSigningInPlace, setIsSigningInPlace] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setToast({ open: true, message, severity });
  };

  
  // Filter for membership status: ACTIVE, PENDING, CANCELLED
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('ACTIVE');

  const isStaffOrAbove = ['STAFF', 'ADMIN', 'SUPERADMIN'].includes(role ?? '');

  const handleManageClick = (sub: any) => {
    setManagedSub(sub);
    setManageOpen(true);
  };

  // Contract dialog state
  const [contractDialogOpen, setContractDialogOpen] = useState(false);
  const [contractLoading, setContractLoading] = useState(false);
  const [contractData, setContractData] = useState<any | null>(null);
  const [contractIsPending, setContractIsPending] = useState(false);
  const [selectedSubscriptionForContract, setSelectedSubscriptionForContract] = useState<any>(null);

  const [generateWaiverOpen, setGenerateWaiverOpen] = useState(false);
  const [openCompose, setOpenCompose] = useState(false);
  const [composeDraft, setComposeDraft] = useState<{
    to: string;
    subject: string;
    body: string;
    templateId?: string;
    attachments: File[];
    accountId?: string;
  } | null>(null);

  const getWaiverVariables = useCallback((sub: any) => {
    const coverage = getCoverage(sub);
    let profile = coverage[0]?.profile;
    
    if (!profile && selectedProfileId) {
      profile = profiles.find(p => p.profile_id === selectedProfileId);
    }
    
    if (!profile && coverage[0]?.profile_id) {
       profile = profiles.find(p => p.profile_id === coverage[0].profile_id);
    }

    const specificName = profile ? `${profile.first_name || ''} ${profile.last_name || ''}`.trim() : 'Primary Contact';
    
    // Find base price
    let matchBasePrice = basePrices.find((bp: any) => bp.base_price_id === sub.reference_id);
    if (!matchBasePrice) {
        const feeSub = subscriptions.find(s => s.subscription_type === 'MEMBERSHIP_FEE');
        if (feeSub) {
            matchBasePrice = basePrices.find(bp => bp.base_price_id === feeSub.reference_id);
        }
    }
    
    // Find category
    let matchCat = (membershipPrograms as any[]).flatMap((p: any) => p.categories || []).find((c: any) => c?.category_id === sub.reference_id);
    if (!matchCat) {
        const joiningSub = subscriptions.find(s => 
            (s.subscription_type === 'MEMBERSHIP_JOINING' || s.subscription_type === 'MEMBERSHIP_RENEWAL')
        );
        if (joiningSub) {
            matchCat = (membershipPrograms as any[]).flatMap((p: any) => p.categories || []).find((c: any) => c?.category_id === joiningSub.reference_id);
        }
    }

    const lengthOfContract = matchBasePrice?.duration_months ?? 0;
    const autoRenewalTerm = matchBasePrice?.recurrence_unit_value ?? lengthOfContract;
    const displayTerm = lengthOfContract > 0 ? `${lengthOfContract} Month${lengthOfContract > 1 ? 's' : ''}` : 'N/A';
    const displayAutoRenewal = autoRenewalTerm > 0 ? `${autoRenewalTerm} Month${autoRenewalTerm > 1 ? 's' : ''}` : 'N/A';
    const currentDate = new Date().toLocaleDateString();
    const fmtCurr = (val: number) => `$${(val || 0).toFixed(2)}`;
    
    const joiningFeeAmt = (matchCat?.fees || []).find((f: any) => f.fee_type === 'JOINING' && f.is_active !== false)?.amount ?? 0;
    const annualFeeAmt = (matchCat?.fees || []).find((f: any) => f.fee_type === 'ANNUAL' && f.is_active !== false)?.amount ?? 0;
    
    const subTermId = sub.subscription_term_id;
    const subTermDisplay = matchBasePrice?.term_name || subscriptionTerms?.find(t => t.subscription_term_id === subTermId)?.name || 'Membership';
    
    const guardianName = (profile as any)?.guardian_email || (profile as any)?.guardian_name || profiles.find(p => p.is_primary)?.guardian_name || 'N/A';
    const currentLocation = locations.find((l: any) => l.location_id === currentLocationId);
    const cName = currentLocation?.name || 'Solar Swim Gym';
    const cAddress = currentLocation?.address || 'Location Address';

    const serviceDetail = serviceDetails[sub.subscription_id] || {};
    const serviceName = serviceDetail.service?.name || sub.plan_name || 'N/A';
    const servicePackName = serviceDetail.name || sub.plan_name || 'N/A';
    const usageLimit = serviceDetail.max_uses_per_period 
        ? `${serviceDetail.max_uses_per_period} Uses / ${serviceDetail.usage_period_length || 1} ${serviceDetail.usage_period_unit || 'Period'}`
        : 'Unlimited';

    return {
       FullName: specificName,
       GuardianName: guardianName,
       DOB: (profile as any)?.date_of_birth ? new Date((profile as any).date_of_birth).toLocaleDateString() : 'N/A',
       CurrentDate: currentDate,
       AcceptSignature: '[AcceptSignature]',
       CardLast4: 'N/A',
       MembershipPlanName: matchBasePrice?.name || sub.plan_name || 'N/A',
       MembershipName: matchBasePrice?.name || sub.plan_name || 'N/A',
       MembershipPlanType: String(matchBasePrice?.role || 'N/A').replace(/_/g, ' '),
       MembershpPlanType: String(matchBasePrice?.role || 'N/A').replace(/_/g, ' '),
       MembershipFee: fmtCurr(matchBasePrice?.price || sub.price || 0),
       JoningFee: fmtCurr(joiningFeeAmt),
       JoiningFee: fmtCurr(joiningFeeAmt),
       AnnualFee: fmtCurr(annualFeeAmt),
       MonthlyDues: autoRenewalTerm === 1 ? fmtCurr(matchBasePrice?.price || sub.price || 0) : 'N/A',
       SubscriptionTerm: subTermDisplay,
       LengthOfContract: displayTerm,
       AutomaticRenewalTerm: displayAutoRenewal,
       EffectiveDate: sub.billing_period_start ? new Date(sub.billing_period_start).toLocaleDateString() : currentDate,
       Relationship: 'Guardian',
       price: fmtCurr(sub.price || 0),
       service_name: serviceName,
       service_pack_name: servicePackName,
       usage_limit: usageLimit,
       service_start_date: currentDate,
       service_end_date: sub.billing_period_end ? new Date(sub.billing_period_end).toLocaleDateString() : 'N/A',
       company_name: cName,
       company_address: cAddress
    };
  }, [basePrices, membershipPrograms, profiles, selectedProfileId, subscriptions, subscriptionTerms, serviceDetails, locations, currentLocationId]);



  const handleContractClick = async (sub: any) => {
    setContractDialogOpen(true);
    setContractData(null);
    setContractIsPending(false);
    setSelectedSubscriptionForContract(sub);
    setPendingTemplate(null);
    setAgreed(false);

    if (sub.signedwaiver_id) {
      setContractLoading(true);
      try {
        const res = await waiverService.getSignedWaiver(sub.signedwaiver_id);
        setContractData(res.data);
      } catch (err) {
        console.error('Failed to load signed contract', err);
        setContractIsPending(true); // fallback
      } finally {
        setContractLoading(false);
      }
    } else {
      setContractIsPending(true);
      // Resolve template
      try {
        setContractLoading(true);
        const templatesRes = await waiverService.getWaiverTemplates(currentLocationId || undefined);
        const allTemplates: WaiverTemplate[] = (templatesRes as any)?.data || [];
        const context = getSubscriptionWaiverContext(sub);
        const matched = resolveWaiverTemplates(allTemplates, context);
        if (matched.length > 0) {
          setPendingTemplate(matched[0]);
        }
      } catch (err) {
        console.error('Failed to resolve pending template', err);
      } finally {
        setContractLoading(false);
      }
    }
  };

  const handleEmailDraftReady = async (draft: { subject: string; body: string; to?: string; templateId?: string; publicUrl: string }) => {
    let finalSubject = draft.subject;
    let finalBody = draft.body;
    let finalTemplateId = draft.templateId;
    
    try {
      const templates = await emailService.getTemplates(currentLocationId || '');
      const template = templates.find(t => 
         t.subject?.includes('Complete Your Registration') || 
         t.subject?.includes('Waiver Signing')
      );
      if (template) {
        finalSubject = template.subject.replace(/\{\{company\}?\}?/g, 'Glass Court Swim and Fitness');
        finalBody = template.body_content
          .replace(/\{\{contract_link\}\}/g, draft.publicUrl)
          .replace(/\{\{company\}\}/g, 'Glass Court Swim and Fitness')
          .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());
        finalTemplateId = template.email_template_id;
      }
    } catch (templateError) {
      console.warn('Could not fetch templates', templateError);
    }

    if (!finalBody.includes(draft.publicUrl)) {
      finalBody = `${finalBody}\n\nSign your waiver here: ${draft.publicUrl}`;
    }

    setComposeDraft({
      to: draft.to || '',
      subject: finalSubject,
      body: finalBody,
      templateId: finalTemplateId,
      attachments: [],
      accountId: accountId
    });
    setOpenCompose(true);
  };

  const handleComposerSuccess = () => {
    showToast('Email sent successfully!', 'success');
    setOpenCompose(false);
    setComposeDraft(null);
  };

  const handleSignInPlace = async () => {
    if (!pendingTemplate || !signaturePadRef.current || !currentLocationId || !selectedSubscriptionForContract) return;

    if (signaturePadRef.current.isEmpty()) {
      showToast('Please sign to continue.', 'warning');
      return;
    }

    const canvas = signaturePadRef.current.getCanvas();
    if (!canvas) return;

    setIsSigningInPlace(true);
    try {
      const blob = await getSignatureBlob(canvas);
      if (!blob) throw new Error('Failed to capture signature');

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const sigResponse = await waiverService.uploadSignature(base64);
          
          
          let content = pendingTemplate.content;
          const variables = getWaiverVariables(selectedSubscriptionForContract) as Record<string, string>;
          
          // Replace all variables in content
          Object.entries(variables).forEach(([key, value]) => {
            content = content.replace(new RegExp(`\\[${key}\\]`, 'gi'), value);
          });
          
          const coverage = getCoverage(selectedSubscriptionForContract);
          const profileId = coverage[0]?.profile_id || selectedProfileId;

          const signedRes = await waiverService.upsertSignedWaiver({
            profile_id: profileId,
            waiver_template_id: pendingTemplate.waiver_template_id,
            waiver_type: selectedSubscriptionForContract.subscription_type === 'SERVICE' ? 'SERVICE' : 'MEMBERSHIP',
            content,
            signature_url: sigResponse.signature_url,
            subscription_id: selectedSubscriptionForContract.subscription_id
          }, currentLocationId);

          // Link to subscription
          await waiverService.linkWaiverToSubscription(selectedSubscriptionForContract.subscription_id, {
            signedwaiver_id: signedRes.signed_waiver_id
          });

          showToast(`Contract signed successfully and linked to subscription!`, 'success');
          setContractDialogOpen(false);
          fetchSubscriptions(); // Refresh to show "Signed"
        } catch (err: any) {
          console.error('Signing failed', err);
          showToast(err.message || 'Signing failed', 'error');
        } finally {
          setIsSigningInPlace(false);
        }
      };
    } catch (err: any) {
      console.error('Signing failed', err);
      showToast(err.message || 'Signing failed', 'error');
      setIsSigningInPlace(false);
    }
  };


  const handleOpenGenerateWaiver = () => {
    setContractDialogOpen(false);
    setGenerateWaiverOpen(true);
  };


  const handleManageSuccess = () => {
    // Re-fetch subscriptions after a successful update
    if (accountId && currentLocationId) {
      setManageOpen(false);
      setManagedSub(null);
      // Trigger a re-fetch by clearing and re-loading
      setSubscriptions([]);
      fetchSubscriptions();
    }
  };

  const fetchSubscriptions = async () => {
    setLoading(true);
    try {
      const [bpData, mpData, response] = await Promise.all([
          basePriceService.getAll(currentLocationId || ''),
          membershipService.getMemberships(currentLocationId || ''),
          billingService.getAccountSubscriptions(accountId, currentLocationId || undefined)
      ]);

      setBasePrices(bpData?.prices || []);
      setMembershipPrograms(mpData || []);

      const subs = response.data || response || [];
      setSubscriptions(subs);

      // Fetch images and details for service subscriptions
      const serviceSubs = subs.filter((s: Subscription) => s.subscription_type === 'SERVICE');
      const images: Record<string, string> = {};
      const details: Record<string, any> = {};

      await Promise.all(serviceSubs.map(async (sub: Subscription) => {
          try {
              // reference_id for SERVICE is service_pack_id
              if (!sub.reference_id) return;
              
              const packRes = await serviceCatalog.getServicePack(sub.reference_id, currentLocationId || undefined);
              const pack = packRes.data || packRes;
              
              if (pack) {
                   details[sub.subscription_id] = pack;
                   // Use nested service object if available (preferred)
                   if (pack.service && pack.service.image_url) {
                       images[sub.subscription_id] = pack.service.image_url;
                   } 
                   // Fallback: fetch service if not nested
                   else if (pack.service_id) {
                      const serviceRes = await serviceCatalog.getServiceDetail(pack.service_id, currentLocationId || undefined);
                      const service = serviceRes.data || serviceRes;
                      if (service && service.image_url) {
                          images[sub.subscription_id] = service.image_url;
                      }
                   }
              }
          } catch (err) {
              // console.warn('Failed to fetch details for subscription', sub.subscription_id, err);
          }
      }));
      setServiceImages(images);
      setServiceDetails(details);

    } catch (err: any) {
      console.error("Failed to fetch subscriptions", err);
      setError("Failed to load subscriptions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && currentLocationId) {
      fetchSubscriptions();
    }
  }, [accountId, currentLocationId]);

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'ACTIVE': return 'success';
          case 'PAUSED': return 'warning';
          case 'EXPIRED': return 'secondary';
          case 'PENDING_PAYMENT': return 'info';
          case 'CANCELLED': return 'error';
          default: return 'default';
      }
  };

  const getInvoiceStatusColor = (status: string) => {
      switch (status) {
          case 'PAID': return 'success';
          case 'PENDING': return 'warning';
          case 'CANCELLED': 
          case 'VOID': return 'error';
          default: return 'default';
      }
  };

  const getCoverage = (sub: any) => {
      return sub.subscription_coverage || sub.coverage || [];
  };

  // Filter subscriptions based on profile selection
  const filteredSubscriptions = subscriptions.filter(sub => 
    !selectedProfileId || getCoverage(sub).some((c: any) => c.profile_id === selectedProfileId)
  );

  const serviceSubscriptions = filteredSubscriptions.filter(s => s.subscription_type === 'SERVICE');
  const membershipSubscriptions = filteredSubscriptions.filter(s => {
    if (s.subscription_type === 'SERVICE') return false;

    // Status filtering logic
    if (membershipStatusFilter === 'ACTIVE') return s.status === 'ACTIVE';
    if (membershipStatusFilter === 'PAUSED') return s.status === 'PAUSED';
    if (membershipStatusFilter === 'EXPIRED') return s.status === 'EXPIRED';
    if (membershipStatusFilter === 'PENDING_PAYMENT') return s.status === 'PENDING_PAYMENT';
    if (membershipStatusFilter === 'CANCELLED') return s.status === 'CANCELLED';
    
    return true; // fallback
  });


  if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
      return <Typography color="error">{error}</Typography>;
  }

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
          <Typography variant="h6">Purchases</Typography>
      </Box>

      {/* Services Section */}
      <Box sx={{ mb: 4 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#334155' }}>Services & Packs</Typography>
          {serviceSubscriptions.length > 0 ? (
              <Grid container spacing={2}>
                  {serviceSubscriptions.map(sub => {
                      const coverage = getCoverage(sub);
                      const imageUrl = serviceImages[sub.subscription_id];
                      const packDetails = serviceDetails[sub.subscription_id];
                      
                      return (
                          <Grid size={{ xs: 12, md: 6 }} key={sub.subscription_id}>
                              <Card variant="outlined" sx={{ display: 'flex', borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                                  <Box 
                                    sx={{ 
                                        width: 120, 
                                        minWidth: 120,
                                        bgcolor: '#f1f5f9', 
                                        display: 'flex', 
                                        alignItems: 'center', 
                                        justifyContent: 'center' 
                                    }}
                                  >
                                      {imageUrl ? (
                                          <CardMedia
                                            component="img"
                                            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            image={imageUrl}
                                            alt={sub.plan_name}
                                          />
                                      ) : (
                                        <Typography variant="caption" color="text.secondary">No Image</Typography>
                                      )}
                                  </Box>
                                  <Box sx={{ display: 'flex', flexDirection: 'column', flexGrow: 1 }}>
                                      <CardContent sx={{ flex: '1 0 auto', p: 2, pb: '16px !important' }}>
                                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                                              <Box>
                                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.25, fontWeight: 500, fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                                      Service Pack
                                                  </Typography>
                                                  {packDetails?.service?.name && (
                                                      <Typography variant="subtitle2" fontWeight={800} color="primary" sx={{ lineHeight: 1.1, mb: 0.25 }}>
                                                          {packDetails.service.name}
                                                      </Typography>
                                                  )}
                                                  <Typography component="div" variant="body2" fontWeight={700} sx={{ lineHeight: 1.2 }}>
                                                      {packDetails?.name || sub.plan_name || 'Unknown Pack'}
                                                  </Typography>
                                                  <Typography variant="caption" color="text.disabled" sx={{ display: 'block', mt: 0.5, fontSize: '0.65rem' }}>
                                                      Ref: {sub.reference_id ? sub.reference_id.substring(0, 8) : 'N/A'}...
                                                  </Typography>
                                              </Box>
                                               <Stack direction="row" spacing={1} alignItems="center">
                                                  {sub.invoice && (
                                                      <Chip 
                                                          label={`INV: ${sub.invoice.status}`} 
                                                          size="small" 
                                                          variant="outlined"
                                                          color={getInvoiceStatusColor(sub.invoice.status) as any} 
                                                          sx={{ fontWeight: 700, fontSize: '0.6rem', height: 20 }}
                                                      />
                                                  )}
                                                  <Chip 
                                                      label={sub.status} 
                                                      size="small" 
                                                      color={getStatusColor(sub.status) as any} 
                                                      sx={{ fontWeight: 700, fontSize: '0.65rem', height: 20 }}
                                                  />
                                                  {isStaffOrAbove && sub.status !== 'CANCELLED' && (
                                                    <Tooltip title="Manage subscription (status & pricing)" arrow>
                                                      <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => { e.stopPropagation(); handleManageClick(sub); }}
                                                        startIcon={<TuneIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                        sx={{
                                                          fontSize: '0.65rem',
                                                          fontWeight: 700,
                                                          height: 22,
                                                          px: 1,
                                                          py: 0,
                                                          textTransform: 'none',
                                                          borderColor: '#6366f1',
                                                          color: '#4f46e5',
                                                          bgcolor: '#eef2ff',
                                                          '&:hover': { bgcolor: '#e0e7ff', borderColor: '#4338ca' },
                                                        }}
                                                      >
                                                        Manage
                                                      </Button>
                                                    </Tooltip>
                                                  )}
                                                  {isStaffOrAbove && (
                                                    <Tooltip title="View or send contract" arrow>
                                                      <Button
                                                        size="small"
                                                        variant="outlined"
                                                        onClick={(e) => { e.stopPropagation(); handleContractClick(sub); }}
                                                        startIcon={<HistoryEduIcon sx={{ fontSize: '0.8rem !important' }} />}
                                                        sx={{
                                                          fontSize: '0.65rem',
                                                          fontWeight: 700,
                                                          height: 22,
                                                          px: 1,
                                                          py: 0,
                                                          textTransform: 'none',
                                                          borderColor: (sub as any).signedwaiver_id ? '#10b981' : '#f59e0b',
                                                          color: (sub as any).signedwaiver_id ? '#059669' : '#b45309',
                                                          bgcolor: (sub as any).signedwaiver_id ? '#f0fdf4' : '#fffbeb',
                                                          '&:hover': { bgcolor: (sub as any).signedwaiver_id ? '#dcfce7' : '#fef3c7' },
                                                        }}
                                                      >
                                                        Contract
                                                      </Button>
                                                    </Tooltip>
                                                  )}
                                               </Stack>
                                          </Box>

                                          <Stack spacing={1} sx={{ mt: 1 }}>
                                             {/* Pack details if available */}
                                              {packDetails && (
                                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                                    {sub.billing_period_start && sub.billing_period_end && (
                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                            <strong>Period:</strong> {new Date(sub.billing_period_start).toLocaleDateString()} - {new Date(sub.billing_period_end).toLocaleDateString()}
                                                        </Typography>
                                                    )}
                                                    {packDetails.classes && (
                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                            <strong>Classes:</strong> {packDetails.classes}
                                                        </Typography>
                                                    )}
                                                    {packDetails.duration_months && (
                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                            <strong>Duration:</strong> {packDetails.duration_months} months
                                                        </Typography>
                                                    )}
                                                    {packDetails.duration_days && (
                                                        <Typography variant="caption" sx={{ color: '#475569' }}>
                                                            <strong>Duration:</strong> {packDetails.duration_days} days
                                                        </Typography>
                                                    )}
                                                </Box>
                                              )}

                                              <Divider sx={{ my: 0.5 }} />

                                              <Box>
                                                  <Typography variant="caption" sx={{ color: '#94a3b8', display: 'block', mb: 0.5, fontWeight: 700, fontSize: '0.65rem' }}>
                                                      COVERAGE
                                                  </Typography>
                                                  <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                                      {coverage.length > 0 ? (
                                                          coverage.map((c: any) => (
                                                              <Chip 
                                                                  key={c.profile_id} 
                                                                  label={`${c.profile?.first_name || 'Member'} (${getAgeGroupName(c.profile?.date_of_birth, ageGroups)})`} 
                                                                  size="small"
                                                                  variant={c.profile_id === selectedProfileId ? "filled" : "outlined"}
                                                                  color={c.profile_id === selectedProfileId ? "primary" : "default"}
                                                                  sx={{ fontSize: '0.65rem', height: '20px' }}
                                                              />
                                                          ))
                                                      ) : (
                                                          <Typography variant="caption" color="text.secondary">No coverage</Typography>
                                                      )}
                                                  </Box>
                                              </Box>
                                          </Stack>
                                      </CardContent>
                                  </Box>
                              </Card>
                          </Grid>
                      );
                  })}
              </Grid>
          ) : (
              <Box sx={{ p: 3, border: '1px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No active service subscriptions.</Typography>
              </Box>
          )}
      </Box>

      {/* Memberships Section */}
      <Box>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155' }}>Memberships</Typography>
            
            <Stack direction="row" spacing={1}>
              {[
                { label: 'ACTIVE', value: 'ACTIVE', color: 'success' },
                { label: 'PAUSED', value: 'PAUSED', color: 'warning' },
                { label: 'EXPIRED', value: 'EXPIRED', color: 'secondary' },
                { label: 'PENDING PAYMENT', value: 'PENDING_PAYMENT', color: 'info' },
                { label: 'CANCELLED', value: 'CANCELLED', color: 'error' }
              ].map((f) => (
                <Chip
                  key={f.value}
                  label={f.label}
                  onClick={() => setMembershipStatusFilter(f.value)}
                  color={membershipStatusFilter === f.value ? (f.color as any) : 'default'}
                  variant={membershipStatusFilter === f.value ? 'filled' : 'outlined'}
                  size="small"
                  sx={{ 
                    fontWeight: 800, 
                    fontSize: '0.65rem',
                    height: 24,
                    px: 0.5,
                    transition: 'all 0.2s',
                    '&:hover': { opacity: 0.8 }
                  }}
                />
              ))}
            </Stack>
          </Box>
          
          {membershipSubscriptions.length > 0 ? (
              <TableContainer component={Paper} elevation={0} variant="outlined">
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                         <TableCell>Type</TableCell>
                            <TableCell>Plan Name</TableCell>
                            <TableCell>Billing Period</TableCell>
                            <TableCell>Sub Status</TableCell>
                            <TableCell>Invoice Status</TableCell>
                            <TableCell>Coverage</TableCell>
                            {isStaffOrAbove && <TableCell align="right">Actions</TableCell>}
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {membershipSubscriptions.map((sub) => {
                            const coverage = getCoverage(sub);
                            
                            let displayPlanName = sub.plan_name || 'Membership';
                            let refInfo = sub.reference_id ? sub.reference_id.substring(0, 8) + '...' : 'N/A';
                
                            if (sub.subscription_type === 'MEMBERSHIP_FEE') {
                                const bp = basePrices.find(p => p.base_price_id === sub.reference_id);
                                if (bp) {
                                    displayPlanName = bp.name;
                                    refInfo = `${bp.age_group_name || ''} ${bp.role ? `(${bp.role})` : ''}`.trim() || refInfo;
                                }
                            } else if (sub.subscription_type === 'MEMBERSHIP_JOINING' || sub.subscription_type === 'MEMBERSHIP_RENEWAL') {
                                const cat = membershipPrograms.flatMap(p => p.categories || []).find((c: any) => c.category_id === sub.reference_id);
                                if (cat) {
                                    displayPlanName = cat.name || displayPlanName;
                                    const prog = membershipPrograms.find(p => (p.categories || []).some((c: any) => c.category_id === sub.reference_id));
                                    refInfo = prog ? prog.name : 'Category';
                                }
                            }

                            return (
                                <TableRow key={sub.subscription_id} hover>
                                    <TableCell>
                                            <Chip 
                                                label={sub.subscription_type.replace(/MEMBERSHIP_/, '').replace('_', ' ')} 
                                                size="small" 
                                            variant="outlined" 
                                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Typography variant="body2" fontWeight={600}>
                                            {displayPlanName}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            Ref: {refInfo}
                                        </Typography>
                                    </TableCell>
                                    <TableCell>
                                        {sub.billing_period_start ? (
                                            <Typography variant="body2">
                                                {new Date(sub.billing_period_start).toLocaleDateString()} - {new Date(sub.billing_period_end!).toLocaleDateString()}
                                            </Typography>
                                        ) : (
                                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                                        )}
                                    </TableCell>
                                     <TableCell>
                                        <Chip 
                                            label={sub.status} 
                                            size="small" 
                                            color={getStatusColor(sub.status) as any} 
                                            sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        {sub.invoice ? (
                                            <Chip 
                                                label={sub.invoice.status} 
                                                size="small" 
                                                variant="outlined"
                                                color={getInvoiceStatusColor(sub.invoice.status) as any} 
                                                sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                            />
                                        ) : (
                                            <Typography variant="caption" color="text.secondary">N/A</Typography>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                            {coverage.length > 0 ? (
                                                coverage.map((c: any) => (
                                                    <Chip 
                                                        key={c.profile_id} 
                                                        label={`${c.profile?.first_name || 'Member'} (${getAgeGroupName(c.profile?.date_of_birth, ageGroups)})`} 
                                                        size="small"
                                                        variant={c.profile_id === selectedProfileId ? "filled" : "outlined"}
                                                        color={c.profile_id === selectedProfileId ? "primary" : "default"}
                                                        sx={{ fontSize: '0.65rem', height: '20px' }}
                                                    />
                                                ))
                                            ) : (
                                                <Typography variant="caption" color="text.secondary italic">No coverage</Typography>
                                            )}
                                        </Box>
                                    </TableCell>
                                    {isStaffOrAbove && (
                                        <TableCell align="right">
                                          <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                            {/* Contract button — available for all memberships except JOINING */}
                                            {sub.subscription_type !== 'MEMBERSHIP_JOINING' && (
                                              <Tooltip title="View contract / waiver" arrow>
                                                <Button
                                                  size="small"
                                                  variant="outlined"
                                                  onClick={() => handleContractClick(sub)}
                                                  startIcon={<HistoryEduIcon sx={{ fontSize: '0.85rem !important' }} />}
                                                  sx={{
                                                    fontSize: '0.72rem',
                                                    fontWeight: 700,
                                                    textTransform: 'none',
                                                    borderColor: (sub as any).signedwaiver_id ? '#10b981' : '#f59e0b',
                                                    color: (sub as any).signedwaiver_id ? '#059669' : '#b45309',
                                                    bgcolor: (sub as any).signedwaiver_id ? '#f0fdf4' : '#fffbeb',
                                                    '&:hover': { bgcolor: (sub as any).signedwaiver_id ? '#dcfce7' : '#fef3c7' },
                                                    borderRadius: '6px',
                                                    px: 1.5,
                                                    py: 0.4,
                                                  }}
                                                >
                                                  Contract
                                                </Button>
                                              </Tooltip>
                                            )}


                                            {/* Manage button */}
                                            {sub.status !== 'CANCELLED' && (
                                              <Tooltip title="Manage subscription (status & pricing)" arrow>
                                                  <Button
                                                      size="small"
                                                      variant="outlined"
                                                      onClick={() => handleManageClick(sub)}
                                                      startIcon={<TuneIcon sx={{ fontSize: '0.85rem !important' }} />}
                                                      sx={{
                                                          fontSize: '0.72rem',
                                                          fontWeight: 700,
                                                          textTransform: 'none',
                                                          borderColor: '#6366f1',
                                                          color: '#4f46e5',
                                                          bgcolor: '#eef2ff',
                                                          '&:hover': { bgcolor: '#e0e7ff', borderColor: '#4338ca' },
                                                          borderRadius: '6px',
                                                          px: 1.5,
                                                          py: 0.4,
                                                      }}
                                                  >
                                                      Manage
                                                  </Button>
                                              </Tooltip>
                                            )}
                                          </Stack>
                                        </TableCell>
                                    )}
                                </TableRow>
                            );
                        })}
                    </TableBody>
                </Table>
              </TableContainer>
          ) : (
              <Box sx={{ p: 3, border: '1px dashed #e2e8f0', borderRadius: 2, textAlign: 'center' }}>
                  <Typography variant="body2" color="text.secondary">No membership subscriptions.</Typography>
              </Box>
          )}
      </Box>

      {/* Contract Viewing Dialog */}
      <Dialog open={contractDialogOpen} onClose={() => setContractDialogOpen(false)} maxWidth="md" fullWidth scroll="paper">
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, borderBottom: '1px solid #e2e8f0' }}>
          <HistoryEduIcon color={contractIsPending ? 'warning' : 'success'} />
          <Typography variant="h6" fontWeight={800}>
            {contractIsPending ? 'Review & Sign Contract' : 'Signed Contract'}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ bgcolor: '#f8fafc', p: 0 }}>
          {contractLoading && (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 8 }}>
              <CircularProgress size={40} />
              <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary', fontWeight: 600 }}>Loading contract details...</Typography>
            </Box>
          )}
          
          {contractIsPending && !contractLoading && (
            <Box sx={{ p: { xs: 1, md: 4 } }}>
              {pendingTemplate ? (
                <>
                  <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
                    This subscription requires a signed contract. You can sign it in-place below or generate a link for the customer.
                  </Alert>

                  <WaiverPreview
                    content={pendingTemplate.content}
                    variables={getWaiverVariables(selectedSubscriptionForContract) as Record<string, string>}
                    data={{
                      first_name: (() => {
                        const coverage = getCoverage(selectedSubscriptionForContract);
                        return coverage[0]?.profile?.first_name || 'Member';
                      })(),
                      last_name: (() => {
                        const coverage = getCoverage(selectedSubscriptionForContract);
                        return coverage[0]?.profile?.last_name || '';
                      })(),
                      guardian_name: (getWaiverVariables(selectedSubscriptionForContract) as any)?.GuardianName
                    }}
                    agreed={agreed}
                    onAgreeChange={setAgreed}
                    hideCheckbox={true}
                    fullHeight={true}
                    signatureComponent={
                      <SignaturePad
                        ref={signaturePadRef}
                        width={500}
                        height={180}
                      />
                    }
                  />
                </>
              ) : (
                <Box sx={{ py: 8, textAlign: 'center' }}>
                  <HistoryEduIcon sx={{ fontSize: 64, color: '#94a3b8', mb: 2, opacity: 0.5 }} />
                  <Typography variant="h6" fontWeight={700} color="text.secondary">No Suitable Template Found</Typography>
                  <Typography variant="body2" color="text.disabled" sx={{ mt: 1, maxWidth: 400, mx: 'auto' }}>
                    We couldn't automatically find a contract template for this purchase. 
                    Please ensure templates are configured for this membership/service.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    startIcon={<SendIcon />} 
                    onClick={handleOpenGenerateWaiver}
                    sx={{ mt: 4, textTransform: 'none', fontWeight: 700, borderRadius: 2 }}
                  >
                    Manually Select Template
                  </Button>
                </Box>
              )}
            </Box>
          )}

          {contractData && !contractLoading && (
            <Box sx={{ p: { xs: 1, md: 4 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Stack direction="row" spacing={1}>
                  <Chip label={contractData.waiver_type} size="small" color="primary" sx={{ fontWeight: 800 }} />
                  <Chip label="SIGNED" size="small" color="success" sx={{ fontWeight: 800 }} />
                </Stack>
                <Typography variant="caption" color="text.secondary" fontWeight={600}>
                  Signed on {new Date(contractData.signed_at).toLocaleString()}
                </Typography>
              </Box>

              <WaiverPreview
                content={contractData.content}
                data={{
                  first_name: '', // already replaced in content
                  last_name: '' 
                }}
                agreed={true}
                onAgreeChange={() => {}}
                hideCheckbox={true}
                fullHeight={true}
                signatureComponent={
                  contractData.signature_url ? (
                    <Box sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e2e8f0', borderRadius: 2 }}>
                       <img src={contractData.signature_url} alt="Signature" style={{ maxHeight: 100 }} />
                    </Box>
                  ) : null
                }
              />
            </Box>
          )}
        </DialogContent>

        {contractIsPending && !contractLoading && pendingTemplate && (
          <Box sx={{ p: 3, pt: 2, bgcolor: '#fff', borderTop: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={agreed} 
                  onChange={(e) => setAgreed(e.target.checked)} 
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" fontWeight={600} color="#1e293b">
                  I have read and agree to all terms and conditions
                </Typography>
              }
              sx={{ mb: 2 }}
            />
            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', width: '100%' }}>
              <Button 
                variant="contained" 
                color="primary"
                size="large"
                startIcon={isSigningInPlace ? <CircularProgress size={20} color="inherit" /> : <HistoryEduIcon />} 
                onClick={handleSignInPlace}
                disabled={!agreed || isSigningInPlace}
                sx={{ textTransform: 'none', fontWeight: 800, borderRadius: 2, px: 4 }}
              >
                {isSigningInPlace ? 'Submitting...' : 'Sign & Submit Now'}
              </Button>
              <Button 
                variant="outlined" 
                size="large"
                startIcon={<SendIcon />} 
                onClick={handleOpenGenerateWaiver}
                sx={{ textTransform: 'none', fontWeight: 700, borderRadius: 2, color: '#334155', borderColor: '#cbd5e1' }}
              >
                Generate Signing Link
              </Button>
            </Box>
          </Box>
        )}

        <DialogActions sx={{ p: 2, borderTop: (contractIsPending && !contractLoading && pendingTemplate) ? 'none' : '1px solid #e2e8f0', bgcolor: (contractIsPending && !contractLoading && pendingTemplate) ? '#f8fafc' : 'transparent' }}>
          <Button onClick={() => setContractDialogOpen(false)} sx={{ textTransform: 'none', fontWeight: 700 }} color="inherit">Close</Button>
          {!contractIsPending && contractData && role !== 'MEMBER' && (
             <Button
                onClick={() => handleEmailDraftReady({ 
                    subject: 'Signed Contract Copy', 
                    body: 'Please find your signed contract details below.', 
                    publicUrl: '' 
                })}
                color="primary"
                startIcon={<EmailIcon />}
                disabled={contractLoading}
                sx={{ textTransform: 'none', fontWeight: 700 }}
             >
                Compose Email
             </Button>
          )}
          <Button 
            onClick={() => window.print()} 
            color="primary" 
            startIcon={<PrintIcon />}
            sx={{ textTransform: 'none', fontWeight: 700 }}
          >
            Print
          </Button>
        </DialogActions>
      </Dialog>


      {/* Subscription manage dialog (staff/admin/superadmin only) */}
      {isStaffOrAbove && managedSub && (
        <SubscriptionManageDialog
          open={manageOpen}
          onClose={() => { setManageOpen(false); setManagedSub(null); }}
          onSuccess={handleManageSuccess}
          subscription={managedSub}
        />
      )}

      {/* Generate Waiver Dialog */}
      {isStaffOrAbove && (() => {
          let initVars: Record<string, string> = {};
          if (selectedSubscriptionForContract) {
             initVars = getWaiverVariables(selectedSubscriptionForContract);
          }
          return (
             <GenerateWaiverDialog
               open={generateWaiverOpen}
               onClose={() => setGenerateWaiverOpen(false)}
               accountId={accountId}
               profileId={selectedProfileId || (selectedSubscriptionForContract ? getCoverage(selectedSubscriptionForContract)[0]?.profile_id : '') || ''}
               profileName={initVars.FullName || 'Primary Contact'}
               subscription={selectedSubscriptionForContract}
               initialVariables={initVars}
               onEmailDraftReady={handleEmailDraftReady}
               onLinkGenerated={() => showToast('Link generated and copied to clipboard!', 'success')}
             />
          );
      })()}

      {/* Email Compose Dialog */}
      <Dialog open={openCompose} onClose={() => setOpenCompose(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {composeDraft && (
            <EmailComposer
              onClose={() => setOpenCompose(false)}
              onSuccess={handleComposerSuccess}
              initialTo={composeDraft.to}
              initialSubject={composeDraft.subject}
              initialBody={composeDraft.body}
              initialTemplateId={composeDraft.templateId}
              initialAttachments={composeDraft.attachments}
              initialAccountId={accountId}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar 
        open={toast.open} 
        autoHideDuration={6000} 
        onClose={() => setToast(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={() => setToast(prev => ({ ...prev, open: false }))} 
          severity={toast.severity} 
          variant="filled" 
          sx={{ width: '100%', borderRadius: 2, fontWeight: 600 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

