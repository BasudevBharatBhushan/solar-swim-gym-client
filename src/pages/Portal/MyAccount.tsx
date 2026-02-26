import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Grid, CircularProgress, Typography, Paper, Tabs, Tab } from '@mui/material';
import { crmService } from '../../services/crmService';
import { cartService } from '../../services/cartService';
import { AccountSummary } from '../Accounts/components/AccountSummary';
import { ProfileList } from '../Accounts/components/ProfileList';
import { ProfileDetail } from '../Accounts/components/ProfileDetail';
import { SubscriptionsTab } from '../Accounts/components/SubscriptionsTab';
import { WaiversTab } from '../Accounts/components/WaiversTab';
import { InvoicesTab } from '../Accounts/components/InvoicesTab';
import { TransactionsTab } from '../Accounts/components/TransactionsTab';
import { SavedCardsTab } from '../Accounts/components/SavedCardsTab';
import { ProfileUpsertDialog } from '../Accounts/components/ProfileUpsertDialog';
import { useAuth } from '../../context/AuthContext';

export const MyAccount = () => {
    const { userParams, currentLocationId } = useAuth();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [account, setAccount] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
    const [cartCount, setCartCount] = useState(0);
    const [profileToEdit, setProfileToEdit] = useState<any>(null);
    const [openProfileUpsert, setOpenProfileUpsert] = useState(false);
    
    // Right Panel Tabs: 0=Profile Details, 1=Subscriptions, 2=Waivers, 3=Invoices, 4=Transactions, 5=Saved Cards
    const [tabValue, setTabValue] = useState(0);

    // Auto-switch tabs based on URL params
    useEffect(() => {
        const tabParam = searchParams.get('tab');
        if (tabParam === 'waivers') {
            setTabValue(2);
        } else if (tabParam === 'invoices') {
            setTabValue(3);
        } else if (tabParam === 'transactions') {
            setTabValue(4);
        } else if (tabParam === 'cards') {
            setTabValue(5);
        } else if (tabParam === 'subscriptions') {
            setTabValue(1);
        }
    }, [searchParams]);

    useEffect(() => {
        const fetchAccount = async () => {
            if (!userParams?.account_id) return;
            
            setLoading(true);
            try {
                const response = await crmService.getAccountDetails(userParams.account_id, currentLocationId || undefined);
                const data = response.data || response;
                
                const normalizedData = {
                    ...data,
                    profiles: data.profiles || data.profile || []
                };
                
                setAccount(normalizedData);
                setSelectedProfileId(null);

            } catch (err: any) {
                console.error("Failed to fetch account details", err);
                if (userParams && userParams.account_id) {
                     const fallbackData = {
                        account_id: userParams.account_id,
                        profiles: [{
                            profile_id: userParams.profile_id,
                            first_name: userParams.first_name,
                            last_name: userParams.last_name,
                             date_of_birth: userParams.date_of_birth,
                             is_primary: userParams.is_primary,
                             email: userParams.email
                        }]
                     };
                     setAccount(fallbackData);
                } else {
                    setError("Failed to load your account. " + (err.message || ''));
                }
            } finally {
                setLoading(false);
            }
        };

        const fetchCartCount = async () => {
            if (!userParams?.account_id || !currentLocationId) return;
            try {
              const items = await cartService.getItems(currentLocationId);
              const count = items.filter(i => i.account_id === userParams.account_id).length;
              setCartCount(count);
            } catch (err) {
              console.error("Failed to fetch cart count", err);
            }
          };

        fetchAccount();
        fetchCartCount();
    }, [userParams, currentLocationId]);

    const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
        setTabValue(newValue);
    };

    const handleProfileSelect = (profileId: string) => {
        setSelectedProfileId(profileId);
    };


    
    const handleAddMember = () => {
        setProfileToEdit(null);
        setOpenProfileUpsert(true);
    };

    const handleEditMember = (profile: any) => {
        setProfileToEdit(profile);
        setOpenProfileUpsert(true);
    };

    const handleUpsertSuccess = () => {
        // Refresh account details
        if (userParams?.account_id) {
            crmService.getAccountDetails(userParams.account_id, currentLocationId || undefined)
                .then(response => {
                    const data = response.data || response;
                    setAccount({
                        ...data,
                        profiles: data.profiles || data.profile || []
                    });
                });
        }
        setOpenProfileUpsert(false);
    };

    const handleAddSubscription = () => {
        navigate('/portal/marketplace');
    };

    const handleClearCart = async () => {
        if (!userParams?.account_id || !currentLocationId) return;
        try {
          await cartService.clearCart(userParams.account_id, currentLocationId);
          setCartCount(0);
        } catch (err: any) {
          console.error("Failed to clear cart", err);
        }
      };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
                <CircularProgress />
            </Box>
        );
    }

    if (error || !account) {
        return (
            <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography color="error">{error || 'Account info unavailable'}</Typography>
            </Box>
        );
    }

    const selectedProfile = account.profiles?.find((p: any) => p.profile_id === selectedProfileId);

    return (
        <Box>
            <Box sx={{ mb: 3 }}>
               <Typography variant="h4" fontWeight="bold" color="text.primary">
                   My Account
               </Typography>
               <Typography variant="body1" color="text.secondary">
                   Manage your family profiles and subscriptions
               </Typography>
            </Box>

            <AccountSummary 
                account={account} 
                onStoreClick={handleAddSubscription}
                cartCount={cartCount}
                onClearCart={handleClearCart}
            />

            <Grid container spacing={3} sx={{ mt: 1 }}>
                {/* Left Panel: Profile List */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <ProfileList 
                        profiles={account.profiles || []} 
                        selectedProfileId={selectedProfileId} 
                        onSelectProfile={handleProfileSelect} 
                        onAddMember={handleAddMember}
                    />
                </Grid>

                {/* Right Panel: Tabs */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper sx={{ width: '100%', minHeight: 400, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
                        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
                            <Tabs value={tabValue} onChange={handleTabChange} aria-label="account detail tabs">
                                <Tab label="Profile Details" />
                                <Tab label="Subscriptions" />
                                <Tab label="Waivers" />
                                <Tab label="Invoices" />
                                <Tab label="Transactions" />
                                <Tab label="Saved Cards" />
                            </Tabs>
                        </Box>
                        <Box sx={{ p: 3 }}>
                            {tabValue === 0 && (
                                <ProfileDetail 
                                    profile={selectedProfile} 
                                    accountId={account.account_id} 
                                    onEdit={() => handleEditMember(selectedProfile)}
                                />
                            )}
                            {tabValue === 1 && (
                                <SubscriptionsTab accountId={account.account_id} selectedProfileId={selectedProfileId} />
                            )}
                            {tabValue === 2 && (
                                <WaiversTab
                                    profiles={account.profiles || []}
                                    selectedProfileId={selectedProfileId}
                                    accountId={account.account_id}
                                />
                            )}
                            {tabValue === 3 && (
                                <InvoicesTab accountId={account.account_id} />
                            )}
                            {tabValue === 4 && (
                                <TransactionsTab accountId={account.account_id} />
                            )}
                            {tabValue === 5 && (
                                <SavedCardsTab accountId={account.account_id} />
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>

            {account && (
                <ProfileUpsertDialog
                    open={openProfileUpsert}
                    onClose={() => setOpenProfileUpsert(false)}
                    onSuccess={handleUpsertSuccess}
                    account_id={account.account_id}
                    profile={profileToEdit}
                />
            )}
        </Box>
    );
};
