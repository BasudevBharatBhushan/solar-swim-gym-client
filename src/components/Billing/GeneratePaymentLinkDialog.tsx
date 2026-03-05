import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  Box,
  Alert,
  CircularProgress,
  InputAdornment,
  Grid
} from '@mui/material';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import EmailIcon from '@mui/icons-material/Email';
import { paymentLinkService } from '../../services/paymentLinkService';
import { emailService } from '../../services/emailService';
import { useAuth } from '../../context/AuthContext';
import { EmailComposer } from '../Email/EmailComposer';

interface GeneratePaymentLinkDialogProps {
  open: boolean;
  onClose: () => void;
  invoice: any;
}

export const GeneratePaymentLinkDialog = ({ open, onClose, invoice }: GeneratePaymentLinkDialogProps) => {
  const { currentLocationId } = useAuth();
  const [amountToPay, setAmountToPay] = useState<string>('');
  const [expiresInDays, setExpiresInDays] = useState<number>(7);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);
  
  // View states: 'generate' -> 'email'
  const [view, setView] = useState<'generate' | 'email'>('generate');
  
  // Preload for EmailComposer
  const [emailTo, setEmailTo] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');

  const maxAmount = Number(invoice?.amount_due ?? invoice?.AmountDue ?? invoice?.total_amount ?? 0);

  useEffect(() => {
    if (open && invoice) {
      setAmountToPay(maxAmount.toFixed(2));
      setExpiresInDays(7);
      setError(null);
      setGeneratedLink(null);
      setView('generate');
      
      const defaultEmail = invoice.email || invoice.primary_profile_email || '';
      setEmailTo(defaultEmail);
    }
  }, [open, invoice, maxAmount]);

  const handleGenerate = async (onSuccess: (url: string) => void) => {
    if (!invoice?.invoice_id || !invoice?.account_id) {
        setError('Missing invoice or account ID.');
        return;
    }

    const numAmount = parseFloat(amountToPay);
    if (isNaN(numAmount) || numAmount <= 0) {
      setError('Please enter a valid amount.');
      return;
    }
    if (numAmount > maxAmount) {
      setError(`Amount cannot exceed the total due ($${maxAmount.toFixed(2)}).`);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const response = await paymentLinkService.generatePaymentLink({
        invoice_id: invoice.invoice_id,
        account_id: invoice.account_id,
        amount_to_be_paid: numAmount,
        expires_in_days: expiresInDays
      });
      
      const paymentUrl = `${window.location.origin}/public/pay/${response.token}`;
      setGeneratedLink(paymentUrl);
      onSuccess(paymentUrl);
    } catch (err: any) {
      console.error('Failed to generate payment link:', err);
      setError(err.response?.data?.error || err.message || 'Failed to generate payment link.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAndCopy = () => {
    handleGenerate((url) => {
      navigator.clipboard.writeText(url);
    });
  };

  const handleGenerateAndEmail = async () => {
    await handleGenerate(async (url) => {
      const formattedAmount = `$${parseFloat(amountToPay).toFixed(2)}`;
      const invoiceNo = invoice.invoice_no || invoice.invoice_id.substring(0, 8);
      const customerName = invoice.primary_profile_name || invoice.account_name || 'Valued Customer';
      const paymentDate = new Date().toLocaleDateString();
      const paymentMethod = 'Online Payment (Credit Card / ACH)';

      let subject = `Payment Request for Invoice #${invoiceNo}`;
      let body = `
        <div style="font-family: sans-serif; color: #333;">
          <p>Hello,</p>
          <p>Please find the secure payment link for your invoice below:</p>
          <p>
            <a href="${url}" style="display: inline-block; padding: 10px 20px; background-color: #7c3aed; color: white; text-decoration: none; border-radius: 5px; font-weight: bold;">
              Pay Invoice #${invoiceNo}
            </a>
          </p>
          <p style="word-break: break-all;"><a href="${url}">${url}</a></p>
          <p><strong>Total Amount Due: ${formattedAmount}</strong></p>
          <p>Thank you!</p>
        </div>
      `;

      if (currentLocationId) {
        setLoading(true);
        try {
          const templates = await emailService.getTemplates(currentLocationId);
          const targetSubject = 'Payment Request – Complete Your Payment for Glass Court Swim & Fitness';
          const template = templates.find(t => t.subject === targetSubject);

          if (template) {
            subject = template.subject;
            let content = template.body_content || '';

            // Replace variables
            content = content
              .replace(/\[fullname\]/gi, customerName)
              .replace(/\[invoice_number\]/gi, invoiceNo)
              .replace(/\[amount\]/gi, formattedAmount)
              .replace(/\[payment_date\]/gi, paymentDate)
              .replace(/\[payment_method\]/gi, paymentMethod);

            // If no link is in the template, append it
            if (!content.includes(url)) {
              content = `${content}<br/><br/><strong>Secure Payment Link:</strong> <a href="${url}">${url}</a>`;
            }

            body = content;
          }
        } catch (err) {
          console.warn('Failed to fetch email templates, using default message', err);
        } finally {
          setLoading(false);
        }
      }

      setEmailSubject(subject);
      setEmailBody(body);
      setView('email');
    });
  };

  if (!open || !invoice) return null;

  return (
    <Dialog open={open} onClose={() => !loading && onClose()} maxWidth="sm" fullWidth>
      {view === 'generate' ? (
        <>
          <DialogTitle sx={{ fontWeight: 800 }}>Generate Payment Link</DialogTitle>
          <DialogContent>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
              <Typography variant="body2" color="text.secondary">
                Generate a secure, public payment link for Invoice #{invoice.invoice_no || invoice.invoice_id.substring(0, 8)}.
              </Typography>
              
              {error && <Alert severity="error">{error}</Alert>}
              
              {generatedLink && (
                 <Alert severity="success" sx={{ wordBreak: 'break-all' }}>
                   Link generated: <a href={generatedLink} target="_blank" rel="noreferrer">{generatedLink}</a>
                 </Alert>
              )}

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Amount to Pay"
                    type="number"
                    value={amountToPay}
                    onChange={(e) => setAmountToPay(e.target.value)}
                    disabled={loading || !!generatedLink}
                    InputProps={{
                      startAdornment: <InputAdornment position="start">$</InputAdornment>,
                    }}
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    Max allowed: ${maxAmount.toFixed(2)}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Expiry (Days)"
                    type="number"
                    value={expiresInDays}
                    onChange={(e) => setExpiresInDays(parseInt(e.target.value, 10))}
                    disabled={loading || !!generatedLink}
                    inputProps={{ min: 1, max: 30 }}
                  />
                </Grid>
              </Grid>
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2.5, px: 3, gap: 1 }}>
            <Button onClick={onClose} disabled={loading} color="inherit">
              {generatedLink ? 'Close' : 'Cancel'}
            </Button>
            {!generatedLink ? (
              <>
                <Button 
                  onClick={handleGenerateAndCopy}
                  disabled={loading}
                  variant="outlined"
                  startIcon={loading ? <CircularProgress size={20} /> : <ContentCopyIcon />}
                >
                  Generate & Copy
                </Button>
                <Button 
                  onClick={handleGenerateAndEmail}
                  disabled={loading}
                  variant="contained"
                  color="primary"
                  startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EmailIcon />}
                >
                  Generate & Email
                </Button>
              </>
            ) : (
                <Button 
                  onClick={() => navigator.clipboard.writeText(generatedLink)}
                  variant="contained"
                  startIcon={<ContentCopyIcon />}
                >
                  Copy Again
                </Button>
            )}
          </DialogActions>
        </>
      ) : (
        <Box sx={{ p: 0 }}>
             <EmailComposer
                onClose={onClose}
                onSuccess={onClose}
                initialTo={emailTo}
                initialSubject={emailSubject}
                initialBody={emailBody}
                initialAccountId={invoice.account_id}
             />
        </Box>
      )}
    </Dialog>
  );
};
