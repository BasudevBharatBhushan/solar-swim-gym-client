
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Button
} from '@mui/material';
import { useAuth } from '../../../context/AuthContext';
import { billingService } from '../../../services/billingService';
import { Subscription } from '../../../types';

import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroupName } from '../../../lib/ageUtils';


interface SubscriptionsTabProps {
  accountId: string;
  selectedProfileId: string | null;
}

export const SubscriptionsTab = ({ accountId, selectedProfileId }: SubscriptionsTabProps) => {
  const navigate = useNavigate();
  const { currentLocationId, role } = useAuth();
  const { ageGroups } = useConfig();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSubscriptions = async () => {
      setLoading(true);
      try {
        const response = await billingService.getAccountSubscriptions(accountId, currentLocationId || undefined);
        setSubscriptions(response.data || response || []);
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

  const getCoverage = (sub: any) => {
      return sub.subscription_coverage || sub.coverage || [];
  };

  if (loading) {
      return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
      return <Typography color="error">{error}</Typography>;
  }

  if (subscriptions.length === 0) {
      return (
        <Box>
            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="h6">Subscriptions</Typography>
                <Button 
                    variant="contained" 
                    size="small" 
                    onClick={() => {
                        const isMember = role === 'MEMBER' || role === 'USER';
                        if (isMember) {
                            navigate('/portal/marketplace');
                        } else {
                            navigate(`/admin/accounts/${accountId}/marketplace`);
                        }
                    }}
                >
                    Add Subscription
                </Button>
            </Box>
            <Typography color="text.secondary" align="center" sx={{ py: 4 }}>No subscriptions found.</Typography>
        </Box>
      );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Subscriptions</Typography>
          <Button 
            variant="contained" 
            size="small" 
            onClick={() => {
                const isMember = role === 'MEMBER' || role === 'USER';
                if (isMember) {
                    navigate('/portal/marketplace');
                } else {
                    navigate(`/admin/accounts/${accountId}/marketplace`);
                }
            }}
          >
            Add Subscription
          </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                    <TableCell>Type</TableCell>
                    <TableCell>Plan/Service</TableCell>
                    <TableCell>Billing Period</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Coverage</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {subscriptions
                  .filter(sub => !selectedProfileId || getCoverage(sub).some((c: any) => c.profile_id === selectedProfileId))
                  .map((sub) => {
                    const coverage = getCoverage(sub);
                    return (
                        <TableRow 
                            key={sub.subscription_id} 
                            hover
                        >
                            <TableCell>
                                <Chip 
                                    label={sub.subscription_type.replace('_', ' ')} 
                                    size="small" 
                                    variant="outlined" 
                                    sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight={600}>
                                    {sub.plan_name || (sub.subscription_type === 'MEMBERSHIP_FEE' ? 'Membership Program' : (sub.subscription_type === 'ADDON_SERVICE' ? 'Service/Pack' : 'Base Subscription'))}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                    Ref: {sub.reference_id.substring(0, 8)}...
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
                                        <Typography variant="caption" color="text.secondary italic">No coverage recorded</Typography>
                                    )}
                                </Box>
                            </TableCell>
                        </TableRow>
                    );
                })}
                {subscriptions.filter(sub => !selectedProfileId || getCoverage(sub).some((c: any) => c.profile_id === selectedProfileId)).length === 0 && (
                    <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                            <Typography color="text.secondary">No subscriptions found for the selected profile.</Typography>
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
