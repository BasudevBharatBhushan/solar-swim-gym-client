
import { useEffect, useState, useRef } from 'react';
import 'react-quill-new/dist/quill.snow.css';
import { 
  Box, 
  Typography, 
  CircularProgress, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper, 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Chip,
  Snackbar,
  Alert,
  Tabs,
  Tab,
  Checkbox,
  FormControlLabel,
  Divider
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import DrawIcon from '@mui/icons-material/Draw';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useAuth } from '../../../context/AuthContext';
import { waiverService, SignedWaiver, WaiverTemplate } from '../../../services/waiverService';
import { emailService } from '../../../services/emailService';
import { configService } from '../../../services/configService';
import { Profile } from '../../../types';
import { createWaiverPdfAttachment } from '../../../utils/waiverPdf';
import { EmailComposer } from '../../../components/Email/EmailComposer';
import { WaiverPreview } from '../../../components/Waiver/WaiverPreview';
import { SignaturePad, SignaturePadRef, getSignatureBlob } from '../../../components/Waiver/SignaturePad';
import { getAgeGroup, getAgeRangeLabel } from '../../../lib/ageUtils';

interface WaiversTabProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  accountId?: string;
  /** Full account object – used to read notification prefs after signing */
  account?: {
    account_id?: string;
    email?: string;
    notify_primary_member?: boolean;
    notify_guardian?: boolean;
    profiles?: any[];
  };
}

interface WaiverEmailDraft {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments: File[];
  accountId?: string;
}

interface PendingWaiver {
  profile: Profile;
  waiverTemplate: WaiverTemplate;
  ageGroupName: string;
}

