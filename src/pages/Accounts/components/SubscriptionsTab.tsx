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
  Divider
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { billingService } from '../../../services/billingService';
import { serviceCatalog } from '../../../services/serviceCatalog';
import { basePriceService, BasePrice } from '../../../services/basePriceService';
import { membershipService, MembershipProgram } from '../../../services/membershipService';
import { Subscription } from '../../../types';

import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroupName } from '../../../lib/ageUtils';

interface SubscriptionsTabProps {
  accountId: string;
  selectedProfileId: string | null;
}

export const SubscriptionsTab = ({ accountId, selectedProfileId }: SubscriptionsTabProps) => {
  const { currentLocationId } = useAuth();
  const { ageGroups } = useConfig();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [serviceImages, setServiceImages] = useState<Record<string, string>>({});
  const [serviceDetails, setServiceDetails] = useState<Record<string, any>>({}); // To store extra pack details if needed
  const [basePrices, setBasePrices] = useState<BasePrice[]>([]);
  const [membershipPrograms, setMembershipPrograms] = useState<MembershipProgram[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
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

    if (accountId && currentLocationId) {
      fetchSubscriptions();
    }
  }, [accountId, currentLocationId]);

  const getStatusColor = (status: string) => {
      switch (status) {
          case 'ACTIVE': return 'success';
          case 'PAID': return 'success';
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
  const membershipSubscriptions = filteredSubscriptions.filter(s => s.subscription_type !== 'SERVICE');


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
          <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 2, color: '#334155' }}>Memberships</Typography>
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
    </Box>
  );
};
