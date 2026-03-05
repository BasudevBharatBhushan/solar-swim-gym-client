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
  Button,
  TextField,
  Tooltip,
  Collapse,
  IconButton,
  TablePagination,
  Grid,
  TableSortLabel,
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import ArticleIcon from '@mui/icons-material/Article';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import LinkIcon from '@mui/icons-material/Link';
import { billingService } from '../../services/billingService';
import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { InvoicePreviewModal } from '../../components/Billing/InvoicePreviewModal';
import { GeneratePaymentLinkDialog } from '../../components/Billing/GeneratePaymentLinkDialog';

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
  onSendLink: (inv: any) => void;
}

const GlobalInvoiceRow = ({ inv, onView, onSendLink }: InvoiceRowProps) => {
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
          <Tooltip title={inv.invoice_id} arrow>
            <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed', cursor: 'default' }}>
              #{inv.invoice_no || inv.invoice_id?.substring(0, 8)}
            </Typography>
          </Tooltip>
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
        <TableCell align="right" sx={{ fontWeight: 600 }}>
          ${Number(inv.total_amount || 0).toFixed(2)}
        </TableCell>
        <TableCell
          align="right"
          sx={{
            fontWeight: 700,
            color:
              Number(inv.amount_due ?? inv.AmountDue ?? (inv.status === 'PAID' ? 0 : inv.total_amount)) > 0
                ? 'error.main'
                : 'success.main',
          }}
        >
          ${Number(inv.amount_due ?? inv.AmountDue ?? (inv.status === 'PAID' ? 0 : inv.total_amount)).toFixed(2)}
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
          <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
            {inv.status !== 'PAID' && Number(inv.amount_due ?? inv.AmountDue ?? inv.total_amount) > 0 && (
              <Tooltip title="Send Payment Link" arrow>
                <IconButton 
                  size="small" 
                  color="primary" 
                  onClick={(e) => { e.stopPropagation(); onSendLink(inv); }}
                  sx={{ 
                    bgcolor: '#eff6ff', 
                    '&:hover': { bgcolor: '#dbeafe' },
                    transition: 'all 0.2s'
                  }}
                >
                  <LinkIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            <Button
              size="small"
              variant="text"
              startIcon={<VisibilityIcon />}
              onClick={() => onView(inv)}
            >
              View
            </Button>
          </Box>
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
  const [linkInvoice, setLinkInvoice] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState<any>(null);

  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchInvoices = async () => {
    setLoading(true);
    setError(null);
    try {
      const params = {
        q: searchQuery,
        startDate,
        endDate,
        page: page + 1,
        limit: rowsPerPage,
        sortBy: sortField,
        sortOrder: sortOrder
      };
      
      const response: any = await billingService.getInvoices(currentLocationId || undefined, params);
      
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
      setError('Failed to load global invoice records.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [currentLocationId, page, rowsPerPage, sortField, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchInvoices();
  };

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
    setPage(0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

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
        <Paper sx={{ mb: 3, p: 2, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
          <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
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
              placeholder="Search all invoices..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              sx={{ flexGrow: 1, minWidth: 200 }}
              InputProps={{
                startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
              }}
            />
            <Button type="submit" variant="outlined" sx={{ borderRadius: '8px' }}>
              Search
            </Button>
            <Button 
              variant="text" 
              size="small" 
              onClick={() => {
                setSearchQuery('');
                setStartDate('');
                setEndDate('');
                setPage(0);
                setTimeout(() => fetchInvoices(), 0);
              }}
              sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 'auto', px: 2 }}
            >
              Clear
            </Button>
            <IconButton onClick={fetchInvoices} title="Refresh">
              <RefreshIcon />
            </IconButton>
          </Box>
        </Paper>

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
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                    <TableSortLabel active={sortField === 'invoice_no'} direction={sortField === 'invoice_no' ? sortOrder : 'asc'} onClick={() => handleSort('invoice_no')}>
                      Invoice #
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                    <TableSortLabel active={sortField === 'created_at'} direction={sortField === 'created_at' ? sortOrder : 'asc'} onClick={() => handleSort('created_at')}>
                      Date
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Account / Member</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment Info</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">
                    <TableSortLabel active={sortField === 'total_amount'} direction={sortField === 'total_amount' ? sortOrder : 'asc'} onClick={() => handleSort('total_amount')}>
                      Total
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Due</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                    <TableSortLabel active={sortField === 'status'} direction={sortField === 'status' ? sortOrder : 'asc'} onClick={() => handleSort('status')}>
                      Status
                    </TableSortLabel>
                  </TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {invoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery || startDate || endDate ? 'No invoices match your filters.' : 'No invoices found.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  invoices.map((inv) => (
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
                      onSendLink={(invoice) => setLinkInvoice(invoice)}
                    />
                  ))
                )}
              </TableBody>
            </Table>
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalRecords}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              sx={{ borderTop: '1px solid #e2e8f0' }}
            />
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

      {linkInvoice && (
        <GeneratePaymentLinkDialog
          open={!!linkInvoice}
          onClose={() => setLinkInvoice(null)}
          invoice={linkInvoice}
        />
      )}
    </Box>
  );
};
