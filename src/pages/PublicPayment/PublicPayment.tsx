import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Typography,
  CircularProgress,
  Button,
  TextField,
  RadioGroup,
  Radio,
  FormControlLabel,
  Alert,
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
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { publicPaymentService } from '../../services/publicPaymentService';
import { PaymentLinkDetails, PaymentLinkPayResponse } from '../../types';

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

// ── Shared card style ─────────────────────────────────────────────────────────
const cardSx = {
  background: '#ffffff',
  borderRadius: '20px',
  boxShadow: '0 2px 16px rgba(0,0,0,0.07)',
  border: '1px solid #e8eef4',
  p: { xs: 2.5, sm: 3 },
};

// ── Page wrapper ──────────────────────────────────────────────────────────────
const PageWrapper = ({ children }: { children: React.ReactNode }) => (
  <Box
    sx={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #dbeafe 0%, #e0f2fe 40%, #dcfce7 100%)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'flex-start',
      py: { xs: 3, sm: 5 },
      px: { xs: 1.5, sm: 2 },
    }}
  >
    {children}
  </Box>
);

export const PublicPayment = () => {
  const { token } = useParams<{ token: string }>();

  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [linkDetails, setLinkDetails] = useState<ExtendedPaymentLinkDetails | null>(null);

  const [paymentMode, setPaymentMode]           = useState<'saved' | 'new'>('saved');
  const [selectedMethodId, setSelectedMethodId] = useState<string>('');

  const [cardNumber, setCardNumber]         = useState('');
  const [expiry, setExpiry]                 = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [cvv, setCvv]                       = useState('');

  const [processing, setProcessing]         = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [receipt, setReceipt]               = useState<PaymentLinkPayResponse['transaction'] | null>(null);

  useEffect(() => {
    const fetch = async () => {
      if (!token) { setError('Invalid payment link.'); setLoading(false); return; }
      try {
        const details = await publicPaymentService.getPaymentLink(token) as ExtendedPaymentLinkDetails;
        if (details.status === 'paid') {
          setError('This invoice has already been paid.'); setLoading(false); return;
        }
        if (details.status === 'expired' || details.status === 'cancelled') {
          setError('This payment link has expired or been cancelled. Please contact the establishment.');
          setLoading(false); return;
        }
        setLinkDetails(details);
        if (details.saved_methods?.length > 0) {
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
    fetch();
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
        if (!cardNumber || !expiry || !cardholderName || !cvv)
          throw new Error('Please fill in all card details.');
        payload = {
          cardNumber: cardNumber.replace(/\s+/g, ''),
          expiryMmYy: expiry.replace(/\//g, ''),
          cardholderName,
          cvv,
        };
      }
      const response = await publicPaymentService.payWithLink(token, payload);
      setReceipt(response.transaction);
      setPaymentSuccess(true);
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Payment failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  // ── Loading ─────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <PageWrapper>
        <Box sx={{ textAlign: 'center', mt: 10 }}>
          <CircularProgress sx={{ color: '#3b82f6' }} size={44} />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading payment details…
          </Typography>
        </Box>
      </PageWrapper>
    );
  }

  // ── Error ───────────────────────────────────────────────────────────────────
  if (error && !linkDetails) {
    return (
      <PageWrapper>
        <Box sx={{ ...cardSx, maxWidth: 420, width: '100%', textAlign: 'center', py: 5, px: 4, mt: 4 }}>
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%', bgcolor: '#fee2e2',
            display: 'flex', alignItems: 'center', justifyContent: 'center', mx: 'auto', mb: 2.5,
          }}>
            <ErrorOutlineIcon sx={{ color: '#ef4444', fontSize: 34 }} />
          </Box>
          <Typography variant="h6" fontWeight={800} gutterBottom>Link Unavailable</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{error}</Typography>
          <Typography variant="caption" color="text.secondary">
            Please contact the establishment if you think this is a mistake.
          </Typography>
        </Box>
      </PageWrapper>
    );
  }

  // ── Success ─────────────────────────────────────────────────────────────────
  if (paymentSuccess && receipt && linkDetails) {
    return (
      <PageWrapper>
        <Box sx={{ ...cardSx, maxWidth: 460, width: '100%', textAlign: 'center', py: 5, px: { xs: 2.5, sm: 4 }, mt: 4 }}>
          <Box sx={{
            width: 80, height: 80, borderRadius: '50%',
            background: 'linear-gradient(135deg, #bbf7d0, #dcfce7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            mx: 'auto', mb: 2.5, boxShadow: '0 0 0 10px rgba(220,252,231,0.5)',
          }}>
            <CheckCircleIcon sx={{ color: '#16a34a', fontSize: 46 }} />
          </Box>
          <Typography variant="h5" fontWeight={800} sx={{ color: '#15803d', mb: 0.75 }}>
            Payment Successful!
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3.5 }}>
            Thank you, your payment has been processed.
          </Typography>

          <Box sx={{ bgcolor: '#f8fafc', borderRadius: 3, border: '1px solid #e2e8f0', p: 2.5, textAlign: 'left' }}>
            {[
              { label: 'Amount Paid', value: `$${Number(receipt.amount || 0).toFixed(2)}`, highlight: true },
              { label: 'Invoice #', value: linkDetails.invoice_no },
              { label: 'Approval Code', value: receipt.approval_code || 'N/A', mono: true },
              { label: 'Transaction ID', value: `${receipt.id?.substring(0, 8)}…`, mono: true },
            ].map((row, i, arr) => (
              <Box key={row.label}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', py: 1.25 }}>
                  <Typography variant="caption" color="text.secondary" fontWeight={600}>{row.label}</Typography>
                  <Typography
                    variant="body2"
                    fontWeight={row.highlight ? 800 : 600}
                    sx={{ color: row.highlight ? '#15803d' : '#0f172a', fontFamily: row.mono ? 'monospace' : 'inherit' }}
                  >
                    {row.value}
                  </Typography>
                </Box>
                {i < arr.length - 1 && <Divider />}
              </Box>
            ))}
          </Box>

          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 3 }}>
            You may now safely close this window.
          </Typography>
        </Box>
      </PageWrapper>
    );
  }

  const subs = linkDetails?.subscriptions ?? [];
  const hasSavedCards = (linkDetails?.saved_methods?.length ?? 0) > 0;

  // ── Main ────────────────────────────────────────────────────────────────────
  return (
    <PageWrapper>
      {/* Header */}
      <Box sx={{ textAlign: 'center', mb: { xs: 3, sm: 4 }, px: 1 }}>
        <Typography
          variant="h6"
          fontWeight={800}
          sx={{ color: '#0f172a', fontSize: { xs: '1.1rem', sm: '1.25rem' } }}
        >
          {linkDetails?.location_name || 'Secure Payment'}
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
          Invoice #{linkDetails?.invoice_no}&nbsp;·&nbsp;For {linkDetails?.profile_name}
        </Typography>
      </Box>

      {/* Two-column layout: stacked on mobile, side-by-side on md+ */}
      <Box
        sx={{
          width: '100%',
          maxWidth: 900,
          display: 'flex',
          flexDirection: { xs: 'column', md: 'row' },
          gap: { xs: 2, sm: 2.5 },
          alignItems: 'flex-start',
        }}
      >
        {/* ── LEFT: Order Summary ──────────────────────────────────────────── */}
        <Box sx={{ flex: { md: '0 0 340px' }, width: '100%' }}>
          <Box sx={cardSx}>
            {/* Amount Due */}
            <Box sx={{ textAlign: 'center', pb: 2.5, mb: 2.5, borderBottom: '1px solid #f1f5f9' }}>
              <Typography
                sx={{ fontSize: '0.65rem', fontWeight: 800, letterSpacing: 2, color: '#94a3b8', textTransform: 'uppercase', mb: 0.5 }}
              >
                Amount Due
              </Typography>
              <Typography
                sx={{ fontSize: { xs: '2.4rem', sm: '2.75rem' }, fontWeight: 900, color: '#0f172a', lineHeight: 1 }}
              >
                ${Number(linkDetails?.amount_to_be_paid || 0).toFixed(2)}
              </Typography>
            </Box>

            {/* Subscription Breakdown */}
            {subs.length > 0 && (
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2 }}>
                  <ReceiptLongIcon sx={{ fontSize: 14, color: '#94a3b8' }} />
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5 }}>
                    What you're paying for
                  </Typography>
                </Box>

                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {subs.map((sub, i) => {
                    const isActive = sub.status?.toUpperCase() === 'ACTIVE';
                    return (
                      <Box
                        key={sub.subscription_id || i}
                        sx={{
                          bgcolor: '#f8fafc',
                          border: '1px solid #e8eef4',
                          borderRadius: '12px',
                          p: 2,
                        }}
                      >
                        {/* Row: name + status chip */}
                        <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1, mb: 0.75 }}>
                          <Typography variant="body2" fontWeight={700} sx={{ color: '#1e293b', lineHeight: 1.3, flex: 1 }}>
                            {sub.term_name || subscriptionTypeLabel(sub.subscription_type)}
                          </Typography>
                          <Chip
                            label={sub.status?.replace(/_/g, ' ')}
                            size="small"
                            sx={{
                              height: 20,
                              fontSize: '0.6rem',
                              fontWeight: 800,
                              bgcolor: isActive ? '#dcfce7' : '#fef9c3',
                              color: isActive ? '#15803d' : '#92400e',
                              flexShrink: 0,
                            }}
                          />
                        </Box>

                        {/* Sub-type + recurrence */}
                        <Typography sx={{ fontSize: '0.72rem', color: '#64748b', mb: 1 }}>
                          {subscriptionTypeLabel(sub.subscription_type)}
                          {sub.recurrence ? ` · ${sub.recurrence}` : ''}
                          {sub.payment_mode ? ` · ${sub.payment_mode}` : ''}
                        </Typography>

                        {/* Billing period */}
                        {(sub.billing_period_start || sub.billing_period_end) && (
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 0.75 }}>
                            <CalendarTodayIcon sx={{ fontSize: 11, color: '#94a3b8' }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {formatDate(sub.billing_period_start)} – {formatDate(sub.billing_period_end)}
                            </Typography>
                          </Box>
                        )}

                        {/* Covered profiles */}
                        {sub.covered_profiles && sub.covered_profiles.length > 0 && (
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 0.75, mb: 1.25 }}>
                            <PersonIcon sx={{ fontSize: 11, color: '#94a3b8', mt: '2px' }} />
                            <Typography sx={{ fontSize: '0.72rem', color: '#64748b' }}>
                              {sub.covered_profiles.map(p => `${p.name} (${p.role})`).join(', ')}
                            </Typography>
                          </Box>
                        )}

                        {/* Amount + optional discount */}
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 1.25, borderTop: '1px dashed #e2e8f0' }}>
                          {sub.discount_amount ? (
                            <Typography sx={{ fontSize: '0.72rem', color: '#16a34a', fontWeight: 600 }}>
                              −${Number(sub.discount_amount).toFixed(2)}
                              {sub.discount_percentage ? ` (${sub.discount_percentage}%)` : ''}
                            </Typography>
                          ) : <Box />}
                          <Typography variant="body2" fontWeight={800} sx={{ color: '#0f172a' }}>
                            ${Number(sub.total_amount).toFixed(2)}
                          </Typography>
                        </Box>
                      </Box>
                    );
                  })}
                </Box>
              </Box>
            )}

            {subs.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 1 }}>
                Payment for Invoice #{linkDetails?.invoice_no}
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── RIGHT: Payment Form ──────────────────────────────────────────── */}
        <Box sx={{ flex: 1, width: '100%' }}>
          <Box sx={cardSx}>
            <Typography variant="subtitle1" fontWeight={800} sx={{ color: '#0f172a', mb: 2.5 }}>
              Payment Details
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2.5, borderRadius: 2 }}>{error}</Alert>
            )}

            <Box component="form" onSubmit={handlePay} noValidate>

              {/* ── Saved Cards ─────────────────────────────────────── */}
              {hasSavedCards && (
                <Box sx={{ mb: 3 }}>
                  <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, mb: 1.5 }}>
                    Select Payment Method
                  </Typography>

                  <RadioGroup value={paymentMode} onChange={(e) => setPaymentMode(e.target.value as 'saved' | 'new')}>
                    {/* Saved card option */}
                    <Box
                      sx={{
                        border: paymentMode === 'saved' ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        p: 1.5,
                        mb: 1.5,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                        bgcolor: paymentMode === 'saved' ? '#eff6ff' : 'white',
                      }}
                      onClick={() => setPaymentMode('saved')}
                    >
                      <FormControlLabel
                        value="saved"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2" fontWeight={700}>Saved Card</Typography>}
                        sx={{ m: 0 }}
                      />

                      {paymentMode === 'saved' && (
                        <Box sx={{ mt: 1.5, pl: 3.5 }}>
                          <RadioGroup value={selectedMethodId} onChange={(e) => setSelectedMethodId(e.target.value)}>
                            {linkDetails!.saved_methods.map(method => (
                              <Paper
                                key={method.id}
                                variant="outlined"
                                onClick={(ev) => { ev.stopPropagation(); setSelectedMethodId(method.id); }}
                                sx={{
                                  mb: 1, p: 1.25, display: 'flex', alignItems: 'center',
                                  borderRadius: '10px', cursor: 'pointer',
                                  border: selectedMethodId === method.id ? '2px solid #3b82f6' : '1px solid #e2e8f0',
                                  bgcolor: selectedMethodId === method.id ? '#dbeafe' : '#fafbfc',
                                  transition: 'all 0.12s',
                                  '&:hover': { borderColor: '#93c5fd' },
                                }}
                              >
                                <Radio size="small" value={method.id} checked={selectedMethodId === method.id} sx={{ p: 0.5, mr: 1 }} />
                                <CreditCardIcon sx={{ fontSize: 18, color: '#64748b', mr: 1 }} />
                                <Box>
                                  <Typography variant="body2" fontWeight={700}>{method.brand} •••• {method.last4}</Typography>
                                  <Typography variant="caption" color="text.secondary">Expires {method.expiry}</Typography>
                                </Box>
                              </Paper>
                            ))}
                          </RadioGroup>
                        </Box>
                      )}
                    </Box>

                    {/* Different card option */}
                    <Box
                      sx={{
                        border: paymentMode === 'new' ? '2px solid #3b82f6' : '1.5px solid #e2e8f0',
                        borderRadius: '12px',
                        p: 1.5,
                        cursor: 'pointer',
                        transition: 'border-color 0.15s',
                        bgcolor: paymentMode === 'new' ? '#eff6ff' : 'white',
                      }}
                      onClick={() => setPaymentMode('new')}
                    >
                      <FormControlLabel
                        value="new"
                        control={<Radio size="small" />}
                        label={<Typography variant="body2" fontWeight={700}>Use a Different Card</Typography>}
                        sx={{ m: 0 }}
                      />
                    </Box>
                  </RadioGroup>
                </Box>
              )}

              {/* ── Card Input Fields ───────────────────────────────── */}
              {paymentMode === 'new' && (
                <Box sx={{ mt: hasSavedCards ? 2.5 : 0 }}>
                  {!hasSavedCards && (
                    <Typography sx={{ fontSize: '0.65rem', fontWeight: 800, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: 1.5, mb: 1.5 }}>
                      Card Details
                    </Typography>
                  )}

                  {/* Card Number — full width */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Card Number"
                    value={cardNumber}
                    onChange={(e) => setCardNumber(e.target.value)}
                    disabled={processing}
                    required
                    placeholder="1234 5678 9012 3456"
                    inputProps={{ inputMode: 'numeric', maxLength: 19 }}
                    InputProps={{ startAdornment: <CreditCardIcon color="action" sx={{ mr: 1, fontSize: 18 }} /> }}
                    sx={{ mb: 2, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />

                  {/* MM/YY + CVV — side by side */}
                  <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                    <TextField
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      size="small"
                      label="Expiry (MM/YY)"
                      value={expiry}
                      onChange={(e) => setExpiry(e.target.value)}
                      disabled={processing}
                      required
                      placeholder="MM/YY"
                      inputProps={{ maxLength: 5 }}
                    />
                    <TextField
                      sx={{ flex: 1, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                      size="small"
                      label="CVV"
                      value={cvv}
                      onChange={(e) => setCvv(e.target.value)}
                      disabled={processing}
                      required
                      type="password"
                      placeholder="•••"
                      inputProps={{ maxLength: 4 }}
                    />
                  </Box>

                  {/* Cardholder Name — full width */}
                  <TextField
                    fullWidth
                    size="small"
                    label="Name on Card"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    disabled={processing}
                    required
                    placeholder="Jane Doe"
                    sx={{ mb: 0, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
                  />
                </Box>
              )}

              {/* ── Pay Button ──────────────────────────────────────── */}
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={processing}
                sx={{
                  mt: 3,
                  py: { xs: 1.6, sm: 1.75 },
                  fontSize: { xs: '1rem', sm: '1.05rem' },
                  fontWeight: 800,
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #3b82f6 0%, #2563eb 100%)',
                  boxShadow: '0 4px 18px rgba(59,130,246,0.4)',
                  textTransform: 'none',
                  letterSpacing: 0,
                  transition: 'all 0.2s ease',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                    boxShadow: '0 6px 24px rgba(59,130,246,0.5)',
                    transform: 'translateY(-1px)',
                  },
                  '&:active': { transform: 'translateY(0)' },
                  '&.Mui-disabled': { opacity: 0.7 },
                }}
              >
                {processing
                  ? <><CircularProgress size={20} color="inherit" sx={{ mr: 1.5 }} />Processing…</>
                  : `Pay $${Number(linkDetails?.amount_to_be_paid || 0).toFixed(2)}`
                }
              </Button>

              {/* Security note */}
              <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 0.75 }}>
                <LockIcon sx={{ fontSize: 13, color: '#94a3b8' }} />
                <Typography sx={{ fontSize: '0.72rem', color: '#94a3b8' }}>
                  256-bit SSL encrypted · Payments processed securely
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* Footer */}
      <Typography sx={{ mt: 4, fontSize: '0.72rem', color: '#94a3b8', textAlign: 'center', pb: 2 }}>
        © {linkDetails?.location_name} · Secure payment
      </Typography>
    </PageWrapper>
  );
};
