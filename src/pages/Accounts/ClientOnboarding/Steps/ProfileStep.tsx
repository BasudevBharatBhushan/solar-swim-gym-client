import React from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  IconButton,
  InputAdornment,
  Chip,
  Switch,
  FormControlLabel
} from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useConfig } from '../../../../context/ConfigContext';
import { getAgeGroup, getAgeRangeLabel } from '../../../../lib/ageUtils';
import { DobField } from '../components/DobField';

interface ProfileStepProps {
  data: any;
  updateData: (key: string, value: any) => void;
  errors: any;
  isPrimaryJunior?: boolean;
  lockFamilyCount?: boolean;
  onFieldBlur?: (key: string, value: string) => void;
  onboardingType?: string;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({
  data,
  updateData,
  errors,
  isPrimaryJunior = false,
  lockFamilyCount = false,
  onFieldBlur,
  onboardingType
}) => {
  const { waiverPrograms, ageGroups } = useConfig();
  const ageProfile = getAgeGroup(data.date_of_birth || '', ageGroups, 'Membership');

  const handleProgramChange = (programId: string) => {
    updateData('waiver_program_id', programId);
  };

  const selectValue = waiverPrograms.some(p => p.waiver_program_id === data.waiver_program_id)
    ? data.waiver_program_id
    : '';

  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, color: '#1e293b' }}>
        Primary Contact Information
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Please provide your details to create the primary account holder profile.
      </Typography>

      <Grid container spacing={3}>
        {/* Basic Info */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="First Name"
            fullWidth
            value={data.first_name || ''}
            onChange={(e) => updateData('first_name', e.target.value)}
            error={!!errors.first_name}
            helperText={errors.first_name}
            placeholder="e.g. John"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Last Name"
            fullWidth
            value={data.last_name || ''}
            onChange={(e) => updateData('last_name', e.target.value)}
            error={!!errors.last_name}
            helperText={errors.last_name}
            placeholder="e.g. Doe"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <DobField
            label="Date of Birth"
            value={data.date_of_birth}
            onChange={(val) => updateData('date_of_birth', val)}
            onBlur={(val) => onFieldBlur?.('date_of_birth', val)}
            error={!!errors.date_of_birth}
            helperText={errors.date_of_birth}
            required
            size="small"
          />
          {ageProfile && (
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
          )}
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel shrink>Gender (Optional)</InputLabel>
            <Select value={data.gender || ''} onChange={e => updateData('gender', e.target.value)} label="Gender (Optional)" displayEmpty>
              <MenuItem value=""><em>Prefer not to say</em></MenuItem>
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
              <MenuItem value="Other">Other</MenuItem>
            </Select>
          </FormControl>
        </Grid>

        {/* Contact */}
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Email Address"
            fullWidth
            type="email"
            value={data.email || ''}
            onChange={(e) => updateData('email', e.target.value)}
            onBlur={(e) => onFieldBlur?.('email', e.target.value)}
            error={!!errors.email}
            helperText={errors.email}
            placeholder="john.doe@example.com"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Mobile Number"
            fullWidth
            value={data.mobile || ''}
            onChange={(e) => updateData('mobile', e.target.value)}
            onBlur={(e) => onFieldBlur?.('mobile', e.target.value)}
            error={!!errors.mobile}
            helperText={errors.mobile}
            placeholder="(555) 123-4567"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="How did you hear about us? (Optional)"
            size="small"
            fullWidth
            value={data.heard_about_us || ''}
            onChange={e => updateData('heard_about_us', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
            placeholder="e.g. Google, Social Media, Friend"
          />
        </Grid>

        {/* Password block */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, fontWeight: 600, color: '#334155' }}>
            Account Security
          </Typography>
        </Grid>
        {onboardingType === 'staff_assisted' ? (
          <Grid size={{ xs: 12 }}>
            <Typography variant="body2" sx={{ color: 'text.secondary', fontStyle: 'italic', bgcolor: '#f1f5f9', p: 1.5, borderRadius: 1 }}>
              Password setup is skipped for staff-assisted onboarding; account activation/reset link will be sent.
            </Typography>
          </Grid>
        ) : (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Password"
                type="password"
                size="small"
                fullWidth
                value={data.password || ''}
                onChange={(e) => updateData('password', e.target.value)}
                error={!!errors.password}
                helperText={errors.password || 'Minimum 8 characters'}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Confirm Password"
                type="password"
                size="small"
                fullWidth
                value={data.confirm_password || ''}
                onChange={(e) => updateData('confirm_password', e.target.value)}
                error={!!errors.confirm_password}
                helperText={errors.confirm_password}
                required
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </>
        )}

        {/* Address */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, fontWeight: 600, color: '#334155' }}>
            Address Information
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Address Line 1" size="small" fullWidth value={data.address_line1 || ''} onChange={e => updateData('address_line1', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField label="Address Line 2" placeholder="Apt, Suite, etc." size="small" fullWidth value={data.address_line2 || ''} onChange={e => updateData('address_line2', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="City" size="small" fullWidth value={data.city || ''} onChange={e => updateData('city', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="State/Province" size="small" fullWidth value={data.state || ''} onChange={e => updateData('state', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Zip/Postal Code" size="small" fullWidth value={data.zip_code || ''} onChange={e => updateData('zip_code', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>
        <Grid size={{ xs: 12, sm: 4 }}>
          <TextField label="Country" size="small" fullWidth value={data.country || 'USA'} onChange={e => updateData('country', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
        </Grid>

        {/* Program */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 0, mt: 1, fontWeight: 600, color: '#334155' }}>
            Program Info & Preferences
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            select
            fullWidth
            size="small"
            label="State Waiver Program (Optional)"
            value={selectValue}
            onChange={(e) => handleProgramChange(e.target.value)}
            slotProps={{
              inputLabel: { shrink: true },
              select: { displayEmpty: true }
            }}
            helperText="Select a government or partner-funded program if applicable."
          >
            <MenuItem value="">
              <em>None / Private Pay</em>
            </MenuItem>
            {waiverPrograms
              .filter((p: any) => p.is_active)
              .map((program: any) => (
                <MenuItem key={program.waiver_program_id} value={program.waiver_program_id}>
                  {program.name} ({program.code})
                </MenuItem>
            ))}
          </TextField>
        </Grid>

        {data.waiver_program_id && (
          <>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Case Manager Name"
                fullWidth
                size="small"
                value={data.case_manager_name || ''}
                onChange={(e) => updateData('case_manager_name', e.target.value)}
                required
                error={!!errors.case_manager_name}
                helperText={errors.case_manager_name}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Case Manager Email"
                fullWidth
                size="small"
                value={data.case_manager_email || ''}
                onChange={(e) => updateData('case_manager_email', e.target.value)}
                required
                error={!!errors.case_manager_email}
                helperText={errors.case_manager_email}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </>
        )}

        {/* Guardian for Junior */}
        {isPrimaryJunior && (
          <>
            <Grid size={{ xs: 12 }}>
              <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, fontWeight: 600, color: '#334155' }}>
                Guardian Information (Required for Junior Primary)
              </Typography>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian Name"
                size="small"
                fullWidth
                value={data.guardian_name || ''}
                onChange={(e) => updateData('guardian_name', e.target.value)}
                error={!!errors.guardian_name}
                helperText={errors.guardian_name}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian Mobile"
                size="small"
                fullWidth
                value={data.guardian_mobile || ''}
                onChange={(e) => updateData('guardian_mobile', e.target.value)}
                onBlur={(e) => onFieldBlur?.('guardian_mobile', e.target.value)}
                error={!!errors.guardian_mobile}
                helperText={errors.guardian_mobile}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Guardian Email"
                size="small"
                fullWidth
                value={data.guardian_email || ''}
                onChange={(e) => updateData('guardian_email', e.target.value)}
                error={!!errors.guardian_email}
                helperText={errors.guardian_email}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Emergency Contact Phone"
                size="small"
                fullWidth
                value={data.emergency_contact_phone || ''}
                onChange={(e) => updateData('emergency_contact_phone', e.target.value)}
                onBlur={(e) => onFieldBlur?.('emergency_contact_phone', e.target.value)}
                error={!!errors.emergency_contact_phone}
                helperText={errors.emergency_contact_phone}
                slotProps={{ inputLabel: { shrink: true } }}
              />
            </Grid>
          </>
        )}

        {/* Notifications */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, fontWeight: 600, color: '#334155' }}>
            Notification Preferences
          </Typography>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={data.notify_primary_member !== false} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('notify_primary_member', e.target.checked)} 
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Primary Member Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">Enable system notifications for primary member</Typography>
                </Box>
              }
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', p: 1, border: '1px solid #e2e8f0', borderRadius: 2 }}>
            <FormControlLabel
              control={
                <Switch 
                  checked={data.notify_guardian === true} 
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateData('notify_guardian', e.target.checked)} 
                />
              }
              label={
                <Box>
                  <Typography variant="body2" fontWeight={600}>Guardian Notifications</Typography>
                  <Typography variant="caption" color="text.secondary">Enable system notifications for guardian</Typography>
                </Box>
              }
            />
          </Box>
        </Grid>

        {/* Family count */}
        <Grid size={{ xs: 12 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
            Number of Family Members to Enroll (including yourself)
          </Typography>
          <TextField
            type="number"
            value={data.family_count || ''}
            onChange={(e) => {
              const val = e.target.value === '' ? '' : parseInt(e.target.value);
              updateData('family_count', val);
            }}
            disabled={lockFamilyCount}
            slotProps={{
              htmlInput: { min: 1 },
              input: {
                endAdornment: !lockFamilyCount && data.family_count > 1 ? (
                  <InputAdornment position="end">
                    <IconButton
                      size="small"
                      onClick={() => updateData('family_count', 1)}
                      edge="end"
                      title="Reset to 1"
                    >
                      <ClearIcon sx={{ fontSize: 18 }} />
                    </IconButton>
                  </InputAdornment>
                ) : null
              }
            }}
            sx={{ width: 160 }}
          />
        </Grid>
      </Grid>
    </Box>
  );
};
