
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Grid, CircularProgress, Typography, Button, Paper, Tabs, Tab, Stack, Snackbar, Alert, Dialog, DialogContent, Tooltip, DialogTitle, DialogActions } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import LinkIcon from '@mui/icons-material/Link';
import PaymentsIcon from '@mui/icons-material/Payments';
import LaunchIcon from '@mui/icons-material/Launch';
import DeleteIcon from '@mui/icons-material/Delete';
import WarningIcon from '@mui/icons-material/Warning';
import DrawIcon from '@mui/icons-material/Draw';
import { authService } from '../../services/authService';
import { billingService } from '../../services/billingService';

import { EmailComposer } from '../../components/Email/EmailComposer';
import { crmService } from '../../services/crmService';
import { cartService } from '../../services/cartService';
import { PageHeader } from '../../components/Common/PageHeader';
import { AccountSummary } from './components/AccountSummary';
import { ProfileList } from './components/ProfileList';
import { ProfileDetail } from './components/ProfileDetail';
import { SubscriptionsTab } from './components/SubscriptionsTab';
import { WaiversTab } from './components/WaiversTab';
import { InvoicesTab } from './components/InvoicesTab';
import { TransactionsTab } from './components/TransactionsTab';
import { ProfileUpsertDialog } from './components/ProfileUpsertDialog';
import { SavedCardsTab } from './components/SavedCardsTab';
import { GenerateWaiverDialog } from './components/GenerateWaiverDialog';
import { useAuth } from '../../context/AuthContext';
import { ManagerPasscodeDialog } from '../../components/Common/ManagerPasscodeDialog';

interface WaiverComposeDraft {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments: File[];
  accountId?: string;
}

