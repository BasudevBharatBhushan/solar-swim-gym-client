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
  Tooltip,
  TextField,
  InputAdornment,
} from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import SearchIcon from '@mui/icons-material/Search';
import CreditCardIcon from '@mui/icons-material/CreditCard';
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

  useEffect(() => {
    const fetchTransactions = async () => {
      setLoading(true);
      setError(null);
      try {
        const response: any = await billingService.getAccountTransactions(accountId, currentLocationId || undefined);
        const data = response?.data || response;
        setTransactions(Array.isArray(data) ? data : []);
      } catch (err: any) {
        console.error('Failed to load transactions:', err);
        setError('Failed to load transaction history.');
      } finally {
        setLoading(false);
      }
    };

    if (accountId) {
      fetchTransactions();
    }
  }, [accountId, currentLocationId]);

  const filteredTransactions = useMemo(() => {
    return transactions.filter((tx) => {
      const invoiceStr = tx.invoice ? `${tx.invoice.invoice_id} ${tx.invoice.status}` : '';
      const searchStr = `${tx.transaction_id} ${tx.status} ${tx.amount} ${tx.cardholder_name} ${tx.card_last4} ${tx.primary_profile_name} ${tx.primary_profile_email} ${invoiceStr}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [transactions, searchQuery]);

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
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
          Transaction History
        </Typography>
        <TextField
          size="small"
          placeholder="Search transactions..."
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
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Card / Member</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Transaction ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredTransactions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? 'No transactions match your search.' : 'No transactions found for this account.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredTransactions.map((tx) => (
                <TableRow key={tx.transaction_id || tx.id} hover>
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
                    {tx.invoice && (
                      <Typography variant="caption" color="primary.main" sx={{ fontWeight: 600, display: 'block' }}>
                        Inv: {tx.invoice.invoice_id?.substring(0, 8)}...
                      </Typography>
                    )}
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
      </TableContainer>
    </Box>
  );
};
