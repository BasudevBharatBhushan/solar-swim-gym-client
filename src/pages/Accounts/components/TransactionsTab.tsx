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
  Tooltip,
  TextField,
  TablePagination,
  Grid,
  Button,
  IconButton,
  TableSortLabel,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import PaidIcon from '@mui/icons-material/Paid';
import AnalyticsIcon from '@mui/icons-material/Analytics';
import HistoryIcon from '@mui/icons-material/History';
import { billingService } from '../../../services/billingService';
import { useAuth } from '../../../context/AuthContext';

interface TransactionsTabProps {
  accountId: string;
}

export const TransactionsTab = ({ accountId }: TransactionsTabProps) => {
  const { currentLocationId } = useAuth();
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [stats, setStats] = useState<any>(null);
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchTransactions = async () => {
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
      const response: any = await billingService.getAccountTransactions(accountId, currentLocationId || undefined, params);
      
      if (response && response.results) {
        setTransactions(response.results);
        setTotalRecords(response.total_found || 0);
        setStats({
          total_transaction_amount: response.total_transaction_amount,
          status_stats: response.status_stats,
          total_found: response.total_found
        });
      } else {
        const data = response?.data || response;
        setTransactions(Array.isArray(data) ? data : []);
        setTotalRecords(Array.isArray(data) ? data.length : 0);
        setStats(null);
      }
    } catch (err: any) {
      console.error('Failed to load transactions:', err);
      setError('Failed to load transaction history.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (accountId && currentLocationId) {
      fetchTransactions();
    }
  }, [accountId, currentLocationId, page, rowsPerPage, sortField, sortOrder]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0);
    fetchTransactions();
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


  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'APPROVED':
        return 'success';
      case 'DECLINED':
        return 'error';
      case 'FAILED':
        return 'error';
      case 'PENDING':
        return 'warning';
      default:
        return 'default';
    }
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
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #dcfce7' }}>
                <PaidIcon sx={{ color: 'success.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="success.dark" sx={{ fontWeight: 600, display: 'block' }}>Total Volumn</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>
                  ${(stats.total_transaction_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#f8fafc', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #e2e8f0' }}>
                <HistoryIcon sx={{ color: 'primary.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block' }}>Total Count</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800 }}>{stats.total_found || 0}</Typography>
              </Box>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 4 }}>
            <Paper elevation={0} sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0', bgcolor: '#fffbeb', display: 'flex', alignItems: 'center', gap: 2 }}>
              <Box sx={{ bgcolor: 'white', p: 1, borderRadius: 2, display: 'flex', border: '1px solid #fef3c7' }}>
                <AnalyticsIcon sx={{ color: 'warning.main' }} />
              </Box>
              <Box>
                <Typography variant="caption" color="warning.dark" sx={{ fontWeight: 600, display: 'block' }}>Approved</Typography>
                <Typography variant="h6" sx={{ fontWeight: 800, color: 'warning.main' }}>{stats.status_stats?.APPROVED || 0}</Typography>
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
            placeholder="Search by Invoice #, Status, Amount..."
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
              setTimeout(() => fetchTransactions(), 0);
            }}
            sx={{ color: 'text.secondary', fontWeight: 600, minWidth: 'auto', px: 2 }}
          >
            Clear
          </Button>
          <IconButton onClick={fetchTransactions} title="Refresh">
            <RefreshIcon />
          </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice #</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                <TableSortLabel active={sortField === 'created_at'} direction={sortField === 'created_at' ? sortOrder : 'asc'} onClick={() => handleSort('created_at')}>
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Card / Member</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Transaction ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">
                <TableSortLabel active={sortField === 'amount'} direction={sortField === 'amount' ? sortOrder : 'asc'} onClick={() => handleSort('amount')}>
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>
                <TableSortLabel active={sortField === 'status'} direction={sortField === 'status' ? sortOrder : 'asc'} onClick={() => handleSort('status')}>
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Staff</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <CircularProgress size={24} sx={{ mr: 2 }} />
                  <Typography variant="body2" component="span" color="text.secondary">Loading transactions...</Typography>
                </TableCell>
              </TableRow>
            ) : transactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery || startDate || endDate ? 'No transactions match your filters.' : 'No transactions found for this account.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              transactions.map((tx) => (
                <TableRow key={tx.transaction_id || tx.id} hover>
                  <TableCell>
                    {tx.invoice ? (
                      <Tooltip title={tx.invoice.invoice_id} arrow>
                        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontWeight: 700, color: '#7c3aed', cursor: 'default' }}>
                          #{tx.invoice.invoice_no || tx.invoice.invoice_id?.substring(0, 8)}
                        </Typography>
                      </Tooltip>
                    ) : (
                      <Typography variant="body2" color="text.disabled">—</Typography>
                    )}
                  </TableCell>
                  <TableCell>
                    {tx.created_at
                      ? new Date(tx.created_at).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : 'N/A'}
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CreditCardIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          XXXX-{tx.card_last4 || '****'}
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        {tx.cardholder_name || tx.primary_profile_name || 'N/A'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#64748b' }}>
                      {(tx.transaction_id || tx.id || '').substring(0, 12)}...
                    </Typography>
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ${Number(tx.amount || tx.invoice?.total_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={tx.status || 'UNKNOWN'}
                      size="small"
                      color={getStatusColor(tx.status || '') as any}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ color: '#64748b' }}>
                      {tx.staff_name || '-'}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Tooltip
                      title={
                        <Box sx={{ p: 0.5 }}>
                          <Typography variant="caption" display="block">
                            Approval Code: {tx.approval_code || 'N/A'}
                          </Typography>
                          <Typography variant="caption" display="block">
                            Gateway Token: {tx.gateway_transaction_token || 'N/A'}
                          </Typography>
                          {tx.invoice && (
                            <>
                              <Typography variant="caption" display="block" sx={{ mt: 0.5, fontWeight: 700 }}>Invoice Status: {tx.invoice.status}</Typography>
                              <Typography variant="caption" display="block">Billed Amount: ${Number(tx.invoice.total_amount).toFixed(2)}</Typography>
                            </>
                          )}
                          {tx.primary_profile_email && (
                             <Typography variant="caption" display="block">
                               Email: {tx.primary_profile_email}
                             </Typography>
                          )}
                        </Box>
                      }
                      arrow
                    >
                      <InfoOutlinedIcon sx={{ color: '#94a3b8', fontSize: '1.2rem', cursor: 'pointer' }} />
                    </Tooltip>
                  </TableCell>
                </TableRow>
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
    </Box>
  );
};
