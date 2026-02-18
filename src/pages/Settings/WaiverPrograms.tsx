import React, { useEffect, useState } from 'react';
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
  Switch,
  Chip
} from '@mui/material';
import { EditOutlined, Add, InfoOutlined } from '@mui/icons-material';
import { useAuth } from '../../context/AuthContext';
import { configService } from '../../services/configService';
import { PageHeader } from '../../components/Common/PageHeader';

export const WaiverPrograms = () => {
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string|null>(null);
    const [success, setSuccess] = useState<string|null>(null);
    const [openDialog, setOpenDialog] = useState(false);
    const [currentProgram, setCurrentProgram] = useState<any>({});
    
    const { token, currentLocationId } = useAuth();
    // Assuming location_id comes from userDetails or context for the header
    const locationId = currentLocationId;

    const fetchData = async () => {
        setLoading(true);
        try {
            const res = await configService.getWaiverPrograms(locationId || undefined);
            setData(res || []);
        } catch (err) {
            console.error(err);
            setError('Failed to fetch waiver programs');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [locationId]);

    const handleOpenDialog = (program?: any) => {
        setCurrentProgram(program || { 
            name: '', 
            code: '', 
            description: '', 
            requires_case_manager: false,
            is_active: true
        });
        setOpenDialog(true);
    };

    const handleCloseDialog = () => {
        setOpenDialog(false);
        setCurrentProgram({});
    };

    const handleSave = async () => {
        try {
            const payload = {
                ...currentProgram,
                location_id: locationId
            };
            
            await configService.upsertWaiverProgram(payload);
            setSuccess(currentProgram.waiver_program_id ? 'Program updated successfully' : 'Program created successfully');
            handleCloseDialog();
            fetchData();
        } catch (err) {
            console.error(err);
            setError('Failed to save waiver program');
        }
    };

    return (
        <Box sx={{ width: '100%' }}>
            <PageHeader 
                title="Waiver Programs" 
                description="Manage government or partner-funded waiver programs available at this location."
                breadcrumbs={[
                    { label: 'Settings', href: '/admin/settings' },
                    { label: 'Waiver Programs', active: true }
                ]}
                action={
                    <Button 
                        variant="contained" 
                        startIcon={<Add />} 
                        onClick={() => handleOpenDialog()}
                        sx={{ px: 3 }}
                    >
                        Add Program
                    </Button>
                }
            />

            <TableContainer component={Paper} elevation={0} sx={{ mb: 4, borderRadius: 1, border: '1px solid', borderColor: '#e2e8f0' }}>
                <Table sx={{ minWidth: 650 }} aria-label="waiver programs table">
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Program Name</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Code</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }}>Description</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Case Manager</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="center">Status</TableCell>
                            <TableCell sx={{ fontWeight: 700, color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase' }} align="right">Actions</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {data.map((row) => (
                            <TableRow key={row.waiver_program_id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                                <TableCell component="th" scope="row" sx={{ fontWeight: 600 }}>
                                    {row.name}
                                </TableCell>
                                <TableCell>{row.code}</TableCell>
                                <TableCell sx={{ maxWidth: 300, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {row.description}
                                </TableCell>
                                <TableCell align="center">
                                    {row.requires_case_manager ? 
                                        <Chip label="Required" size="small" color="primary" variant="outlined" /> : 
                                        <Chip label="Optional" size="small" variant="outlined" color="default" />
                                    }
                                </TableCell>
                                <TableCell align="center">
                                    <Chip 
                                        label={row.is_active ? 'Active' : 'Inactive'} 
                                        size="small" 
                                        color={row.is_active ? 'success' : 'default'} 
                                        variant={row.is_active ? 'filled' : 'outlined'}
                                    />
                                </TableCell>
                                <TableCell align="right">
                                    <IconButton size="small" onClick={() => handleOpenDialog(row)} sx={{ color: 'text.secondary' }}>
                                        <EditOutlined fontSize="small" />
                                    </IconButton>
                                </TableCell>
                            </TableRow>
                        ))}
                        {!loading && data.length === 0 && (
                            <TableRow>
                                <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                                    No waiver programs found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            <Paper elevation={0} sx={{ p: 2, bgcolor: '#f8fafc', border: '1px solid', borderColor: '#e2e8f0', display: 'flex', alignItems: 'flex-start', gap: 2 }}>
                <InfoOutlined color="info" sx={{ mt: 0.25 }} />
                <Box>
                    <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.5 }}>Program Configuration</Typography>
                    <Typography variant="body2" color="text.secondary">
                        Programs configured here will be available for selection during client onboarding. 
                        Enabling "Requires Case Manager" will enforce data collection for Case Manager Name and Email during registration.
                    </Typography>
                </Box>
            </Paper>

            {/* Add/Edit Dialog */}
            <Dialog 
                open={openDialog} 
                onClose={handleCloseDialog} 
                maxWidth="sm" 
                fullWidth
            >
                <DialogTitle>
                    {currentProgram.waiver_program_id ? 'Edit Waiver Program' : 'Add New Program'}
                </DialogTitle>
                <DialogContent dividers>
                    <Stack spacing={3} sx={{ mt: 1 }}>
                        <TextField 
                            label="Program Name" 
                            fullWidth 
                            autoFocus
                            value={currentProgram.name || ''}
                            onChange={(e) => setCurrentProgram({...currentProgram, name: e.target.value})}
                        />
                        <TextField 
                            label="Program Code" 
                            fullWidth 
                            placeholder="e.g., SLW-001"
                            value={currentProgram.code || ''}
                            onChange={(e) => setCurrentProgram({...currentProgram, code: e.target.value})}
                            helperText="Unique identifier for internal use."
                        />
                        <TextField 
                            label="Description" 
                            fullWidth 
                            multiline
                            rows={3}
                            value={currentProgram.description || ''}
                            onChange={(e) => setCurrentProgram({...currentProgram, description: e.target.value})}
                        />
                        
                        <FormControlLabel
                            control={
                                <Switch 
                                    checked={currentProgram.requires_case_manager || false}
                                    onChange={(e) => setCurrentProgram({...currentProgram, requires_case_manager: e.target.checked})}
                                />
                            }
                            label="Requires Case Manager Info"
                        />
                         <Typography variant="caption" color="text.secondary" sx={{ mt: -2, ml: 4, display: 'block' }}>
                            If enabled, Case Manager Name and Email will be mandatory during onboarding for this program.
                        </Typography>

                         <FormControlLabel
                            control={
                                <Switch 
                                    checked={currentProgram.is_active !== false}
                                    onChange={(e) => setCurrentProgram({...currentProgram, is_active: e.target.checked})}
                                />
                            }
                            label="Program Active"
                        />
                    </Stack>
                </DialogContent>
                <DialogActions sx={{ p: 2.5 }}>
                    <Button onClick={handleCloseDialog} color="inherit">Cancel</Button>
                    <Button variant="contained" onClick={handleSave}>Save Program</Button>
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
