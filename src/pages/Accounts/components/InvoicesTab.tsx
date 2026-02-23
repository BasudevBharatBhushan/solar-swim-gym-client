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
  Chip
} from '@mui/material';
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
  
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

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
      <Typography variant="h6" sx={{ mb: 3, fontWeight: 700, color: '#1e293b' }}>
        Invoices
      </Typography>

      <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: '12px' }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice ID</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Amount</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {invoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                  <Typography color="text.secondary">No invoices found for this account.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              invoices.map((invoice) => (
                <TableRow 
                  key={invoice.invoice_id}
                  hover
                  onClick={() => setSelectedInvoiceId(invoice.invoice_id)}
                  sx={{ cursor: 'pointer' }}
                >
                  <TableCell>
                    {invoice.created_at ? new Date(invoice.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : 'N/A'}
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

      {selectedInvoiceId && (
        <InvoicePreviewModal
          open={!!selectedInvoiceId}
          onClose={() => setSelectedInvoiceId(null)}
          invoiceId={selectedInvoiceId}
          accountId={accountId}
        />
      )}
    </Box>
  );
};

