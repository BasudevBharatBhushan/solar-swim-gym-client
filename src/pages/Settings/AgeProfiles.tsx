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
  Stack
} from '@mui/material';
import { EditOutlined, DeleteOutline, Add, InfoOutlined } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';

// Config
const API_URL = 'http://localhost:3001/api/v1';

export const AgeProfiles = () => {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>({});
  
  const { token } = useAuth();
  const { refreshAgeGroups } = useConfig();

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API_URL}/config/age-groups`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setData(res.data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch age groups');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (profile?: any) => {
    setCurrentProfile(profile || { name: '', min_age: '', max_age: '' });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProfile({});
  };

  const handleSave = async () => {
    try {
      const payload = {
        name: currentProfile.name,
        min_age: parseFloat(currentProfile.min_age),
        max_age: parseFloat(currentProfile.max_age)
      };

      if (currentProfile.id) {
        await axios.put(`${API_URL}/config/age-groups/${currentProfile.id}`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Profile updated successfully');
      } else {
        await axios.post(`${API_URL}/config/age-groups`, payload, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Profile created successfully');
      }
      
      handleCloseDialog();
      fetchData();
      refreshAgeGroups(); // Update global config context
    } catch (err) {
      console.error(err);
      setError('Failed to save age profile');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this age profile?')) return;
    
    try {
        await axios.delete(`${API_URL}/config/age-groups/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
        });
        setSuccess('Profile deleted successfully');
        fetchData();
        refreshAgeGroups();
    } catch (err) {
        console.error(err);
        setError('Delete operation not supported or failed');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader 
        title="Age Profiles Management" 
        description="Define and manage age ranges for membership subscriptions."
        breadcrumbs={[
            { label: 'Settings', href: '/settings' },
            { label: 'Age Profiles', active: true }
        ]}
        action={
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpenDialog()}
                sx={{ px: 3 }}
            >
                Add New Profile
            </Button>
        }
      />

      <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: 1, border: '1px solid', borderColor: '#e2e8f0' }}>
        <Table sx={{ minWidth: 650 }} aria-label="age profiles table">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Profile Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Min Age</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Max Age</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                  {row.name}
                </TableCell>
                <TableCell align="center">{row.min_age}</TableCell>
                <TableCell align="center">{row.max_age}</TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(row)} sx={{ mr: 1, color: 'text.secondary' }}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ color: 'text.secondary' }}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No age profiles found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <InfoOutlined color="info" sx={{ mt: 0.25 }} />
        <Box>
          <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Profile Synchronization</Typography>
          <Typography variant="body2" color="text.secondary">
            Changes to age profiles will immediately reflect across all new subscription plans and service bookings. 
            Existing subscriptions will maintain their original profile assignment until manual update.
          </Typography>
        </Box>
      </Paper>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentProfile.id ? 'Edit Profile' : 'Add New Profile'}</DialogTitle>
        <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField 
                    label="Profile Name" 
                    fullWidth 
                    value={currentProfile.name || ''}
                    onChange={(e) => setCurrentProfile({...currentProfile, name: e.target.value})}
                />
                <Stack direction="row" spacing={2}>
                    <TextField 
                        label="Min Age" 
                        type="number" 
                        fullWidth 
                        value={currentProfile.min_age || ''}
                        onChange={(e) => setCurrentProfile({...currentProfile, min_age: e.target.value})}
                    />
                    <TextField 
                        label="Max Age" 
                        type="number" 
                        fullWidth 
                        value={currentProfile.max_age || ''}
                        onChange={(e) => setCurrentProfile({...currentProfile, max_age: e.target.value})}
                    />
                </Stack>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save Profile</Button>
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
