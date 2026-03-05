import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Box,
  CircularProgress,
  Typography,
  Stack
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import { waiverService, WaiverTemplate } from '../../../services/waiverService';
import { useAuth } from '../../../context/AuthContext';

interface GenerateWaiverDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  profiles: any[];
  onGenerateEmailDraft?: (draftInfo: { 
    templateName: string;
    publicUrl: string;
    profile: any;
  }) => void;
  showToast: (msg: string, severity: 'success' | 'error' | 'warning' | 'info') => void;
}

export const GenerateWaiverDialog = ({
  open,
  onClose,
  accountId,
  profiles,
  onGenerateEmailDraft,
  showToast
}: GenerateWaiverDialogProps) => {
  const { currentLocationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);

  // Form State
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [waiverType, setWaiverType] = useState<string>('REGISTRATION');
  const [expiresIn, setExpiresIn] = useState<number>(7);
  
  // Basic variable
  const [fullName, setFullName] = useState<string>('');

  useEffect(() => {
    if (open && currentLocationId) {
      fetchTemplates();
      if (profiles && profiles.length > 0 && !selectedProfileId) {
        setSelectedProfileId(profiles[0].profile_id);
        setFullName(`${profiles[0].first_name} ${profiles[0].last_name}`);
      }
    }
  }, [open, currentLocationId, profiles]);

  const fetchTemplates = async () => {
    try {
      const res = await waiverService.getWaiverTemplates(currentLocationId || undefined);
      setTemplates((res as any).data || []);
    } catch (err: any) {
      showToast('Failed to load templates.', 'error');
    }
  };

  const handleProfileChange = (e: any) => {
    const pId = e.target.value;
    setSelectedProfileId(pId);
    const profile = profiles.find(p => p.profile_id === pId);
    if (profile) {
      setFullName(`${profile.first_name} ${profile.last_name}`);
    }
  };

  const generateRequest = async () => {
    if (!selectedProfileId || !selectedTemplateId) {
      showToast('Please select a profile and a template.', 'warning');
      return null;
    }

    setLoading(true);
    try {
      const payload = {
        account_id: accountId,
        profile_id: selectedProfileId,
        waiver_template_id: selectedTemplateId,
        waiver_type: waiverType,
        expires_in_days: expiresIn,
        variables: {
          FullName: fullName,
          CurrentDate: new Date().toLocaleDateString()
        }
      };

      const res = await waiverService.createWaiverRequest(payload, currentLocationId || undefined);
      return res.data;
    } catch (err: any) {
      setLoading(false);
      showToast(err.message || 'Failed to generate sign link.', 'error');
      return null;
    }
  };

  const handleCopyLink = async () => {
    const data = await generateRequest();
    if (data && data.public_signing_url) {
      try {
        await navigator.clipboard.writeText(data.public_signing_url);
        showToast('Signing link copied to clipboard!', 'success');
        setLoading(false);
        onClose();
      } catch (err) {
        showToast('Failed to copy to clipboard', 'error');
        setLoading(false);
      }
    }
  };

  const handleEmailLink = async () => {
    const data = await generateRequest();
    if (data && data.public_signing_url && onGenerateEmailDraft) {
      const profile = profiles.find(p => p.profile_id === selectedProfileId);
      const template = templates.find(t => t.waiver_template_id === selectedTemplateId);
      onGenerateEmailDraft({
        templateName: template?.template_category || 'Document',
        publicUrl: data.public_signing_url,
        profile
      });
      setLoading(false);
      onClose();
    } else {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={loading ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        Generate Waiver Request
      </DialogTitle>
      <DialogContent dividers>
        <Stack spacing={3} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Signing Profile</InputLabel>
            <Select
              value={selectedProfileId}
              label="Signing Profile"
              onChange={handleProfileChange}
              disabled={loading}
            >
              {profiles.map(p => (
                <MenuItem key={p.profile_id} value={p.profile_id}>
                  {p.first_name} {p.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Waiver Type</InputLabel>
            <Select
              value={waiverType}
              label="Waiver Type"
              onChange={(e) => setWaiverType(e.target.value)}
              disabled={loading}
            >
              <MenuItem value="REGISTRATION">Registration</MenuItem>
              <MenuItem value="MEMBERSHIP">Membership</MenuItem>
              <MenuItem value="SERVICE">Service</MenuItem>
            </Select>
          </FormControl>

          <FormControl fullWidth size="small">
            <InputLabel>Waiver Template</InputLabel>
            <Select
              value={selectedTemplateId}
              label="Waiver Template"
              onChange={(e) => setSelectedTemplateId(e.target.value)}
              disabled={loading}
            >
              {templates.map(t => (
                <MenuItem key={t.waiver_template_id} value={t.waiver_template_id}>
                  {t.template_category || `Template ${t.waiver_template_id.substring(0,8)}`}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 700 }}>Template Variables</Typography>
            <TextField 
              fullWidth 
              size="small" 
              label="[FullName]" 
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={loading}
            />
          </Box>

          <TextField 
            fullWidth 
            size="small"
            type="number"
            label="Expires In (Days)" 
            value={expiresIn}
            onChange={(e) => setExpiresIn(parseInt(e.target.value) || 7)}
            disabled={loading}
          />
          
        </Stack>
      </DialogContent>
      <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button 
          variant="outlined" 
          startIcon={loading ? <CircularProgress size={16} /> : <ContentCopyIcon />}
          onClick={handleCopyLink}
          disabled={loading || !selectedProfileId || !selectedTemplateId}
        >
          Copy Link
        </Button>
        <Button 
          variant="contained" 
          startIcon={loading ? <CircularProgress size={16} /> : <EmailIcon />}
          onClick={handleEmailLink}
          disabled={loading || !selectedProfileId || !selectedTemplateId}
        >
          Generate & Email
        </Button>
      </DialogActions>
    </Dialog>
  );
};