export const WaiversTab = ({ profiles, selectedProfileId, accountId, account }: WaiversTabProps) => {
  const { currentLocationId } = useAuth();
  const [signedWaivers, setSignedWaivers] = useState<SignedWaiver[]>([]);
  const [pendingWaivers, setPendingWaivers] = useState<PendingWaiver[]>([]);
  const [loading, setLoading] = useState(false);
  const [sendingWaiverId, setSendingWaiverId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [openCompose, setOpenCompose] = useState(false);
  const [composeDraft, setComposeDraft] = useState<WaiverEmailDraft | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'error' | 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info'
  });
  
  // Sub-tab state: 0 = Pending, 1 = Signed
  const [subTab, setSubTab] = useState(0);
  
  // Dialog state for viewing signed waivers
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<SignedWaiver | null>(null);

  // Signing dialog state
  const [signingProfile, setSigningProfile] = useState<PendingWaiver | null>(null);
  const [openSignDialog, setOpenSignDialog] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [signing, setSigning] = useState(false);
  const signaturePadRef = useRef<SignaturePadRef>(null);

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  
  useEffect(() => {
    const fetchWaiverData = async () => {
      if (!currentLocationId) return;
      
      setLoading(true);
      setError(null);
      setSignedWaivers([]);
      setPendingWaivers([]);

      try {
        let profilesToFetch: Profile[] = [];
        if (selectedProfileId) {
          profilesToFetch = profiles.filter(p => p.profile_id === selectedProfileId);
        } else {
          profilesToFetch = profiles;
        }

        if (profilesToFetch.length === 0) {
          setLoading(false);
          return;
        }

        // Fetch waiver templates, age groups, and signed waivers in parallel
        const [waiverTemplatesRes, ageGroupsRes, ...signedResults] = await Promise.all([
          waiverService.getWaiverTemplates(currentLocationId || undefined),
          configService.getAgeGroups(currentLocationId),
          ...profilesToFetch.map(p => 
            waiverService.getSignedWaivers(p.profile_id, currentLocationId)
              .then(res => ({ profileId: p.profile_id, waivers: res.data || [] }))
              .catch(err => {
                console.error(`Failed to fetch waivers for profile ${p.profile_id}`, err);
                return { profileId: p.profile_id, waivers: [] as SignedWaiver[] };
              })
          )
        ]);

        const templates: WaiverTemplate[] = (waiverTemplatesRes as any).data || [];
        const ageGroups: any[] = (ageGroupsRes as any) || [];

        // Build map of signed waivers by profile
        const signedByProfile: Record<string, SignedWaiver[]> = {};
        const allSigned: SignedWaiver[] = [];

        for (const result of signedResults) {
          const r = result as { profileId: string; waivers: SignedWaiver[] };
          signedByProfile[r.profileId] = r.waivers;
          allSigned.push(...r.waivers);
        }

        // Sort signed waivers by signed_at descending
        allSigned.sort((a, b) => 
          new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
        );
        setSignedWaivers(allSigned);

        // Determine pending registration waivers
        const pending: PendingWaiver[] = [];

        for (const profile of profilesToFetch) {
          const group = profile.date_of_birth ? getAgeGroup(profile.date_of_birth, ageGroups, 'Membership') : null;

          // Find the template for this membership age profile
          let matchedTemplate = templates.find(t =>
            t.is_active && t.ageprofile_id === group?.age_group_id
          );
          if (!matchedTemplate) {
            matchedTemplate = templates.find(t => t.is_active && !t.ageprofile_id);
          }

          if (!matchedTemplate) continue;

          // Check if this profile already has a signed REGISTRATION waiver
          const profileSigned = signedByProfile[profile.profile_id] || [];
          const hasRegistrationWaiver = profileSigned.some(w => w.waiver_type === 'REGISTRATION');

          if (!hasRegistrationWaiver) {
            const ageGroupLabel = group ? `${group.name} ${getAgeRangeLabel(group)}` : 'Unknown';
            pending.push({
              profile,
              waiverTemplate: matchedTemplate,
              ageGroupName: ageGroupLabel
            });
          }
        }

        setPendingWaivers(pending);

        // Auto-switch to pending tab if there are pending waivers
        if (pending.length > 0) {
          setSubTab(0);
        } else if (allSigned.length > 0) {
          setSubTab(1);
        }

      } catch (err: any) {
        console.error("Failed to fetch waiver data", err);
        setError("Failed to load waivers.");
      } finally {
        setLoading(false);
      }
    };

    fetchWaiverData();
  }, [selectedProfileId, currentLocationId, profiles]);

  const handleViewWaiver = (waiver: SignedWaiver) => {
    setSelectedWaiver(waiver);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedWaiver(null);
  };

  const getProfileName = (profileId: string) => {
     const profile = profiles.find(p => p.profile_id === profileId);
     return profile ? `${profile.first_name} ${profile.last_name}` : 'Unknown Profile';
  };

  const getProfileById = (profileId: string) => {
    return profiles.find(p => p.profile_id === profileId);
  };

  const handleCloseCompose = () => {
    setOpenCompose(false);
    setComposeDraft(null);
  };

  const handleComposerSuccess = () => {
    showToast('Waiver email sent successfully.', 'success');
  };

  // --- Signing Dialog Logic ---
  const handleOpenSignDialog = (pendingWaiver: PendingWaiver) => {
    setSigningProfile(pendingWaiver);
    setAgreed(false);
    setSigning(false);
    setOpenSignDialog(true);
  };

  const handleCloseSignDialog = () => {
    setOpenSignDialog(false);
    setSigningProfile(null);
    setAgreed(false);
  };

  /**
   * Automatically sends the signed waiver PDF to the correct recipients
   * based on account-level notification preferences.
   */
  const sendSignedWaiverAutomatically = async (
    profile: Profile,
    signedWaiver: any
  ) => {
    if (!currentLocationId) return;

    try {
      // Resolve recipient emails based on notification preferences
      const recipients: string[] = [];

      const notifyPrimary = account?.notify_primary_member !== false; // default true if unset
      const notifyGuardian = account?.notify_guardian === true;

      if (notifyPrimary) {
        // Primary member email: the profile itself, or the primary profile of the account
        const primaryEmail =
          profile.email ||
          account?.profiles?.find((p: any) => p.is_primary)?.email ||
          account?.email ||
          null;
        if (primaryEmail) recipients.push(primaryEmail);
      }

      if (notifyGuardian) {
        // Guardian email: look for guardian_email on the profile or account email as fallback
        const guardianEmail =
          profile.guardian_email ||
          account?.profiles?.find((p: Profile) => p.is_primary)?.guardian_email ||
          null;
        if (guardianEmail && !recipients.includes(guardianEmail)) {
          recipients.push(guardianEmail);
        }
      }

      if (recipients.length === 0) {
        console.warn('No notification recipients resolved; skipping auto-email after signing.');
        return;
      }

      // Generate PDF attachment
      const pdfFile = await createWaiverPdfAttachment(
        { first_name: profile.first_name, last_name: profile.last_name },
        signedWaiver
      );

      // Fetch waiver email template
      const templateName = 'Waiver to Join Glass Court Swim and Fitness Membership';
      let subject = `Signed Waiver – ${profile.first_name} ${profile.last_name}`;
      let body = `Please find attached the signed registration waiver for ${profile.first_name} ${profile.last_name}.`;
      let templateId: string | undefined;

      try {
        const templates = await emailService.getTemplates(currentLocationId);
        const template = templates.find(
          (t) => t.subject === templateName || t.subject.includes('Waiver')
        );
        if (template) {
          subject = template.subject;
          body = template.body_content;
          templateId = template.email_template_id;
        }
      } catch {
        console.warn('Could not fetch waiver email template; using defaults.');
      }

      // Send to all resolved recipients
      await emailService.sendEmail({
        to: recipients.join(', '),
        subject,
        body,
        isHtml: true,
        location_id: currentLocationId,
        account_id: accountId,
        email_template_id: templateId,
        attachments: [pdfFile],
      });

      showToast(
        `Signed waiver copy sent to ${recipients.join(', ')}.`,
        'success'
      );
    } catch (err: any) {
      console.error('Failed to auto-send signed waiver email', err);
      // Non-fatal: show a warning but don't block the UI
      showToast(
        `Waiver signed, but failed to send email copy: ${err.message || 'unknown error'}`,
        'warning'
      );
    }
  };

  const handleSignWaiver = async () => {
    if (!signingProfile || !signaturePadRef.current || !currentLocationId) return;

    if (signaturePadRef.current.isEmpty()) {
      showToast('Please sign to continue.', 'warning');
      return;
    }

    const canvas = signaturePadRef.current.getCanvas();
    if (!canvas) return;

    setSigning(true);
    try {
      const blob = await getSignatureBlob(canvas);
      if (!blob) throw new Error('Failed to capture signature');

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;
          const sigResponse = await waiverService.uploadSignature(base64);
          
          let content = signingProfile.waiverTemplate.content;
          const fullName = `${signingProfile.profile.first_name} ${signingProfile.profile.last_name}`;
          content = content.replace(/\[FullName\]/g, fullName);
          content = content.replace(/\[CurrentDate\]/g, new Date().toLocaleDateString());
          
          await waiverService.upsertSignedWaiver({
            profile_id: signingProfile.profile.profile_id,
            waiver_template_id: signingProfile.waiverTemplate.waiver_template_id,
            waiver_type: 'REGISTRATION',
            content,
            signature_url: sigResponse.signature_url
          }, currentLocationId);

          showToast(`Waiver signed successfully for ${fullName}!`, 'success');
          handleCloseSignDialog();

          // Remove from pending list
          setPendingWaivers(prev => prev.filter(pw => pw.profile.profile_id !== signingProfile.profile.profile_id));
          
          // Fetch the newly signed waiver record and update state
          const newSigned = await waiverService.getSignedWaivers(signingProfile.profile.profile_id, currentLocationId);
          const latestWaiver = newSigned.data?.[0] ?? null;
          if (newSigned.data) {
            setSignedWaivers(prev => [...newSigned.data, ...prev]);
          }

          // === AUTO-SEND SIGNED WAIVER COPY BASED ON NOTIFICATION PREFS ===
          if (latestWaiver) {
            await sendSignedWaiverAutomatically(signingProfile.profile, latestWaiver);
          }
        } catch (err: any) {
          console.error('Signing failed', err);
          showToast(err.message || 'Signing failed', 'error');
          setSigning(false);
        }
      };
    } catch (err: any) {
      console.error('Signing failed', err);
      showToast(err.message || 'Signing failed', 'error');
      setSigning(false);
    }
  };

  // --- Email Draft Logic ---
  const preparePublicWaiverEmailDraft = async (pw: PendingWaiver) => {
    if (!currentLocationId) return;

    if (!pw.profile.email && !accountId) {
      showToast(`No email found for ${pw.profile.first_name} ${pw.profile.last_name}.`, 'warning');
      return;
    }

    setSendingWaiverId(pw.profile.profile_id); // using this just for loading state identifier
    try {
      const payload = {
         account_id: accountId || (pw.profile as any).account_id || '', // Note: pw.profile might not have account_id typed or present directly
         profile_id: pw.profile.profile_id,
         waiver_template_id: pw.waiverTemplate.waiver_template_id,
         waiver_type: 'REGISTRATION',
         variables: {
            FullName: `${pw.profile.first_name} ${pw.profile.last_name}`,
            GuardianName: (pw.profile as any).guardian_name || 'N/A',
            CurrentDate: new Date().toLocaleDateString(),
         }
      };
      
      const res = await waiverService.createWaiverRequest(payload, currentLocationId);
      const publicUrl = res.data.public_signing_url;

      const templateName = 'Complete Your Registration – Waiver Signing';
      let subject = templateName;
      let body = `Your contract is ready for signing. Please click the link below to sign your waiver for ${pw.profile.first_name}.`;
      let templateId: string | undefined;

      try {
        const templates = await emailService.getTemplates(currentLocationId);
        const template = templates.find(t => 
           t.subject?.includes('Complete Your Registration') || 
           t.subject?.includes('Waiver Signing')
        );
        if (template) {
          subject = template.subject.replace(/\{\{company\}?\}?/g, 'Glass Court Swim and Fitness');
          body = template.body_content;
          templateId = template.email_template_id;
        }
      } catch (templateError) {
        console.warn('Could not fetch templates', templateError);
      }

      body = body
        .replace(/\{\{contract_link\}\}/g, publicUrl)
        .replace(/\{\{company\}\}/g, 'Glass Court Swim and Fitness')
        .replace(/\{\{year\}\}/g, new Date().getFullYear().toString());

      if (!body.includes(publicUrl)) {
        body = `${body}\n\nSign your waiver here: ${publicUrl}`;
      }

      setComposeDraft({
        to: pw.profile.email || '', // fallback to maybe account email inside composer if blank
        subject,
        body,
        templateId,
        attachments: [],
        accountId: accountId
      });
      setOpenCompose(true);
    } catch (err: any) {
      console.error('Failed to prepare public waiver link email', err);
      showToast(err.message || 'Failed to generate sign link.', 'error');
    } finally {
      setSendingWaiverId(null);
    }
  };

  const prepareWaiverEmailDraft = async (waiver: SignedWaiver) => {
    if (!currentLocationId) return;

    const profile = getProfileById(waiver.profile_id);
    if (!profile) {
      showToast('Profile not found for this waiver.', 'warning');
      return;
    }
    if (!profile.email) {
      showToast(`No email found for ${profile.first_name} ${profile.last_name}.`, 'warning');
      return;
    }

    setSendingWaiverId(waiver.signed_waiver_id);
    try {
      const pdfFile = await createWaiverPdfAttachment(profile, waiver);

      const templateName = 'Waiver to Join Glass Court Swim and Fitness Membership';
      let subject = templateName;
      let body = `Please find attached the signed waiver for ${profile.first_name} ${profile.last_name}.`;
      let templateId: string | undefined;

      try {
        const templates = await emailService.getTemplates(currentLocationId);
        const template = templates.find(t => t.subject === templateName || t.subject.includes('Waiver'));
        if (template) {
          subject = template.subject;
          body = template.body_content;
          templateId = template.email_template_id;
        }
      } catch (templateError) {
        console.warn('Could not fetch waiver email template, using default subject.', templateError);
      }

      setComposeDraft({
        to: profile.email,
        subject,
        body,
        templateId,
        attachments: [pdfFile]
      });
      setOpenCompose(true);
    } catch (sendError: any) {
      console.error('Failed to send waiver email', sendError);
      showToast(`Failed to prepare waiver email. ${sendError?.message || ''}`.trim(), 'error');
    } finally {
      setSendingWaiverId(null);
    }
  };

  if (loading) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}><CircularProgress /></Box>;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  const hasPending = pendingWaivers.length > 0;
  const hasSigned = signedWaivers.length > 0;

  if (!hasPending && !hasSigned) {
     return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No waivers found.</Typography>
        </Box>
     );
  }

  return (
    <Box>
      {/* Sub-tabs: Pending / Signed */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
        <Tabs 
          value={subTab} 
          onChange={(_, v) => setSubTab(v)} 
          aria-label="waiver status tabs"
          sx={{
            '& .MuiTab-root': { textTransform: 'none', fontWeight: 600 }
          }}
        >
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PendingActionsIcon sx={{ fontSize: 18 }} />
                Pending
                {hasPending && (
                  <Chip label={pendingWaivers.length} size="small" color="warning" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                )}
              </Box>
            } 
          />
          <Tab 
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CheckCircleIcon sx={{ fontSize: 18 }} />
                Signed
                {hasSigned && (
                  <Chip label={signedWaivers.length} size="small" color="success" sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }} />
                )}
              </Box>
            } 
          />
        </Tabs>
      </Box>

      {/* Pending Waivers Tab */}
      {subTab === 0 && (
        <Box>
          {pendingWaivers.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={600}>All registration waivers are signed!</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#fffbeb', borderBottom: '1px solid #fef3c7' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Profile</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Age Group</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Waiver Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Status</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#92400e', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {pendingWaivers.map((pw) => (
                    <TableRow key={pw.profile.profile_id} hover>
                      <TableCell>
                        <Typography variant="body2" fontWeight={600}>
                          {pw.profile.first_name} {pw.profile.last_name}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={pw.ageGroupName} 
                          size="small" 
                          variant="outlined" 
                          sx={{ fontWeight: 600, fontSize: '0.75rem' }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label="REGISTRATION" 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                          sx={{ fontWeight: 600 }} 
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label="Pending" 
                          size="small" 
                          color="warning" 
                          sx={{ fontWeight: 700 }} 
                        />
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          startIcon={<EmailIcon />}
                          size="small"
                          variant="outlined"
                          onClick={() => preparePublicWaiverEmailDraft(pw)}
                          disabled={sendingWaiverId === pw.profile.profile_id}
                          sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600,
                            mr: 1
                          }}
                        >
                          {sendingWaiverId === pw.profile.profile_id ? 'Wait...' : 'Email Link'}
                        </Button>
                        <Button
                          startIcon={<DrawIcon />}
                          size="small"
                          variant="contained"
                          onClick={() => handleOpenSignDialog(pw)}
                          sx={{ 
                            textTransform: 'none', 
                            fontWeight: 600,
                            bgcolor: '#2563eb',
                            '&:hover': { bgcolor: '#1d4ed8' }
                          }}
                        >
                          Sign Waiver
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* Signed Waivers Tab */}
      {subTab === 1 && (
        <Box>
          {signedWaivers.length === 0 ? (
            <Box sx={{ py: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No signed waivers found.</Typography>
            </Box>
          ) : (
            <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden' }}>
              <Table>
                <TableHead sx={{ bgcolor: '#f1f5f9', borderBottom: '1px solid #e2e8f0' }}>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Waiver Type</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Signed By</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Signed Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Signature</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 700, color: '#475569', fontSize: '0.75rem', textTransform: 'uppercase' }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {signedWaivers.map((waiver) => (
                    <TableRow key={waiver.signed_waiver_id} hover>
                      <TableCell>
                        <Chip 
                          label={waiver.waiver_type || 'General'} 
                          size="small" 
                          color="primary" 
                          variant="outlined" 
                          sx={{ fontWeight: 600 }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">{getProfileName(waiver.profile_id)}</Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2">
                          {new Date(waiver.signed_at).toLocaleDateString()} {new Date(waiver.signed_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        {waiver.signature_url ? (
                          <img src={waiver.signature_url} alt="Signature" style={{ height: 40, border: '1px solid #ddd', borderRadius: 4, backgroundColor: '#fff' }} />
                        ) : (
                          <Typography variant="caption" color="text.secondary">No Image</Typography>
                        )}
                      </TableCell>
                      <TableCell align="right">
                        <Button
                          startIcon={<EmailIcon />}
                          size="small"
                          onClick={() => prepareWaiverEmailDraft(waiver)}
                          disabled={sendingWaiverId === waiver.signed_waiver_id}
                          sx={{ mr: 1 }}
                        >
                          {sendingWaiverId === waiver.signed_waiver_id ? 'Sending...' : 'Email'}
                        </Button>
                        <Button 
                          startIcon={<VisibilityIcon />} 
                          size="small" 
                          onClick={() => handleViewWaiver(waiver)}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Box>
      )}

      {/* View Waiver Content Dialog */}
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
            Signed Waiver Content
            <Typography variant="subtitle2" color="text.secondary">
                Signed by {selectedWaiver ? getProfileName(selectedWaiver.profile_id) : ''} on {selectedWaiver ? new Date(selectedWaiver.signed_at).toLocaleString() : ''}
            </Typography>
        </DialogTitle>
        <DialogContent dividers>
            {selectedWaiver && (
                <>
                  {/* Use ql-editor so Quill's full snow.css styles apply (lists, indent, size, etc.) */}
                  <style>{`
                    .ql-waiver-view.ql-editor {
                      font-family: inherit;
                      font-size: 14px;
                      line-height: 1.6;
                      padding: 0;
                      border: none;
                      box-sizing: border-box;
                    }
                    .ql-waiver-view.ql-editor p { margin-bottom: 0.75em; }
                    .ql-waiver-view.ql-editor h1 { font-size: 2em; font-weight: bold; margin: 0.75em 0 0.5em; }
                    .ql-waiver-view.ql-editor h2 { font-size: 1.5em; font-weight: bold; margin: 0.75em 0 0.5em; }
                    .ql-waiver-view.ql-editor h3 { font-size: 1.17em; font-weight: bold; margin: 0.75em 0 0.5em; }
                    .ql-waiver-view.ql-editor .ql-align-center { text-align: center !important; }
                    .ql-waiver-view.ql-editor .ql-align-right  { text-align: right  !important; }
                    .ql-waiver-view.ql-editor .ql-align-justify { text-align: justify !important; }
                    .ql-waiver-view.ql-editor blockquote { border-left: 4px solid #ccc; padding-left: 1em; margin-left: 0; }
                    .ql-waiver-view.ql-editor img { max-width: 100%; height: auto; }
                  `}</style>
                  <div
                    className="ql-editor ql-waiver-view"
                    dangerouslySetInnerHTML={{ __html: selectedWaiver.content }}
                  />
                </>
            )}
             {selectedWaiver?.signature_url && (
                <Box sx={{ mt: 4, borderTop: '1px solid #eee', pt: 2 }}>
                    <Typography variant="caption" display="block" color="text.secondary" gutterBottom>Signature</Typography>
                    <img src={selectedWaiver.signature_url} alt="Signature" style={{ maxHeight: 80 }} />
                </Box>
            )}
        </DialogContent>
        <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
            <Button
                onClick={() => selectedWaiver && prepareWaiverEmailDraft(selectedWaiver)}
                color="primary"
                startIcon={<EmailIcon />}
                disabled={!selectedWaiver || sendingWaiverId === selectedWaiver.signed_waiver_id}
            >
                {selectedWaiver && sendingWaiverId === selectedWaiver.signed_waiver_id ? 'Preparing...' : 'Compose Email'}
            </Button>
            <Button onClick={() => window.print()} color="primary">Print</Button>
        </DialogActions>
      </Dialog>

      {/* Sign Waiver Dialog */}
      <Dialog
        open={openSignDialog}
        onClose={handleCloseSignDialog}
        maxWidth="md"
        fullWidth
        scroll="paper"
      >
        <DialogTitle>
          <Box>
            <Typography variant="h6" fontWeight={700}>Sign Registration Waiver</Typography>
            {signingProfile && (
              <Typography variant="subtitle2" color="text.secondary">
                For {signingProfile.profile.first_name} {signingProfile.profile.last_name} ({signingProfile.ageGroupName})
              </Typography>
            )}
          </Box>
        </DialogTitle>
        <DialogContent dividers>
          {signingProfile && (
            <Box>
              <WaiverPreview
                content={signingProfile.waiverTemplate.content}
                data={{
                  first_name: signingProfile.profile.first_name,
                  last_name: signingProfile.profile.last_name,
                }}
                agreed={agreed}
                onAgreeChange={setAgreed}
                hideCheckbox={true}
                fullHeight={false}
                signatureComponent={
                  <SignaturePad
                    ref={signaturePadRef}
                    width={500}
                    height={150}
                  />
                }
              />
              <Divider sx={{ my: 2 }} />
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)} 
                    color="primary"
                  />
                }
                label={
                  <Typography variant="body2" fontWeight={600}>
                    I have read and agree to all terms above
                  </Typography>
                }
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseSignDialog} sx={{ textTransform: 'none' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSignWaiver}
            disabled={!agreed || signing}
            sx={{ 
              textTransform: 'none', 
              fontWeight: 700,
              bgcolor: '#2563eb',
              '&:hover': { bgcolor: '#1d4ed8' },
              px: 4
            }}
          >
            {signing ? 'Signing...' : 'Complete & Sign Waiver'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Email Compose Dialog */}
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
              initialAccountId={accountId}
            />
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={toast.open}
        autoHideDuration={5000}
        onClose={handleCloseToast}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseToast} severity={toast.severity} variant="filled" sx={{ width: '100%' }}>
          {toast.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};
