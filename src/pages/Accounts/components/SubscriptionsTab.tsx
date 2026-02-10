
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

interface SubscriptionsTabProps {
  accountId: string;
  selectedProfileId: string | null;
}

export const SubscriptionsTab = ({ accountId, selectedProfileId }: SubscriptionsTabProps) => {
  const navigate = useNavigate();
  const { currentLocationId } = useAuth();
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

  const isProfileCovered = (sub: Subscription) => {
      if (!selectedProfileId) return true; 
      return sub.coverage?.some(c => c.profile_id === selectedProfileId);
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
                    onClick={() => navigate(`/admin/accounts/${accountId}/marketplace`)}
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
            onClick={() => navigate(`/admin/accounts/${accountId}/marketplace`)}
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
                {subscriptions.map((sub) => {
                    const isRelevant = isProfileCovered(sub);
                    return (
                        <TableRow 
                            key={sub.subscription_id} 
                            sx={{ 
                                bgcolor: isRelevant ? 'transparent' : 'action.hover',
                                opacity: isRelevant ? 1 : 0.5 
                            }}
                        >
                            <TableCell>
                                <Chip label={sub.subscription_type} size="small" variant="outlined" />
                            </TableCell>
                            <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                    {sub.plan_name || sub.reference_id}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                {sub.billing_period_start ? (
                                    <Typography variant="caption" display="block">
                                        {new Date(sub.billing_period_start).toLocaleDateString()} - {new Date(sub.billing_period_end!).toLocaleDateString()}
                                    </Typography>
                                ) : '-'}
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={sub.status} 
                                    size="small" 
                                    color={getStatusColor(sub.status) as any} 
                                />
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {sub.coverage?.map((c) => (
                                        <Chip 
                                            key={c.profile_id} 
                                            label={c.role} 
                                            size="small" 
                                            variant={c.profile_id === selectedProfileId ? "filled" : "outlined"}
                                            color={c.profile_id === selectedProfileId ? "primary" : "default"}
                                            sx={{ fontSize: '0.7rem' }}
                                        />
                                    ))}
                                </Box>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
};
