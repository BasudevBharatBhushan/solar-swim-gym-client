import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  TextField,
  Box,
  CircularProgress,
  Alert,
  MenuItem,
  Stack,
} from '@mui/material';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import { useAuth } from '../../../context/AuthContext';
import { waiverService, WaiverTemplate } from '../../../services/waiverService';
import { resolveWaiverTemplates, getSubscriptionWaiverContext, WaiverResolutionContext } from '../../../utils/waiverUtils';

interface GenerateWaiverDialogProps {
  open: boolean;
  onClose: () => void;
  accountId: string;
  profileId: string;
  profileName: string;
  subscription?: any; // If provided, context is derived from here
  onLinkGenerated?: (url: string) => void;
  onEmailDraftReady?: (draft: { subject: string; body: string; to?: string; templateId?: string; publicUrl: string }) => void;
}

export const GenerateWaiverDialog: React.FC<GenerateWaiverDialogProps> = ({
  open,
  onClose,
  accountId,
  profileId,
  profileName,
  subscription,
  onLinkGenerated,
  onEmailDraftReady,
}) => {
  const { currentLocationId } = useAuth();
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [templates, setTemplates] = useState<WaiverTemplate[]>([]);
  const [resolvedTemplates, setResolvedTemplates] = useState<WaiverTemplate[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  
  const [expiryDays, setExpiryDays] = useState<number>(7);
  const [variables, setVariables] = useState<Record<string, string>>({
    FullName: profileName,
    CurrentDate: new Date().toLocaleDateString(),
  });
  
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (open && currentLocationId) {
      fetchTemplates();
    }
  }, [open, currentLocationId]);

  useEffect(() => {
    if (templates.length > 0) {
      resolveBestTemplates();
    }
  }, [templates, subscription]);

  const fetchTemplates = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await waiverService.getWaiverTemplates(currentLocationId || undefined);
      setTemplates((res as any).data || []);
    } catch (err) {
      setError('Failed to load waiver templates.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resolveBestTemplates = () => {
    let context: WaiverResolutionContext;

    if (subscription) {
      context = getSubscriptionWaiverContext(subscription);
    } else {
      // Default to general REGISTRATION if no subscription
      context = { type: 'REGISTRATION' };
    }

    let matches = resolveWaiverTemplates(templates, context);
    
    // If no specific match found and it's a REGISTRATION, fallback to any active Registration template
    if (matches.length === 0 && context.type === 'REGISTRATION') {
       matches = templates.filter(t => t.template_category?.toLowerCase() === 'registration' && t.is_active);
    }

    setResolvedTemplates(matches);
    
    if (matches.length > 0) {
      setSelectedTemplateId(matches[0].waiver_template_id);
    } else {
      setSelectedTemplateId('');
    }
  };

  const handleGenerate = async (): Promise<string | null> => {
    if (!selectedTemplateId || !currentLocationId) {
      setError('Please select a valid template first.');
      return null;
    }

    setGenerating(true);
    setError(null);
    
    try {
      // Determine waiver type from context or template
      let waiverType = 'REGISTRATION';
      if (subscription) {
         waiverType = subscription.subscription_type;
      }
      // Clean up MEMBERSHIP_FEE/BASE
      if (waiverType === 'MEMBERSHIP_FEE' || waiverType === 'BASE') waiverType = 'MEMBERSHIP';
      if (waiverType === 'LESSON_REGISTRATION_FEE') waiverType = 'REGISTRATION';

      const payload = {
        account_id: accountId,
        profile_id: profileId,
        waiver_template_id: selectedTemplateId,
        waiver_type: waiverType,
        subscription_id: subscription?.subscription_id,
        expires_in_days: expiryDays,
        variables
      };

      const res = await waiverService.createWaiverRequest(payload, currentLocationId);
      return res.data.public_signing_url;
      
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Failed to generate waiver request.');
      return null;
    } finally {
      setGenerating(false);
    }
  };

  const onCopyLink = async () => {
    const url = await handleGenerate();
    if (url) {
      navigator.clipboard.writeText(url);
      if (onLinkGenerated) onLinkGenerated(url);
      onClose();
    }
  };

  const onEmailLink = async () => {
    const url = await handleGenerate();
    if (url && onEmailDraftReady) {
       const template = templates.find(t => t.waiver_template_id === selectedTemplateId);
       const tplName = template?.template_category ? `${template.template_category} Waiver` : 'Waiver';
       
       onEmailDraftReady({
          subject: `Signature Required: ${tplName}`,
          body: `Please click the link below to review and sign your document for ${profileName}:\n\n{{contract_link}}\n\nThank you!`,
          publicUrl: url
       });
       onClose();
    }
  };

  // Variable input handler
  const handleVariableChange = (key: string, value: string) => {
    setVariables(prev => ({ ...prev, [key]: value }));
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Generate Waiver Link</DialogTitle>
      <DialogContent dividers>
        {loading ? (
          <Box display="flex" justifyContent="center" p={3}>
            <CircularProgress />
          </Box>
        ) : (
          <Stack spacing={3}>
            {error && <Alert severity="error">{error}</Alert>}
            
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Profile Context
              </Typography>
              <Typography variant="body1" fontWeight={600}>{profileName}</Typography>
              {subscription && (
                <Typography variant="body2" color="primary" mt={0.5}>
                  Linked to Subscription: {subscription.subscription_type}
                </Typography>
              )}
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Resolved Template
              </Typography>
              {resolvedTemplates.length === 0 ? (
                <Alert severity="warning" sx={{ mt: 1 }}>
                  No matching template found for this context. You can manually select an active template below.
                </Alert>
              ) : resolvedTemplates.length === 1 ? (
                <Alert severity="success" icon={false} sx={{ mt: 1, bgcolor: '#f0fdf4', border: '1px solid #bbf7d0' }}>
                  <Typography variant="body2" fontWeight={600} color="#166534">
                    {resolvedTemplates[0].template_category || 'General'} Template Detected
                  </Typography>
                </Alert>
              ) : (
                <Alert severity="info" sx={{ mt: 1 }}>
                  Multiple templates matched. Please select one.
                </Alert>
              )}
              
              <TextField
                select
                fullWidth
                size="small"
                label="Selected Template"
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                sx={{ mt: 2 }}
                disabled={templates.length === 0}
              >
                {resolvedTemplates.length > 0 ? (
                   resolvedTemplates.map(t => (
                    <MenuItem key={t.waiver_template_id} value={t.waiver_template_id}>
                      {t.template_category || 'Unnamed Template'} (Match)
                    </MenuItem>
                   ))
                ) : (
                   templates.filter(t => t.is_active).map(t => (
                    <MenuItem key={t.waiver_template_id} value={t.waiver_template_id}>
                      {t.template_category || 'Unnamed Template'}
                    </MenuItem>
                   ))
                )}
              </TextField>
            </Box>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Template Variables
              </Typography>
              <Stack spacing={2} mt={1}>
                <TextField
                  size="small"
                  label="Full Name"
                  value={variables.FullName || ''}
                  onChange={(e) => handleVariableChange('FullName', e.target.value)}
                  fullWidth
                />
                {/* Could add dynamic parsing of variables here, but for now we supply the basics */}
              </Stack>
            </Box>

            <Box>
              <TextField
                type="number"
                size="small"
                label="Link Expiry (Days)"
                value={expiryDays}
                onChange={(e) => setExpiryDays(parseInt(e.target.value) || 7)}
                fullWidth
                inputProps={{ min: 1, max: 30 }}
              />
            </Box>
          </Stack>
        )}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit" disabled={generating}>
          Cancel
        </Button>
        <Button 
          variant="outlined" 
          startIcon={<LinkIcon />} 
          onClick={onCopyLink}
          disabled={!selectedTemplateId || generating}
        >
          {generating ? 'Generating...' : 'Copy Link'}
        </Button>
        <Button 
          variant="contained" 
          startIcon={<EmailIcon />} 
          onClick={onEmailLink}
          disabled={!selectedTemplateId || generating}
        >
          {generating ? 'Generating...' : 'Email'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
