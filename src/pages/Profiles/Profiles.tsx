import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TablePagination, TextField, IconButton, Chip, Typography,
  Alert, Snackbar, InputAdornment
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import RefreshIcon from '@mui/icons-material/Refresh';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import { useNavigate } from 'react-router-dom';

import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { accountService, ProfileResult } from '../../services/accountService';

interface ColumnSearch {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
}

export const Profiles = () => {
  const navigate = useNavigate();
  const { currentLocationId } = useAuth();
  
  // Table State
  const [profiles, setProfiles] = useState<ProfileResult[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search & Sort State
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [columnSearch, setColumnSearch] = useState<ColumnSearch>({});
  
  // Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Data Fetching ---

  const fetchProfiles = useCallback(async () => {
    if (!currentLocationId) return;
    setLoading(true);
    try {
      let query = globalSearch;
      if (!query) {
         const parts: string[] = [];
         if (columnSearch.first_name) parts.push(columnSearch.first_name); 
         if (columnSearch.last_name) parts.push(columnSearch.last_name);
         if (columnSearch.email) parts.push(columnSearch.email);
         if (columnSearch.mobile) parts.push(columnSearch.mobile);
         
         if (parts.length > 0) query = parts.join(' '); 
      }

      const res = await accountService.searchProfiles({
        q: query || '',
        from: page * rowsPerPage,
        size: rowsPerPage,
        sort: sortField === 'created_at' ? undefined : sortField,
        order: sortField === 'created_at' ? undefined : sortOrder,
        locationId: currentLocationId,
        elastic: false
      });
      
      setProfiles(res.results || []);
      setTotal(res.total || (res.results || []).length);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch profiles');
    } finally {
      setLoading(false);
    }
  }, [currentLocationId, page, rowsPerPage, globalSearch, sortField, sortOrder, columnSearch]);

  useEffect(() => {
    fetchProfiles();
  }, [fetchProfiles]);

  // --- Handlers ---

  const handleSort = (field: string) => {
    const isAsc = sortField === field && sortOrder === 'asc';
    setSortOrder(isAsc ? 'desc' : 'asc');
    setSortField(field);
  };

  const handleGlobalSearch = (val: string) => {
    setGlobalSearch(val);
    setPage(0);
  };

  const handleColumnSearch = (field: keyof ColumnSearch, val: string) => {
    setColumnSearch(prev => ({ ...prev, [field]: val }));
    setPage(0); 
  };

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />;
  };


  return (
    <Box sx={{ width: '100%', pb: 5 }}>
      <PageHeader 
        title="Profiles" 
        description="View and manage client profiles across all accounts."
        breadcrumbs={[{ label: 'System', href: '/admin' }, { label: 'Profiles', active: true }]}
      />

      <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 2, overflow: 'hidden', bgcolor: 'white' }}>
        {/* Actions Toolbar */}
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #f1f5f9' }}>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <TextField 
                    size="small" 
                    placeholder="Global Search..." 
                    value={globalSearch}
                    onChange={(e) => handleGlobalSearch(e.target.value)}
                    InputProps={{ 
                      startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" color="action" /></InputAdornment>,
                      sx: { borderRadius: '8px', bgcolor: '#f8fafc', '& fieldset': { border: 'none' } }
                    }}
                    sx={{ width: 280 }}
                />
            </Box>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
                <IconButton onClick={fetchProfiles} color="primary" title="Refresh">
                    <RefreshIcon />
                </IconButton>
            </Box>
        </Box>

        {/* Data Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell onClick={() => handleSort('profiles.first_name')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              NAME {renderSortIcon('profiles.first_name')}
                            </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('profiles.email')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                EMAIL {renderSortIcon('profiles.email')}
                             </Box>
                        </TableCell>
                        <TableCell sx={{ py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                MOBILE
                             </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('created_at')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                CREATED AT {renderSortIcon('created_at')}
                             </Box>
                        </TableCell>
                        <TableCell align="center" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', bgcolor: 'white' }}>PRIMARY</TableCell>
                        <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', bgcolor: 'white' }}>ACTIONS</TableCell>
                    </TableRow>
                    {/* Column Search Row */}
                    <TableRow>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="First/Last Name" value={columnSearch.first_name || ''} onChange={(e) => handleColumnSearch('first_name', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Email" value={columnSearch.email || ''} onChange={(e) => handleColumnSearch('email', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Mobile" value={columnSearch.mobile || ''} onChange={(e) => handleColumnSearch('mobile', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }} />
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }} />
                        <TableCell sx={{ borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading && profiles.length === 0 ? (
                        <TableRow><TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>Loading profiles...</TableCell></TableRow>
                    ) : profiles.map((profile) => {
                        const mobile = profile.mobile || profile.guardian_mobile || profile.emergency_contact_phone || '-';
                        return (
                            <TableRow 
                                key={profile.profile_id} 
                                hover 
                                sx={{ cursor: 'pointer', '&:last-child td, &:last-child th': { border: 0 } }}
                                onClick={() => navigate(`/admin/accounts/${profile.account_id}`)}
                            >
                                <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>
                                    {profile.first_name} {profile.last_name}
                                </TableCell>
                                <TableCell sx={{ color: '#64748b' }}>{profile.email || '-'}</TableCell>
                                <TableCell>{mobile}</TableCell>
                                <TableCell sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    <Box sx={{ fontWeight: 600 }}>{new Date(profile.created_at).toLocaleDateString()}</Box>
                                    <Box sx={{ opacity: 0.8 }}>{new Date(profile.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Box>
                                </TableCell>
                                <TableCell align="center">
                                    {profile.is_primary ? (
                                        <Chip label="Yes" size="small" color="primary" sx={{ height: 20, fontSize: '0.65rem' }} />
                                    ) : (
                                        <Typography variant="caption" color="text.secondary">No</Typography>
                                    )}
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" sx={{ color: '#94a3b8' }}>
                                        <ArrowForwardIcon fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                    {!loading && profiles.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={6} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                {!currentLocationId 
                                    ? "Please select a location to view profiles." 
                                    : "No profiles found matching your search."}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </TableContainer>
        <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
            sx={{ borderTop: '1px solid #f1f5f9' }}
        />
      </Paper>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
         <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  );
};
