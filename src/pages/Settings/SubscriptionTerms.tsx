import { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  Box, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Button, 
  IconButton, 
  Typography, 
  Alert, 
  Snackbar,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  MenuItem,
  Chip
} from '@mui/material';
import { EditOutlined, DeleteOutline, Add } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';
import { dropdownOptions } from '../../lib/dropdownOptions';

const API_URL = 'http://localhost:3001/api/v1';

export const SubscriptionTerms = () => {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentTerm, setCurrentTerm] = useState<any>({});
  
  const { token, currentLocationId, locations } = useAuth();
  const { refreshSubscriptionTerms } = useConfig();
  const currentLocation = locations.find(l => l.location_id === currentLocationId);

  const fetchData = async () => {
    if (!currentLocationId) return;
    try {
      const res = await axios.get(`${API_URL}/config/subscription-terms`, {
        headers: { 
            Authorization: `Bearer ${token}`,
            'x-location-id': currentLocationId 
        }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch subscription terms');
    }
  };

  useEffect(() => {
    if (currentLocationId) {
        fetchData();
    } else {
        setData([]);
    }
  }, [currentLocationId]);

  const handleOpenDialog = (term?: any) => {
    setCurrentTerm(term || { name: '', duration_months: '', payment_mode: 'RECURRING' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentTerm({});
  };

  const handleSave = async () => {
    if (!currentLocationId) {
        setError("Please select a location first.");
        return;
    }
    try {
      await axios.post(`${API_URL}/config/subscription-terms`, { ...currentTerm, location_id: currentLocationId }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Subscription term saved');
      setOpenDialog(false);
      await fetchData();
      await refreshSubscriptionTerms();
    } catch (err) {
      console.error(err);
      setError('Failed to save subscription term');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure?')) return;
    try {
        await axios.delete(`${API_URL}/config/subscription-terms/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Term deleted');
        fetchData();
    } catch (err) {
        console.error(err);
        setError('Failed to delete term');
    }
  };

  if (!currentLocationId) {
      return (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <Alert severity="warning" variant="filled">
                  Please select a location from the top bar to view subscription terms.
              </Alert>
          </Box>
      );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader 
        title={`Subscription Terms`}
        description="Define and manage subscription durations and payment modes."
        breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Subscription', active: true }
        ]}
        action={
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpenDialog()}
            >
                Add Row
            </Button>
        }
      />

      <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: 1, border: '1px solid', borderColor: '#e2e8f0' }}>
        <Table sx={{ minWidth: 650 }} aria-label="subscription terms table">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell style={{ width: '40%', fontWeight: 600 }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Duration (Months)</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Payment Mode</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id || row.subscription_term_id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">{row.duration_months}</TableCell>
                <TableCell align="center">
                    <Chip 
                        label={row.payment_mode === 'RECURRING' ? 'SUBSCRIPTION' : (row.payment_mode || 'UNKNOWN').replace(/_/g, ' ')} 
                        color={row.payment_mode === 'RECURRING' ? 'success' : 'info'}
                        size="small"
                        sx={{ 
                            borderRadius: '6px', 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            bgcolor: row.payment_mode === 'RECURRING' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(59, 130, 246, 0.1)',
                            color: row.payment_mode === 'RECURRING' ? 'secondary.dark' : 'info.dark',
                        }}
                    />
                </TableCell>
                <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => handleOpenDialog(row)} sx={{ color: 'text.secondary' }}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(row.id || row.subscription_term_id)} sx={{ color: 'text.secondary' }}>
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </Stack>
                </TableCell>
              </TableRow>
            ))}
             {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No subscription terms found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentTerm.id || currentTerm.subscription_term_id ? 'Edit Term' : 'Add New Term'}</DialogTitle>
        <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField 
                    label="Name" 
                    fullWidth 
                    value={currentTerm.name || ''}
                    onChange={(e) => setCurrentTerm({...currentTerm, name: e.target.value})}
                    placeholder="e.g. Yearly, Monthly"
                />
                <TextField 
                    label="Duration (Months)" 
                    type="number"
                    fullWidth 
                    value={currentTerm.duration_months || ''}
                    onChange={(e) => setCurrentTerm({...currentTerm, duration_months: e.target.value})}
                />
                <TextField 
                    select
                    label="Payment Mode" 
                    fullWidth 
                    value={currentTerm.payment_mode || 'RECURRING'}
                    onChange={(e) => setCurrentTerm({...currentTerm, payment_mode: e.target.value})}
                >
                    {dropdownOptions.subscriptionTerms.map((opt) => (
                        <MenuItem key={opt.value} value={opt.value}>
                            {opt.label}
                        </MenuItem>
                    ))}
                </TextField>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save Term</Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError(null)}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
       <Snackbar open={!!success} autoHideDuration={6000} onClose={() => setSuccess(null)}>
        <Alert severity="success" variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};
