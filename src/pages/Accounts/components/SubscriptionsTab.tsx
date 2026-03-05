import { useEffect, useState } from 'react';
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
} from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import { useAuth } from '../../../context/AuthContext';
import { billingService } from '../../../services/billingService';
import { serviceCatalog } from '../../../services/serviceCatalog';
import { basePriceService, BasePrice } from '../../../services/basePriceService';
import { membershipService, MembershipProgram } from '../../../services/membershipService';
import { waiverService } from '../../../services/waiverService';
import { Subscription } from '../../../types';
import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroupName } from '../../../lib/ageUtils';
import { SubscriptionManageDialog } from './SubscriptionManageDialog';
import HistoryEduIcon from '@mui/icons-material/HistoryEdu';
import LinkIcon from '@mui/icons-material/Link';
import { Dialog, DialogTitle, DialogContent, DialogActions, Select, MenuItem, InputLabel, FormControl } from '@mui/material';

interface SubscriptionsTabProps {
  accountId: string;
  selectedProfileId: string | null;
}

export const SubscriptionsTab = ({ accountId, selectedProfileId }: SubscriptionsTabProps) => {
  const { currentLocationId, role } = useAuth();
  const { ageGroups } = useConfig();
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
  
  // Contract dialog state
  const [contractOpen, setContractOpen] = useState(false);
  const [contractData, setContractData] = useState<any>(null);
  const [contractLoading, setContractLoading] = useState(false);

  // Filter for membership status: ACTIVE, PENDING, CANCELLED
  const [membershipStatusFilter, setMembershipStatusFilter] = useState<string>('ACTIVE');

  const isStaffOrAbove = ['STAFF', 'ADMIN', 'SUPERADMIN'].includes(role ?? '');

  // Link contract dialog state
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkSub, setLinkSub] = useState<Subscription | null>(null);
  const [availableWaivers, setAvailableWaivers] = useState<any[]>([]);
  const [selectedWaiverId, setSelectedWaiverId] = useState<string>('');
  const [linkLoading, setLinkLoading] = useState(false);

  const handleContractClick = async (sub: Subscription) => {
    if (!sub.signedwaiver_id) return;
    setContractLoading(true);
    setContractOpen(true);
    try {
      const res = await waiverService.getSignedWaiverById(sub.signedwaiver_id);
      setContractData(res.data || res);
    } catch (err) {
      console.error('Failed to load contract', err);
    } finally {
      setContractLoading(false);
    }
  };

  const handleOpenLinkDialog = async (sub: Subscription) => {
    setLinkSub(sub);
    setLinkOpen(true);
    setLinkLoading(true);
    try {
        // Fetch signed waivers for the profile(s) on this sub
        const targetProfileId = selectedProfileId || sub.subscription_coverage?.[0]?.profile_id || sub.coverage?.[0]?.profile_id || '';
        const res = await waiverService.getSignedWaivers(targetProfileId, currentLocationId || '');
        setAvailableWaivers(res.data || res);
    } catch (err) {
        console.error('Failed to load available waivers', err);
    } finally {
        setLinkLoading(false);
    }
  };

  const handleLinkContract = async () => {
    if (!linkSub || !selectedWaiverId) return;
    setLinkLoading(true);
    try {
        await waiverService.linkWaiverToSubscription(linkSub.subscription_id, selectedWaiverId);
        // We'd ideally refresh the subscriptions list here
        setLinkOpen(false);
        setLinkSub(null);
        setSelectedWaiverId('');
    } catch (err) {
        console.error('Failed to link contract', err);
    } finally {
        setLinkLoading(false);
    }
  };

  const handleManageClick = (sub: any) => {
    setManagedSub(sub);
    setManageOpen(true);
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
                                                  {sub.signedwaiver_id ? (
                                                      <Chip
                                                          icon={<HistoryEduIcon sx={{ fontSize: '0.8rem' }} />}
                                                          label="View Contract"
                                                          size="small"
                                                          onClick={(e) => { e.stopPropagation(); handleContractClick(sub); }}
                                                          color="primary"
                                                          variant="outlined"
                                                          sx={{ mt: 1, fontSize: '0.65rem', height: 20, cursor: 'pointer' }}
                                                      />
                                                  ) : (
                                                      <Chip
                                                          icon={<LinkIcon sx={{ fontSize: '0.8rem' }} />}
                                                          label="Link Contract"
                                                          size="small"
                                                          onClick={(e) => { e.stopPropagation(); handleOpenLinkDialog(sub); }}
                                                          color="warning"
                                                          variant="outlined"
                                                          sx={{ mt: 1, fontSize: '0.65rem', height: 20, cursor: 'pointer' }}
                                                      />
                                                  )}
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
                            <TableCell>Contract</TableCell>
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
                                    <TableCell>
                                        {sub.signedwaiver_id ? (
                                            <Chip
                                                icon={<HistoryEduIcon sx={{ fontSize: '0.8rem' }} />}
                                                label="View"
                                                size="small"
                                                onClick={() => handleContractClick(sub)}
                                                color="primary"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: 22, cursor: 'pointer' }}
                                            />
                                        ) : (
                                            <Chip
                                                icon={<LinkIcon sx={{ fontSize: '0.8rem' }} />}
                                                label="Link"
                                                size="small"
                                                onClick={() => handleOpenLinkDialog(sub)}
                                                color="warning"
                                                variant="outlined"
                                                sx={{ fontSize: '0.65rem', height: 22, cursor: 'pointer' }}
                                            />
                                        )}
                                    </TableCell>
                                    {isStaffOrAbove && sub.status !== 'CANCELLED' && (
                                        <TableCell align="right">
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

      {/* Subscription manage dialog (staff/admin/superadmin only) */}
      {isStaffOrAbove && managedSub && (
        <SubscriptionManageDialog
          open={manageOpen}
          onClose={() => { setManageOpen(false); setManagedSub(null); }}
          onSuccess={handleManageSuccess}
          subscription={managedSub}
        />
      )}

      {/* Contract Viewer Dialog */}
      <Dialog 
        open={contractOpen} 
        onClose={() => setContractOpen(false)}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
            Subscription Contract
        </DialogTitle>
        <DialogContent dividers>
            {contractLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                    <CircularProgress />
                </Box>
            ) : contractData ? (
                <Box sx={{ bgcolor: '#f1f5f9', p: { xs: 1, md: 4 }, borderRadius: 1 }}>
                    <Box
                      sx={{ 
                        maxWidth: '816px', 
                        width: '100%', 
                        margin: '0 auto', 
                        bgcolor: '#fff', 
                        p: { xs: 2, md: 6 },
                        boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
                        '& img': { maxWidth: '100%', height: 'auto' }
                      }}
                      dangerouslySetInnerHTML={{ __html: contractData.content }}
                    />
                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Signature</Typography>
                        {contractData.signature_url ? (
                            <img src={contractData.signature_url} alt="Signature" style={{ border: '1px solid #e2e8f0', borderRadius: 8, maxHeight: 100, backgroundColor: '#fff', padding: 4 }} />
                        ) : (
                             <Typography variant="body2" color="text.disabled">No signature captured</Typography>
                        )}
                        <Typography variant="caption" display="block" sx={{ mt: 1, color: '#64748b' }}>
                            Signed on {new Date(contractData.signed_at || contractData.created_at).toLocaleString()}
                        </Typography>
                    </Box>
                </Box>
            ) : (
                <Typography color="error">Failed to load contract data.</Typography>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setContractOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Link Contract Dialog */}
      <Dialog open={linkOpen} onClose={() => setLinkOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Link Contract to Subscription</DialogTitle>
        <DialogContent dividers>
            <Typography variant="body2" sx={{ mb: 2 }}>
                Select a signed waiver to link to {linkSub?.plan_name || 'this subscription'}.
            </Typography>
            {linkLoading ? (
                <CircularProgress size={24} />
            ) : (
                <FormControl fullWidth size="small">
                    <InputLabel>Signed Waiver</InputLabel>
                    <Select
                        value={selectedWaiverId}
                        label="Signed Waiver"
                        onChange={(e) => setSelectedWaiverId(e.target.value)}
                    >
                        {availableWaivers.length === 0 && (
                            <MenuItem value="" disabled>No signed waivers found</MenuItem>
                        )}
                        {availableWaivers.map((w: any) => (
                            <MenuItem key={w.signed_waiver_id} value={w.signed_waiver_id}>
                                {w.template?.template_category || `Waiver ${w.signed_waiver_id.substring(0,8)}`} - Signed: {new Date(w.signed_at).toLocaleDateString()}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setLinkOpen(false)} color="inherit">Cancel</Button>
            <Button 
                onClick={handleLinkContract} 
                variant="contained" 
                disabled={linkLoading || !selectedWaiverId}
            >
                Link Contract
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
