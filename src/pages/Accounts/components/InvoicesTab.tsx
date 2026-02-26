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
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import { billingService } from '../../../services/billingService';
import { InvoicePreviewModal } from '../../../components/Billing/InvoicePreviewModal';
import { useAuth } from '../../../context/AuthContext';

interface InvoicesTabProps {
  accountId: string;
}

export const InvoicesTab = ({ accountId }: InvoicesTabProps) => {
  const { currentLocationId } = useAuth();
  const [invoices, setInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const [selectedInvoice, setSelectedInvoice] = useState<{id: string, paymentDetails?: any} | null>(null);

  useEffect(() => {
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

    if (accountId && currentLocationId) {
      fetchInvoices();
    }
  }, [accountId, currentLocationId]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter((inv) => {
      const searchStr = `${inv.invoice_id} ${inv.status} ${inv.total_amount} ${inv.primary_profile_name || ''} ${inv.payment_details?.cardholder_name || ''} ${inv.payment_details?.card_last4 || ''}`.toLowerCase();
      return searchStr.includes(searchQuery.toLowerCase());
    });
  }, [invoices, searchQuery]);

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
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment Details</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">
                    {searchQuery ? 'No invoices match your search.' : 'No invoices found for this account.'}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow 
                  key={invoice.invoice_id}
                  hover
                  onClick={() => setSelectedInvoice({ id: invoice.invoice_id, paymentDetails: invoice.payment_details })}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
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
                  <TableCell align="right" sx={{ fontWeight: 600 }}>
                    ${Number(invoice.total_amount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={invoice.status || 'PENDING'} 
                      size="small" 
                      color={getStatusColor(invoice.status || 'PENDING') as any}
                      sx={{ fontWeight: 600, fontSize: '0.75rem' }}
                    />
                  </TableCell>
                </TableRow>
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
        />
      )}
    </Box>
  );
};
