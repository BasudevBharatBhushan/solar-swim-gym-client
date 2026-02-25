
import { useState, useEffect } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Grid, FormControlLabel, Switch,
  MenuItem, Box, Typography, CircularProgress
} from '@mui/material';
import { crmService } from '../../../services/crmService';
import { configService } from '../../../services/configService';
import { useAuth } from '../../../context/AuthContext';
import { getAgeGroup, getAgeRangeLabel } from '../../../lib/ageUtils';
import { Chip } from '@mui/material';

interface ProfileUpsertDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  account_id?: string;
  profile?: any; // If provided, we are editing
}

export const ProfileUpsertDialog = ({ open, onClose, onSuccess, account_id, profile }: ProfileUpsertDialogProps) => {
  const { currentLocationId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [waiverPrograms, setWaiverPrograms] = useState<any[]>([]);
  const [ageGroups, setAgeGroups] = useState<any[]>([]);
  const [formData, setFormData] = useState<any>({
    first_name: '',
    last_name: '',
    email: '',
    mobile: '',
    date_of_birth: '',
    is_primary: false,
    guardian_name: '',
    guardian_mobile: '',
    guardian_email: '',
    emergency_contact_name: '',
    emergency_contact_phone: '',
    waiver_program_id: '',
    case_manager_name: '',
    case_manager_email: '',
    gender: '',
    address_line1: '',
    address_line2: '',
    city: '',
    state: '',
    zip_code: '',
    country: 'USA',
    relationship: ''
  });

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const [programsRes, ageGroupsRes] = await Promise.all([
          configService.getWaiverPrograms(),
          configService.getAgeGroups(currentLocationId || undefined)
        ]);
        setWaiverPrograms(programsRes.data || programsRes || []);
        setAgeGroups(ageGroupsRes.data || ageGroupsRes || []);
      } catch (err) {
        console.error("Failed to fetch configuration", err);
      }
    };
    if (open) fetchConfig();
  }, [open, currentLocationId]);

  useEffect(() => {
    if (profile) {
      setFormData({
        first_name: profile.first_name || '',
        last_name: profile.last_name || '',
        email: profile.email || '',
        mobile: profile.mobile || '',
        date_of_birth: profile.date_of_birth ? profile.date_of_birth.split('T')[0] : '',
        is_primary: !!profile.is_primary,
        guardian_name: profile.guardian_name || '',
        guardian_mobile: profile.guardian_mobile || '',
        guardian_email: profile.guardian_email || '',
        emergency_contact_name: profile.emergency_contact_name || '',
        emergency_contact_phone: profile.emergency_contact_phone || '',
        waiver_program_id: profile.waiver_program_id || '',
        case_manager_name: profile.case_manager_name || '',
        case_manager_email: profile.case_manager_email || '',
        gender: profile.gender || '',
        address_line1: profile.address_line1 || '',
        address_line2: profile.address_line2 || '',
        city: profile.city || '',
        state: profile.state || '',
        zip_code: profile.zip_code || '',
        country: profile.country || 'USA',
        relationship: profile.relationship || ''
      });
    } else {
      setFormData({
        first_name: '',
        last_name: '',
        email: '',
        mobile: '',
        date_of_birth: '',
        is_primary: false,
        guardian_name: '',
        guardian_mobile: '',
        guardian_email: '',
        emergency_contact_name: '',
        emergency_contact_phone: '',
        waiver_program_id: '',
        case_manager_name: '',
        case_manager_email: '',
        gender: '',
        address_line1: '',
        address_line2: '',
        city: '',
        state: '',
        zip_code: '',
        country: 'USA',
        relationship: ''
      });
    }
  }, [profile, open]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev: any) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        account_id: account_id || profile?.account_id,
        profile_id: profile?.profile_id,
        waiver_program_id: formData.waiver_program_id || null
      };
      
      await crmService.upsertProfile(payload, currentLocationId || undefined);
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to upsert profile", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight={800} sx={{ px: 3, pt: 3, pb: 2 }}>
        {profile ? 'Edit Member Profile' : 'Add New Member'}
      </DialogTitle>
      <DialogContent sx={{ px: 3 }}>
        <Grid container spacing={2.5} sx={{ mt: 0.5 }}>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="first_name"
              label="First Name"
              fullWidth
              required
              value={formData.first_name}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="last_name"
              label="Last Name"
              fullWidth
              required
              value={formData.last_name}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="email"
              label="Email"
              fullWidth
              value={formData.email}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="mobile"
              label="Mobile"
              fullWidth
              value={formData.mobile}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="date_of_birth"
              label="Date of Birth"
              type="date"
              fullWidth
              slotProps={{ inputLabel: { shrink: true } }}
              value={formData.date_of_birth}
              onChange={handleChange}
            />
            {(() => {
              const ageProfile = getAgeGroup(formData.date_of_birth, ageGroups, 'Membership');
              return ageProfile ? (
                <Chip 
                  label={`${ageProfile.name} ${getAgeRangeLabel(ageProfile)}`} 
                  size="small" 
                  sx={{ 
                    mt: 1, 
                    height: 24, 
                    fontSize: '0.75rem', 
                    fontWeight: 700, 
                    bgcolor: '#f1f5f9', 
                    color: '#475569',
                    textTransform: 'uppercase',
                    '& .MuiChip-label': { px: 1 }
                  }} 
                />
              ) : null;
            })()}
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="gender"
              select
              label="Gender"
              fullWidth
              value={formData.gender}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value=""><em>None</em></MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </TextField>
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="relationship"
              label="Relationship to Primary"
              placeholder="e.g. Spouse, Child, Parent"
              fullWidth
              value={formData.relationship}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="waiver_program_id"
              select
              label="Waiver Program"
              fullWidth
              value={formData.waiver_program_id}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            >
              <MenuItem value="">None</MenuItem>
              {waiverPrograms.map((p) => (
                <MenuItem key={p.waiver_program_id} value={p.waiver_program_id}>
                  {p.name} ({p.code})
                </MenuItem>
              ))}
            </TextField>
          </Grid>

          {formData.waiver_program_id && (
            <>
              <Grid size={{ xs: 12 }}>
                <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
                  Case Manager Information
                </Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="case_manager_name"
                  label="Case Manager Name"
                  fullWidth
                  required
                  value={formData.case_manager_name}
                  onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  name="case_manager_email"
                  label="Case Manager Email"
                  fullWidth
                  required
                  value={formData.case_manager_email}
                  onChange={handleChange}
                  slotProps={{ inputLabel: { shrink: true } }}
                />
              </Grid>
            </>
          )}
          
          <Grid size={12}>
            <Box sx={{ mt: 1, mb: 0 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
                Address Information
              </Typography>
            </Box>
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField name="address_line1" label="Address Line 1" fullWidth value={formData.address_line1} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12 }}>
            <TextField name="address_line2" label="Address Line 2" fullWidth value={formData.address_line2} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="city" label="City" fullWidth value={formData.city} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="state" label="State/Province" fullWidth value={formData.state} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="zip_code" label="Zip/Postal Code" fullWidth value={formData.zip_code} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField name="country" label="Country" fullWidth value={formData.country} onChange={handleChange} slotProps={{ inputLabel: { shrink: true } }} />
          </Grid>
          <Grid size={12}>
            <FormControlLabel
              control={
                <Switch 
                  name="is_primary"
                  checked={formData.is_primary}
                  onChange={handleChange}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                   Primary Member of Account
                </Typography>
              }
            />
          </Grid>

          <Grid size={12}>
            <Box sx={{ mt: 1, mb: 0 }}>
              <Typography variant="overline" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '1px' }}>
                Guardian & Emergency Contact
              </Typography>
            </Box>
          </Grid>

          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="guardian_name"
              label="Guardian Name"
              fullWidth
              value={formData.guardian_name}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="guardian_mobile"
              label="Guardian Mobile"
              fullWidth
              value={formData.guardian_mobile}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="guardian_email"
              label="Guardian Email"
              type="email"
              fullWidth
              value={formData.guardian_email}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="emergency_contact_name"
              label="Emergency Name"
              fullWidth
              value={formData.emergency_contact_name}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
          <Grid size={{ xs: 12, sm: 6 }}>
            <TextField
              name="emergency_contact_phone"
              label="Emergency Phone"
              fullWidth
              value={formData.emergency_contact_phone}
              onChange={handleChange}
              slotProps={{ inputLabel: { shrink: true } }}
            />
          </Grid>
        </Grid>
      </DialogContent>
      <DialogActions sx={{ p: 3, pt: 2 }}>
        <Button 
          onClick={onClose} 
          sx={{ 
            color: '#64748b', 
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.9rem',
            '&:hover': { bgcolor: '#f1f5f9' }
          }} 
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          disabled={loading || !formData.first_name || !formData.last_name}
          sx={{ 
            bgcolor: '#3b82f6',
            boxShadow: 'none',
            fontWeight: 700,
            textTransform: 'none',
            fontSize: '0.9rem',
            px: 3,
            '&:hover': { bgcolor: '#2563eb', boxShadow: 'none' }
          }}
          startIcon={loading && <CircularProgress size={16} color="inherit" />}
        >
          {profile ? 'Save Changes' : 'Add Member'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
