import React, { useCallback, useEffect } from 'react';
import {
  Box,
  TextField,
  Typography,
  Grid,
  Button,
  Card,
  CardContent,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Chip,
  Avatar,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import { Person, ChildCare, ContentCopy, Star, ContactEmergency } from '@mui/icons-material';
import { useConfig } from '../../../../context/ConfigContext';
import type { OnboardingFamilyMember, OnboardingProfileData } from '../types';

interface FamilyStepProps {
  data: OnboardingFamilyMember[];
  updateData: (members: OnboardingFamilyMember[]) => void;
  primaryData: OnboardingProfileData;
  updatePrimaryData: (key: keyof OnboardingProfileData, value: string | number | null) => void;
  expectedCount: number;
}

export const FamilyStep: React.FC<FamilyStepProps> = ({ data, updateData, primaryData, updatePrimaryData, expectedCount }) => {
    const { ageGroups, waiverPrograms } = useConfig();

  // Strict Family Count Synchronization
  useEffect(() => {
      // expectedCount includes primary. So family members needed = expectedCount - 1
      const needed = Math.max(0, expectedCount - 1);
      
      if (data.length !== needed) {
          if (data.length < needed) {
               const current = [...data];
              for (let i = data.length; i < needed; i++) {
                  current.push({ first_name: '', last_name: '', date_of_birth: null });
              }
              updateData(current);
          } else {
              updateData(data.slice(0, needed));
          }
      }
  }, [expectedCount, data, updateData]);

  const handleChange = useCallback((index: number, field: keyof OnboardingFamilyMember, value: string | null) => {
      const updated = [...data];
      updated[index] = { ...updated[index], [field]: value };
      updateData(updated);
  }, [data, updateData]);

  const handlePrimaryInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const field = event.currentTarget.dataset.field;
      if (!field) return;
      updatePrimaryData(field, event.target.value);
  }, [updatePrimaryData]);

  const handlePrimaryWaiverChange = useCallback((event: SelectChangeEvent<string>) => {
      updatePrimaryData('waiver_program_id', event.target.value);
  }, [updatePrimaryData]);

  const handleMemberInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
      const indexValue = event.currentTarget.dataset.memberIndex;
      const field = event.currentTarget.dataset.field as keyof FamilyMember | undefined;
      if (indexValue === undefined || !field) return;
      handleChange(Number(indexValue), field, event.target.value);
  }, [handleChange]);

  const handleMemberWaiverChange = useCallback((event: SelectChangeEvent<string>) => {
      const target = event.target as HTMLInputElement;
      const indexValue = target.dataset.memberIndex;
      if (indexValue === undefined) return;
      handleChange(Number(indexValue), 'waiver_program_id', event.target.value);
  }, [handleChange]);

  const calculateAge = (dob: string | null) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
  };

  const getAgeProfile = (dob: string | null) => {
      const age = calculateAge(dob);
      if (dob === null) return null;
      return ageGroups.find(g => {
          const min = g.min_age ?? 0;
          const max = g.max_age ?? 999;
          return age >= min && age <= max;
      });
  };

  const isMinor = (dob: string | null) => {
      const age = calculateAge(dob);
      return age !== null && age < 18;
  };

  const copyPrimaryToGuardian = useCallback((index: number) => {
      const updated = [...data];
      updated[index] = {
          ...updated[index],
          guardian_name: `${primaryData.first_name} ${primaryData.last_name}`,
          guardian_mobile: primaryData.mobile
      };
      updateData(updated);
  }, [data, primaryData.first_name, primaryData.last_name, primaryData.mobile, updateData]);

  const handleCopyPrimaryClick = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
      const indexValue = event.currentTarget.dataset.memberIndex;
      if (indexValue === undefined) return;
      copyPrimaryToGuardian(Number(indexValue));
  }, [copyPrimaryToGuardian]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Family Enrollment
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Configure individual profiles for all {expectedCount} family members.
          </Typography>
      </Box>

      <Stack spacing={4}>
        {/* Primary Member Card (Editable & Highlighted) */}
        {(() => {
            const ageProfile = getAgeProfile(primaryData.date_of_birth);
            return (
                <Card variant="outlined" sx={{ 
                    borderRadius: 3, 
                    bgcolor: '#f8fafc', 
                    borderColor: '#cbd5e1', 
                    boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03)',
                    position: 'relative',
                    overflow: 'visible'
                }}>
                    <Box sx={{ 
                        position: 'absolute', 
                        top: -12, 
                        left: 24, 
                        bgcolor: '#0ea5e9', 
                        color: 'white', 
                        px: 2, 
                        py: 0.5, 
                        borderRadius: 2, 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: 1,
                        boxShadow: '0 4px 6px -1px rgba(14, 165, 233, 0.3)',
                        zIndex: 1
                    }}>
                        <Star sx={{ fontSize: 16 }} />
                        <Typography variant="caption" sx={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                            Primary Member / Head
                        </Typography>
                    </Box>

                    <CardContent sx={{ p: 4, pt: 4 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Avatar sx={{ bgcolor: '#bae6fd', color: '#0284c7', width: 48, height: 48 }}>
                                    <Person />
                                </Avatar>
                                <Box>
                                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b', lineHeight: 1.2 }}>
                                        {primaryData.first_name || 'Account'} {primaryData.last_name || 'Holder'}
                                    </Typography>
                                    {ageProfile && (
                                        <Chip 
                                            label={ageProfile.name} 
                                            size="small" 
                                            sx={{ 
                                                mt: 0.5, 
                                                height: 20, 
                                                fontSize: '0.65rem', 
                                                fontWeight: 800, 
                                                bgcolor: '#f1f5f9', 
                                                color: '#475569',
                                                textTransform: 'uppercase'
                                            }} 
                                        />
                                    )}
                                </Box>
                            </Box>
                        </Box>

                        <Grid container spacing={3}>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField 
                                    label="First Name"
                                    placeholder="e.g. John"
                                    size="small"
                                    fullWidth
                                    required
                                    value={primaryData.first_name || ''}
                                    onChange={handlePrimaryInputChange}
                                    inputProps={{ 'data-field': 'first_name' }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField 
                                    label="Last Name"
                                    placeholder="e.g. Doe"
                                    size="small"
                                    fullWidth
                                    required
                                    value={primaryData.last_name || ''}
                                    onChange={handlePrimaryInputChange}
                                    inputProps={{ 'data-field': 'last_name' }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 4 }}>
                                <TextField 
                                    label="Date of Birth"
                                    type="date"
                                    size="small"
                                    fullWidth
                                    required
                                    value={primaryData.date_of_birth || ''}
                                    onChange={handlePrimaryInputChange}
                                    inputProps={{ 'data-field': 'date_of_birth' }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                             <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField 
                                    label="Mobile Number"
                                    placeholder="(555) 123-4567"
                                    size="small"
                                    fullWidth
                                    value={primaryData.mobile || ''}
                                    onChange={handlePrimaryInputChange}
                                    inputProps={{ 'data-field': 'mobile' }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                             <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField 
                                    label="Email Address"
                                    placeholder="john@example.com"
                                    size="small"
                                    fullWidth
                                    required
                                    value={primaryData.email || ''}
                                    onChange={handlePrimaryInputChange}
                                    inputProps={{ 'data-field': 'email' }}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>

                             {/* Waiver Program for Primary */}
                             <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel id="primary-waiver-label" shrink>Waiver Program (Optional)</InputLabel>
                                    <Select
                                        labelId="primary-waiver-label"
                                        value={waiverPrograms.some(p => p.waiver_program_id === primaryData.waiver_program_id) ? primaryData.waiver_program_id : ''}
                                        onChange={handlePrimaryWaiverChange}
                                        label="Waiver Program (Optional)"
                                        displayEmpty
                                    >
                                        <MenuItem value=""><em>None / Private Pay</em></MenuItem>
                                        {waiverPrograms.filter(p => p.is_active).map((p) => (
                                            <MenuItem key={p.waiver_program_id} value={p.waiver_program_id}>
                                                {p.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>
                            </Grid>

                            {/* Case Manager for Primary */}
                            {primaryData.waiver_program_id && (
                                <Grid size={{ xs: 12 }} container spacing={2}>
                                    <Grid size={{ xs: 12 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                            <ContactEmergency sx={{ fontSize: 14 }} /> CASE MANAGER INFORMATION
                                        </Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField 
                                            label="Case Manager Name"
                                            placeholder="Name"
                                            size="small"
                                            fullWidth
                                            required
                                            value={primaryData.case_manager_name || ''}
                                            onChange={handlePrimaryInputChange}
                                            inputProps={{ 'data-field': 'case_manager_name' }}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 6 }}>
                                        <TextField 
                                            label="Case Manager Email"
                                            placeholder="email@agency.com"
                                            size="small"
                                            fullWidth
                                            required
                                            value={primaryData.case_manager_email || ''}
                                            onChange={handlePrimaryInputChange}
                                            inputProps={{ 'data-field': 'case_manager_email' }}
                                            slotProps={{ inputLabel: { shrink: true } }}
                                        />
                                    </Grid>
                                </Grid>
                            )}
                        </Grid>
                    </CardContent>
                </Card>
            );
        })()}

        {/* Family Custom Members */}
        {data.map((member, index) => {
            const memberIsMinor = isMinor(member.date_of_birth);
            const ageProfile = getAgeProfile(member.date_of_birth);

            return (
            <Card key={index} variant="outlined" sx={{ 
                borderRadius: 3, 
                bgcolor: '#fff', 
                borderColor: '#e2e8f0',
                boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
            }}>
                <CardContent sx={{ p: 4 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                            <Avatar sx={{ 
                                bgcolor: memberIsMinor ? '#f0f9ff' : '#f8fafc', 
                                color: memberIsMinor ? '#0ea5e9' : '#64748b',
                                border: '1px solid',
                                borderColor: memberIsMinor ? '#bae6fd' : '#e2e8f0'
                            }}>
                                {memberIsMinor ? <ChildCare /> : <Person />}
                            </Avatar>
                            <Box>
                                <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#334155', lineHeight: 1.2 }}>
                                    Family Member {index + 2}
                                </Typography>
                                <Stack direction="row" spacing={1} sx={{ mt: 0.5 }}>
                                    {ageProfile && (
                                        <Chip 
                                            label={ageProfile.name} 
                                            size="small" 
                                            sx={{ 
                                                height: 20, 
                                                fontSize: '0.65rem', 
                                                fontWeight: 800, 
                                                bgcolor: memberIsMinor ? '#e0f2fe' : '#f1f5f9', 
                                                color: memberIsMinor ? '#0369a1' : '#475569',
                                                textTransform: 'uppercase'
                                            }} 
                                        />
                                    )}
                                    {memberIsMinor && (
                                        <Chip 
                                            label="Minor" 
                                            size="small" 
                                            color="info"
                                            variant="outlined"
                                            sx={{ height: 20, fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }} 
                                        />
                                    )}
                                </Stack>
                            </Box>
                        </Box>
                    </Box>

                    <Grid container spacing={3}>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField 
                                label="First Name"
                                placeholder="e.g. Jane"
                                size="small"
                                fullWidth
                                required
                                value={member.first_name || ''}
                                onChange={handleMemberInputChange}
                                inputProps={{ 'data-member-index': index, 'data-field': 'first_name' }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField 
                                label="Last Name"
                                placeholder="e.g. Doe"
                                size="small"
                                fullWidth
                                required
                                value={member.last_name || ''}
                                onChange={handleMemberInputChange}
                                inputProps={{ 'data-member-index': index, 'data-field': 'last_name' }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField
                                label="Date of Birth"
                                type="date"
                                size="small"
                                fullWidth
                                required
                                value={member.date_of_birth || ''}
                                onChange={handleMemberInputChange}
                                inputProps={{ 'data-member-index': index, 'data-field': 'date_of_birth' }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                             <TextField 
                                label="Email (Optional)"
                                placeholder="member@example.com"
                                size="small"
                                type="email"
                                fullWidth
                                value={member.email || ''}
                                onChange={handleMemberInputChange}
                                inputProps={{ 'data-member-index': index, 'data-field': 'email' }}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>

                        {/* Waiver Program Selection */}
                         <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel id={`waiver-label-${index}`} shrink>Waiver Program (Optional)</InputLabel>
                                <Select
                                    labelId={`waiver-label-${index}`}
                                    value={waiverPrograms.some(p => p.waiver_program_id === member.waiver_program_id) ? member.waiver_program_id : ''}
                                    onChange={handleMemberWaiverChange}
                                    label="Waiver Program (Optional)"
                                    displayEmpty
                                    inputProps={{ 'data-member-index': index }}
                                >
                                    <MenuItem value=""><em>None / Private Pay</em></MenuItem>
                                    {waiverPrograms.filter(p => p.is_active).map((p) => (
                                        <MenuItem key={p.waiver_program_id} value={p.waiver_program_id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>

                        {/* Case Manager Fields - Show if any program selected */}
                        {member.waiver_program_id && (
                            <Grid size={{ xs: 12 }} container spacing={2}>
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#64748b', display: 'flex', alignItems: 'center', gap: 1 }}>
                                        <ContactEmergency sx={{ fontSize: 14 }} /> CASE MANAGER INFORMATION
                                    </Typography>
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField 
                                        label="Case Manager Name"
                                        placeholder="Name"
                                        size="small"
                                        fullWidth
                                        required
                                        value={member.case_manager_name || ''}
                                        onChange={handleMemberInputChange}
                                        inputProps={{ 'data-member-index': index, 'data-field': 'case_manager_name' }}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <TextField 
                                        label="Case Manager Email"
                                        placeholder="email@agency.com"
                                        size="small"
                                        fullWidth
                                        required
                                        value={member.case_manager_email || ''}
                                        onChange={handleMemberInputChange}
                                        inputProps={{ 'data-member-index': index, 'data-field': 'case_manager_email' }}
                                        slotProps={{ inputLabel: { shrink: true } }}
                                    />
                                </Grid>
                            </Grid>
                        )}

                        {/* Conditional Minor Fields */}
                        {memberIsMinor && (
                            <Grid size={{ xs: 12 }}>
                                <Box sx={{ bgcolor: '#f8fafc', p: 3, borderRadius: 2, border: '1px solid #e2e8f0' }}>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                                        <Typography variant="caption" sx={{ fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            Guardian & Emergency Contact
                                        </Typography>
                                        <Tooltip title="Copy name and mobile from Primary Member">
                                            <Button 
                                                variant="outlined"
                                                size="small" 
                                                startIcon={<ContentCopy fontSize="inherit" />} 
                                                onClick={handleCopyPrimaryClick}
                                                data-member-index={index}
                                                sx={{ fontSize: '0.65rem', textTransform: 'none', py: 0.5, borderRadius: 1.5 }}
                                            >
                                                Copy Primary Info
                                            </Button>
                                        </Tooltip>
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField 
                                                label="Guardian Name"
                                                placeholder="Full Name"
                                                size="small"
                                                fullWidth
                                                required
                                                value={member.guardian_name || ''}
                                                onChange={handleMemberInputChange}
                                                inputProps={{ 'data-member-index': index, 'data-field': 'guardian_name' }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField 
                                                label="Guardian Mobile"
                                                placeholder="(555) 123-4567"
                                                size="small"
                                                fullWidth
                                                required
                                                value={member.guardian_mobile || ''}
                                                onChange={handleMemberInputChange}
                                                inputProps={{ 'data-member-index': index, 'data-field': 'guardian_mobile' }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 4 }}>
                                            <TextField 
                                                label="Emergency Phone"
                                                placeholder="(555) 999-9999"
                                                size="small"
                                                fullWidth
                                                required
                                                value={member.emergency_phone || ''}
                                                onChange={handleMemberInputChange}
                                                inputProps={{ 'data-member-index': index, 'data-field': 'emergency_phone' }}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                    </Grid>
                                </Box>
                            </Grid>
                        )}
                    </Grid>
                </CardContent>
            </Card>
            );
        })}
      </Stack>
    </Box>
  );
};
