import { useEffect, useState } from 'react';
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
  FormControlLabel,
  Checkbox,
  Chip,
  Tabs,
  Tab
} from '@mui/material';
import { EditOutlined, DeleteOutline, Add, InfoOutlined } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';
import { configService } from '../../services/configService';

// Config
export const AgeProfiles = () => {
  const [data, setData] = useState<any[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<any>({});
  
  // Tab state: 0 for Membership, 1 for Service
  const [activeTab, setActiveTab] = useState(0);

  const { currentLocationId } = useAuth();
  const { refreshAgeGroups } = useConfig();

  const fetchData = async () => {
    if (!currentLocationId) return;
    try {
      const res = await configService.getAgeGroups(currentLocationId);
      setData(res || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch age groups');
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentLocationId]);

  const handleOpenDialog = (profile?: any) => {
    setCurrentProfile(profile || { 
      name: '', 
      min_age: '', 
      max_age: '',
      accept_guardian_information: false,
      age_group_category: activeTab === 0 ? 'Membership' : 'Service'
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentProfile({});
  };

  const handleSave = async () => {
    try {
      const payload: any = {
        name: currentProfile.name,
        min_age: parseFloat(currentProfile.min_age),
        max_age: parseFloat(currentProfile.max_age),
        accept_guardian_information: currentProfile.accept_guardian_information || false,
        age_group_category: currentProfile.age_group_category || (activeTab === 0 ? 'Membership' : 'Service')
      };

      if (currentProfile.age_group_id) {
        payload.age_group_id = currentProfile.age_group_id;
      }

      if (currentLocationId) {
        payload.location_id = currentLocationId;
      }

      await configService.upsertAgeGroup(payload, currentLocationId || undefined);
      setSuccess(currentProfile.age_group_id ? 'Profile updated successfully' : 'Profile created successfully');
      
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
        await configService.deleteAgeGroup(id, currentLocationId || undefined);
        setSuccess('Profile deleted successfully');
        fetchData();
        refreshAgeGroups();
    } catch (err: any) {
        console.error(err);
        const errorMsg = err.response?.data?.error || err.message || '';
        if (errorMsg.includes('foreign key constraint')) {
            setError('Cannot delete this age profile because it is linked to pricing or services. Please remove those links first.');
        } else {
            setError('Failed to delete age profile');
        }
    }
  };

  if (!currentLocationId) {
      return (
          <Box sx={{ p: 4, display: 'flex', justifyContent: 'center' }}>
              <Alert severity="warning" variant="filled">
                  Please select a location from the top bar to view age profiles.
              </Alert>
          </Box>
      );
  }

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader 
        title="Age Profiles Management" 
        description="Define and manage age ranges for membership subscriptions."
        breadcrumbs={[
            { label: 'Settings', href: '/admin/settings' },
            { label: 'Age Profiles', active: true }
        ]}
        action={
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpenDialog()}
                sx={{ px: 3 }}
            >
                Add New Age Profile
            </Button>
            }
        />

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={activeTab} onChange={(_, newValue) => setActiveTab(newValue)} aria-label="age profiles tabs">
          <Tab label="Membership Profiles" sx={{ textTransform: 'none', fontWeight: 600 }} />
          <Tab label="Service Profiles" sx={{ textTransform: 'none', fontWeight: 600 }} />
        </Tabs>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: 1, border: '1px solid', borderColor: '#e2e8f0' }}>
        <Table sx={{ minWidth: 650 }} aria-label="age profiles table">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Profile Name</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Min Age</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Max Age</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Guardian Info</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.filter(row => {
                const isService = row.age_group_category === 'Service';
                return activeTab === 0 ? !isService : isService;
            }).map((row) => (
              <TableRow key={row.age_group_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                  {row.name}
                </TableCell>
                <TableCell align="center">{row.min_age}</TableCell>
                <TableCell align="center">{row.max_age}</TableCell>
                <TableCell align="center">
                    {row.accept_guardian_information ? (
                        <Chip label="Required" size="small" color="primary" variant="outlined" />
                    ) : (
                        <span style={{ color: '#ccc' }}>-</span>
                    )}
                </TableCell>

                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpenDialog(row)} sx={{ mr: 1, color: 'text.secondary' }}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={() => handleDelete(row.age_group_id)} sx={{ color: 'text.secondary' }}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.filter(row => {
                const isService = row.age_group_category === 'Service';
                return activeTab === 0 ? !isService : isService;
            }).length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                  No age profiles found for this category.
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
      <Dialog 
        open={openDialog} 
        onClose={handleCloseDialog} 
        maxWidth="sm" 
        fullWidth
        aria-labelledby="age-profile-dialog-title"
      >
        <DialogTitle id="age-profile-dialog-title">
          {currentProfile.age_group_id ? 'Edit Age Profile' : 'Add New Age Profile'}
        </DialogTitle>
        <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField 
                    label="Profile Name" 
                    fullWidth 
                    autoFocus
                    value={currentProfile.name || ''}
                    onChange={(e) => setCurrentProfile({...currentProfile, name: e.target.value})}
                />
                <Stack direction="row" spacing={2}>
                    <TextField 
                        label="Min Age" 
                        type="number" 
                        fullWidth 
                        value={currentProfile.min_age ?? ''}
                        onChange={(e) => setCurrentProfile({...currentProfile, min_age: e.target.value})}
                    />
                    <TextField 
                        label="Max Age" 
                        type="number" 
                        fullWidth 
                        value={currentProfile.max_age ?? ''}
                        onChange={(e) => setCurrentProfile({...currentProfile, max_age: e.target.value})}
                    />
                </Stack>
                
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={currentProfile.accept_guardian_information || false}
                            onChange={(e) => setCurrentProfile({...currentProfile, accept_guardian_information: e.target.checked})}
                        />
                    }
                    label="Require Guardian Information"
                />

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
