import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  Box,
  CircularProgress,
  Stack,
  Paper,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import IconButton from '@mui/material/IconButton';
import EmailIcon from '@mui/icons-material/Email';
import PaymentsIcon from '@mui/icons-material/Payments';
import { billingService } from '../../services/billingService';
import { useAuth } from '../../context/AuthContext';
import { EmailComposer } from '../Email/EmailComposer';
import { emailService } from '../../services/emailService';
import { serviceCatalog } from '../../services/serviceCatalog';
import { membershipService } from '../../services/membershipService';
import { basePriceService } from '../../services/basePriceService';
import { useConfig } from '../../context/ConfigContext';
import { getAgeGroupName } from '../../lib/ageUtils';
import { configService } from '../../services/configService';

interface InvoicePreviewModalProps {
  open: boolean;
  onClose: () => void;
  invoiceId: string;
  accountId: string;
}

export const InvoicePreviewModal = ({ open, onClose, invoiceId, accountId }: InvoicePreviewModalProps) => {
  const { currentLocationId } = useAuth();
  const { ageGroups } = useConfig();
  const [invoice, setInvoice] = useState<any>(null);
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [servicePacks, setServicePacks] = useState<Record<string, any>>({});
  const [membershipDetails, setMembershipDetails] = useState<Record<string, any>>({});
  const [basePrices, setBasePrices] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [location, setLocation] = useState<any>(null);
  const [openEmailComposer, setOpenEmailComposer] = useState(false);
  const [emailDraft, setEmailDraft] = useState<any>(null);
  const [preparingEmail, setPreparingEmail] = useState(false);

  useEffect(() => {
    const fetchInvoiceDetails = async () => {
      setLoading(true);
      setError(null);
      try {
        // 0. Fetch Location details
        if (currentLocationId) {
          try {
            const locsRes: any = await configService.getLocations();
            const locs = locsRes?.data || locsRes || [];
            const currentLoc = locs.find((l: any) => l.location_id === currentLocationId);
            setLocation(currentLoc);
          } catch (err) {}
        }

        // 1. Fetch Invoice
        const invRes: any = await billingService.getInvoice(invoiceId);
        const invData = invRes?.data || invRes;
        if (!invData) throw new Error('Invoice not found');
        setInvoice(invData);

        // 2. Fetch Subscriptions to find items linked to this invoice
        const subsRes: any = await billingService.getAccountSubscriptions(accountId, currentLocationId || undefined);
        const subsData = subsRes?.data || subsRes || [];
        
        // Filter subscriptions where invoice_id matches
        const linkedSubs = subsData.filter((sub: any) => sub.invoice_id === invoiceId);
        
        // 3. Fetch enrichment details
        const packs: Record<string, any> = {};
        const memberships: Record<string, any> = {};
        const bPrices: Record<string, any> = {};

        await Promise.all(linkedSubs.map(async (sub: any) => {
          if (sub.subscription_type === 'SERVICE' && sub.reference_id) {
            try {
              const packRes = await serviceCatalog.getServicePack(sub.reference_id, currentLocationId || undefined);
              packs[sub.subscription_id] = packRes.data || packRes;
            } catch (err) {}
          } else if (sub.subscription_type === 'MEMBERSHIP_FEE' && sub.reference_id) {
            try {
               const bpRes = await basePriceService.getBasePrice(sub.reference_id, currentLocationId || undefined);
               bPrices[sub.subscription_id] = bpRes;
            } catch (err) {}
          } else if (sub.subscription_type.startsWith('MEMBERSHIP') && sub.reference_id) {
             try {
                const mpData = await membershipService.getMemberships(currentLocationId || '');
                const cat = mpData.flatMap((p: any) => p.categories || []).find((c: any) => c.category_id === sub.reference_id);
                if (cat) memberships[sub.subscription_id] = cat;
             } catch (err) {}
          }
        }));

        setServicePacks(packs);
        setMembershipDetails(memberships);
        setBasePrices(bPrices);
        setSubscriptions(linkedSubs);

      } catch (err: any) {
        console.error('Failed to load invoice details:', err);
        setError('Failed to load invoice details.');
      } finally {
        setLoading(false);
      }
    };

    if (open && invoiceId) {
      fetchInvoiceDetails();
    }
  }, [open, invoiceId, accountId, currentLocationId]);

  const handleSendNormalInvoiceEmail = async () => {
    setPreparingEmail(true);
    try {
      // Create PDF Attachment
      const { createInvoicePdfAttachment } = await import('../../utils/invoicePdf');
      const pdfFile = await createInvoicePdfAttachment(
        invoice,
        subscriptions,
        location,
        ageGroups,
        servicePacks,
        membershipDetails,
        basePrices
      );

      // Find template
      const templates = await emailService.getTemplates(currentLocationId || '');
      const template = templates.find((t: any) => 
        t.subject?.toLowerCase().includes('payment request') || 
        t.template_name?.toLowerCase().includes('payment request')
      );
      
      let subject = 'Invoice Payment Request';
      let body = `Hello,\n\nPlease find the attached invoice for your recent purchase at ${location?.name || 'Solar Swim'}.\n\nTotal Amount Due: $${invoice?.total_amount}\n\nYou can review the details in the attached PDF file.\n\nThank you!`;
      let templateId = undefined;

      if (template) {
        subject = template.subject;
        body = template.body_content;
        templateId = template.email_template_id;
      }

      setEmailDraft({
        to: '', 
        subject,
        body,
        templateId,
        accountId: accountId || '',
        attachments: [pdfFile]
      });
      setOpenEmailComposer(true);
    } catch (err) {
      console.error('Failed to prepare email:', err);
      alert('Failed to prepare email draft');
    } finally {
      setPreparingEmail(false);
    }
  };

  const statusColors: any = {
    'DRAFT': 'warning',
    'PENDING': 'warning',
    'PAID': 'success',
    'PARTIAL': 'info',
    'FAILED': 'error'
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, m: 2 } }}>
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', borderBottom: '1px solid #e2e8f0', px: 3, py: 2 }}>
        <Typography variant="h6" fontWeight={800}>Invoice Preview</Typography>
        <IconButton onClick={onClose} size="small"><CloseIcon /></IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 4 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
        ) : error ? (
          <Typography color="error" align="center">{error}</Typography>
        ) : invoice ? (
          <Stack spacing={4}>
            {/* Professional Receipt Header */}
            <Box display="flex" justifyContent="space-between" alignItems="flex-start" sx={{ pb: 3, borderBottom: '2px solid #f1f5f9' }}>
              <Box>
                <Typography variant="h5" fontWeight={900} color="primary.main" gutterBottom>
                  {location?.name || 'SOLAR SWIM'}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ maxWidth: 250 }}>
                  {location?.address || 'Location Address'}
                </Typography>
                <Typography variant="caption" color="text.disabled" sx={{ mt: 1, display: 'block' }}>
                  support@solarswim.com
                </Typography>
              </Box>
              <Box textAlign="right">
                <Typography variant="h6" fontWeight={800} color="text.primary" textTransform="uppercase">
                  Invoice
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  #{invoice.invoice_id?.substring(0, 8)}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A'}
                </Typography>
                <Chip 
                  label={invoice.status || 'PENDING'} 
                  color={statusColors[invoice.status || 'PENDING']} 
                  size="small"
                  sx={{ fontWeight: 800, borderRadius: 1, mt: 1 }} 
                />
              </Box>
            </Box>

            {/* Summary Highlights */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#f8fafc', p: 3, borderRadius: 3 }}>
               <Box>
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">Amount Due</Typography>
                  <Typography variant="h4" fontWeight={900} color="primary.dark">
                    ${Number(invoice.total_amount || 0).toFixed(2)}
                  </Typography>
               </Box>
               <Box textAlign="right">
                  <Typography variant="caption" color="text.secondary" fontWeight={700} textTransform="uppercase">Billed To</Typography>
                  <Typography variant="body1" fontWeight={700}>Account ID: {invoice.account_id?.substring(0,8)}...</Typography>
               </Box>
            </Box>

            {/* Line Items */}
            <Box>
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary" textTransform="uppercase" gutterBottom sx={{ px: 1 }}>
                Line Items
              </Typography>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, overflow: 'hidden' }}>
                <Table size="small">
                  <TableHead sx={{ bgcolor: '#f8fafc' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase', minWidth: 200 }}>Item Details</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Coverage</TableCell>
                      <TableCell sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Period</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Unit Price</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Discount</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: 'text.secondary', textTransform: 'uppercase' }}>Total</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {subscriptions.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3 }}>
                          <Typography variant="body2" color="text.secondary">No subscription items linked to this invoice.</Typography>
                        </TableCell>
                      </TableRow>
                    ) : (
                      subscriptions.map((sub, idx) => {
                        const unitPrice = Number(sub.actual_total_amount || sub.unit_price_snapshot || sub.total_amount || 0);
                        const discount = Number(sub.discount_amount || 0);
                        const total = Number(sub.total_amount || 0);
                        const pack = servicePacks[sub.subscription_id];
                        const mem = membershipDetails[sub.subscription_id];
                        const bp = basePrices[sub.subscription_id];
                        const coverage = sub.subscription_coverage || sub.coverage || [];
                        
                        return (
                          <TableRow key={sub.subscription_id || idx} hover>
                            <TableCell>
                              {pack?.service?.name && (
                                <Typography variant="caption" color="primary.main" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                                  {pack.service.name}
                                </Typography>
                              )}
                              {bp && (
                                <Typography variant="caption" color="primary.main" fontWeight={800} sx={{ textTransform: 'uppercase', fontSize: '0.65rem', display: 'block' }}>
                                  MEMBERSHIP
                                </Typography>
                              )}
                              <Typography variant="body2" fontWeight={700}>
                                {pack?.name || mem?.name || bp?.name || sub.pricing_plan?.name || sub.subscription_type}
                              </Typography>
                              {sub.discount_code && (
                                <Box mt={0.5}>
                                  <Chip label={`Code: ${sub.discount_code}`} size="small" variant="outlined" color="primary" sx={{ height: 18, fontSize: '0.6rem' }} />
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                                <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                                    {coverage.length > 0 ? (
                                        coverage.map((c: any) => (
                                            <Chip 
                                                key={c.profile_id} 
                                                label={`${c.profile?.first_name || 'Member'} (${getAgeGroupName(c.profile?.date_of_birth, ageGroups)})`} 
                                                size="small"
                                                variant="outlined"
                                                sx={{ fontSize: '0.6rem', height: '18px' }}
                                            />
                                        ))
                                    ) : (
                                        <Typography variant="caption" color="text.disabled">No coverage</Typography>
                                    )}
                                </Box>
                            </TableCell>
                            <TableCell>
                                {sub.billing_period_start ? (
                                    <Typography variant="caption" color="text.secondary" sx={{ whiteSpace: 'nowrap' }}>
                                        {new Date(sub.billing_period_start).toLocaleDateString()} - <br/> {new Date(sub.billing_period_end!).toLocaleDateString()}
                                    </Typography>
                                ) : (
                                    <Typography variant="caption" color="text.disabled">N/A</Typography>
                                )}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600 }}>${unitPrice.toFixed(2)}</TableCell>
                            <TableCell align="right" sx={{ fontWeight: 600, color: discount > 0 ? 'success.main' : 'inherit' }}>
                              {discount > 0 ? `-$${discount.toFixed(2)}` : '-'}
                            </TableCell>
                            <TableCell align="right" sx={{ fontWeight: 800 }}>${total.toFixed(2)}</TableCell>
                          </TableRow>
                        );
                      })
                    )}
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell colSpan={5} sx={{ borderBottom: 'none' }}>
                        <Typography variant="subtitle2" fontWeight={800} align="right" textTransform="uppercase">Amount Due</Typography>
                      </TableCell>
                      <TableCell align="right" sx={{ borderBottom: 'none' }}>
                        <Typography variant="subtitle2" fontWeight={800} color="primary.main">${Number(invoice.total_amount || 0).toFixed(2)}</Typography>
                      </TableCell>
                    </TableRow>
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>

            {/* Actions Area internal to modal display */}
            <Box sx={{ borderTop: '2px solid #f1f5f9', pt: 3 }}>
              <Typography variant="subtitle2" fontWeight={800} color="text.secondary" textTransform="uppercase" gutterBottom sx={{ px: 1 }}>
                Quick Actions
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
                <Button 
                  variant="contained" 
                  startIcon={<EmailIcon />} 
                  onClick={handleSendNormalInvoiceEmail}
                  disabled={preparingEmail}
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700, boxShadow: 'none' }}
                >
                  {preparingEmail ? 'Generating PDF...' : 'Email Invoice as PDF'}
                </Button>
                <Button 
                  variant="outlined" 
                  startIcon={<PaymentsIcon />} 
                  disabled 
                  fullWidth
                  sx={{ py: 1.5, borderRadius: 2, fontWeight: 700 }}
                >
                  Send Payment Link
                </Button>
              </Stack>
            </Box>
          </Stack>
        ) : null}
      </DialogContent>

      {/* Main Footer Actions */}
      <DialogActions sx={{ p: 3, bgcolor: '#f8fafc', borderTop: '1px solid #e2e8f0' }}>
        <Button onClick={onClose} sx={{ fontWeight: 600, color: 'text.secondary' }}>
          Pay Later
        </Button>
        <Button variant="contained" disabled sx={{ fontWeight: 700, borderRadius: 2 }}>
          Proceed with Payment
        </Button>
      </DialogActions>

      {/* Email Composer Nested Dialog */}
      <Dialog open={openEmailComposer} onClose={() => setOpenEmailComposer(false)} maxWidth="md" fullWidth>
        <DialogContent>
          {emailDraft && (
            <EmailComposer
                onClose={() => setOpenEmailComposer(false)}
                onSuccess={() => {
                  setOpenEmailComposer(false);
                  alert('Email sent successfully!');
                }}
                initialTo={emailDraft.to}
                initialSubject={emailDraft.subject}
                initialBody={emailDraft.body}
                initialTemplateId={emailDraft.templateId}
                initialAccountId={emailDraft.accountId}
                initialAttachments={emailDraft.attachments}
            />
          )}
        </DialogContent>
      </Dialog>
    </Dialog>
  );
};
