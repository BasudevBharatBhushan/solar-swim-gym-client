import { useState, useEffect } from 'react';
import { 
  Box, 
  Button, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow,
  TextField,
  TablePagination,
  IconButton,
  Chip,
  CircularProgress,
  Typography,
  Tooltip,
  Badge
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import SyncIcon from '@mui/icons-material/Sync';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ShoppingCartIcon from '@mui/icons-material/ShoppingCart';
import { useNavigate } from 'react-router-dom';
import { ClientOnboardingModal } from './ClientOnboarding/ClientOnboardingModal';
import { PageHeader } from '../../components/Common/PageHeader';
import { crmService } from '../../services/crmService';
import { cartService } from '../../services/cartService';
import { Account } from '../../types';

import { useAuth } from '../../context/AuthContext';

// ... other imports ...

export const Accounts = () => {
  const navigate = useNavigate();
  const { currentLocationId } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  // Data State
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [cartCounts, setCartCounts] = useState<Record<string, number>>({});
  
  // Query State
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [reindexing, setReindexing] = useState(false);

  const fetchAccounts = async () => {
    if (!currentLocationId) return;
    setLoading(true);
    try {
      const response = await crmService.searchAccounts({
        q: searchQuery,
        from: page * rowsPerPage,
        size: rowsPerPage,
        sort: 'created_at',
        order: 'desc',
        locationId: currentLocationId
      });
      const normalizedResults = (response.results || []).map((acc: any) => ({
        ...acc,
        profiles: acc.profiles || acc.profile || []
      }));
      setAccounts(normalizedResults);
      setTotal(response.total || 0);
    } catch (error) {
      console.error('Failed to fetch accounts', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, [page, rowsPerPage, currentLocationId]);

  useEffect(() => {
    if (currentLocationId) {
      cartService.getItems(currentLocationId)
        .then(items => {
          const counts: Record<string, number> = {};
          items.forEach(item => {
            if (item.account_id) {
               counts[item.account_id] = (counts[item.account_id] || 0) + 1;
            }
          });
          setCartCounts(counts);
        })
        .catch(console.error);
    }
  }, [currentLocationId, page, reindexing]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(0); // Reset to first page
    fetchAccounts();
  };

  const handleOpenModal = () => setIsModalOpen(true);
  const handleCloseModal = () => setIsModalOpen(false);
  
  const handleSuccess = async () => {
      setLoading(true);
      // Trigger Reindex as requested
      try {
          console.log('Triggering automatic reindex after adding client...');
          await crmService.reindexAccounts(currentLocationId || undefined);
      } catch (error) {
          console.error('Failed to trigger automatic reindex', error);
      }

      // Refresh list
      // Reset to first page to see the new client
      if (page !== 0) {
          setPage(0); 
      } else {
          fetchAccounts();
      }
      handleCloseModal();
  };

  const handleReindex = async () => {
      if (!currentLocationId || reindexing) return;
      setReindexing(true);
      try {
          await crmService.reindexAccounts(currentLocationId || undefined);
          // Optional: Show success message or refresh list after reindex
          fetchAccounts();
      } catch (error) {
          console.error('Failed to manually reindex accounts', error);
          alert('Failed to reindex accounts. Please try again.');
      } finally {
          setReindexing(false);
      }
  };

  const getPrimaryProfile = (account: Account) => {
      if (!account.profiles || account.profiles.length === 0) return { name: 'Unknown', email: '-' };
      // Look for the profile marked as primary, or fallback to the first one
      const primary = account.profiles.find((p: any) => p.is_primary) || account.profiles[0]; 
      return {
          name: `${primary.first_name} ${primary.last_name}`,
          email: primary.email || '-'
      };
  };

  const getStatusColor = (status: string) => {
      switch(status) {
          case 'ACTIVE': return 'success';
          case 'PENDING': return 'warning';
          case 'SUSPENDED': return 'error';
          default: return 'default';
      }
  };

  return (
    <Box>
      <PageHeader
        title="Accounts"
        description="Manage client accounts and memberships"
        breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Accounts', active: true }
        ]}
        action={
            <Box sx={{ display: 'flex', gap: 2 }}>
                {/* Hide Reindex button for now
                <Tooltip title="Update search index for all accounts">
                    <span>
                        <Button
                          variant="outlined"
                          startIcon={reindexing ? <CircularProgress size={20} color="inherit" /> : <SyncIcon />}
                          onClick={handleReindex}
                          disabled={reindexing}
                          sx={{
                            borderColor: '#cbd5e1',
                            color: '#475569',
                            textTransform: 'none',
                            borderRadius: '8px',
                            px: 3,
                            '&:hover': {
                                borderColor: '#94a3b8',
                                bgcolor: '#f8fafc'
                            }
                          }}
                        >
                          {reindexing ? 'Reindexing...' : 'Reindex'}
                        </Button>
                    </span>
                </Tooltip>
                */}
                <Button
                  variant="contained"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenModal}
                  sx={{
                    bgcolor: '#4182f9',
                    '&:hover': { bgcolor: '#3a75e0' },
                    textTransform: 'none',
                    borderRadius: '8px',
                    px: 3
                  }}
                >
                  Add Client
                </Button>
            </Box>
        }
      />

      <Paper sx={{ mb: 3, p: 2, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
            <TextField
                size="small"
                placeholder="Search by name, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                sx={{ flexGrow: 1 }}
                InputProps={{
                    startAdornment: <SearchIcon color="action" sx={{ mr: 1 }} />
                }}
            />
            <Button type="submit" variant="outlined" sx={{ borderRadius: '8px' }}>
                Search
            </Button>
            <IconButton onClick={fetchAccounts} title="Refresh">
                <RefreshIcon />
            </IconButton>
        </Box>
      </Paper>

      <TableContainer component={Paper} sx={{ borderRadius: '12px', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
        <Table sx={{ minWidth: 650 }} aria-label="accounts table">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Primary Contact</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Status</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Created Date</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }}>Profiles</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="center">Cart</TableCell>
              <TableCell sx={{ fontWeight: 600, color: '#475569' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
                <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                        <CircularProgress />
                    </TableCell>
                </TableRow>
            ) : accounts.length === 0 ? (
                <TableRow>
                    <TableCell colSpan={5} align="center" sx={{ py: 8, color: '#94a3b8' }}>
                        No accounts found.
                    </TableCell>
                </TableRow>
            ) : (
                accounts.map((account) => {
                    const primary = getPrimaryProfile(account);
                    return (
                        <TableRow 
                            key={account.account_id}
                            hover
                            sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                            onClick={() => navigate(`/admin/accounts/${account.account_id}`)}
                        >
                            <TableCell>
                                <Typography variant="subtitle2" fontWeight={600}>
                                    {primary.name}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                    {primary.email}
                                </Typography>
                            </TableCell>
                            <TableCell>
                                <Chip 
                                    label={account.status} 
                                    size="small" 
                                    color={getStatusColor(account.status) as any}
                                    variant="outlined" 
                                />
                            </TableCell>
                            <TableCell>
                                {new Date(account.created_at).toLocaleDateString()}
                            </TableCell>
                            <TableCell>
                                <Chip label={account.profiles?.length || 0} size="small" />
                            </TableCell>
                            <TableCell align="center">
                                {(cartCounts[account.account_id] || 0) > 0 ? (
                                    <Tooltip title={`${cartCounts[account.account_id]} item(s) in cart`}>
                                        <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/accounts/${account.account_id}/marketplace`); }}>
                                            <Badge badgeContent={cartCounts[account.account_id]} color="error">
                                                <ShoppingCartIcon color="action" />
                                            </Badge>
                                        </IconButton>
                                    </Tooltip>
                                ) : (
                                    <Typography variant="body2" color="text.secondary">-</Typography>
                                )}
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={(e) => { e.stopPropagation(); navigate(`/admin/accounts/${account.account_id}`); }}>
                                    <ArrowForwardIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                    );
                })
            )}
          </TableBody>
        </Table>
        <TablePagination
            rowsPerPageOptions={[10, 25, 50]}
            component="div"
            count={total}
            rowsPerPage={rowsPerPage}
            page={page}
            onPageChange={(_, newPage) => setPage(newPage)}
            onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
            }}
        />
      </TableContainer>

      <ClientOnboardingModal 
        open={isModalOpen} 
        onClose={handleCloseModal} 
        onSuccess={handleSuccess}
      />
    </Box>
  );
};