export const AccountDetail = () => {
  const { accountId } = useParams<{ accountId: string }>();
  const navigate = useNavigate();
  const { currentLocationId, role } = useAuth();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Right Panel Tabs: 0=Profile Details, 1=Subscriptions, 2=Waivers, 3=Invoices, 4=Transactions, 5=Saved Cards
  const [tabValue, setTabValue] = useState(0);
  const [searchParams] = useSearchParams();

  // Auto-switch tabs / pre-select profile based on URL params
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
    } else if (tabParam === 'purchases') {
      setTabValue(1);
    }

    const profileIdParam = searchParams.get('profileId');
    if (profileIdParam) {
      setSelectedProfileId(profileIdParam);
      setTabValue(0); // open Profile Details tab
    }
  }, [searchParams]);


  // Cart state
  const [cartCount, setCartCount] = useState(0);

  // Actions State
  const [actionLoading, setActionLoading] = useState(false);
  const [openCompose, setOpenCompose] = useState(false);
  const [openProfileUpsert, setOpenProfileUpsert] = useState(false);
  const [profileToEdit, setProfileToEdit] = useState<any>(null);
  const [composeDraft, setComposeDraft] = useState<WaiverComposeDraft | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });

  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);

  const [generateWaiverOpen, setGenerateWaiverOpen] = useState(false);

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'error') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  const handleCloseCompose = () => {
    setOpenCompose(false);
    setComposeDraft(null);
  };

  const handleComposerSuccess = () => {
    showToast('Email sent successfully!', 'success');
  };

  const handleSendActivationLink = async () => {
    if (!account?.account_id) return;
    setActionLoading(true);
    try {
        await authService.sendResetPasswordLink(account.account_id);
        showToast("Activation link sent successfully!", "success");
    } catch (error: any) {
        console.error("Failed to send activation link", error);
        showToast(error.message || "Failed to send activation link", "error");
    } finally {
        setActionLoading(false);
    }
  };

  const handleAddSubscription = () => {
    const isMember = role === 'MEMBER' || role === 'USER';
    if (isMember) {
        navigate('/portal/marketplace');
    } else {
        navigate(`/admin/accounts/${accountId}/marketplace`);
    }
  };

  const handleSendPaymentLink = async () => {
    if (!account?.account_id) return;
    setActionLoading(true);
    try {
        await billingService.sendPaymentLink(account.account_id, currentLocationId || undefined);
        showToast("Payment link sent successfully!", "success");
    } catch (error: any) {
        console.error("Failed to send payment link", error);
        showToast(error.message || "Failed to send payment link", "error");
    } finally {
        setActionLoading(false);
    }
  };

  const handleDeleteClick = () => {
    setDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    setDeleteConfirmOpen(false);
    setPasscodeOpen(true);
  };

  const handlePasscodeSuccess = async () => {
    if (!accountId || !currentLocationId) return;
    setPasscodeOpen(false);
    setActionLoading(true);
    try {
        await crmService.deleteAccount(accountId, currentLocationId);
        showToast("Account and all related data deleted successfully", "success");
        setTimeout(() => {
            navigate('/admin/accounts');
        }, 1500);
    } catch (error: any) {
        console.error("Failed to delete account", error);
        showToast(error.message || "Failed to delete account", "error");
        setActionLoading(false);
    }
  };



  const handleGenerateWaiverEmailDraft = (draftInfo: { templateName: string; publicUrl: string; profile: any }) => {
    const subject = `Review & Sign Waiver - ${draftInfo.templateName}`;
    let body = `Please follow this unique, secure link to sign your waiver.\n\n${draftInfo.publicUrl}`;
    
    setComposeDraft({
        to: draftInfo.profile?.email || account.email || '',
        subject,
        body,
        attachments: [],
        accountId: account.account_id
    });
    setOpenCompose(true);
    showToast("Email draft prepared. Review details and send.", "info");
  };

  const fetchAccount = async () => {
    if (!accountId || !currentLocationId) return;
    setLoading(true);
    try {
      const response = await crmService.getAccountDetails(accountId, currentLocationId || undefined);
      const data = response.data || response;
      
      // Normalize data: ensure 'profiles' exists even if API returns 'profile'
      const normalizedData = {
          ...data,
          profiles: data.profiles || data.profile || []
      };
      
      setAccount(normalizedData);
      // Auto-select the primary member only if nothing is already selected (e.g. from URL param)
      const primaryProfile = normalizedData.profiles?.find((p: any) => p.is_primary);
      setSelectedProfileId(prev =>
        prev ? prev : (primaryProfile?.profile_id || normalizedData.profiles?.[0]?.profile_id || null)
      );



    } catch (err: any) {
      console.error("Failed to fetch account details", err);
      setError("Failed to load account details. " + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  const fetchCartCount = async () => {
    if (!accountId || !currentLocationId) return;
    try {
      const items = await cartService.getItems(currentLocationId);
      const count = items.filter(i => i.account_id === accountId).length;
      setCartCount(count);
    } catch (err) {
      console.error("Failed to fetch cart count", err);
    }
  };

  useEffect(() => {
    fetchAccount();
    fetchCartCount();
  }, [accountId, currentLocationId]);

  const handleClearCart = async () => {
    if (!accountId || !currentLocationId) return;
    setActionLoading(true);
    try {
      await cartService.clearCart(accountId, currentLocationId);
      setCartCount(0);
      showToast('Cart cleared successfully', 'success');
    } catch (err: any) {
      console.error("Failed to clear cart", err);
      showToast(err.message || 'Failed to clear cart', 'error');
    } finally {
      setActionLoading(false);
    }
  };

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
      fetchAccount();
      showToast("Profile updated successfully!", "success");
  };

  const handleToggleNotification = async (field: 'notify_primary_member' | 'notify_guardian', value: boolean) => {
    if (!account?.account_id || !currentLocationId) return;
    // Optimistically update local state
    setAccount((prev: any) => prev ? { ...prev, [field]: value } : prev);
    try {
      await crmService.upsertAccountProfiles(
        { account_id: account.account_id, [field]: value },
        currentLocationId
      );
      showToast(
        `${field === 'notify_primary_member' ? 'Primary member' : 'Guardian'} notifications ${value ? 'enabled' : 'disabled'}.`,
        'success'
      );
    } catch (err: any) {
      // Revert optimistic update on failure
      setAccount((prev: any) => prev ? { ...prev, [field]: !value } : prev);
      showToast(err.message || 'Failed to update notification setting.', 'error');
    }
  };

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
            <Button startIcon={<ArrowBackIcon />} onClick={() => navigate('/admin/accounts')} sx={{ mt: 2 }}>
                Back to Accounts
            </Button>
        </Box>
    );
  }

  const selectedProfile = account.profiles?.find((p: any) => p.profile_id === selectedProfileId);

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
            <Stack direction="row" spacing={1} alignItems="center">


                <Tooltip title="Send account activation link via email" arrow>
                    <span>
                        <Button
                            startIcon={<LinkIcon sx={{ fontSize: '0.95rem !important' }} />}
                            endIcon={<LaunchIcon sx={{ fontSize: '0.75rem !important', opacity: 0.6 }} />}
                            onClick={handleSendActivationLink}
                            disabled={actionLoading}
                            size="small"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                px: 1.75,
                                py: 0.75,
                                borderRadius: '6px',
                                border: '1.5px solid #6366f1',
                                color: '#4338ca',
                                bgcolor: '#eef2ff',
                                '&:hover': {
                                    bgcolor: '#e0e7ff',
                                    borderColor: '#4338ca',
                                    boxShadow: '0 2px 8px rgba(99,102,241,0.15)',
                                },
                                transition: 'all 0.2s ease',
                                '&.Mui-disabled': { opacity: 0.5 },
                            }}
                        >
                            Send Activation Link
                        </Button>
                    </span>
                </Tooltip>

                <Tooltip title="Send payment link via email" arrow>
                    <span>
                        <Button
                            startIcon={<PaymentsIcon sx={{ fontSize: '0.95rem !important' }} />}
                            endIcon={<LaunchIcon sx={{ fontSize: '0.75rem !important', opacity: 0.6 }} />}
                            onClick={handleSendPaymentLink}
                            disabled={true}
                            size="small"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                px: 1.75,
                                py: 0.75,
                                borderRadius: '6px',
                                border: '1.5px solid #10b981',
                                color: '#047857',
                                bgcolor: '#ecfdf5',
                                '&:hover': {
                                    bgcolor: '#d1fae5',
                                    borderColor: '#059669',
                                    boxShadow: '0 2px 8px rgba(16,185,129,0.15)',
                                },
                                transition: 'all 0.2s ease',
                                '&.Mui-disabled': { opacity: 0.5 },
                            }}
                        >
                            Send Payment Link
                        </Button>
                    </span>
                </Tooltip>

                <Tooltip title="Generate Waiver Request" arrow>
                    <span>
                        <Button
                            startIcon={<DrawIcon sx={{ fontSize: '0.95rem !important' }} />}
                            onClick={() => setGenerateWaiverOpen(true)}
                            size="small"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                px: 1.75,
                                py: 0.75,
                                borderRadius: '6px',
                                border: '1.5px solid #0ea5e9',
                                color: '#0284c7',
                                bgcolor: '#f0f9ff',
                                '&:hover': {
                                    bgcolor: '#e0f2fe',
                                    borderColor: '#0284c7',
                                    boxShadow: '0 2px 8px rgba(14,165,233,0.15)',
                                },
                                transition: 'all 0.2s ease',
                                '&.Mui-disabled': { opacity: 0.5 },
                            }}
                        >
                            Request Signature
                        </Button>
                    </span>
                </Tooltip>

                <Box sx={{ width: '1px', height: 24, bgcolor: '#e2e8f0', mx: 0.5 }} />

                <Button
                    startIcon={<ArrowBackIcon sx={{ fontSize: '0.95rem !important' }} />}
                    onClick={() => navigate('/admin/accounts')}
                    size="small"
                    sx={{
                        textTransform: 'none',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        px: 1.75,
                        py: 0.75,
                        borderRadius: '6px',
                        border: '1.5px solid #cbd5e1',
                        color: '#475569',
                        bgcolor: '#ffffff',
                        '&:hover': {
                            bgcolor: '#f1f5f9',
                            borderColor: '#94a3b8',
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                        },
                        transition: 'all 0.2s ease',
                    }}
                >
                    Back to Accounts
                </Button>
                {(() => {
                    console.log("Current user role:", role);
                    return null;
                })()}

                {(['SUPERADMIN','ADMIN', 'STAFF', 'admin', 'staff'].includes(role || '')) && (
                    <>
                        <Box sx={{ width: '1px', height: 24, bgcolor: '#e2e8f0', mx: 0.5 }} />
                        <Tooltip title="Permanently delete account and all data" arrow>
                            <span>
                                <Button
                                    startIcon={<DeleteIcon sx={{ fontSize: '0.95rem !important' }} />}
                                    onClick={handleDeleteClick}
                                    disabled={actionLoading}
                                    size="small"
                                    sx={{
                                        textTransform: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.8rem',
                                        px: 1.75,
                                        py: 0.75,
                                        borderRadius: '6px',
                                        border: '1.5px solid #ef4444',
                                        color: '#b91c1c',
                                        bgcolor: '#fef2f2',
                                        '&:hover': {
                                            bgcolor: '#fee2e2',
                                            borderColor: '#dc2626',
                                            boxShadow: '0 2px 8px rgba(239,68,68,0.15)',
                                        },
                                        transition: 'all 0.2s ease',
                                        '&.Mui-disabled': { opacity: 0.5 },
                                    }}
                                >
                                    Delete Account
                                </Button>
                            </span>
                        </Tooltip>
                    </>
                )}
            </Stack>
        }
      />

      <AccountSummary 
        account={account} 
        onStoreClick={handleAddSubscription} 
        selectedProfileId={selectedProfileId} 
        onToggleNotification={handleToggleNotification} 
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
        <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
            <Paper 
                elevation={0}
                sx={{ 
                    width: '100%', 
                    minHeight: 500, 
                    borderRadius: '16px', 
                    border: '1px solid #e2e8f0',
                    bgcolor: '#ffffff',
                    overflow: 'hidden'
                }}
            >
                <Box sx={{ borderBottom: 1, borderColor: '#f1f5f9', px: 1, bgcolor: '#f8fafc', width: '100%', overflow: 'hidden' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange} 
                        aria-label="account detail tabs"
                        variant="scrollable"
                        scrollButtons="auto"
                        allowScrollButtonsMobile
                        sx={{
                            width: '100%',
                            '& .MuiTab-root': {
                                textTransform: 'none',
                                fontWeight: 700,
                                fontSize: '0.85rem',
                                minWidth: 120,
                                py: 2,
                                color: '#64748b',
                                '&.Mui-selected': {
                                    color: '#3b82f6',
                                }
                            },
                            '& .MuiTabs-indicator': {
                                height: 3,
                                borderRadius: '3px 3px 0 0',
                                bgcolor: '#3b82f6'
                            }
                        }}
                    >
                        <Tab label="Profile Details" />
                        <Tab label="Purchases" />
                        <Tab label="Waivers" />
                        <Tab label="Invoices" />
                        <Tab label="Transactions" />
                        <Tab label="Saved Cards" />
                    </Tabs>
                </Box>
                <Box sx={{ p: 4 }}>
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
                          account={{
                            account_id: account.account_id,
                            email: account.email,
                            notify_primary_member: account.notify_primary_member,
                            notify_guardian: account.notify_guardian,
                            profiles: account.profiles || [],
                          }}
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
      
      <Snackbar 
            open={toast.open} 
            autoHideDuration={6000} 
            onClose={handleCloseToast}
            anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
            <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
                {toast.message}
            </Alert>
        </Snackbar>

        <Dialog open={openCompose} onClose={handleCloseCompose} maxWidth="md" fullWidth>
            <DialogContent>
                {composeDraft && (
                    <EmailComposer
                        onClose={handleCloseCompose}
                        onSuccess={handleComposerSuccess}
                        initialTo={composeDraft.to}
                        initialSubject={composeDraft.subject}
                        initialBody={composeDraft.body}
                        initialTemplateId={composeDraft.templateId}
                        initialAttachments={composeDraft.attachments}
                        initialAccountId={composeDraft.accountId}
                    />
                )}
            </DialogContent>
        </Dialog>

        <ProfileUpsertDialog
            open={openProfileUpsert}
            onClose={() => setOpenProfileUpsert(false)}
            onSuccess={handleUpsertSuccess}
            account_id={account.account_id}
            profile={profileToEdit}
            primaryProfile={account.profiles?.find((p: any) => p.is_primary) || account.profiles?.[0]}
        />

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onClose={() => setDeleteConfirmOpen(false)} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#b91c1c' }}>
                <WarningIcon color="error" />
                Caution: Delete Account
            </DialogTitle>
            <DialogContent>
                <Typography variant="body2" sx={{ mb: 2 }}>
                    Are you sure you want to delete this account?
                </Typography>
                <Alert severity="warning" sx={{ mb: 2 }}>
                    Deleting this account will permanently delete its related:
                    <ul style={{ paddingLeft: '20px', marginTop: '8px' }}>
                        <li>Profiles</li>
                        <li>Subscriptions</li>
                        <li>Transactions</li>
                        <li>Invoices</li>
                    </ul>
                    This action cannot be undone.
                </Alert>
            </DialogContent>
            <DialogActions sx={{ p: 2, pt: 0 }}>
                <Button onClick={() => setDeleteConfirmOpen(false)} sx={{ color: '#64748b' }}>
                    Cancel
                </Button>
                <Button 
                    onClick={handleConfirmDelete} 
                    variant="contained" 
                    color="error"
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                >
                    Delete Permanently
                </Button>
            </DialogActions>
        </Dialog>

        {/* Manager passcode gate */}
      <ManagerPasscodeDialog
        open={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onSuccess={handlePasscodeSuccess}
      />

      <GenerateWaiverDialog 
        open={generateWaiverOpen} 
        onClose={() => setGenerateWaiverOpen(false)} 
        accountId={accountId as string} 
        profiles={account.profiles || []} 
        onGenerateEmailDraft={handleGenerateWaiverEmailDraft} 
        showToast={showToast} 
      />
    </Box>
  );
};
