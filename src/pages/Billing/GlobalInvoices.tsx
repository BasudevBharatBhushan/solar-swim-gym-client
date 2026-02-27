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
  Button,
  TextField,
  InputAdornment,
  Tooltip,
  Collapse,
  IconButton,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { billingService } from '../../services/billingService';
import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { InvoicePreviewModal } from '../../components/Billing/InvoicePreviewModal';

const getStatusColor = (status: string) => {
  switch (status?.toUpperCase()) {
    case 'PAID': return 'success';
    case 'DRAFT':
    case 'PENDING': return 'warning';
    case 'PARTIAL': return 'info';
    case 'FAILED': return 'error';
    default: return 'default';
  }
};

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
  inv: any;
  onView: (inv: any) => void;
}

const GlobalInvoiceRow = ({ inv, onView }: InvoiceRowProps) => {
  const [open, setOpen] = useState(false);
  const hasTransactions = Array.isArray(inv.payment_transactions) && inv.payment_transactions.length > 0;

  return (
    <>
      <TableRow hover sx={{ '& > *': { borderBottom: open ? 'none' : undefined } }}>
        <TableCell sx={{ width: 48 }}>
          {hasTransactions ? (
            <IconButton size="small" onClick={() => setOpen(!open)}>
              {open ? <KeyboardArrowUpIcon fontSize="small" /> : <KeyboardArrowDownIcon fontSize="small" />}
            </IconButton>
          ) : null}
        </TableCell>
        <TableCell>
          {inv.created_at ? new Date(inv.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', flexDirection: 'column' }}>
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
              {inv.primary_profile_name || inv.account_name || 'N/A'}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              {inv.primary_profile_email || inv.email || 'N/A'}
            </Typography>
          </Box>
        </TableCell>
        <TableCell>
          {inv.payment_details ? (
            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <CreditCardIcon sx={{ fontSize: '1rem', color: '#10b981' }} />
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#059669' }}>
                  XXXX-{inv.payment_details.card_last4}
                </Typography>
              </Box>
              <Typography variant="caption" color="text.secondary">
                {inv.payment_details.cardholder_name}
              </Typography>
            </Box>
          ) : (
            <Typography variant="caption" color="#94a3b8">Unpaid / No Details</Typography>
          )}
        </TableCell>
        <TableCell>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
              {inv.invoice_id.substring(0, 8)}...
            </Typography>
            {inv.payment_details?.txnid && (
              <Tooltip title={`Transaction ID: ${inv.payment_details.txnid}`} arrow>
                <InfoOutlinedIcon sx={{ fontSize: '0.9rem', color: '#cbd5e1', cursor: 'help' }} />
              </Tooltip>
            )}
          </Box>
        </TableCell>
        <TableCell align="right" sx={{ fontWeight: 600 }}>
          ${Number(inv.total_amount || 0).toFixed(2)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: 700,
            color:
              Number(inv.AmountDue ?? (inv.status === 'PAID' ? 0 : inv.total_amount)) > 0
                ? 'error.main'
                : 'success.main',
          }}
        >
          ${Number(inv.AmountDue ?? (inv.status === 'PAID' ? 0 : inv.total_amount)).toFixed(2)}
        </TableCell>
        <TableCell>
          <Chip
            label={inv.status || 'PENDING'}
            size="small"
            color={getStatusColor(inv.status || '') as any}
            sx={{ fontWeight: 600, fontSize: '0.75rem' }}
          />
        </TableCell>
        <TableCell>
          <Typography variant="body2" sx={{ color: '#64748b' }}>
            {inv.staff_name || '-'}
          </Typography>
        </TableCell>
        <TableCell align="center">
          <Button
            size="small"
            variant="text"
            startIcon={<VisibilityIcon />}
            onClick={() => onView(inv)}
          >
            View
          </Button>
        </TableCell>
      </TableRow>

      {/* Expanded transactions sub-row */}
      {hasTransactions && (
        <TableRow>
          <TableCell colSpan={10} sx={{ p: 0, bgcolor: '#f8fafc' }}>
            <Collapse in={open} timeout="auto" unmountOnExit>
              <Box sx={{ px: 6, py: 1.5 }}>
                <Typography
                  variant="caption"
                  sx={{ fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 1, display: 'block' }}
                >
                  Payment Transactions ({inv.payment_transactions.length})
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
                    {inv.payment_transactions.map((txn: any) => (
                      <TableRow key={txn.id} hover>
                        <TableCell sx={{ fontSize: '0.78rem', color: '#64748b' }}>
                          {txn.created_at
                            ? new Date(txn.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                            : 'N/A'}
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

export const GlobalInvoices = () => {
  const { currentLocationId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedInvoice, setSelectedInvoice] = useState<{id: string, accountId: string, paymentDetails?: any} | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: any = await billingService.getInvoices(currentLocationId || undefined);
        const data = response?.data || response;
        setInvoices(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to load invoices:', err);
        setError('Failed to load global invoice records.');
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
  }, [currentLocationId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const searchStr = `${inv.invoice_id} ${inv.account_name} ${inv.email} ${inv.status} ${inv.primary_profile_name} ${inv.payment_details?.cardholder_name || ''} ${inv.payment_details?.card_last4 || ''}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [invoices, searchQuery]);

  return (
    <Box>
      <PageHeader
        title="Invoices"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'Invoices', active: true }
        ]}
      />

      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 3 }}>
          <TextField
            size="small"
            placeholder="Search all invoices..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 350 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error">{error}</Typography>
        ) : (
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ width: 48 }} />
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Account / Member</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment Info</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Total</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Due</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No invoices match your search.' : 'No invoices found.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <GlobalInvoiceRow
                      key={inv.invoice_id}
                      inv={inv}
                      onView={(invoice) =>
                        setSelectedInvoice({
                          id: invoice.invoice_id,
                          accountId: invoice.account_id,
                          paymentDetails: invoice.payment_details,
                        })
                      }
                    />
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Box>

      {selectedInvoice && (
        <InvoicePreviewModal
          open={!!selectedInvoice}
          onClose={() => setSelectedInvoice(null)}
          invoiceId={selectedInvoice.id}
          accountId={selectedInvoice.accountId}
          initialPaymentDetails={selectedInvoice.paymentDetails}
        />
      )}
    </Box>
  );
};
