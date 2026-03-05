import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Card,
  CardContent,
  CircularProgress,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Alert,
  Divider,
  Grid,
  Paper
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { publicPaymentService } from '../../services/publicPaymentService';
import { PaymentLinkDetails, PaymentLinkPayResponse } from '../../types';

export const PublicPayment = () => {
  const { token } = useParams<{ token: string }>();
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkDetails, setLinkDetails] = useState<PaymentLinkDetails | null>(null);
  
  const [paymentMode, setPaymentMode] = useState<'saved' | 'new'>('saved');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');
  
  // New Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cvv, setCvv] = useState('');
  
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receipt, setReceipt] = useState<PaymentLinkPayResponse['transaction'] | null>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      if (!token) {
        setError('Invalid payment link.');
        setLoading(false);
        return;
      }
      try {
        const details = await publicPaymentService.getPaymentLink(token);
        
        if (details.status === 'paid') {
          setError('This invoice has already been paid.');
          setLoading(false);
          return;
        }
        if (details.status === 'expired' || details.status === 'cancelled') {
          setError('This payment link has expired or been cancelled. Please contact the establishment.');
          setLoading(false);
          return;
        }

        setLinkDetails(details);
        
        if (details.saved_methods && details.saved_methods.length > 0) {
          setPaymentMode('saved');
          setSelectedMethodId(details.saved_methods[0].id);
        } else {
          setPaymentMode('new');
        }
      } catch (err: any) {
        console.error('Failed to fetch link details:', err);
        setError(err.response?.data?.error || 'Payment link not found or expired.');
      } finally {
        setLoading(false);
      }
    };
    fetchDetails();
  }, [token]);

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      let payload: any = {};
      
      if (paymentMode === 'saved') {
        if (!selectedMethodId) throw new Error('Please select a saved card.');
        payload = { paymentMethodId: selectedMethodId };
      } else {
        if (!cardNumber || !expiry || !cardholderName || !cvv) {
          throw new Error('Please fill in all card details.');
        }
        payload = {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          expiryMmYy: expiry.replace(/\//g, ''),
          cardholderName,
          cvv
        };
      }
      
      const response = await publicPaymentService.payWithLink(token, payload);
      setReceipt(response.transaction);
      setPaymentSuccess(true);
    } catch (err: any) {
      console.error('Payment failed:', err);
      setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9' }}>
        <CircularProgress />
      </Box>
    );
  }

  // Handle Invalid/Error States (Before payment interaction)
  if (error && !linkDetails && !paymentSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9', p: 2 }}>
        <Card sx={{ maxWidth: 450, width: '100%', borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ textAlign: 'center', py: 5 }}>
            <Box sx={{ width: 64, height: 64, borderRadius: '50%', bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
               <Typography variant="h4" color="error">!</Typography>
            </Box>
            <Typography variant="h5" fontWeight="bold" gutterBottom>Link Invalid</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
            <Typography variant="body2" color="text.secondary">
              If you believe this is an error, please contact the establishment directly.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Handle Success Receipt
  if (paymentSuccess && receipt && linkDetails) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9', p: 2 }}>
        <Card sx={{ maxWidth: 500, width: '100%', borderRadius: 3, boxShadow: 3 }}>
          <CardContent sx={{ textAlign: 'center', p: 4 }}>
            <Box sx={{ width: 80, height: 80, borderRadius: '50%', bgcolor: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
               <CheckCircleIcon color="success" sx={{ fontSize: 48 }} />
            </Box>
            <Typography variant="h4" fontWeight="800" sx={{ color: '#16a34a', mb: 1 }}>Payment Successful</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Thank you! Your payment has been processed successfully.
            </Typography>

            <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, textAlign: 'left', mb: 3, bgcolor: '#f8fafc' }}>
              <Grid container spacing={2}>
                 <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Amount Paid</Typography>
                    <Typography variant="body1" fontWeight={700}>${Number(receipt.amount || 0).toFixed(2)}</Typography>
                 </Grid>
                 <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Invoice #</Typography>
                    <Typography variant="body1" fontWeight={600}>{linkDetails.invoice_no}</Typography>
                 </Grid>
                 <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Approval Code</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{receipt.approval_code || 'N/A'}</Typography>
                 </Grid>
                 <Grid item xs={6}>
                    <Typography variant="caption" color="text.secondary" display="block">Transaction ID</Typography>
                    <Typography variant="body1" sx={{ fontFamily: 'monospace' }}>{receipt.id?.substring(0, 8)}</Typography>
                 </Grid>
              </Grid>
            </Paper>
            <Typography variant="body2" color="text.secondary">
              A receipt has been saved to your account. You may now close this window.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Active Payment Interface
  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f1f5f9', p: 2 }}>
      <Card sx={{ maxWidth: 500, width: '100%', borderRadius: 3, boxShadow: 3, overflow: 'visible' }}>
        <Box sx={{ bgcolor: '#1e293b', color: 'white', p: 3, borderTopLeftRadius: 12, borderTopRightRadius: 12, textAlign: 'center' }}>
          <Typography variant="h5" fontWeight="bold">{linkDetails?.location_name || 'Secure Payment'}</Typography>
          <Typography variant="body2" sx={{ opacity: 0.8, mt: 0.5 }}>Invoice #{linkDetails?.invoice_no}</Typography>
        </Box>
        
        <CardContent sx={{ p: 4, pt: 3 }}>
          <Box sx={{ textAlign: 'center', mb: 4 }}>
             <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Amount Due
             </Typography>
             <Typography variant="h3" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5 }}>
                ${Number(linkDetails?.amount_to_be_paid || 0).toFixed(2)}
             </Typography>
             <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                For {linkDetails?.profile_name}
             </Typography>
          </Box>

          {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

          <Box component="form" onSubmit={handlePay}>
            
            {linkDetails?.saved_methods && linkDetails.saved_methods.length > 0 && (
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600, color: '#334155' }}>Select Payment Method</Typography>
                <RadioGroup 
                  value={paymentMode} 
                  onChange={(e) => setPaymentMode(e.target.value as 'saved' | 'new')}
                >
                  <FormControlLabel 
                    value="saved" 
                    control={<Radio size="small" />} 
                    label={<Typography variant="body2" fontWeight={600}>Use Saved Card</Typography>} 
                  />
                  {paymentMode === 'saved' && (
                    <Box sx={{ pl: 3.5, pr: 1, pb: 2 }}>
                       <RadioGroup 
                         value={selectedMethodId} 
                         onChange={(e) => setSelectedMethodId(e.target.value)}
                       >
                         {linkDetails.saved_methods.map(method => (
                           <Paper key={method.id} variant="outlined" sx={{ mb: 1, p: 1.5, display: 'flex', alignItems: 'center', borderRadius: 2, cursor: 'pointer', border: selectedMethodId === method.id ? '2px solid #3b82f6' : '1px solid #e2e8f0', '&:hover': { bgcolor: '#f8fafc' } }} onClick={() => setSelectedMethodId(method.id)}>
                             <Radio size="small" value={method.id} checked={selectedMethodId === method.id} sx={{ p: 0.5, mr: 1 }} />
                             <CreditCardIcon sx={{ color: '#64748b', mr: 1.5 }} />
                             <Box>
                                <Typography variant="body2" fontWeight={600}>{method.brand} ending in {method.last4}</Typography>
                                <Typography variant="caption" color="text.secondary">Expires {method.expiry}</Typography>
                             </Box>
                           </Paper>
                         ))}
                       </RadioGroup>
                    </Box>
                  )}
                  <FormControlLabel 
                    value="new" 
                    control={<Radio size="small" />} 
                    label={<Typography variant="body2" fontWeight={600}>Use a Different Card</Typography>} 
                  />
                </RadioGroup>
              </Box>
            )}

            {paymentMode === 'new' && (
              <Box sx={{ mt: linkDetails?.saved_methods?.length ? 1 : 0, mb: 3, pt: linkDetails?.saved_methods?.length ? 2 : 0, borderTop: linkDetails?.saved_methods?.length ? '1px dashed #e2e8f0' : 'none' }}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600, color: '#334155' }}>Card Details</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Card Number"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      disabled={processing}
                      required={paymentMode === 'new'}
                      InputProps={{ startAdornment: <CreditCardIcon color="action" sx={{ mr: 1, fontSize: 20 }} /> }}
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="MM/YY"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      disabled={processing}
                      required={paymentMode === 'new'}
                      placeholder="MM/YY"
                    />
                  </Grid>
                  <Grid item xs={6}>
                    <TextField
                      fullWidth
                      size="small"
                      label="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      disabled={processing}
                      required={paymentMode === 'new'}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      size="small"
                      label="Name on Card"
                      value={cardholderName}
                      onChange={(e) => setCardholderName(e.target.value)}
                      disabled={processing}
                      required={paymentMode === 'new'}
                    />
                  </Grid>
                </Grid>
              </Box>
            )}

            <Button
              type="submit"
              variant="contained"
              fullWidth
              size="large"
              disabled={processing}
              sx={{ py: 1.5, fontSize: '1.05rem', fontWeight: 800, borderRadius: 2 }}
            >
              {processing ? <CircularProgress size={24} color="inherit" /> : `Pay $${Number(linkDetails?.amount_to_be_paid || 0).toFixed(2)}`}
            </Button>
            
            <Box sx={{ mt: 3, textAlign: 'center' }}>
               <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.5 }}>
                 Payments are processed securely
               </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
};
