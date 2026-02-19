import { useState, useEffect, useCallback } from 'react';
import { 
  Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  TablePagination, TextField, Button, Grid, IconButton, Chip, Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions, Alert, Snackbar,
  InputAdornment, Typography, CircularProgress
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';
import EditIcon from '@mui/icons-material/Edit';
import CloseIcon from '@mui/icons-material/Close';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import DownloadIcon from '@mui/icons-material/Download';

import { PageHeader } from '../../components/Common/PageHeader';
import { useAuth } from '../../context/AuthContext';
import { crmService } from '../../services/crmService';

// Types
interface Lead {
  lead_id: string;
  location_id: string;
  first_name: string;
  last_name: string;
  email: string;
  mobile: string;
  status: string;
  lead_source: string;
  notes: string;
  created_at: string;
}

interface ColumnSearch {
  first_name?: string;
  last_name?: string;
  email?: string;
  mobile?: string;
  status?: string;
  lead_source?: string;
}

export const Leads = () => {
  const { currentLocationId, userParams } = useAuth();
  
  // Table State
  const [leads, setLeads] = useState<Lead[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  
  // Search & Sort State
  const [globalSearch, setGlobalSearch] = useState('');
  const [sortField, setSortField] = useState<string>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [columnSearch, setColumnSearch] = useState<ColumnSearch>({});
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLead, setCurrentLead] = useState<Partial<Lead>>({});
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  
  // Feedback
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // --- Data Fetching ---

  const fetchLeads = useCallback(async () => {
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
         if (columnSearch.status) parts.push(columnSearch.status);
         if (columnSearch.lead_source) parts.push(columnSearch.lead_source);
         
         if (parts.length > 0) query = parts.join(' '); 
      }

      const res = await crmService.searchLeads({
        q: query,
        from: page * rowsPerPage,
        size: rowsPerPage,
        sort: sortField,
        order: sortOrder,
        locationId: currentLocationId
      });
      
      setLeads(res.results || []);
      setTotal(res.total || 0);
    } catch (err: any) {
      console.error(err);
      setError('Failed to fetch leads');
    } finally {
      setLoading(false);
    }
  }, [currentLocationId, page, rowsPerPage, globalSearch, sortField, sortOrder, columnSearch]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

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

  const handleReindex = async () => {
    if (!currentLocationId) return;
    try {
        setLoading(true);
        await crmService.reindexLeads(currentLocationId);
        setSuccess('Reindexing triggered successfully');
        fetchLeads();
    } catch (err: any) {
        setError('Failed to reindex');
    } finally {
        setLoading(false);
    }
  };

  const handleSaveLead = async () => {
    if (!currentLocationId) return;
    if (!currentLead.first_name || !currentLead.last_name) return setError('Name is required');

    try {
        const payload = {
            ...currentLead,
            location_id: currentLocationId,
            status: currentLead.status || 'NEW',
            added_by_staff_id: userParams?.staff_id 
        };
        await crmService.upsertLead(payload, currentLocationId || undefined);
        setSuccess('Lead saved successfully');
        setIsModalOpen(false);
        fetchLeads();
    } catch (err: any) {
        setError(err.message || 'Failed to save lead');
    }
  };

  const openModal = (lead?: Lead) => {
    setCurrentLead(lead || { status: 'NEW', lead_source: '' });
    setIsModalOpen(true);
  };

  const handleImportCSV = async () => {
    if (!importFile || !currentLocationId) return;
    
    setImporting(true);
    try {
      // 1. Read and validate CSV
      const text = await importFile.text();
      const lines = text.split(/\r?\n/).filter(line => line.trim());
      if (lines.length < 2) {
        throw new Error('CSV is empty or lacks data');
      }

      const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
      const expectedHeaders = ['first_name', 'last_name', 'email', 'mobile', 'status', 'source', 'staff_name', 'notes'];
      
      const missingHeaders = expectedHeaders.filter(h => !headers.includes(h));
      if (missingHeaders.length > 0) {
        throw new Error(`Invalid CSV format. Missing columns: ${missingHeaders.join(', ')}`);
      }

      // Check order
      const headersInOrder = lines[0].split(',').map(h => h.trim());
      const expectedInOrder = ['first_name', 'last_name', 'email', 'mobile', 'status', 'source', 'staff_name', 'notes'];
      
      const isCorrectOrder = expectedInOrder.every((h, i) => headersInOrder[i]?.toLowerCase() === h.toLowerCase());
      if (!isCorrectOrder) {
         throw new Error('CSV columns must be in this exact order: ' + expectedInOrder.join(', '));
      }

      // 2. Upload
      const formData = new FormData();
      formData.append('file', importFile);
      
      await crmService.importBulkLeads(formData, currentLocationId);
      setSuccess('Leads imported successfully');
      setIsImportModalOpen(false);
      setImportFile(null);
      fetchLeads();
    } catch (err: any) {
      setError(err.message || 'Failed to import leads');
    } finally {
      setImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const headers = ['first_name', 'last_name', 'email', 'mobile', 'status', 'source', 'staff_name', 'notes'];
    const data = ['John', 'Doe', 'john.doe@example.com', '555-0199', 'NEW', 'Walk-In', 'Alice Smith', 'Interested in morning classes'];
    
    // Join with newlines and BOM for Excel compatibility if needed, but standard CSV is fine
    const csvContent = [headers.join(','), data.join(',')].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', 'leads_import_sample.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Render Helpers ---

  const renderSortIcon = (field: string) => {
    if (sortField !== field) return null;
    return sortOrder === 'asc' ? <ArrowUpwardIcon sx={{ fontSize: 14 }} /> : <ArrowDownwardIcon sx={{ fontSize: 14 }} />;
  };

  return (
    <Box sx={{ width: '100%', pb: 5 }}>
      <PageHeader 
        title="Leads Management" 
        description="View and manage potential customers."
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Leads', active: true }]}
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
                <Button 
                    variant="contained" 
                    startIcon={<AddIcon />} 
                    onClick={() => openModal()} 
                    sx={{ 
                      bgcolor: '#4182f9', 
                      borderRadius: '8px', 
                      textTransform: 'none',
                      px: 3,
                      '&:hover': { bgcolor: '#3a75e0' }
                    }}
                >
                    Add Lead
                </Button>
                <Button 
                    variant="outlined" 
                    startIcon={<ArrowUpwardIcon />} 
                    onClick={() => setIsImportModalOpen(true)} 
                    sx={{ 
                      borderColor: '#4182f9',
                      color: '#4182f9',
                      borderRadius: '8px', 
                      textTransform: 'none',
                      px: 3,
                      '&:hover': { bgcolor: 'rgba(65, 130, 249, 0.04)', borderColor: '#3a75e0' }
                    }}
                >
                    Import Leads (CSV)
                </Button>
            </Box>
        </Box>

        {/* Data Table */}
        <TableContainer sx={{ maxHeight: 'calc(100vh - 280px)' }}>
            <Table stickyHeader size="small">
                <TableHead>
                    <TableRow>
                        <TableCell onClick={() => handleSort('first_name')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              FIRST NAME {renderSortIcon('first_name')}
                            </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('last_name')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                              LAST NAME {renderSortIcon('last_name')}
                            </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('email')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                EMAIL {renderSortIcon('email')}
                             </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('mobile')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                MOBILE {renderSortIcon('mobile')}
                             </Box>
                        </TableCell>
                         <TableCell onClick={() => handleSort('status')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                STATUS {renderSortIcon('status')}
                             </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('lead_source')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                SOURCE {renderSortIcon('lead_source')}
                             </Box>
                        </TableCell>
                        <TableCell onClick={() => handleSort('created_at')} sx={{ cursor: 'pointer', py: 2, bgcolor: 'white' }}>
                             <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                CREATED AT {renderSortIcon('created_at')}
                             </Box>
                        </TableCell>
                        <TableCell sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', bgcolor: 'white' }}>NOTES</TableCell>
                        <TableCell align="right" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.05em', bgcolor: 'white' }}>ACTIONS</TableCell>
                    </TableRow>
                    {/* Column Search Row */}
                    <TableRow>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="First Name" value={columnSearch.first_name || ''} onChange={(e) => handleColumnSearch('first_name', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Last Name" value={columnSearch.last_name || ''} onChange={(e) => handleColumnSearch('last_name', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Email" value={columnSearch.email || ''} onChange={(e) => handleColumnSearch('email', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Mobile" value={columnSearch.mobile || ''} onChange={(e) => handleColumnSearch('mobile', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Status" value={columnSearch.status || ''} onChange={(e) => handleColumnSearch('status', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }}>
                          <TextField size="small" fullWidth placeholder="Source" value={columnSearch.lead_source || ''} onChange={(e) => handleColumnSearch('lead_source', e.target.value)} variant="standard" InputProps={{ disableUnderline: false, sx: { fontSize: '0.8rem' } }} />
                        </TableCell>
                        <TableCell sx={{ py: 1, borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }} />
                        <TableCell colSpan={2} sx={{ borderBottom: '1px solid #f1f5f9', position: 'sticky', top: 52, zIndex: 1, bgcolor: 'white' }} />
                    </TableRow>
                </TableHead>
                <TableBody>
                    {loading && leads.length === 0 ? (
                        <TableRow><TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>Loading leads...</TableCell></TableRow>
                    ) : (
                      leads.map((lead) => (
                        <TableRow key={lead.lead_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{lead.first_name}</TableCell>
                            <TableCell sx={{ fontWeight: 600, color: '#1e293b' }}>{lead.last_name}</TableCell>
                            <TableCell sx={{ color: '#64748b' }}>{lead.email}</TableCell>
                            <TableCell>{lead.mobile}</TableCell>
                            <TableCell>
                                <Chip 
                                  label={lead.status} 
                                  size="small" 
                                  sx={{ 
                                    height: 22, 
                                    fontSize: '0.7rem', 
                                    fontWeight: 700, 
                                    bgcolor: '#0f172a', 
                                    color: 'white',
                                    borderRadius: '6px'
                                  }} 
                                />
                            </TableCell>
                            <TableCell>
                               <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.8rem' }}>{lead.lead_source || '-'}</Typography>
                            </TableCell>
                            <TableCell sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                <Box sx={{ fontWeight: 600 }}>{new Date(lead.created_at).toLocaleDateString()}</Box>
                                <Box sx={{ opacity: 0.8 }}>{new Date(lead.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Box>
                            </TableCell>
                            <TableCell sx={{ maxWidth: 200, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontStyle: 'italic', color: '#94a3b8' }}>
                              {lead.notes}
                            </TableCell>
                            <TableCell align="right">
                                <IconButton size="small" onClick={() => openModal(lead)} sx={{ color: '#94a3b8' }}>
                                    <EditIcon fontSize="small" />
                                </IconButton>
                            </TableCell>
                        </TableRow>
                      ))
                    )}
                    {!loading && leads.length === 0 && (
                        <TableRow>
                            <TableCell colSpan={9} align="center" sx={{ py: 8, color: 'text.secondary' }}>
                                {!currentLocationId 
                                    ? "Please select a location from the top menu to view leads." 
                                    : "No leads found matching your search."}
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


      {/* Upsert Modal */}
      <Dialog open={isModalOpen} onClose={() => setIsModalOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {currentLead.lead_id ? 'Edit Lead' : 'Add New Lead'}
            <IconButton onClick={() => setIsModalOpen(false)}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Grid container spacing={2}>
                <Grid size={{ xs: 6 }}>
                    <TextField fullWidth label="First Name" value={currentLead.first_name || ''} onChange={(e) => setCurrentLead({ ...currentLead, first_name: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 6 }}>
                    <TextField fullWidth label="Last Name" value={currentLead.last_name || ''} onChange={(e) => setCurrentLead({ ...currentLead, last_name: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Email" value={currentLead.email || ''} onChange={(e) => setCurrentLead({ ...currentLead, email: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Mobile" value={currentLead.mobile || ''} onChange={(e) => setCurrentLead({ ...currentLead, mobile: e.target.value })} />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Status" value={currentLead.status || 'NEW'} onChange={(e) => setCurrentLead({ ...currentLead, status: e.target.value })} helperText="e.g. NEW, CONTACTED" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth label="Lead Source" value={currentLead.lead_source || ''} onChange={(e) => setCurrentLead({ ...currentLead, lead_source: e.target.value })} placeholder="e.g. Facebook, Walk-in" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                    <TextField fullWidth multiline rows={3} label="Notes" value={currentLead.notes || ''} onChange={(e) => setCurrentLead({ ...currentLead, notes: e.target.value })} />
                </Grid>
            </Grid>
        </DialogContent>
        <DialogActions>
            <Button onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={handleSaveLead}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Import CSV Modal */}
      <Dialog open={isImportModalOpen} onClose={() => !importing && setIsImportModalOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            Import Leads from CSV
            <IconButton onClick={() => setIsImportModalOpen(false)} disabled={importing}><CloseIcon /></IconButton>
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ mb: 3 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#1e293b' }}>Required CSV Structure:</Typography>
                    <Button 
                        size="small" 
                        startIcon={<DownloadIcon />} 
                        onClick={handleDownloadSample}
                        sx={{ textTransform: 'none', color: '#4182f9', fontWeight: 600 }}
                    >
                        Download Sample .csv
                    </Button>
                </Box>
                <TableContainer component={Paper} variant="outlined" sx={{ bgcolor: '#f8fafc', mb: 1 }}>
                    <Table size="small">
                        <TableHead sx={{ bgcolor: '#f1f5f9' }}>
                            <TableRow>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>first_name</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>last_name</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>email</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>mobile</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>status</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>source</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>staff_name</TableCell>
                                <TableCell sx={{ fontSize: '0.7rem', fontWeight: 700 }}>notes</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            <TableRow sx={{ '& td': { fontSize: '0.7rem', color: '#64748b' } }}>
                                <TableCell>John</TableCell>
                                <TableCell>Doe</TableCell>
                                <TableCell>john@example.com</TableCell>
                                <TableCell>555-0199</TableCell>
                                <TableCell>NEW</TableCell>
                                <TableCell>Walk-In</TableCell>
                                <TableCell>Alice Smith</TableCell>
                                <TableCell>Interested...</TableCell>
                            </TableRow>
                        </TableBody>
                    </Table>
                </TableContainer>
                <Typography variant="caption" color="text.secondary">
                    * Header row is mandatory. Columns must be in this exact order.
                </Typography>
            </Box>

            <Box 
                sx={{ 
                    border: '2px dashed #e2e8f0', 
                    borderRadius: 2, 
                    p: 4, 
                    textAlign: 'center',
                    bgcolor: importFile ? '#f0f9ff' : 'transparent',
                    cursor: 'pointer',
                    '&:hover': { borderColor: '#4182f9' }
                }}
                onClick={() => document.getElementById('csv-upload')?.click()}
            >
                <input 
                    type="file" 
                    id="csv-upload" 
                    accept=".csv" 
                    hidden 
                    onChange={(e) => setImportFile(e.target.files?.[0] || null)} 
                />
                {importFile ? (
                    <Box>
                        <Typography variant="body1" sx={{ fontWeight: 600, color: '#0369a1' }}>{importFile.name}</Typography>
                        <Typography variant="caption" color="text.secondary">Click to change file</Typography>
                    </Box>
                ) : (
                    <Box>
                        <Typography variant="body1" sx={{ color: '#64748b' }}>Click to select a CSV file</Typography>
                        <Typography variant="caption" color="text.secondary">Only .csv files are supported</Typography>
                    </Box>
                )}
            </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setIsImportModalOpen(false)} disabled={importing}>Cancel</Button>
            <Button 
                variant="contained" 
                onClick={handleImportCSV} 
                disabled={!importFile || importing}
                startIcon={importing ? <CircularProgress size={20} /> : null}
            >
                {importing ? 'Importing...' : 'Start Import'}
            </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error">{error}</Alert>
      </Snackbar>
      <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
         <Alert severity="success">{success}</Alert>
      </Snackbar>
    </Box>
  );
};
