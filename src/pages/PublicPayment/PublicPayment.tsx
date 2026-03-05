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
  Grid,
  Paper,
  Chip,
  Divider,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import LockIcon from '@mui/icons-material/Lock';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import PersonIcon from '@mui/icons-material/Person';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import { publicPaymentService } from '../../services/publicPaymentService';
import { PaymentLinkDetails, PaymentLinkPayResponse } from '../../types';

// Extended type for subscriptions
interface SubscriptionEntry {
  subscription_id: string;
  subscription_type: string;
  status: string;
  total_amount: number;
  discount_amount?: number;
  discount_percentage?: number;
  billing_period_start?: string;
  billing_period_end?: string;
  term_name?: string;
  term_duration_months?: number;
  payment_mode?: string;
  recurrence?: string;
  covered_profiles?: { role: string; name: string }[];
}
interface ExtendedPaymentLinkDetails extends PaymentLinkDetails {
  subscriptions?: SubscriptionEntry[];
}

const statusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'ACTIVE': return { bg: '#dcfce7', color: '#16a34a' };
    case 'PENDING_PAYMENT': return { bg: '#fef9c3', color: '#854d0e' };
    default: return { bg: '#f1f5f9', color: '#475569' };
  }
};

const formatDate = (d?: string) => {
  if (!d) return '—';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const subscriptionTypeLabel = (type: string) => {
  const map: Record<string, string> = {
    MEMBERSHIP_FEE: 'Membership Fee',
    MEMBERSHIP_JOINING: 'Joining Fee',
    MEMBERSHIP_RENEWAL: 'Renewal',
    SERVICE: 'Service',
  };
  return map[type] || type;
};

export const PublicPayment = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [linkDetails, setLinkDetails] = useState<ExtendedPaymentLinkDetails | null>(null);

  const [paymentMode, setPaymentMode] = useState<'saved' | 'new'>('saved');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

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
        const details = await publicPaymentService.getPaymentLink(token) as ExtendedPaymentLinkDetails;

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

  // Loading
  if (loading) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)' }}>
        <Box sx={{ textAlign: 'center' }}>
          <CircularProgress sx={{ color: '#3b82f6' }} size={48} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>Loading payment details…</Typography>
        </Box>
      </Box>
    );
  }

  // Error State
  if (error && !linkDetails && !paymentSuccess) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)', p: 2 }}>
        <Card sx={{ maxWidth: 440, width: '100%', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.10)' }}>
          <CardContent sx={{ textAlign: 'center', py: 6, px: 4 }}>
            <Box sx={{ width: 72, height: 72, borderRadius: '50%', bgcolor: '#fee2e2', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3 }}>
              <Typography variant="h4" sx={{ color: '#ef4444', lineHeight: 1 }}>!</Typography>
            </Box>
            <Typography variant="h5" fontWeight={800} gutterBottom>Link Invalid</Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>{error}</Typography>
            <Typography variant="body2" color="text.secondary">
              If you believe this is an error, please contact the establishment directly.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  // Success Receipt
  if (paymentSuccess && receipt && linkDetails) {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)', p: 2 }}>
        <Card sx={{ maxWidth: 500, width: '100%', borderRadius: 4, boxShadow: '0 20px 60px rgba(0,0,0,0.10)' }}>
          <CardContent sx={{ textAlign: 'center', p: 5 }}>
            <Box sx={{ width: 88, height: 88, borderRadius: '50%', background: 'linear-gradient(135deg, #bbf7d0, #dcfce7)', display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 3, boxShadow: '0 0 0 8px #f0fdf4' }}>
              <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 52 }} />
            </Box>
            <Typography variant="h4" fontWeight={800} sx={{ color: '#15803d', mb: 1 }}>Payment Successful!</Typography>
            <Typography color="text.secondary" sx={{ mb: 4 }}>
              Thank you! Your payment has been processed successfully.
            </Typography>
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 3, textAlign: 'left', mb: 3, bgcolor: '#f8fafc', borderColor: '#e2e8f0' }}>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Amount Paid</Typography>
                  <Typography variant="body1" fontWeight={700} sx={{ color: '#15803d' }}>${Number(receipt.amount || 0).toFixed(2)}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Invoice #</Typography>
                  <Typography variant="body1" fontWeight={600}>{linkDetails.invoice_no}</Typography>
                </Grid>
                <Grid item xs={12}><Divider /></Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Approval Code</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block' }}>{receipt.approval_code || 'N/A'}</Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>Transaction ID</Typography>
                  <Typography variant="body2" sx={{ fontFamily: 'monospace', bgcolor: '#f1f5f9', px: 1, py: 0.3, borderRadius: 1, display: 'inline-block' }}>{receipt.id?.substring(0, 8)}…</Typography>
                </Grid>
              </Grid>
            </Paper>
            <Typography variant="body2" color="text.secondary">
              You may now safely close this window.
            </Typography>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const subs = (linkDetails as ExtendedPaymentLinkDetails)?.subscriptions ?? [];

  // Main Payment UI
  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        py: { xs: 4, md: 6 },
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 900 }}>
        {/* Page Header */}
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#0f172a', letterSpacing: '-0.5px' }}>
            {linkDetails?.location_name || 'Secure Payment'}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Invoice #{linkDetails?.invoice_no} &nbsp;·&nbsp; For {linkDetails?.profile_name}
          </Typography>
        </Box>

        <Grid container spacing={3} alignItems="flex-start">
          {/* LEFT: Order Summary */}
          <Grid item xs={12} md={5}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3 }}>
                {/* Amount Due */}
                <Box sx={{ textAlign: 'center', mb: 3, pb: 3, borderBottom: '1px solid #f1f5f9' }}>
                  <Typography variant="overline" sx={{ color: '#64748b', letterSpacing: 2, fontSize: '0.7rem', fontWeight: 700 }}>
                    Amount Due
                  </Typography>
                  <Typography variant="h3" fontWeight={800} sx={{ color: '#0f172a', mt: 0.5, lineHeight: 1.1 }}>
                    ${Number(linkDetails?.amount_to_be_paid || 0).toFixed(2)}
                  </Typography>
                </Box>

                {/* Subscription Breakdown */}
                {subs.length > 0 ? (
                  <Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                      <ReceiptLongIcon sx={{ fontSize: 15, color: '#64748b' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1 }}>
                        What you're paying for
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                      {subs.map((sub, i) => {
                        const sc = statusColor(sub.status);
                        return (
                          <Paper
                            key={sub.subscription_id || i}
                            variant="outlined"
                            sx={{ p: 2, borderRadius: 3, borderColor: '#e2e8f0', bgcolor: '#fafbfc' }}
                          >
                            {/* Title + Status */}
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 0.5, gap: 1 }}>
                              <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', lineHeight: 1.3 }}>
                                {sub.term_name || subscriptionTypeLabel(sub.subscription_type)}
                              </Typography>
                              <Chip
                                label={sub.status?.replace(/_/g, ' ')}
                                size="small"
                                sx={{ bgcolor: sc.bg, color: sc.color, fontWeight: 700, fontSize: '0.62rem', height: 18, flexShrink: 0 }}
                              />
                            </Box>

                            <Typography variant="caption" sx={{ color: '#64748b', display: 'block', mb: 1.5 }}>
                              {subscriptionTypeLabel(sub.subscription_type)}
                              {sub.recurrence ? ` · ${sub.recurrence}` : ''}
                              {sub.payment_mode ? ` · ${sub.payment_mode}` : ''}
                            </Typography>

                            {/* Billing Period */}
                            {(sub.billing_period_start || sub.billing_period_end) && (
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                                <CalendarTodayIcon sx={{ fontSize: 12, color: '#94a3b8' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {formatDate(sub.billing_period_start)} – {formatDate(sub.billing_period_end)}
                                </Typography>
                              </Box>
                            )}

                            {/* Covered Profiles */}
                            {sub.covered_profiles && sub.covered_profiles.length > 0 && (
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1.5 }}>
                                <PersonIcon sx={{ fontSize: 12, color: '#94a3b8', mt: '2px' }} />
                                <Typography variant="caption" color="text.secondary">
                                  {sub.covered_profiles.map(p => `${p.name} (${p.role})`).join(', ')}
                                </Typography>
                              </Box>
                            )}

                            {/* Amount row */}
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1, borderTop: '1px dashed #e2e8f0' }}>
                              {sub.discount_amount ? (
                                <Typography variant="caption" sx={{ color: '#16a34a' }}>
                                  −${Number(sub.discount_amount).toFixed(2)}
                                  {sub.discount_percentage ? ` (${sub.discount_percentage}% off)` : ''}
                                </Typography>
                              ) : <Box />}
                              <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a' }}>
                                ${Number(sub.total_amount).toFixed(2)}
                              </Typography>
                            </Box>
                          </Paper>
                        );
                      })}
                    </Box>
                  </Box>
                ) : (
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Payment for Invoice #{linkDetails?.invoice_no}
                    </Typography>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Grid>

          {/* RIGHT: Payment Form */}
          <Grid item xs={12} md={7}>
            <Card sx={{ borderRadius: 4, boxShadow: '0 4px 24px rgba(0,0,0,0.08)', border: '1px solid #e2e8f0' }}>
              <CardContent sx={{ p: 3.5 }}>
                <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2.5, color: '#0f172a' }}>
                  Payment Details
                </Typography>

                {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}

                <Box component="form" onSubmit={handlePay}>
                  {/* Saved Methods */}
                  {linkDetails?.saved_methods && linkDetails.saved_methods.length > 0 && (
                    <Box sx={{ mb: 3 }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 1.5 }}>
                        Select Payment Method
                      </Typography>
                      <RadioGroup value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'saved' | 'new')}>
                        <FormControlLabel
                          value="saved"
                          control={<Radio size="small" />}
                          label={<Typography variant="body2" fontWeight={600}>Saved Card</Typography>}
                        />
                        {paymentMode === 'saved' && (
                          <Box sx={{ pl: 3.5, pr: 0.5, pb: 1 }}>
                            <RadioGroup value={selectedMethodId} onChange={(e) => setSelectedMethodId(e.target.value)}>
                              {linkDetails.saved_methods.map(method => (
                                <Paper
                                  key={method.id}
                                  variant="outlined"
                                  onClick={() => setSelectedMethodId(method.id)}
                                  sx={{
                                    mb: 1, p: 1.5, display: 'flex', alignItems: 'center',
                                    borderRadius: 2.5, cursor: 'pointer',
                                    border: selectedMethodId === method.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                    bgcolor: selectedMethodId === method.id ? '#eff6ff' : 'white',
                                    transition: 'all 0.15s ease',
                                    '&:hover': { borderColor: '#93c5fd', bgcolor: '#f8fafc' }
                                  }}
                                >
                                  <Radio size="small" value={method.id} checked={selectedMethodId === method.id} sx={{ p: 0.5, mr: 1 }} />
                                  <CreditCardIcon sx={{ color: '#64748b', mr: 1.5, fontSize: 20 }} />
                                  <Box>
                                    <Typography variant="body2" fontWeight={600}>{method.brand} •••• {method.last4}</Typography>
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

                  {/* New Card Form */}
                  {paymentMode === 'new' && (
                    <Box sx={{
                      mt: linkDetails?.saved_methods?.length ? 1 : 0,
                      pt: linkDetails?.saved_methods?.length ? 2 : 0,
                      borderTop: linkDetails?.saved_methods?.length ? '1px dashed #e2e8f0' : 'none',
                      mb: 2.5
                    }}>
                      {(!linkDetails?.saved_methods?.length) && (
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', textTransform: 'uppercase', letterSpacing: 1, display: 'block', mb: 2 }}>
                          Card Details
                        </Typography>
                      )}
                      <Grid container spacing={2}>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth size="small" label="Card Number"
                            value={cardNumber}
                            onChange={(e) => setCardNumber(e.target.value)}
                            disabled={processing}
                            required={paymentMode === 'new'}
                            placeholder="1234 5678 9012 3456"
                            InputProps={{ startAdornment: <CreditCardIcon color="action" sx={{ mr: 1, fontSize: 18 }} /> }}
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth size="small" label="MM/YY"
                            value={expiry}
                            onChange={(e) => setExpiry(e.target.value)}
                            disabled={processing}
                            required={paymentMode === 'new'}
                            placeholder="MM/YY"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={6}>
                          <TextField
                            fullWidth size="small" label="CVV"
                            value={cvv}
                            onChange={(e) => setCvv(e.target.value)}
                            disabled={processing}
                            required={paymentMode === 'new'}
                            type="password"
                            placeholder="•••"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                        <Grid item xs={12}>
                          <TextField
                            fullWidth size="small" label="Name on Card"
                            value={cardholderName}
                            onChange={(e) => setCardholderName(e.target.value)}
                            disabled={processing}
                            required={paymentMode === 'new'}
                            placeholder="Jane Doe"
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                          />
                        </Grid>
                      </Grid>
                    </Box>
                  )}

                  {/* Pay Button */}
                  <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={processing}
                    sx={{
                      mt: 1,
                      py: 1.6,
                      fontSize: '1.05rem',
                      fontWeight: 800,
                      borderRadius: 3,
                      background: 'linear-gradient(135deg, #3b82f6, #2563eb)',
                      boxShadow: '0 4px 14px rgba(59,130,246,0.4)',
                      textTransform: 'none',
                      '&:hover': {
                        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                        boxShadow: '0 6px 20px rgba(59,130,246,0.5)',
                      },
                    }}
                  >
                    {processing
                      ? <CircularProgress size={24} color="inherit" />
                      : `Pay $${Number(linkDetails?.amount_to_be_paid || 0).toFixed(2)}`
                    }
                  </Button>

                  {/* Security Badge */}
                  <Box sx={{ mt: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                    <LockIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                    <Typography variant="caption" color="text.secondary">
                      256-bit SSL encrypted · Payments are processed securely
                    </Typography>
                  </Box>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Footer */}
        <Box sx={{ textAlign: 'center', mt: 4 }}>
          <Typography variant="caption" color="text.secondary">
            © {linkDetails?.location_name} · Secure payment powered by Solar Swim
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
