import { useState, useEffect } from 'react';
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
  Tooltip,
  TablePagination,
  Grid,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import ArticleIcon from '@mui/icons-material/Article';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import CancelIcon from '@mui/icons-material/Cancel';
import { billingService } from '../../../services/billingService';
import { InvoicePreviewModal } from '../../../components/Billing/InvoicePreviewModal';
import { useAuth } from '../../../context/AuthContext';
import { ManagerPasscodeDialog } from '../../../components/Common/ManagerPasscodeDialog';
import { FormControlLabel, Checkbox, Dialog, DialogTitle, DialogContent, DialogActions, Button, Alert } from '@mui/material';

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
  onCancel: (inv: any) => void;
}

const InvoiceRow = ({ invoice, onOpen, onCancel }: InvoiceRowProps) => {
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
          <Tooltip title={invoice.invoice_id} arrow>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed', cursor: 'default' }}>
              #{invoice.invoice_id?.substring(0, 8)}
            </Typography>
          </Tooltip>
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
        <TableCell align="right" sx={{ fontWeight: 600, color: '#64748b' }}>
          ${Number(invoice.total_amount || 0).toFixed(2)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: 700,
            color:
              Number(invoice.amount_due ?? invoice.AmountDue ?? (invoice.status === 'PAID' ? 0 : invoice.total_amount)) > 0
                ? 'error.main'
                : 'success.main',
          }}
        >
          ${Number(invoice.amount_due ?? invoice.AmountDue ?? (invoice.status === 'PAID' ? 0 : invoice.total_amount)).toFixed(2)}
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
        <TableCell align="right">
          {invoice.status !== 'CANCELLED' && (
            <Tooltip title="Cancel Invoice" arrow>
              <IconButton 
                size="small" 
                color="error" 
                onClick={(e) => { e.stopPropagation(); onCancel(invoice); }}
                sx={{ 
                  bgcolor: '#fef2f2', 
                  '&:hover': { bgcolor: '#fee2e2' },
                  transition: 'all 0.2s'
                }}
              >
                <CancelIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </TableCell>
      </TableRow>

      {/* Expanded transactions sub-row */}
      {hasTransactions && (
        <TableRow>
          <TableCell colSpan={9} sx={{ p: 0, bgcolor: '#f8fafc' }}>
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
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const [selectedInvoice, setSelectedInvoice] = useState<{id: string, paymentDetails?: any} | null>(null);
  
  // Cancellation state
  const [cancellingInvoice, setCancellingInvoice] = useState<any>(null);
  const [confirmCancelOpen, setConfirmCancelOpen] = useState(false);
  const [passcodeOpen, setPasscodeOpen] = useState(false);
  const [voidInGateway, setVoidInGateway] = useState(false);
  const [cancelLoading, setCancelLoading] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  const handleCancelClick = (invoice: any) => {
    setCancellingInvoice(invoice);
    setVoidInGateway(false);
    setCancelError(null);
    setConfirmCancelOpen(true);
  };

  const proceedToPasscode = () => {
    setConfirmCancelOpen(false);
    setPasscodeOpen(true);
  };

  const handleCancelSuccess = async () => {
    setPasscodeOpen(false);
    setCancelLoading(true);
    setCancelError(null);
    try {
      await billingService.cancelInvoice(cancellingInvoice.invoice_id, voidInGateway, currentLocationId || undefined);
      setCancellingInvoice(null);
      await fetchInvoices();
    } catch (err: any) {
      console.error('Failed to cancel invoice:', err);
      setCancelError(err.response?.data?.error || err.message || 'Failed to cancel invoice.');
      setConfirmCancelOpen(true); // Re-open confirm dialog to show error
    } finally {
      setCancelLoading(false);
    }
  };

  const fetchInvoices = async () => {
    setLoading(true);
    setCancelError(null);
    try {
      const params = {
        q: searchQuery,
        startDate,
        endDate,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: 'created_at',
        sortOrder: 'desc' as const
      };
      
      const response: any = await billingService.getAccountInvoices(accountId, currentLocationId || undefined, params);
      
      if (response && response.results) {
        setInvoices(response.results);
        setTotalRecords(response.total_found || response.total_invoices || 0);
        setStats({
          total_invoices: response.total_invoices,
          total_due_amount: response.total_due_amount,
          status_stats: response.status_stats
        });
      } else {
        const data = response?.data || response;
        setInvoices(Array.isArray(data) ? data : []);
        setTotalRecords(Array.isArray(data) ? data.length : 0);
        setStats(null);
      }
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
  }, [accountId, currentLocationId, page, rowsPerPage, startDate, endDate]);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0);
      fetchInvoices();
    }, 500);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };


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
      {/* Statistics Section */}
      {stats && (
        <Grid container spacing={2} sx={{ mb: 3 }}>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #e2e8f0' }}>
                <ArticleIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Total Invoices</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.total_invoices || 0}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fef2f2', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #fee2e2' }}>
                <AccountBalanceWalletIcon sx={{ color: 'error.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="error.dark" sx={{ fontWeight: 600, display: 'block' }}>Total Due Amount</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'error.main' }}>
                  ${(stats.total_due_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #dcfce7' }}>
                <Chip size="small" label="PAID" color="success" sx={{ height: 24, fontSize: '0.65rem', fontWeight: 800 }} />
              </Box>
              <Box>
                <Typography variant="caption" color="success.dark" sx={{ fontWeight: 600, display: 'block' }}>Paid Invoices</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'success.main' }}>{stats.status_stats?.PAID || 0}</Typography>
              </Box>
            </Paper>
          </Grid>
        </Grid>
      )}

      {/* Filter Section */}
      <Box sx={{ mb: 3, display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Invoices
        </Typography>
        
        <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
          <TextField
              size="small"
              type="date"
              label="From"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
          />
          <TextField
              size="small"
              type="date"
              label="To"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
          />
          <TextField
            size="small"
            placeholder="Search by ID or Status..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{ width: 250 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon sx={{ color: '#94a3b8', fontSize: '1.2rem' }} />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={() => {
              setSearchQuery('');
              setStartDate('');
              setEndDate('');
              setPage(0);
            }}
            sx={{ color: 'text.secondary', borderColor: 'divider', textTransform: 'none', fontWeight: 600 }}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ width: 48 }} />
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment Details</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Total</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Due</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Staff</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2" component="span" color="text.secondary">Loading invoices...</Typography>
                </TableCell>
              </TableRow>
            ) : invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery || startDate || endDate ? 'No invoices match your filters.' : 'No invoices found for this account.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <InvoiceRow
                  key={invoice.invoice_id}
                  invoice={invoice}
                  onOpen={setSelectedInvoice}
                  onCancel={handleCancelClick}
                />
              ))
            )}
          </TableBody>
        </Table>
        <TablePagination
          rowsPerPageOptions={[5, 10, 25]}
          component="div"
          count={totalRecords}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{ borderTop: '1px solid #e2e8f0' }}
        />
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

      {/* Confirmation Dialog */}
      <Dialog open={confirmCancelOpen} onClose={() => !cancelLoading && setConfirmCancelOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ fontWeight: 800 }}>Cancel Invoice</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Are you sure you want to cancel invoice <strong>{cancellingInvoice?.invoice_id.substring(0, 8)}</strong>? 
            This will also cancel any related subscription coverage.
          </Typography>
          
          {(cancellingInvoice?.status === 'PAID' || cancellingInvoice?.status === 'PARTIAL') && (
            <Box sx={{ mt: 2, p: 2, bgcolor: '#fef2f2', borderRadius: 2, border: '1px solid #fee2e2' }}>
              <FormControlLabel
                control={
                  <Checkbox 
                    checked={voidInGateway} 
                    onChange={(e) => setVoidInGateway(e.target.checked)}
                    color="error"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#991b1b' }}>
                      Void/Reverse payment in gateway
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#ef4444', display: 'block' }}>
                      WARNING: This will attempt to refund the customer automatically.
                    </Typography>
                  </Box>
                }
              />
            </Box>
          )}

          {cancelError && (
            <Alert severity="error" sx={{ mt: 2 }}>
              {cancelError}
            </Alert>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
          <Button onClick={() => setConfirmCancelOpen(false)} disabled={cancelLoading} sx={{ fontWeight: 600 }}>
            No, Keep it
          </Button>
          <Button 
            onClick={proceedToPasscode} 
            variant="contained" 
            color="error" 
            disabled={cancelLoading}
            sx={{ fontWeight: 800, px: 3 }}
          >
            {cancelLoading ? 'Cancelling...' : 'Yes, Cancel Invoice'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Passcode Dialog */}
      <ManagerPasscodeDialog
        open={passcodeOpen}
        onClose={() => setPasscodeOpen(false)}
        onSuccess={handleCancelSuccess}
      />
    </Box>
  );
};
