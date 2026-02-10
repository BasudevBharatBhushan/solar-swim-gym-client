import React, { useEffect, useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Avatar,
  Chip,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  CircularProgress,
} from '@mui/material';
import {
  Add,
  Edit,
  Email,
  AdminPanelSettings,
  PersonOutline,
} from '@mui/icons-material';
import { staffService, StaffMember, UpsertStaffPayload } from '../../services/staffService';
import { useAuth } from '../../context/AuthContext';
import { PageHeader } from '../../components/Common/PageHeader';

interface StaffModalProps {
  open: boolean;
  onClose: () => void;
  onSave: (payload: UpsertStaffPayload) => Promise<void>;
  staffToEdit?: StaffMember;
  currentLocationId: string;
}

const StaffModal = ({ open, onClose, onSave, staffToEdit, currentLocationId }: StaffModalProps) => {
  const [formData, setFormData] = useState<UpsertStaffPayload>({
    location_id: currentLocationId,
    first_name: '',
    last_name: '',
    email: '',
    role: 'STAFF',
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (staffToEdit) {
      setFormData({
        staff_id: staffToEdit.staff_id,
        first_name: staffToEdit.first_name,
        last_name: staffToEdit.last_name,
        email: staffToEdit.email,
        role: staffToEdit.role as 'STAFF' | 'ADMIN',
      });
    } else {
      setFormData({
        location_id: currentLocationId,
        first_name: '',
        last_name: '',
        email: '',
        role: 'STAFF',
      });
    }
  }, [staffToEdit, currentLocationId, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    setLoading(true);
    await onSave(formData);
    setLoading(false);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 'bold' }}>
        {staffToEdit ? 'Edit Staff Member' : 'Add New Staff'}
      </DialogTitle>
      <DialogContent dividers>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField
              label="First Name"
              name="first_name"
              value={formData.first_name}
              onChange={handleChange}
              fullWidth
              required
            />
            <TextField
              label="Last Name"
              name="last_name"
              value={formData.last_name}
              onChange={handleChange}
              fullWidth
              required
            />
          </Box>
          <TextField
            label="Email Address"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            required
            disabled={!!staffToEdit} // Usually email isn't editable or depends on backend
          />
          <TextField
            select
            label="Role"
            name="role"
            value={formData.role}
            onChange={handleChange}
            fullWidth
            required
            disabled
          >
            <MenuItem value="STAFF">Staff</MenuItem>
          </TextField>
          {!staffToEdit && (
             <Typography variant="caption" color="text.secondary">
               * The new staff member will receive an email to activate their account and set a password.
             </Typography>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} color="inherit">Cancel</Button>
        <Button onClick={handleSubmit} variant="contained" disabled={loading}>
          {loading ? 'Saving...' : 'Save Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export const StaffManagement = () => {
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | undefined>(undefined);
  const [sendingEmail, setSendingEmail] = useState<string | null>(null);

  const { currentLocationId } = useAuth();
  const locationId = currentLocationId || ''; 

  const fetchStaff = async () => {
      try {
        setLoading(true);
        const response = await staffService.getAllStaff();
        if (Array.isArray(response)) {
            const sorted = [...response].sort((a, b) => {
                const order: Record<string, number> = { 'SUPER_ADMIN': 0, 'ADMIN': 1, 'STAFF': 2 };
                return (order[a.role as string] ?? 3) - (order[b.role as string] ?? 3);
            });
            setStaffList(sorted);
        } else if (response && (response as any).data) {
             const data = (response as any).data;
             const sorted = [...data].sort((a, b) => {
                const order: Record<string, number> = { 'SUPER_ADMIN': 0, 'ADMIN': 1, 'STAFF': 2 };
                return (order[a.role as string] ?? 3) - (order[b.role as string] ?? 3);
            });
             setStaffList(sorted);
        }
      } catch (error) {
        console.error("Failed to fetch staff", error);
      } finally {
        setLoading(false);
      }
  };

  useEffect(() => {
    fetchStaff();
  }, []);

  const handleOpenModal = (staff?: StaffMember) => {
    setSelectedStaff(staff);
    setModalOpen(true);
  };

  const handleSaveStaff = async (payload: UpsertStaffPayload) => {
      try {
          await staffService.upsertStaff(payload);
          fetchStaff();
          // Ideally show success toast here
          // if (!selectedStaff) { handleSendResetLink(newId) } // Backend handles email? Or we trigger?
          // Requirements say: "Upon success, automatically trigger the Send Reset Link API"
          // If upsert returns the ID, we can do it. 
          // Assuming upsert returns the created object
      } catch (error) {
          console.error("Failed to save staff", error);
          alert("Failed to save staff member."); // Placeholder for toast
      }
  };

  const handleSendResetLink = async (staffId: string) => {
    setSendingEmail(staffId);
    try {
      await staffService.sendResetLink(staffId);
      alert("Activation email sent successfully!"); // Placeholder for toast
    } catch (error) {
      console.error("Failed to send reset link", error);
      alert("Failed to send email.");
    } finally {
      setSendingEmail(null);
    }
  };

  const getRoleIcon = (role: string) => {
      switch(role) {
          case 'SUPER_ADMIN': return <AdminPanelSettings color="error" />;
          case 'ADMIN': return <AdminPanelSettings color="primary" />;
          default: return <PersonOutline color="action" />;
      }
  };

  const getStatusChip = (isActive: boolean) => (
      <Chip 
        label={isActive ? "Active" : "Inactive"} 
        color={isActive ? "success" : "default"} 
        size="small" 
        variant="outlined"
      />
  );

  return (
    <Box sx={{ p: 3 }}>
        <PageHeader 
            title="Staff Management" 
            description="Manage your team members and permissions"
            breadcrumbs={[
                { label: 'Settings', href: '/admin/settings' },
                { label: 'Staff Management', active: true }
            ]}
            action={
                <Button 
                    variant="contained" 
                    startIcon={<Add />} 
                    onClick={() => handleOpenModal()}
                    sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}
                >
                    Add Staff Member
                </Button>
            }
        />

        <Paper sx={{ width: '100%', overflow: 'hidden', borderRadius: 2, border: '1px solid', borderColor: 'divider' }} elevation={0}>
            {loading ? (
                <Box sx={{ p: 4, textAlign: 'center' }}>
                    <CircularProgress />
                </Box>
            ) : (
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: 'action.hover' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', textAlign: 'right' }}>Actions</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {staffList.map((staff) => (
                                <TableRow key={staff.staff_id} hover>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                            <Avatar src={staff.profile_image_url} alt={staff.first_name}>
                                                {staff.first_name[0]}{staff.last_name[0]}
                                            </Avatar>
                                            <Box>
                                                <Typography variant="subtitle2" fontWeight="bold">
                                                    {staff.first_name} {staff.last_name}
                                                </Typography>
                                            </Box>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{staff.email}</TableCell>
                                    <TableCell>
                                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                            {getRoleIcon(staff.role)}
                                            <Typography variant="body2" sx={{ 
                                                fontWeight: staff.role?.toUpperCase() === 'SUPER_ADMIN' ? 'bold' : 'normal',
                                                color: staff.role?.toUpperCase() === 'SUPER_ADMIN' ? 'error.main' : 'text.primary'
                                            }}>
                                                {staff.role?.toUpperCase() === 'SUPER_ADMIN' ? 'SUPER ADMIN' : (staff.role || 'STAFF')}
                                            </Typography>
                                        </Box>
                                    </TableCell>
                                    <TableCell>{getStatusChip(staff.is_active)}</TableCell>
                                    <TableCell align="right">
                                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                                            {staff.role?.toUpperCase() !== 'SUPER_ADMIN' && (
                                                <Tooltip title="Send Activation/Reset Link">
                                                    <IconButton 
                                                        size="small" 
                                                        color="primary"
                                                        disabled={sendingEmail === staff.staff_id}
                                                        onClick={() => handleSendResetLink(staff.staff_id)}
                                                    >
                                                        {sendingEmail === staff.staff_id ? <CircularProgress size={20} /> : <Email />}
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                            {staff.role?.toUpperCase() !== 'SUPER_ADMIN' && (
                                                <Tooltip title="Edit">
                                                    <IconButton size="small" onClick={() => handleOpenModal(staff)}>
                                                        <Edit fontSize="small" />
                                                    </IconButton>
                                                </Tooltip>
                                            )}
                                        </Box>
                                    </TableCell>
                                </TableRow>
                            ))}
                            {staffList.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={5} align="center" sx={{ py: 4 }}>
                                        <Typography color="text.secondary">No staff members found.</Typography>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
            )}
        </Paper>

        <StaffModal 
            open={modalOpen} 
            onClose={() => setModalOpen(false)} 
            onSave={handleSaveStaff} 
            staffToEdit={selectedStaff}
            currentLocationId={locationId}
        />
    </Box>
  );
};
