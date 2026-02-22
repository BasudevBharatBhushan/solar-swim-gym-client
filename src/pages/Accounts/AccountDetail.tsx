
import { useEffect, useState } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { Box, Grid, CircularProgress, Typography, Button, Paper, Tabs, Tab, Stack, Snackbar, Alert, Dialog, DialogContent, Tooltip } from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EmailIcon from '@mui/icons-material/Email';
import LinkIcon from '@mui/icons-material/Link';
import PaymentsIcon from '@mui/icons-material/Payments';
import LaunchIcon from '@mui/icons-material/Launch';
import DrawIcon from '@mui/icons-material/Draw';
import { authService } from '../../services/authService';
import { billingService } from '../../services/billingService';
import { waiverService } from '../../services/waiverService';
import { emailService } from '../../services/emailService';
import { configService } from '../../services/configService';
import { createWaiverPdfAttachment } from '../../utils/waiverPdf';
import { EmailComposer } from '../../components/Email/EmailComposer';
import { crmService } from '../../services/crmService';
import { PageHeader } from '../../components/Common/PageHeader';
import { AccountSummary } from './components/AccountSummary';
import { ProfileList } from './components/ProfileList';
import { ProfileDetail } from './components/ProfileDetail';
import { SubscriptionsTab } from './components/SubscriptionsTab';
import { WaiversTab } from './components/WaiversTab';
import { ProfileUpsertDialog } from './components/ProfileUpsertDialog';
import { useAuth } from '../../context/AuthContext';

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
  const { currentLocationId } = useAuth();
  const [account, setAccount] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  
  // Right Panel Tabs: 0=Profile Details, 1=Subscriptions, 2=Waivers
  const [tabValue, setTabValue] = useState(0);
  const [searchParams] = useSearchParams();

  // Auto-switch to Waivers tab if ?tab=waivers is in the URL
  useEffect(() => {
    if (searchParams.get('tab') === 'waivers') {
      setTabValue(2);
    }
  }, [searchParams]);

  // Waiver status tracking
  const [hasUnsignedWaivers, setHasUnsignedWaivers] = useState(false);

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

  // Send signed waiver PDFs via email (existing behavior)
  const handleSendSignedWaiverEmail = async () => {
      if (!account || !currentLocationId) return;
      setActionLoading(true);

      try {
          const profiles = account.profiles || [];
          if (profiles.length === 0) {
              showToast("No profiles found for this account.", "warning");
              setActionLoading(false);
              return;
          }
           const recipientEmail = account.email || profiles.find((p: any) => p.is_primary)?.email || profiles[0]?.email;

           if (!recipientEmail) {
              showToast("No recipient email found for this account.", "warning");
              setActionLoading(false);
              return;
           }

          // Fetch signed waivers
          const attachments: File[] = [];
          const missingWaiverProfiles: string[] = [];
          const failedPdfProfiles: string[] = [];
          
          for (const profile of profiles) {
              const waivers = await waiverService.getSignedWaivers(profile.profile_id, currentLocationId);
              if (waivers.data && waivers.data.length > 0) {
                  const latestWaiver = waivers.data[0];
                  try {
                    const pdfFile = await createWaiverPdfAttachment(
                      { first_name: profile.first_name, last_name: profile.last_name },
                      latestWaiver
                    );
                    attachments.push(pdfFile);
                  } catch (pdfError) {
                    console.error(`Failed to create waiver PDF for ${profile.first_name} ${profile.last_name}`, pdfError);
                    failedPdfProfiles.push(`${profile.first_name} ${profile.last_name}`);
                  }
              } else {
                  missingWaiverProfiles.push(`${profile.first_name} ${profile.last_name}`);
              }
          }

          if (attachments.length === 0) {
              showToast("No signed waivers found to send.", "warning");
              setActionLoading(false);
              return;
          }

          const profileNames = profiles.map((p: any) => `${p.first_name} ${p.last_name}`).join(', ');
          const templateName = 'Waiver to Join Solar Swim Gym Membership';
          
          let subject = templateName;
          let body = `Please find attached the signed waivers for: ${profileNames}.`;
          let templateId: string | undefined = undefined;

          try {
              const templates = await emailService.getTemplates(currentLocationId);
              const template = templates.find(t => t.subject === templateName || t.subject.includes('Waiver'));
              if (template) {
                  subject = template.subject;
                  body = template.body_content;
                  templateId = template.email_template_id;
              }
          } catch (e) {
              console.warn("Could not fetch templates, using default subject");
          }

          setComposeDraft({
             to: recipientEmail,
             subject,
             body,
             templateId,
             attachments,
             accountId: account.account_id
          });
          setOpenCompose(true);
          showToast("Email draft prepared. Review details and send.", "info");

      } catch (error: any) {
          console.error("Failed to prepare waiver email", error);
          showToast("Failed to prepare waiver email. " + error.message, "error");
      } finally {
          setActionLoading(false);
      }
  };

  // Send waiver for signing - based on account status
  const handleSendWaiverForSigning = async () => {
      if (!account || !currentLocationId) return;
      setActionLoading(true);

      try {
          const profiles = account.profiles || [];
          // Collect all profile emails as comma-separated
          const allEmails = profiles
              .map((p: any) => p.email)
              .filter(Boolean)
              .join(', ');
          const recipientEmail = allEmails || account.email;

          if (!recipientEmail) {
              showToast("No recipient email found for this account.", "warning");
              setActionLoading(false);
              return;
          }

          if (account.status === 'PENDING') {
              // Account is pending - send activation link with waiver_sign=true
              await authService.sendResetPasswordLink(account.account_id, { waiver_sign: true });
              showToast("Activation link with waiver signing sent successfully!", "success");
          } else {
              // Account is active - send contract signing email using template
              const companyName = (account.location?.name || account.location_name || 'Solar Swim Gym');
              // Default subject with company name already resolved
              let subject = `Complete Your Registration – Waiver Signing for ${companyName}`;
              let body = `Your contract is ready for signing. Please click the link below to sign your waiver.`;
              let templateId: string | undefined = undefined;

              try {
                  const templates = await emailService.getTemplates(currentLocationId);
                  const template = templates.find((t: any) =>
                      t.subject?.includes('Complete Your Registration') ||
                      t.subject?.includes('Waiver Signing') ||
                      t.subject?.includes('Contract')
                  );
                  if (template) {
                      // Replace {{company}} or {{company} (handles missing closing brace in DB)
                      subject = template.subject.replace(/\{\{company\}?\}?/g, companyName);
                      body = template.body_content;
                      templateId = template.email_template_id;
                  }
              } catch (e) {
                  console.warn("Could not fetch templates, using default");
              }

              // Build the contract signing link — points to the member portal waiver tab
              const contractLink = `${window.location.origin}/portal?tab=waivers`;
              const currentYear = new Date().getFullYear().toString();

              // Replace all template variables
              body = body
                .replace(/\{\{contract_link\}\}/g, contractLink)
                .replace(/\{\{company\}\}/g, companyName)
                .replace(/\{\{year\}\}/g, currentYear);

              // Fallback: if no {{contract_link}} placeholder was found, append the link
              if (!body.includes(contractLink)) {
                  body = `${body}\n\nSign your waiver here: ${contractLink}`;
              }

              setComposeDraft({
                  to: recipientEmail,
                  subject,
                  body,
                  templateId,
                  attachments: [],
                  accountId: account.account_id
              });
              setOpenCompose(true);
              showToast("Email draft prepared. Review details and send.", "info");
          }
      } catch (error: any) {
          console.error("Failed to send waiver for signing", error);
          showToast(error.message || "Failed to send waiver for signing.", "error");
      } finally {
          setActionLoading(false);
      }
  };

  // Unified handler - decides between sending signed waiver or sending for signing
  const handleWaiverButtonClick = () => {
      if (hasUnsignedWaivers) {
          handleSendWaiverForSigning();
      } else {
          handleSendSignedWaiverEmail();
      }
  };

  // Helper to calculate age
  const calculateAge = (dob: string | null | undefined) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
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
      // Auto-select the primary member only if nothing is selected or if previous selection is gone
      const primaryProfile = normalizedData.profiles?.find((p: any) => p.is_primary);
      if (!selectedProfileId) {
          setSelectedProfileId(primaryProfile?.profile_id || normalizedData.profiles?.[0]?.profile_id || null);
      }

      // Check waiver status for all profiles
      try {
        const profiles = normalizedData.profiles || [];
        if (profiles.length > 0) {
          const [waiverTemplatesRes, ageGroupsRes] = await Promise.all([
            waiverService.getWaiverTemplates(),
            configService.getAgeGroups()
          ]);
          const templates = (waiverTemplatesRes as any).data || [];
          const ageGroups = (ageGroupsRes as any) || [];

          let foundUnsigned = false;
          for (const profile of profiles) {
            const age = calculateAge(profile.date_of_birth);
            const group = ageGroups.find((g: any) => age >= g.min_age && age <= g.max_age);
            const matchedTemplate = templates.find((t: any) => 
              t.is_active && (t.ageprofile_id === group?.age_group_id || !t.ageprofile_id)
            );

            if (matchedTemplate) {
              const signedRes = await waiverService.getSignedWaivers(profile.profile_id, currentLocationId);
              const signed = signedRes.data || [];
              const hasRegistration = signed.some((w: any) => w.waiver_type === 'REGISTRATION');
              if (!hasRegistration) {
                foundUnsigned = true;
                break;
              }
            }
          }
          setHasUnsignedWaivers(foundUnsigned);
        }
      } catch (waiverErr) {
        console.warn('Could not determine waiver status', waiverErr);
      }

    } catch (err: any) {
      console.error("Failed to fetch account details", err);
      setError("Failed to load account details. " + (err.message || ''));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccount();
  }, [accountId, currentLocationId]);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleProfileSelect = (profileId: string) => {
    setSelectedProfileId(profileId);
    // Optionally switch to details tab when clicking a profile, 
    // or stay on subscriptions tab to see that profile's subscriptions
    // For now, let's keep the user on the current tab to allow rapid filtering of subscriptions
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
                <Tooltip title={hasUnsignedWaivers ? 'Send waiver link for signing to member email' : 'Email signed waiver PDF to member'} arrow>
                    <span>
                        <Button
                            startIcon={hasUnsignedWaivers ? <DrawIcon sx={{ fontSize: '0.95rem !important' }} /> : <EmailIcon sx={{ fontSize: '0.95rem !important' }} />}
                            endIcon={<LaunchIcon sx={{ fontSize: '0.75rem !important', opacity: 0.6 }} />}
                            onClick={handleWaiverButtonClick}
                            disabled={actionLoading}
                            size="small"
                            sx={{
                                textTransform: 'none',
                                fontWeight: 600,
                                fontSize: '0.8rem',
                                px: 1.75,
                                py: 0.75,
                                borderRadius: '6px',
                                border: '1.5px solid',
                                borderColor: hasUnsignedWaivers ? '#f59e0b' : '#334155',
                                color: hasUnsignedWaivers ? '#b45309' : '#334155',
                                bgcolor: hasUnsignedWaivers ? '#fffbeb' : '#f8fafc',
                                '&:hover': {
                                    bgcolor: hasUnsignedWaivers ? '#fef3c7' : '#f1f5f9',
                                    borderColor: hasUnsignedWaivers ? '#d97706' : '#1e293b',
                                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                                },
                                transition: 'all 0.2s ease',
                                '&.Mui-disabled': { opacity: 0.5 },
                            }}
                        >
                            {hasUnsignedWaivers ? 'Send Waiver for Signing' : 'Email Signed Waiver'}
                        </Button>
                    </span>
                </Tooltip>

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
                            disabled={actionLoading}
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
            </Stack>
        }
      />

      <AccountSummary account={account} />

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
                <Box sx={{ borderBottom: 1, borderColor: '#f1f5f9', px: 1, bgcolor: '#f8fafc' }}>
                    <Tabs 
                        value={tabValue} 
                        onChange={handleTabChange} 
                        aria-label="account detail tabs"
                        sx={{
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
                        />
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
        />
    </Box>
  );
};
