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
  MenuItem,
  Chip,
  Grid
} from '@mui/material';
import { EditOutlined, DeleteOutline, Add } from '@mui/icons-material';
import { PageHeader } from '../../components/Common/PageHeader';
import { sessionService } from '../../services/sessionService';
import { Session } from '../../types';

export const Sessions = () => {
  const [data, setData] = useState<Session[]>([]);
  const [error, setError] = useState<string|null>(null);
  const [success, setSuccess] = useState<string|null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [currentSession, setCurrentSession] = useState<Partial<Session>>({});
  
  const fetchData = async () => {
    try {
      const res = await sessionService.getSessions();
      setData(res || []);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch sessions');
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (session?: Session) => {
    setCurrentSession(session || { 
        name: '', 
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date().toISOString().split('T')[0],
        duration_unit: 'MONTH',
        duration: 1,
        is_active: true
    });
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setCurrentSession({});
  };

  const handleSave = async () => {
    try {
      if (!currentSession.name || !currentSession.start_date || !currentSession.end_date) {
        setError('Please fill in all required fields');
        return;
      }

      await sessionService.upsertSession(currentSession as Session);
      setSuccess('Session saved successfully');
      setOpenDialog(false);
      fetchData();
    } catch (err) {
      console.error(err);
      setError('Failed to save session');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this session?')) return;
    try {
        await sessionService.deleteSession(id);
        setSuccess('Session deleted');
        fetchData();
    } catch (err: any) {
        console.error(err);
        setError('Failed to delete session');
    }
  };

  return (
    <Box sx={{ width: '100%' }}>
      <PageHeader 
        title="Sessions"
        description="Manage time-bound sessions for class scheduling and terms."
        breadcrumbs={[
            { label: 'Settings', href: '/admin/settings' },
            { label: 'Sessions', active: true }
        ]}
        action={
            <Button 
                variant="contained" 
                startIcon={<Add />} 
                onClick={() => handleOpenDialog()}
            >
                Add Session
            </Button>
        }
      />

      <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: 1, border: '1px solid', borderColor: '#e2e8f0' }}>
        <Table sx={{ minWidth: 650 }} aria-label="sessions table">
          <TableHead sx={{ bgcolor: '#f8fafc' }}>
            <TableRow>
              <TableCell style={{ width: '30%', fontWeight: 600 }}>Name</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Start Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>End Date</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Duration</TableCell>
              <TableCell align="center" sx={{ fontWeight: 600 }}>Status</TableCell>
              <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {data.map((row) => (
              <TableRow
                key={row.session_id}
                sx={{ '&:last-child td, &:last-child th': { border: 0 } }}
              >
                <TableCell component="th" scope="row">
                  <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                    {row.name}
                  </Typography>
                </TableCell>
                <TableCell align="center">{row.start_date}</TableCell>
                <TableCell align="center">{row.end_date}</TableCell>
                <TableCell align="center">
                    {row.duration} {row.duration_unit?.toLowerCase()}{ (row.duration || 0) > 1 ? 's' : ''}
                </TableCell>
                <TableCell align="center">
                    <Chip 
                        label={row.is_active ? 'ACTIVE' : 'INACTIVE'} 
                        color={row.is_active ? 'success' : 'default'}
                        size="small"
                        sx={{ 
                            borderRadius: '6px', 
                            fontSize: '0.7rem', 
                            fontWeight: 700,
                            bgcolor: row.is_active ? 'rgba(16, 185, 129, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                            color: row.is_active ? 'secondary.dark' : 'text.secondary',
                        }}
                    />
                </TableCell>
                <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <IconButton size="small" onClick={() => handleOpenDialog(row)} sx={{ color: 'text.secondary' }}>
                            <EditOutlined fontSize="small" />
                        </IconButton>
                        <IconButton size="small" onClick={() => row.session_id && handleDelete(row.session_id)} sx={{ color: 'text.secondary' }}>
                            <DeleteOutline fontSize="small" />
                        </IconButton>
                    </Stack>
                </TableCell>
              </TableRow>
            ))}
             {data.length === 0 && (
                <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 6, color: 'text.secondary' }}>
                        No sessions found.
                    </TableCell>
                </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{currentSession.session_id ? 'Edit Session' : 'Add New Session'}</DialogTitle>
        <DialogContent dividers>
            <Stack spacing={3} sx={{ mt: 1 }}>
                <TextField 
                    label="Session Name" 
                    fullWidth 
                    required
                    value={currentSession.name || ''}
                    onChange={(e) => setCurrentSession({...currentSession, name: e.target.value})}
                    placeholder="e.g. Summer 2026"
                />
                
                <Grid container spacing={2}>
                    <Grid size={{ xs: 6 }}>
                        <TextField 
                            label="Start Date" 
                            type="date"
                            fullWidth 
                            required
                            value={currentSession.start_date || ''}
                            onChange={(e) => setCurrentSession({...currentSession, start_date: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                    <Grid size={{ xs: 6 }}>
                        <TextField 
                            label="End Date" 
                            type="date"
                            fullWidth 
                            required
                            value={currentSession.end_date || ''}
                            onChange={(e) => setCurrentSession({...currentSession, end_date: e.target.value})}
                            InputLabelProps={{ shrink: true }}
                        />
                    </Grid>
                </Grid>

                <Grid container spacing={2}>
                    <Grid size={{ xs: 4 }}>
                        <TextField 
                            label="Duration" 
                            type="number"
                            fullWidth
                            value={currentSession.duration || ''}
                            onChange={(e) => setCurrentSession({...currentSession, duration: parseInt(e.target.value) || 0})}
                        />
                    </Grid>
                    <Grid size={{ xs: 8 }}>
                        <TextField 
                            select
                            label="Unit" 
                            fullWidth 
                            value={currentSession.duration_unit || 'MONTH'}
                            onChange={(e) => setCurrentSession({...currentSession, duration_unit: e.target.value as any})}
                        >
                            <MenuItem value="DAY">Day(s)</MenuItem>
                            <MenuItem value="WEEK">Week(s)</MenuItem>
                            <MenuItem value="MONTH">Month(s)</MenuItem>
                        </TextField>
                    </Grid>
                </Grid>

                <TextField 
                    select
                    label="Status" 
                    fullWidth 
                    value={currentSession.is_active ? 'ACTIVE' : 'INACTIVE'}
                    onChange={(e) => setCurrentSession({...currentSession, is_active: e.target.value === 'ACTIVE'})}
                >
                    <MenuItem value="ACTIVE">Active</MenuItem>
                    <MenuItem value="INACTIVE">Inactive</MenuItem>
                </TextField>
            </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 2.5 }}>
            <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
            <Button variant="contained" onClick={handleSave}>Save Session</Button>
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
