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
      await axios.post(`${API_URL}/config/age-groups`, currentProfile, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setSuccess('Age group saved successfully');
      setOpenDialog(false);
      await fetchData();
      await refreshAgeGroups();
    } catch (err) {
      console.error(err);
      setError('Failed to save age group');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this profile?')) return;
    // Assuming there's a delete endpoint, otherwise this part might need adjustment based on API capabilities
    // The prompt implied standard management. If no DELETE endpoint exists, this might fail or need removal.
    // For now I'll mock the success or try a delete call if standard REST.
    // If not standard, I'll just show error.
    try {
        // Optimistic delete for now as API might not support it yet based on previous conversations?
        // Actually earlier conversation said "Use POST ... Do NOT deduplicate", didn't mention delete.
        // But the ID shows "Trash" icon.
        // I'll try standard DELETE.
        // If it fails, I will alert user.
         await axios.delete(`${API_URL}/config/age-groups/${id}`, {
            headers: { Authorization: `Bearer ${token}` }
         });
         setSuccess('Age group deleted');
         fetchData();
    } catch (err) {
        // Fallback or explicit error
        console.error(err);
        setError('Delete operation not supported or failed');
    }
  };

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
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
              <TableCell style={{ width: '40%', fontWeight: 600 }}>Profile Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Min Age</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Max Age</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.id || row.age_group_id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600, fontSize: '0.9rem' }}>
                    {row.name}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    ID: {row.id || row.age_group_id}
                  </Typography>
                </TableCell>
                <TableCell align="center">{row.min_age}</TableCell>
                <TableCell align="center">{row.max_age}</TableCell>
                <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => handleOpenDialog(row)} sx={{ color: 'text.secondary' }}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDelete(row.id || row.age_group_id)} sx={{ color: 'text.secondary' }}>
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </Stack>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={4} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No age profiles found. Create one to get started.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* Footer Info Box */}
      <Paper 
        elevation={0} 
        sx={{ 
            p: 2.5, 
            bgcolor: '#eff6ff', 
            borderRadius: 1,
            display: 'flex',
            gap: 2
        }}
      >
        <InfoOutlined color="primary" sx={{ mt: 0.5 }} />
        <Box>
            <Typography variant="subtitle2" color="primary.main" gutterBottom>
                Profile Synchronization
            </Typography>
            <Typography variant="body2" color="text.secondary">
                Changes made to age profiles will automatically propagate to all service fee calculations and membership eligibility checks for the selected location.
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
