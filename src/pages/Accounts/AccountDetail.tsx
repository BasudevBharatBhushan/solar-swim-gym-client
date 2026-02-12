
import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, CircularProgress, Typography, Button, Paper, Tabs, Tab } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { crmService } from '../../services/crmService';
import { PageHeader } from '../../components/Common/PageHeader';
import { AccountSummary } from './components/AccountSummary';
import { ProfileList } from './components/ProfileList';
import { ProfileDetail } from './components/ProfileDetail';
import { SubscriptionsTab } from './components/SubscriptionsTab';
import { WaiversTab } from './components/WaiversTab';
import { useAuth } from '../../context/AuthContext';
import type { Account, Profile } from '../../types';

interface AccountDetailData extends Account {
  profile?: Profile[];
  primary_profile?: Profile;
}

export const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { currentLocationId } = useAuth();
  const [account, setAccount] = useState<AccountDetailData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Right Panel Tabs
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchAccount = async () => {
      if (!accountId || !currentLocationId) return;
      setLoading(true);
      try {
        const response = await crmService.getAccountDetails(accountId, currentLocationId || undefined);
        const data = (response as { data?: AccountDetailData }).data || (response as AccountDetailData);
        
        // Normalize data: ensure 'profiles' exists even if API returns 'profile'
        const normalizedData = {
            ...data,
            profiles: data.profiles || data.profile || []
        };
        
        setAccount(normalizedData);
        // Default to 'All Members' (null)
        setSelectedProfileId(null);

      } catch (err: unknown) {
        console.error("Failed to fetch account details", err);
        setError("Failed to load account details. " + (err instanceof Error ? err.message : ''));
      } finally {
        setLoading(false);
      }
    };

    fetchAccount();
  }, [accountId, currentLocationId]);

  const handleTabChange = useCallback((_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  }, []);

  const handleProfileSelect = useCallback((profileId: string | null) => {
    setSelectedProfileId(profileId);
    // Optionally switch to details tab when clicking a profile, 
    // or stay on subscriptions tab to see that profile's subscriptions
    // For now, let's keep the user on the current tab to allow rapid filtering of subscriptions
  }, []);

  const handleBackToAccounts = useCallback(() => {
    navigate('/admin/accounts');
  }, [navigate]);

  if (loading) {
    return (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
            <CircularProgress />
        </Box>
    );
  }

  if (error || !account) {
    return (
        <Box sx={{ p: 3 }}>
            <Typography color="error">{error || 'Account not found'}</Typography>
            <Button startIcon={<ArrowBackIcon />} onClick={handleBackToAccounts} sx={{ mt: 2 }}>
                Back to Accounts
            </Button>
        </Box>
    );
  }

  const selectedProfile = account.profiles?.find((p) => p.profile_id === selectedProfileId) || null;

  return (
    <Box>
      <PageHeader
        title="Account Details"
        breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Accounts', href: '/admin/accounts' },
            { label: 'Detail', active: true }
        ]}
        action={
            <Button 
                startIcon={<ArrowBackIcon />} 
                onClick={handleBackToAccounts}
                variant="outlined"
                sx={{ textTransform: 'none' }}
            >
                Back
            </Button>
        }
      />

      <AccountSummary account={account} />

      <Grid container spacing={3}>
        {/* Left Panel: Profile List */}
        <Grid size={{ xs: 12, md: 4 }}>
          <ProfileList 
            profiles={account.profiles || []} 
            selectedProfileId={selectedProfileId} 
            onSelectProfile={handleProfileSelect} 
          />
        </Grid>

        {/* Right Panel: Tabs */}
        <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ width: '100%', minHeight: 400, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                    <Tabs value={tabValue} onChange={handleTabChange} aria-label="account detail tabs">
                        <Tab label="Profile Details" />
                        <Tab label="Subscriptions" />
                        <Tab label="Signed Waivers" />
                    </Tabs>
                </Box>
                <Box sx={{ p: 3 }}>
                    {tabValue === 0 && (
                        <ProfileDetail profile={selectedProfile} accountId={account.account_id} />
                    )}
                    {tabValue === 1 && (
                        <SubscriptionsTab accountId={account.account_id} selectedProfileId={selectedProfileId} />
                    )}
                    {tabValue === 2 && (
                        <WaiversTab profiles={account.profiles || []} selectedProfileId={selectedProfileId} />
                    )}
                </Box>
            </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
