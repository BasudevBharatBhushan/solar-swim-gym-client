import React, { useCallback } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { useConfig } from '../../../../context/ConfigContext';
import type { OnboardingErrors, OnboardingProfileData } from '../types';

interface ProfileStepProps {
  data: OnboardingProfileData;
  updateData: (key: keyof OnboardingProfileData, value: string | number | null) => void;
  errors: OnboardingErrors;
}

export const ProfileStep: React.FC<ProfileStepProps> = ({ data, updateData, errors }) => {
    const { waiverPrograms } = useConfig();

    const handleInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const field = event.currentTarget.dataset.field;
        if (!field) return;
        updateData(field, event.target.value);
    }, [updateData]);

    const handleFamilyCountChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        updateData('family_count', parseInt(event.target.value, 10));
    }, [updateData]);

    const handleWaiverProgramChange = useCallback((event: SelectChangeEvent<string>) => {
        updateData('waiver_program_id', event.target.value);
    }, [updateData]);

    // Safety check: ensure current value exists in loaded programs (or is empty) to avoid MUI out-of-range warning
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
        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="First Name"
            fullWidth
            value={data.first_name || ''}
            onChange={handleInputChange}
            inputProps={{ 'data-field': 'first_name' }}
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
            onChange={handleInputChange}
            inputProps={{ 'data-field': 'last_name' }}
            error={!!errors.last_name}
            helperText={errors.last_name}
            placeholder="e.g. Doe"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <TextField
            label="Email Address"
            fullWidth
            type="email"
            value={data.email || ''}
            onChange={handleInputChange}
            inputProps={{ 'data-field': 'email' }}
            error={!!errors.email}
            helperText={errors.email}
            placeholder="john.doe@example.com"
            required
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
           <TextField
            label="Password"
            fullWidth
            value="Min. 8 characters"
            disabled
            helperText="Password will be set via activation link sent to email."
            slotProps={{ inputLabel: { shrink: true } }}
            sx={{
                '& .MuiInputBase-input.Mui-disabled': {
                    WebkitTextFillColor: 'rgba(0, 0, 0, 0.38)',
                }
            }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <TextField
            label="Mobile Number"
            fullWidth
            value={data.mobile || ''}
            onChange={handleInputChange}
            inputProps={{ 'data-field': 'mobile' }}
            error={!!errors.mobile}
            helperText={errors.mobile}
            placeholder="(555) 123-4567"
            slotProps={{ inputLabel: { shrink: true } }}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
             <TextField
                label="Date of Birth"
                type="date"
                fullWidth
                value={data.date_of_birth || ''}
                onChange={handleInputChange}
                inputProps={{ 'data-field': 'date_of_birth' }}
                error={!!errors.date_of_birth}
                helperText={errors.date_of_birth}
                slotProps={{ inputLabel: { shrink: true } }}
            />
        </Grid>

        <Grid size={{ xs: 12 }}>
            <FormControl fullWidth size="small">
                <InputLabel id="waiver-program-label">State Waiver Program (Optional)</InputLabel>
                <Select
                    labelId="waiver-program-label"
                    value={selectValue}
                    label="State Waiver Program (Optional)"
                    onChange={handleWaiverProgramChange}
                >
                    <MenuItem value="">
                        <em>None</em>
                    </MenuItem>
                    {waiverPrograms
                        .filter((p) => p.is_active)
                        .map((program) => (
                        <MenuItem key={program.waiver_program_id} value={program.waiver_program_id}>
                            {program.name} ({program.code})
                        </MenuItem>
                    ))}
                </Select>
                 <FormHelperText>Select a government or partner-funded program if applicable.</FormHelperText>
            </FormControl>
        </Grid>

        {data.waiver_program_id && (
            <>
                <Grid size={{ xs: 12, sm: 6 }}>
                    <TextField
                        label="Case Manager Name"
                        fullWidth
                        size="small"
                        value={data.case_manager_name || ''}
                        onChange={handleInputChange}
                        inputProps={{ 'data-field': 'case_manager_name' }}
                        required
                        error={!!errors.case_manager_name} // Handler in parent needs to validate this
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
                        onChange={handleInputChange}
                        inputProps={{ 'data-field': 'case_manager_email' }}
                        required
                        error={!!errors.case_manager_email}
                        helperText={errors.case_manager_email}
                        slotProps={{ inputLabel: { shrink: true } }}
                    />
                </Grid>
            </>
        )}

        <Grid size={{ xs: 12 }}>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600, color: '#334155' }}>
                Number of Family Members to Enroll (including yourself)
            </Typography>
             <TextField
                type="number"
                value={data.family_count || 1}
                onChange={handleFamilyCountChange}
                slotProps={{ htmlInput: { min: 1 } }}
                sx={{ width: 100 }}
             />
        </Grid>
      </Grid>
    </Box>
  );
};
