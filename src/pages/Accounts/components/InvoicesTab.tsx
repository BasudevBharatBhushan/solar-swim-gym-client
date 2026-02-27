import { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  CircularProgress,
  Chip,
  TextField,
  InputAdornment,
  Collapse,
  IconButton,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { billingService } from '../../../services/billingService';
import { InvoicePreviewModal } from '../../../components/Billing/InvoicePreviewModal';
import { useAuth } from '../../../context/AuthContext';

interface InvoicesTabProps {
  accountId: string;
}

const getTxnStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return '#10b981';
    case 'DECLINED': return '#f59e0b';
    case 'FAILED': return '#ef4444';
    default: return '#94a3b8';
  }
};

const getTxnStatusBg = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'APPROVED': return '#f0fdf4';
    case 'DECLINED': return '#fffbeb';
    case 'FAILED': return '#fef2f2';
    default: return '#f8fafc';
  }
};

interface InvoiceRowProps {
  invoice: any;
  onOpen: (inv: any) => void;
}

const InvoiceRow = ({ invoice, onOpen }: InvoiceRowProps) => {
  const [open, setOpen] = useState(false);
  const hasTransactions = Array.isArray(invoice.payment_transactions) && invoice.payment_transactions.length > 0;

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'DRAFT':
      case 'PENDING': return 'warning';
      case 'PAID': return 'success';
      case 'PARTIAL': return 'info';
      case 'FAILED': return 'error';
      default: return 'default';
    }
  };

  return (
    <>
      <TableRow
        hover
        sx={{ cursor: 'pointer', '& > *': { borderBottom: open ? 'none' : undefined } }}
        onClick={() => onOpen({ id: invoice.invoice_id, paymentDetails: invoice.payment_details })}
      >
        <TableCell sx={{ width: 48 }} onClick={(e) => { e.stopPropagation(); setOpen(!open); }}>
          {hasTransactions ? (
            <IconButton size="small">
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          ) : null}
        </TableCell>
        <TableCell>
          {invoice.created_at
            ? new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            : 'N/A'}
        </TableCell>
        <TableCell>
          {invoice.payment_details ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CreditCardIcon sx={{ fontSize: '0.9rem', color: '#10b981' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#16a34a' }}>
                  XXXX-{invoice.payment_details.card_last4}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {invoice.payment_details.cardholder_name}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="text.secondary">
              {invoice.status === 'PAID' ? 'System Record' : 'No Payment Info'}
            </Typography>
          )}
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
            {invoice.invoice_id.substring(0, 8)}...
          </Typography>
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>
          ${Number(invoice.total_amount || 0).toFixed(2)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: 700,
            color:
              Number(invoice.AmountDue ?? (invoice.status === 'PAID' ? 0 : invoice.total_amount)) > 0
                ? 'error.main'
                : 'success.main',
          }}
        >
          ${Number(invoice.AmountDue ?? (invoice.status === 'PAID' ? 0 : invoice.total_amount)).toFixed(2)}
        </TableCell>
        <TableCell>
          <Chip
            label={invoice.status || 'PENDING'}
            size="small"
            color={getStatusColor(invoice.status || 'PENDING') as any}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {invoice.staff_name || '-'}
          </Typography>
        </TableCell>
      </TableRow>

      {/* Expanded transactions sub-row */}
      {hasTransactions && (
        <TableRow>
          <TableCell colSpan={8} sx={{ p: 0, bgcolor: '#f8fafc' }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ px: 5, py: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}
                >
                  Payment Transactions ({invoice.payment_transactions.length})
                </Typography>
                <Table size="small" sx={{ bgcolor: 'white', borderRadius: '8px', overflow: 'hidden' }}>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f1f5f9' }}>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Date</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Card</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Cardholder</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Gateway</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Approval Code</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }} align="right">Amount</TableCell>
                      <TableCell sx={{ fontWeight: 600, color: '#64748b', fontSize: '0.75rem' }}>Status</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {invoice.payment_transactions.map((txn: any) => (
                      <TableRow key={txn.id} hover>
                        <TableCell sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {txn.created_at ? new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
                        </TableCell>
                        <TableCell>
                          {txn.card_last4 ? (
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <CreditCardIcon sx={{ fontSize: '0.85rem', color: '#10b981' }} />
                              <Typography variant="caption" sx={{ fontFamily: 'monospace', fontWeight: 600 }}>
                                XXXX-{txn.card_last4}
                              </Typography>
                            </Box>
                          ) : (
                            <Typography variant="caption" color="text.secondary">—</Typography>
                          )}
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem' }}>{txn.cardholder_name || '—'}</TableCell>
                        <TableCell>
                          <Typography variant="caption" sx={{ fontWeight: 600, color: '#7c3aed' }}>
                            {txn.gateway || '—'}
                          </Typography>
                        </TableCell>
                        <TableCell sx={{ fontSize: '0.78rem', fontFamily: 'monospace', color: '#64748b' }}>
                          {txn.approval_code || '—'}
                        </TableCell>
                        <TableCell align="right" sx={{ fontWeight: 700, fontSize: '0.83rem' }}>
                          ${Number(txn.amount || 0).toFixed(2)}
                        </TableCell>
                        <TableCell>
                          <Box
                            sx={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              px: 1,
                              py: 0.25,
                              borderRadius: '999px',
                              bgcolor: getTxnStatusBg(txn.status),
                              border: `1px solid ${getTxnStatusColor(txn.status)}33`,
                            }}
                          >
                            <Typography
                              variant="caption"
                              sx={{ fontWeight: 700, color: getTxnStatusColor(txn.status), fontSize: '0.7rem' }}
                            >
                              {txn.status || 'UNKNOWN'}
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Collapse>
          </TableCell>
        </TableRow>
      )}
    </>
  );
};

export const InvoicesTab = ({ accountId }: InvoicesTabProps) => {
  const { currentLocationId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const [selectedInvoice, setSelectedInvoice] = useState<{id: string, paymentDetails?: any} | null>(null);

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const response: any = await billingService.getAccountInvoices(accountId, currentLocationId || undefined);
      const data = response?.data || response;
      setInvoices(Array.isArray(data) ? data : []);
    } catch (err: any) {
      console.error('Failed to load invoices:', err);
      setError('Failed to load invoices.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && currentLocationId) {
      fetchInvoices();
    }
  }, [accountId, currentLocationId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const searchStr = `${inv.invoice_id} ${inv.status} ${inv.total_amount} ${inv.AmountDue || ''} ${inv.primary_profile_name || ''} ${inv.payment_details?.cardholder_name || ''} ${inv.payment_details?.card_last4 || ''}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [invoices, searchQuery]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ py: 2 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Invoices
        </Typography>
        <TextField
          size="small"
          placeholder="Search invoices..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment Details</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Due</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Staff</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? 'No invoices match your search.' : 'No invoices found for this account.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.invoice_id}
                  invoice={invoice}
                  onOpen={setSelectedInvoice}
                />
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {selectedInvoice && (
        <InvoicePreviewModal
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoiceId={selectedInvoice.id}
          accountId={accountId}
          initialPaymentDetails={selectedInvoice.paymentDetails}
          onRefresh={fetchInvoices}
        />
      )}
    </Box>
  );
};
