import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormControlLabel,
  Switch,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  IconButton,
  Tabs,
  Tab,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import EditNoteIcon from '@mui/icons-material/EditNote';
import PriceChangeIcon from '@mui/icons-material/PriceChange';
import TuneIcon from '@mui/icons-material/Tune';
import { ManagerPasscodeDialog } from '../../../components/Common/ManagerPasscodeDialog';
import { billingService } from '../../../services/billingService';
import { useAuth } from '../../../context/AuthContext';

interface SubscriptionManageDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  subscription: any;
}

const STATUS_OPTIONS = ['ACTIVE', 'PAUSED', 'CANCELLED'] as const;

const getStatusColor = (status: string) => {
  switch (status) {
    case 'ACTIVE': return 'success';
    case 'PAUSED': return 'warning';
    case 'CANCELLED': return 'error';
    default: return 'default';
  }
};

export const SubscriptionManageDialog = ({
  open,
  onClose,
  onSuccess,
  subscription,
}: SubscriptionManageDialogProps) => {
  const { currentLocationId, loginId } = useAuth();

  // Which tab: 0 = Lifecycle/Status, 1 = Pricing
  const [activeTab, setActiveTab] = useState(0);

  // -- Lifecycle fields --
  const [newStatus, setNewStatus] = useState<string>(subscription?.status || 'ACTIVE');
  const [autoRenew, setAutoRenew] = useState<boolean>(subscription?.auto_renew ?? true);

  // -- Pricing fields --
  const [unitPrice, setUnitPrice] = useState<string>(
    subscription?.unit_price_snapshot != null ? String(subscription.unit_price_snapshot) : ''
  );
  const [totalAmount, setTotalAmount] = useState<string>(
    subscription?.total_amount != null ? String(subscription.total_amount) : ''
  );
  const [nextRenewalDate, setNextRenewalDate] = useState<string>(
    subscription?.next_renewal_date
      ? subscription.next_renewal_date.substring(0, 10)
      : ''
  );

  // Flow state
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleRequestPasscode = () => {
    setError(null);
    setSuccess(null);
    setPasscodeOpen(true);
  };

  const handlePasscodeSuccess = async () => {
    setPasscodeOpen(false);
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      if (activeTab === 0) {
        // PATCH /billing/subscriptions/:id  — lifecycle
        await billingService.patchSubscription(
          subscription.subscription_id,
          {
            status: newStatus as 'ACTIVE' | 'PAUSED' | 'CANCELLED',
            auto_renew: autoRenew,
            staff_id: loginId || undefined,
          },
          currentLocationId || undefined
        );
        setSuccess('Subscription lifecycle updated successfully.');
      } else {
        // PATCH /billing/subscriptions/:id/pricing  — pricing
        const payload: { unit_price_snapshot?: number; total_amount?: number; next_renewal_date?: string } = {};
        if (unitPrice.trim() !== '') payload.unit_price_snapshot = parseFloat(unitPrice);
        if (totalAmount.trim() !== '') payload.total_amount = parseFloat(totalAmount);
        if (nextRenewalDate.trim() !== '') payload.next_renewal_date = nextRenewalDate;

        await billingService.patchSubscriptionPricing(
          subscription.subscription_id,
          payload,
          currentLocationId || undefined
        );
        setSuccess('Subscription pricing updated successfully.');
      }
      onSuccess();
    } catch (err: any) {
      console.error('Failed to update subscription', err);
      setError(err?.response?.data?.error || err?.message || 'Failed to update subscription.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setError(null);
    setSuccess(null);
    onClose();
  };

  if (!subscription) return null;

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: { borderRadius: 3, overflow: 'hidden' }
        }}
      >
        {/* Header */}
        <DialogTitle
          sx={{
            m: 0,
            p: 0,
            background: '#ffffff',
            color: '#1e293b',
            borderBottom: '1px solid #e2e8f0',
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', px: 3, py: 2.5 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: '#eff6ff', p: 1, borderRadius: 2, display: 'flex', color: '#3b82f6' }}>
                <TuneIcon sx={{ fontSize: '1.4rem' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} sx={{ lineHeight: 1.2, color: '#0f172a' }}>
                  Manage Subscription
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
                  {subscription.plan_name || 'Membership Plan'}
                </Typography>
                <Typography variant="caption" sx={{ color: '#94a3b8', fontFamily: 'monospace' }}>
                  ID: {subscription.subscription_id?.substring(0, 8)}...
                </Typography>
              </Box>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Chip
                label={subscription.status}
                size="small"
                color={getStatusColor(subscription.status) as any}
                sx={{ 
                  fontWeight: 800, 
                  fontSize: '0.7rem',
                  textTransform: 'uppercase',
                  height: 24
                }}
              />
              <IconButton onClick={handleClose} size="small" sx={{ color: '#94a3b8', '&:hover': { color: '#64748b', bgcolor: '#f1f5f9' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>
          </Box>

          {/* Sub-tabs */}
          <Tabs
            value={activeTab}
            onChange={(_, v) => { setActiveTab(v); setError(null); setSuccess(null); }}
            sx={{
              px: 3,
              bgcolor: '#f8fafc',
              '& .MuiTab-root': {
                color: '#64748b',
                fontWeight: 700,
                fontSize: '0.85rem',
                textTransform: 'none',
                minHeight: 48,
                transition: 'all 0.2s',
                '&.Mui-selected': { color: '#3b82f6' },
                '&:hover': { color: '#334155' }
              },
              '& .MuiTabs-indicator': { bgcolor: '#3b82f6', height: 3, borderRadius: '3px 3px 0 0' },
            }}
          >
            <Tab icon={<EditNoteIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Lifecycle / Status" />
            <Tab icon={<PriceChangeIcon sx={{ fontSize: '1.1rem' }} />} iconPosition="start" label="Pricing Override" />
          </Tabs>
        </DialogTitle>

        <DialogContent sx={{ p: 3, pt: 4 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 3, borderRadius: 2, fontWeight: 500 }}>
              {success}
            </Alert>
          )}

          {/* ── Tab 0: Lifecycle ── */}
          {activeTab === 0 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, mt: 1 }}>
              <Box>
                <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1.5 }}>
                  Current Status
                </Typography>
                <Chip 
                  label={subscription.status} 
                  color={getStatusColor(subscription.status) as any} 
                  sx={{ fontWeight: 800, px: 1 }} 
                />
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <FormControl fullWidth>
                <InputLabel sx={{ fontWeight: 600 }}>New Status</InputLabel>
                <Select
                  value={newStatus}
                  label="New Status"
                  onChange={(e) => setNewStatus(e.target.value)}
                  sx={{ 
                    borderRadius: 2.5,
                    fontWeight: 600,
                    '& .MuiOutlinedInput-notchedOutline': { borderColor: '#e2e8f0' }
                  }}
                >
                  {STATUS_OPTIONS.map((s) => (
                    <MenuItem key={s} value={s}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                        <Chip 
                          label={s} 
                          size="small" 
                          color={getStatusColor(s) as any} 
                          sx={{ fontWeight: 800, fontSize: '0.7rem', height: 22 }} 
                        />
                        {s === subscription.status && (
                          <Typography variant="caption" sx={{ color: '#94a3b8', fontStyle: 'italic' }}>
                            (Current)
                          </Typography>
                        )}
                      </Box>
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Box sx={{ 
                p: 2.5, 
                bgcolor: '#f1f5f9', 
                borderRadius: 3, 
                border: '1px solid #e2e8f0',
                position: 'relative',
                opacity: 0.8
              }}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={autoRenew}
                      onChange={(e) => setAutoRenew(e.target.checked)}
                      color="primary"
                      disabled={true} // Disabled as requested
                    />
                  }
                  label={
                    <Box sx={{ ml: 1 }}>
                      <Typography variant="body2" fontWeight={800} color="#334155">
                        Auto-Renew
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.25 }}>
                        Toggle automatic billing at the end of each term.
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 700, mt: 0.5, display: 'block' }}>
                        Note: This feature will be added soon.
                      </Typography>
                    </Box>
                  }
                />
              </Box>

              <Alert severity="warning" variant="outlined" sx={{ borderRadius: 3, bgcolor: '#fffbeb', border: '1px solid #fde68a' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#92400e' }}>
                  Changing status to <strong>CANCELLED</strong> cannot be easily undone. Proceed with caution.
                </Typography>
              </Alert>
            </Box>
          )}

          {/* ── Tab 1: Pricing ── */}
          {activeTab === 1 && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3.5, mt: 1 }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                    Current Unit Price
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#3b82f6">
                    ${Number(subscription.unit_price_snapshot ?? 0).toFixed(2)}
                  </Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#f1f5f9', borderRadius: 2.5, border: '1px solid #e2e8f0' }}>
                  <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', mb: 1 }}>
                    Current Total
                  </Typography>
                  <Typography variant="h6" fontWeight={800} color="#0f172a">
                    ${Number(subscription.total_amount ?? 0).toFixed(2)}
                  </Typography>
                </Box>
              </Box>

              <Divider sx={{ borderStyle: 'dashed' }} />

              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                <TextField
                  label="Unit Price Snapshot ($)"
                  type="number"
                  fullWidth
                  value={unitPrice}
                  onChange={(e) => setUnitPrice(e.target.value)}
                  placeholder={String(subscription.unit_price_snapshot ?? '')}
                  inputProps={{ min: 0, step: '0.01' }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputLabel-root': { fontWeight: 600 }
                  }}
                  helperText="Override the per-unit price snapshot on this subscription."
                />

                <TextField
                  label="Total Amount ($)"
                  type="number"
                  fullWidth
                  value={totalAmount}
                  onChange={(e) => setTotalAmount(e.target.value)}
                  placeholder={String(subscription.total_amount ?? '')}
                  inputProps={{ min: 0, step: '0.01' }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputLabel-root': { fontWeight: 600 }
                  }}
                  helperText="Override the total billed amount for this term."
                />

                <TextField
                  label="Next Renewal Date"
                  type="date"
                  fullWidth
                  value={nextRenewalDate}
                  onChange={(e) => setNextRenewalDate(e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  sx={{ 
                    '& .MuiOutlinedInput-root': { borderRadius: 2.5 },
                    '& .MuiInputLabel-root': { fontWeight: 600 }
                  }}
                  helperText="Set or override the date this subscription next renews."
                />
              </Box>

              <Alert severity="info" variant="outlined" sx={{ borderRadius: 3, bgcolor: '#f0f9ff', border: '1px solid #bae6fd', fontSize: '0.85rem' }}>
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#0369a1' }}>
                  Leave any field <strong>blank</strong> to keep its current value unchanged. Only filled fields will be sent to the server.
                </Typography>
              </Alert>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, gap: 1.5 }}>
          <Button 
            onClick={handleClose} 
            disabled={loading} 
            sx={{ 
              fontWeight: 700, 
              textTransform: 'none', 
              color: '#64748b',
              px: 3,
              borderRadius: 2,
              '&:hover': { bgcolor: '#f1f5f9' }
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleRequestPasscode}
            variant="contained"
            disabled={loading}
            sx={{
              fontWeight: 800,
              textTransform: 'none',
              borderRadius: 2.5,
              px: 4,
              py: 1,
              background: 'linear-gradient(135deg, #3b82f6 0%, #6366f1 100%)',
              boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
              transition: 'all 0.2s',
              '&:hover': {
                background: 'linear-gradient(135deg, #2563eb 0%, #4f46e5 100%)',
                boxShadow: '0 6px 20px rgba(99,102,241,0.5)',
                transform: 'translateY(-1px)',
              },
              '&:active': {
                transform: 'translateY(0)',
              },
            }}
            startIcon={loading ? <CircularProgress size={16} sx={{ color: 'white' }} /> : undefined}
          >
            {loading ? 'Saving Changes…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Manager passcode gate */}
      <ManagerPasscodeDialog
        open={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onSuccess={handlePasscodeSuccess}
      />
    </>
  );
};
