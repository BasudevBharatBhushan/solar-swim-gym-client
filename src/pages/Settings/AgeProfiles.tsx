import { useEffect, useState, useCallback } from 'react';
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
  Chip
} from '@mui/material';
import { EditOutlined, DeleteOutline, Add, InfoOutlined } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { useConfig } from '../../context/ConfigContext';
import type { AgeGroup } from '../../context/ConfigContext';
import { PageHeader } from '../../components/Common/PageHeader';
import { configService } from '../../services/configService';

type AgeProfile = AgeGroup & {
  accept_guardian_information?: boolean;
};

type AgeProfileForm = {
  age_group_id?: string;
  name: string;
  min_age: number | string;
  max_age: number | string;
  accept_guardian_information: boolean;
};

// Config
export const AgeProfiles = () => {
  const [data, setData] = useState<AgeProfile[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentProfile, setCurrentProfile] = useState<AgeProfileForm>({
    name: '',
    min_age: '',
    max_age: '',
    accept_guardian_information: false
  });
  
  const { currentLocationId } = useAuth();
  const { refreshAgeGroups } = useConfig();

  const fetchData = useCallback(async () => {
    if (!currentLocationId) return;
    try {
      const res = await configService.getAgeGroups(currentLocationId);
      setData(res || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch age groups');
    }
  }, [currentLocationId]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchData();
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [fetchData]);

  const handleOpenDialog = useCallback((profile?: AgeProfile) => {
    setCurrentProfile(profile || { 
      name: '', 
      min_age: '', 
      max_age: '',
      accept_guardian_information: false
    });
    setOpenDialog(true);
  }, []);

  const handleCloseDialog = useCallback(() => {
    setOpenDialog(false);
    setCurrentProfile({
      name: '',
      min_age: '',
      max_age: '',
      accept_guardian_information: false
    });
  }, []);

  const handleOpenNewDialog = useCallback(() => {
    handleOpenDialog();
  }, [handleOpenDialog]);

  const handleEditRowClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const ageGroupId = event.currentTarget.dataset.ageGroupId;
    if (!ageGroupId) return;
    const profile = data.find(row => row.age_group_id === ageGroupId);
    if (!profile) return;
    handleOpenDialog(profile);
  }, [data, handleOpenDialog]);

  const handleSave = useCallback(async () => {
    try {
      const payload: Record<string, unknown> = {
        name: currentProfile.name,
        min_age: parseFloat(currentProfile.min_age),
        max_age: parseFloat(currentProfile.max_age),
        accept_guardian_information: currentProfile.accept_guardian_information || false
      };

      if (currentProfile.age_group_id) {
        payload.age_group_id = currentProfile.age_group_id;
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
  }, [currentLocationId, currentProfile, fetchData, handleCloseDialog, refreshAgeGroups]);

  const handleDelete = useCallback(async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this age profile?')) return;
    
    try {
        await configService.deleteAgeGroup(id, currentLocationId || undefined);
        setSuccess('Profile deleted successfully');
        fetchData();
        refreshAgeGroups();
    } catch (err) {
        console.error(err);
        setError('Delete operation not supported or failed');
    }
  }, [currentLocationId, fetchData, refreshAgeGroups]);

  const handleDeleteRowClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    const ageGroupId = event.currentTarget.dataset.ageGroupId;
    if (!ageGroupId) return;
    handleDelete(ageGroupId);
  }, [handleDelete]);

  const handleCurrentProfileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const field = event.currentTarget.dataset.field;
    if (!field) return;
    setCurrentProfile((prev) => ({ ...prev, [field]: event.target.value }));
  }, []);

  const handleGuardianInfoChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentProfile((prev) => ({ ...prev, accept_guardian_information: event.target.checked }));
  }, []);

  const handleErrorClose = useCallback(() => {
    setError(null);
  }, []);

  const handleSuccessClose = useCallback(() => {
    setSuccess(null);
  }, []);

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
                onClick={handleOpenNewDialog}
                sx={{ px: 3 }}
            >
                Add New Age Profile
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
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Guardian Info</TableCell>
              <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
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
                  <IconButton size="small" onClick={handleEditRowClick} data-age-group-id={row.age_group_id} sx={{ mr: 1, color: 'text.secondary' }}>
                    <EditOutlined fontSize="small" />
                  </IconButton>
                  <IconButton size="small" onClick={handleDeleteRowClick} data-age-group-id={row.age_group_id} sx={{ color: 'text.secondary' }}>
                    <DeleteOutline fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
            {data.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 3, color: 'text.secondary' }}>
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
                    onChange={handleCurrentProfileChange}
                    inputProps={{ 'data-field': 'name' }}
                />
                <Stack direction="row" spacing={2}>
                    <TextField 
                        label="Min Age" 
                        type="number" 
                        fullWidth 
                        value={currentProfile.min_age ?? ''}
                        onChange={handleCurrentProfileChange}
                        inputProps={{ 'data-field': 'min_age' }}
                    />
                    <TextField 
                        label="Max Age" 
                        type="number" 
                        fullWidth 
                        value={currentProfile.max_age ?? ''}
                        onChange={handleCurrentProfileChange}
                        inputProps={{ 'data-field': 'max_age' }}
                    />
                </Stack>
                
                <FormControlLabel
                    control={
                        <Checkbox
                            checked={currentProfile.accept_guardian_information || false}
                            onChange={handleGuardianInfoChange}
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

      <Snackbar open={!!error} autoHideDuration={6000} onClose={handleErrorClose}>
        <Alert severity="error" variant="filled">{error}</Alert>
      </Snackbar>
       <Snackbar open={!!success} autoHideDuration={6000} onClose={handleSuccessClose}>
        <Alert severity="success" variant="filled">{success}</Alert>
      </Snackbar>
    </Box>
  );
};
