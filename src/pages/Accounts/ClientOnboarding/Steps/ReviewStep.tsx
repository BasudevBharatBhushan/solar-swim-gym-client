import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Divider,
  Chip,
  Avatar,
  Stack
} from '@mui/material';
import { Person, ChildCare, Star, ContactEmergency } from '@mui/icons-material';
import { useConfig } from '../../../../context/ConfigContext';

interface ReviewStepProps {
  primaryProfile: any;
  familyMembers: any[];
}

export const ReviewStep: React.FC<ReviewStepProps> = ({ primaryProfile, familyMembers }) => {
  const { ageGroups, waiverPrograms } = useConfig();


  const calculateAge = (dob: string | null) => {
      if (!dob) return null;
      const birthDate = new Date(dob);
      const ageDifMs = Date.now() - birthDate.getTime();
      const ageDate = new Date(ageDifMs);
      return Math.abs(ageDate.getUTCFullYear() - 1970);
  };

  const getAgeProfileLabel = (dob: string | null) => {
      const age = calculateAge(dob);
      if (age === null) return null;
      const group = ageGroups.find(g => {
          const min = g.min_age ?? 0;
          const max = g.max_age ?? 999;
          return age >= min && age <= max;
      });
      return group?.name || null;
  };

  const getProgramName = (id?: string | null) => {
      if (!id) return null;
      return waiverPrograms.find((p: any) => p.waiver_program_id === id)?.name || 'Unknown Program';
  };

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ fontWeight: 800, color: '#0f172a', letterSpacing: '-0.02em' }}>
            Final Review
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Review all details before finalizing the account registration.
          </Typography>
      </Box>

      <Stack spacing={3}>
        {/* Primary Member Section */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '1px solid #cbd5e1', bgcolor: '#f8fafc' }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ bgcolor: '#0ea5e9', color: 'white', width: 40, height: 40 }}>
                    <Star fontSize="small" />
                </Avatar>
                <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1.2 }}>
                        {primaryProfile.first_name} {primaryProfile.last_name}
                    </Typography>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600, textTransform: 'uppercase' }}>
                        Primary Member (Head)
                    </Typography>
                </Box>
            </Box>
            {getAgeProfileLabel(primaryProfile.date_of_birth) && (
                <Chip 
                    label={getAgeProfileLabel(primaryProfile.date_of_birth)} 
                    size="small" 
                    sx={{ fontWeight: 800, fontSize: '0.65rem', bgcolor: '#e2e8f0', color: '#475569', textTransform: 'uppercase' }} 
                />
            )}
          </Box>

          <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>EMAIL</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>{primaryProfile.email}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>MOBILE</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>{primaryProfile.mobile || '-'}</Typography>
              </Grid>
              <Grid size={{ xs: 12, sm: 4 }}>
                  <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700, mb: 0.5 }}>DATE OF BIRTH</Typography>
                  <Typography variant="body2" fontWeight={600} sx={{ color: '#334155' }}>{primaryProfile.date_of_birth || '-'}</Typography>
              </Grid>

              {/* Primary Waiver/Case Manager */}
              {primaryProfile.waiver_program_id && (
                  <Grid size={{ xs: 12 }}>
                      <Divider sx={{ my: 1 }} />
                      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 1 }}>
                                <ContactEmergency sx={{ fontSize: 14 }} /> {getProgramName(primaryProfile.waiver_program_id)} - CASE MANAGER INFO
                            </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 4 }}>
                            <Box>
                                <Typography variant="caption" display="block" color="text.secondary">Name</Typography>
                                <Typography variant="body2" fontWeight={600}>{primaryProfile.case_manager_name || 'N/A'}</Typography>
                            </Box>
                            <Box>
                                <Typography variant="caption" display="block" color="text.secondary">Email</Typography>
                                <Typography variant="body2" fontWeight={600}>{primaryProfile.case_manager_email || 'N/A'}</Typography>
                            </Box>
                        </Box>
                      </Box>
                  </Grid>
              )}
          </Grid>
        </Paper>

        {/* Family Members Section */}
        <Paper variant="outlined" sx={{ p: 4, borderRadius: 3, border: '1px solid #e2e8f0' }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#334155', mb: 3, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Additional Family Members ({familyMembers.length})
            </Typography>

            {familyMembers.length > 0 ? (
                <Stack spacing={4} divider={<Divider />}>
                    {familyMembers.map((member, idx) => {
                        const ageLabel = getAgeProfileLabel(member.date_of_birth);
                        const isMinor = calculateAge(member.date_of_birth) !== null && calculateAge(member.date_of_birth)! < 18;

                        return (
                            <Box key={idx}>
                                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                                        <Avatar sx={{ 
                                            width: 32, 
                                            height: 32, 
                                            bgcolor: isMinor ? '#f0f9ff' : '#f8fafc',
                                            color: isMinor ? '#0ea5e9' : '#64748b',
                                            border: '1px solid',
                                            borderColor: isMinor ? '#bae6fd' : '#e2e8f0'
                                        }}>
                                            {isMinor ? <ChildCare sx={{ fontSize: 16 }} /> : <Person sx={{ fontSize: 16 }} />}
                                        </Avatar>
                                        <Typography variant="subtitle2" sx={{ fontWeight: 700, color: '#334155' }}>
                                            {member.first_name} {member.last_name}
                                        </Typography>
                                    </Box>
                                    <Stack direction="row" spacing={1}>
                                         {ageLabel && (
                                            <Chip 
                                                label={ageLabel} 
                                                size="small" 
                                                sx={{ height: 20, fontWeight: 800, fontSize: '0.6rem', bgcolor: '#f1f5f9', color: '#475569', textTransform: 'uppercase' }} 
                                            />
                                        )}
                                        {isMinor && (
                                            <Chip 
                                                label="MINOR" 
                                                size="small" 
                                                color="info"
                                                variant="outlined"
                                                sx={{ height: 20, fontWeight: 800, fontSize: '0.6rem' }} 
                                            />
                                        )}
                                    </Stack>
                                </Box>

                                <Grid container spacing={3}>
                                    <Grid size={{ xs: 12, sm: 4 }}>
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700 }}>DOB</Typography>
                                        <Typography variant="body2" fontWeight={600}>{member.date_of_birth || 'N/A'}</Typography>
                                    </Grid>
                                    <Grid size={{ xs: 12, sm: 8 }}>
                                        <Typography variant="caption" display="block" color="text.secondary" sx={{ fontWeight: 700 }}>EMAIL</Typography>
                                        <Typography variant="body2" fontWeight={600}>{member.email || 'N/A'}</Typography>
                                    </Grid>

                                    {/* Waiver Info */}
                                    {member.waiver_program_id && (
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f0f9ff', borderRadius: 2, border: '1px solid #e0f2fe' }}>
                                                <Typography variant="caption" sx={{ fontWeight: 800, color: '#0369a1', display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                                    <ContactEmergency sx={{ fontSize: 14 }} /> {getProgramName(member.waiver_program_id)} - CASE MANAGER INFO
                                                </Typography>
                                                <Box sx={{ display: 'flex', gap: 4 }}>
                                                    <Box>
                                                        <Typography variant="caption" display="block" color="text.secondary">Name</Typography>
                                                        <Typography variant="body2" fontWeight={600}>{member.case_manager_name || 'N/A'}</Typography>
                                                    </Box>
                                                    <Box>
                                                        <Typography variant="caption" display="block" color="text.secondary">Email</Typography>
                                                        <Typography variant="body2" fontWeight={600}>{member.case_manager_email || 'N/A'}</Typography>
                                                    </Box>
                                                </Box>
                                            </Box>
                                        </Grid>
                                    )}

                                    {/* Guardian Info */}
                                    {isMinor && member.guardian_name && (
                                        <Grid size={{ xs: 12 }}>
                                            <Box sx={{ mt: 1, p: 2, bgcolor: '#f8fafc', borderRadius: 2, border: '1px solid #f1f5f9' }}>
                                                <Typography variant="caption" display="block" fontWeight={800} color="#475569" sx={{ mb: 1 }}>GUARDIAN & EMERGENCY</Typography>
                                                <Grid container spacing={2}>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Typography variant="caption" color="text.secondary">Guardian</Typography>
                                                        <Typography variant="body2" fontWeight={600}>{member.guardian_name}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Typography variant="caption" color="text.secondary">Guardian Mobile</Typography>
                                                        <Typography variant="body2" fontWeight={600}>{member.guardian_mobile}</Typography>
                                                    </Grid>
                                                    <Grid size={{ xs: 12, sm: 4 }}>
                                                        <Typography variant="caption" color="text.secondary">Emergency Phone</Typography>
                                                        <Typography variant="body2" fontWeight={600}>{member.emergency_phone}</Typography>
                                                    </Grid>
                                                </Grid>
                                            </Box>
                                        </Grid>
                                    )}
                                </Grid>
                            </Box>
                        );
                    })}
                </Stack>
            ) : (
                <Box sx={{ py: 4, textAlign: 'center', border: '2px dashed #e2e8f0', borderRadius: 3 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        Individual account enrollment only.
                    </Typography>
                </Box>
            )}
        </Paper>
      </Stack>
    </Box>
  );
};
