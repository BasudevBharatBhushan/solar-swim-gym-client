
import { useEffect, useState } from 'react';
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
  Alert
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../../../context/AuthContext';
import { waiverService, SignedWaiver } from '../../../services/waiverService';
import { emailService } from '../../../services/emailService';
import { Profile } from '../../../types';
import { createWaiverPdfAttachment } from '../../../utils/waiverPdf';
import { EmailComposer } from '../../../components/Email/EmailComposer';

interface WaiversTabProps {
  profiles: Profile[];
  selectedProfileId: string | null;
  accountId?: string;
}

interface WaiverEmailDraft {
  to: string;
  subject: string;
  body: string;
  templateId?: string;
  attachments: File[];
  accountId?: string;
}

export const WaiversTab = ({ profiles, selectedProfileId, accountId }: WaiversTabProps) => {
  const { currentLocationId } = useAuth();
  const [waivers, setWaivers] = useState<SignedWaiver[]>([]);
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
  
  // Dialog state
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedWaiver, setSelectedWaiver] = useState<SignedWaiver | null>(null);

  const showToast = (message: string, severity: 'error' | 'success' | 'warning' | 'info' = 'info') => {
    setToast({ open: true, message, severity });
  };

  const handleCloseToast = () => {
    setToast(prev => ({ ...prev, open: false }));
  };

  useEffect(() => {
    const fetchWaivers = async () => {
      if (!currentLocationId) return;
      
      setLoading(true);
      setError(null);
      setWaivers([]);

      try {
        let profilesToFetch = [];
        if (selectedProfileId) {
            profilesToFetch = profiles.filter(p => p.profile_id === selectedProfileId);
        } else {
            profilesToFetch = profiles;
        }

        if (profilesToFetch.length === 0) {
            setLoading(false);
            return;
        }

        // Fetch waivers for each relevant profile
        const promises = profilesToFetch.map(p => 
            waiverService.getSignedWaivers(p.profile_id, currentLocationId)
                .then(res => res.data || [])
                .catch(err => {
                    console.error(`Failed to fetch waivers for profile ${p.profile_id}`, err);
                    return [] as SignedWaiver[];
                })
        );

        const results = await Promise.all(promises);
        // Flatten and sort by signed_at descending
        const allWaivers = results.flat().sort((a, b) => 
            new Date(b.signed_at).getTime() - new Date(a.signed_at).getTime()
        );
        
        setWaivers(allWaivers);

      } catch (err: any) {
        console.error("Failed to fetch waivers", err);
        setError("Failed to load waivers.");
      } finally {
        setLoading(false);
      }
    };

    fetchWaivers();
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

      const templateName = 'Waiver to Join Solar Swim Gym Membership';
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

  if (waivers.length === 0) {
     return (
        <Box sx={{ py: 4, textAlign: 'center' }}>
            <Typography color="text.secondary">No signed waivers found.</Typography>
        </Box>
     );
  }

  return (
    <Box>
      <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">Signed Waivers</Typography>
      </Box>

      <TableContainer component={Paper} elevation={0} variant="outlined">
        <Table>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                    <TableCell>Waiver Type</TableCell>
                    <TableCell>Signed By</TableCell>
                    <TableCell>Signed Date</TableCell>
                    <TableCell>Signature</TableCell>
                    <TableCell align="right">Actions</TableCell>
                </TableRow>
            </TableHead>
            <TableBody>
                {waivers.map((waiver) => (
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

      {/* Waiver Content Dialog */}
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
                <Box dangerouslySetInnerHTML={{ __html: selectedWaiver.content }} />
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
