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
  Alert
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

import { publicWaiverService, PublicWaiverDetailsResponse } from '../services/publicWaiverService';
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
        const response = await publicWaiverService.getWaiverDetails(token);
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

          await publicWaiverService.submitWaiver(token, {
            signature_base64: base64,
            final_content: contentWithVars,
            agreed,
            subscription_id: waiverDetails.subscription_id
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
    <Box sx={{ height: '100vh', bgcolor: '#f8fafc', py: { xs: 0, md: 4 }, px: { xs: 0, md: 2 } }}>
      <Container maxWidth="md" sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
        <Paper elevation={3} sx={{ borderRadius: { xs: 0, md: 4 }, overflow: 'hidden', flex: 1, display: 'flex', flexDirection: 'column' }}>
          
          <Box sx={{ bgcolor: 'white', borderBottom: '1px solid #f1f5f9', p: { xs: 2.5, md: 4 }, color: '#1e293b', textAlign: 'center', flexShrink: 0 }}>
            <Typography variant="h5" fontWeight={800} color="#0f172a" sx={{ letterSpacing: '-0.02em' }}>
              {waiverDetails?.location_name || 'Glass Court Swim and Fitness'}
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748b', fontWeight: 500, mt: 0.5 }}>
              Document Signing Request
            </Typography>
          </Box>

          {error && (
            <Box sx={{ p: { xs: 3, md: 5 }, pb: 0 }}>
              <Alert severity="error" icon={<ErrorOutlineIcon fontSize="inherit" />} sx={{ borderRadius: 2 }}>
                {error}
              </Alert>
            </Box>
          )}

          {!waiverDetails ? (
            <Box sx={{ textAlign: 'center', py: 5, p: { xs: 3, md: 5 } }}>
              <ErrorOutlineIcon color="error" sx={{ fontSize: 60, mb: 2, opacity: 0.5 }} />
              <Typography variant="h6" color="text.secondary">Waiver not found or expired.</Typography>
            </Box>
          ) : (
            <>
                <Typography variant="h6" fontWeight={700} gutterBottom color="text.primary" sx={{ px: { xs: 2, md: 4 }, pt: { xs: 2, md: 3 } }}>
                  Review & Sign Document
                </Typography>
                
                <Box sx={{ mb: 2, mx: { xs: 2, md: 4 }, p: 2, bgcolor: '#f1f5f9', borderRadius: 2, border: '1px solid #e2e8f0', flexShrink: 0 }}>
                   <Typography variant="body2" color="text.secondary">
                     <strong>Document Type:</strong> {waiverDetails.waiver_type} Waiver
                   </Typography>
                   <Typography variant="body2" color="text.secondary">
                     <strong>Signing As:</strong> {waiverDetails.resolved_variables?.FullName || 'Unknown'}
                   </Typography>
                </Box>

                {/* Pre-replace variables for the preview */}
                <Box sx={{ flex: 1, overflowY: 'auto', px: { xs: 2, md: 4 }, pb: 4, display: 'flex', flexDirection: 'column' }}>
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
                    fullHeight={true}
                    signatureComponent={
                      <SignaturePad
                        ref={signaturePadRef}
                        width={500}
                        height={180}
                      />
                    }
                  />
                </Box>

                {/* Fixed Footer for Checkbox and Submit */}
                <Box sx={{ 
                  p: { xs: 2, md: 3 }, 
                  bgcolor: '#fff', 
                  borderTop: '1px solid #e2e8f0', 
                  display: 'flex', 
                  flexDirection: 'column', 
                  alignItems: 'center',
                  boxShadow: '0 -4px 12px rgba(0,0,0,0.05)',
                  flexShrink: 0
                }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={agreed}
                        onChange={(e) => {
                            setAgreed(e.target.checked);
                            if (e.target.checked) setError(null);
                        }}
                        color="primary"
                        sx={{ '& .MuiSvgIcon-root': { fontSize: 28 } }}
                      />
                    }
                    label={
                      <Typography variant="body1" fontWeight={600} color="#1e293b">
                        I have read, understand, and agree to the terms outlined above.
                      </Typography>
                    }
                    sx={{ mb: 2, width: '100%', justifyContent: 'center' }}
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
                      boxShadow: '0 4px 14px 0 rgba(0,118,255,0.39)',
                      maxWidth: '400px',
                      '&:hover': {
                        transform: 'translateY(-1px)',
                        boxShadow: '0 6px 20px rgba(0,118,255,0.23)'
                      },
                      transition: 'all 0.2s ease',
                    }}
                  >
                    {signing ? 'Submitting Signature...' : 'Submit & Sign Waiver'}
                  </Button>
                </Box>
              </>
            )}
          {/* Removed wrapping Box */}
        </Paper>
      </Container>
    </Box>
  );
};

export default PublicWaiverSigning;
