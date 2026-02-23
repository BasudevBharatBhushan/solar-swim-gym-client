import { useEffect, useState, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  Container,
  Paper,
  Checkbox,
  FormControlLabel,
  Divider,
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { waiverService, PublicWaiverDetailsResponse } from '../services/waiverService';
import { WaiverPreview } from '../components/Waiver/WaiverPreview';
import { SignaturePad, SignaturePadRef, getSignatureBlob } from '../components/Waiver/SignaturePad';

export const PublicWaiverSigning = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');

  const [loading, setLoading] = useState(true);
  const [signing, setSigning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [waiverDetails, setWaiverDetails] = useState<PublicWaiverDetailsResponse['data'] | null>(null);
  const [agreed, setAgreed] = useState(false);
  const [success, setSuccess] = useState(false);

  const signaturePadRef = useRef<SignaturePadRef>(null);

  useEffect(() => {
    if (!token) {
      setError('Invalid or missing signing token.');
      setLoading(false);
      return;
    }

    const fetchWaiver = async () => {
      try {
        const response = await waiverService.getPublicWaiverRequest(token);
        setWaiverDetails(response.data);
      } catch (err: any) {
        console.error('Failed to load waiver:', err);
        // Map 410 or other errors specifically if possible
        setError(err.message || 'Failed to load waiver. The link may have expired or was already signed.');
      } finally {
        setLoading(false);
      }
    };

    fetchWaiver();
  }, [token]);

  const handleSign = async () => {
    if (!token || !waiverDetails || !signaturePadRef.current) return;

    if (signaturePadRef.current.isEmpty()) {
      setError('Please provide your signature to continue.');
      return;
    }

    const canvas = signaturePadRef.current.getCanvas();
    if (!canvas) return;

    setSigning(true);
    setError(null);

    try {
      const blob = await getSignatureBlob(canvas);
      if (!blob) throw new Error('Failed to capture signature');

      const reader = new FileReader();
      reader.readAsDataURL(blob);
      reader.onloadend = async () => {
        try {
          const base64 = reader.result as string;

          let contentWithVars = waiverDetails.template_content;
          // Dynamically inject all resolved variables
          if (waiverDetails.resolved_variables) {
            Object.entries(waiverDetails.resolved_variables).forEach(([key, value]) => {
              const regex = new RegExp(`\\[${key}\\]`, 'g');
              contentWithVars = contentWithVars.replace(regex, value);
            });
          }

          await waiverService.submitPublicWaiver(token, {
            signature_base64: base64,
            final_content: contentWithVars,
            agreed
          });

          setSuccess(true);
        } catch (err: any) {
          console.error('Submission failed', err);
          setError(err.message || 'Failed to submit signature. Please try again or contact support.');
          setSigning(false);
        }
      };
    } catch (err: any) {
      console.error('Signing failed', err);
      setError(err.message || 'An error occurred while signing.');
      setSigning(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100vh', bgcolor: '#f8fafc' }}>
        <CircularProgress size={60} thickness={4} />
        <Typography variant="h6" sx={{ mt: 3, color: '#475569', fontWeight: 600 }}>Loading waiver details...</Typography>
      </Box>
    );
  }

  if (success) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', bgcolor: '#f8fafc', p: 3 }}>
        <Paper elevation={3} sx={{ p: 5, borderRadius: 4, maxWidth: 500, textAlign: 'center' }}>
          <CheckCircleIcon color="success" sx={{ fontSize: 80, mb: 2 }} />
          <Typography variant="h4" fontWeight={800} color="success.main" gutterBottom>
            Thank You!
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
            Your waiver has been successfully signed and submitted. You may now close this page.
          </Typography>
        </Paper>
      </Box>
    );
  }

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f8fafc', py: { xs: 4, md: 8 }, px: 2 }}>
      <Container maxWidth="md">
        <Paper elevation={3} sx={{ borderRadius: 4, overflow: 'hidden' }}>
          
          <Box sx={{ bgcolor: 'primary.main', p: 3, color: 'white', textAlign: 'center' }}>
            <Typography variant="h5" fontWeight={800}>
              {waiverDetails?.location_name || 'Solar Swim Gym'}
            </Typography>
            <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
              Document Signing Request
            </Typography>
          </Box>

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            {error && (
              <Alert severity="error" icon={<ErrorOutlineIcon fontSize="inherit" />} sx={{ mb: 4, borderRadius: 2 }}>
                {error}
              </Alert>
            )}

            {!waiverDetails ? (
              <Box sx={{ textAlign: 'center', py: 5 }}>
                <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
                <Typography variant="h6" color="text.secondary">Waiver not found or expired.</Typography>
              </Box>
            ) : (
              <>
                <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary">
                  Review & Sign Document
                </Typography>
                
                <Box sx={{ mb: 4, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0' }}>
                   <Typography variant="body2" color="text.secondary">
                     <strong>Document Type:</strong> {waiverDetails.waiver_type} Waiver
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     <strong>Signing As:</strong> {waiverDetails.resolved_variables?.FullName || 'Unknown'}
                   </Typography>
                </Box>

                {/* Pre-replace variables for the preview */}
                <Box>
                  <WaiverPreview
                    content={(() => {
                      let content = waiverDetails.template_content;
                      Object.entries(waiverDetails.resolved_variables || {}).forEach(([key, value]) => {
                        content = content.replace(new RegExp(`\\[${key}\\]`, 'g'), value);
                      });
                      return content;
                    })()}
                    data={{ 
                      first_name: waiverDetails.resolved_variables?.FullName?.split(' ')[0] || '', 
                      last_name: waiverDetails.resolved_variables?.FullName?.split(' ')[1] || '' 
                    }}
                    agreed={agreed}
                    onAgreeChange={setAgreed}
                    hideCheckbox={true}
                    fullHeight={false}
                    signatureComponent={
                      <SignaturePad
                        ref={signaturePadRef}
                        width={500}
                        height={180}
                      />
                    }
                  />
                </Box>

                <Divider sx={{ my: 4 }} />

                <FormControlLabel
                  control={
                    <Checkbox
                      checked={agreed}
                      onChange={(e) => {
                          setAgreed(e.target.checked);
                          if (e.target.checked) setError(null);
                      }}
                      color="primary"
                    />
                  }
                  label={
                    <Typography variant="body1" fontWeight={600} color="text.primary">
                      I have read, understand, and agree to the terms outlined above.
                    </Typography>
                  }
                  sx={{ mb: 3 }}
                />

                <Button
                  fullWidth
                  variant="contained"
                  size="large"
                  onClick={handleSign}
                  disabled={!agreed || signing}
                  sx={{
                    py: 1.5,
                    fontSize: '1.1rem',
                    fontWeight: 800,
                    textTransform: 'none',
                    borderRadius: 3,
                    boxShadow: 2
                  }}
                >
                  {signing ? 'Submitting Signature...' : 'Submit & Sign Waiver'}
                </Button>
              </>
            )}
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicWaiverSigning;
