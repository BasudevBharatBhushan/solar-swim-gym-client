
import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Box, Grid, CircularProgress, Typography, Button, Paper, Tabs, Tab, Stack, Snackbar, Alert, Dialog, DialogContent } from '@mui/material';
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
  
  // Right Panel Tabs
  const [tabValue, setTabValue] = useState(0);

  // Waiver status tracking
  const [hasUnsignedWaivers, setHasUnsignedWaivers] = useState(false);

  // Actions State
  const [actionLoading, setActionLoading] = useState(false);
  const [openCompose, setOpenCompose] = useState(false);
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
          const recipientEmail = account.email || profiles.find((p: any) => p.is_primary)?.email || profiles[0]?.email;

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
              const templateName = 'Your Contract is Ready for Signing';
              let subject = templateName;
              let body = `Your contract is ready for signing. Please click the link below to sign your waiver.`;
              let templateId: string | undefined = undefined;

              try {
                  const templates = await emailService.getTemplates(currentLocationId);
                  const template = templates.find(t => t.subject === templateName || t.subject.includes('Contract'));
                  if (template) {
                      subject = template.subject;
                      body = template.body_content;
                      templateId = template.email_template_id;
                  }
              } catch (e) {
                  console.warn("Could not fetch templates, using default");
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

  useEffect(() => {
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
        // Default to 'All Members' (null)
        setSelectedProfileId(null);

        // Check waiver status for all profiles
        try {
          const profiles = normalizedData.profiles || [];
          if (profiles.length > 0) {
            const [waiverTemplatesRes, ageGroupsRes] = await Promise.all([
              waiverService.getWaiverTemplates(currentLocationId),
              configService.getAgeGroups(currentLocationId)
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
            <Stack direction="row" spacing={1}>
                 <Button 
                    startIcon={hasUnsignedWaivers ? <DrawIcon /> : <EmailIcon />} 
                    endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                    onClick={handleWaiverButtonClick}
                    disabled={actionLoading}
                    variant="outlined"
                    size="small"
                    color={hasUnsignedWaivers ? 'warning' : 'primary'}
                    sx={{ textTransform: 'none' }}
                >
                    {hasUnsignedWaivers ? 'Send Waiver for Signing' : 'Send Signed Waiver'}
                </Button>
                <Button 
                    startIcon={<LinkIcon />} 
                    endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                    onClick={handleSendActivationLink}
                    disabled={actionLoading}
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none' }}
                >
                    Send Activation
                </Button>
                <Button 
                    startIcon={<PaymentsIcon />} 
                    endIcon={<LaunchIcon sx={{ fontSize: 14 }} />}
                    onClick={handleSendPaymentLink}
                    disabled={actionLoading}
                    variant="outlined"
                    size="small"
                    sx={{ textTransform: 'none' }}
                >
                    Send Payment Link
                </Button>
                <Button 
                    startIcon={<ArrowBackIcon />} 
                    onClick={() => navigate('/admin/accounts')}
                    variant="contained"
                    size="small"
                    sx={{ textTransform: 'none', bgcolor: '#0f172a' }}
                >
                    Back
                </Button>
            </Stack>
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
                        <Tab label="Waivers" />
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
    </Box>
  );
};
