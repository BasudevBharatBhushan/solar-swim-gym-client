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
} from '@mui/material';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import CreditCardIcon from '@mui/icons-material/CreditCard';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { billingService } from '../../services/billingService';
import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { InvoicePreviewModal } from '../../components/Billing/InvoicePreviewModal';

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

  const getStatusColor = (status: string) => {
    switch (status?.toUpperCase()) {
      case 'PAID': return 'success';
      case 'DRAFT': return 'warning';
      case 'PENDING': return 'warning';
      case 'FAILED': return 'error';
      default: return 'default';
    }
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
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Account / Member</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Payment Info</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Invoice ID</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Amount</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Staff</TableCell>
                  <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredInvoices.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="text.secondary">
                        {searchQuery ? 'No invoices match your search.' : 'No invoices found.'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredInvoices.map((inv) => (
                    <TableRow key={inv.invoice_id} hover>
                      <TableCell>
                        {inv.created_at ? new Date(inv.created_at).toLocaleDateString() : 'N/A'}
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
                          onClick={() => setSelectedInvoice({
                            id: inv.invoice_id, 
                            accountId: inv.account_id,
                            paymentDetails: inv.payment_details
                          })}
                        >
                          View
                        </Button>
                      </TableCell>
                    </TableRow>
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
