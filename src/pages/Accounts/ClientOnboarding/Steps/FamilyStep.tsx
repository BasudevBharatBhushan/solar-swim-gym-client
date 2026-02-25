import React, { useEffect } from 'react';
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
  FormControlLabel,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Chip,
  Avatar,
  Checkbox,
  useTheme,
  useMediaQuery
} from '@mui/material';
import { Person, ChildCare, ContentCopy, Star, ContactEmergency }
from '@mui/icons-material';
import { useConfig } from '../../../../context/ConfigContext';
import { getAgeGroup, getAgeRangeLabel, calculateAge } from '../../../../lib/ageUtils';

interface FamilyMember {
    first_name: string;
    last_name: string;
    date_of_birth: string | null;
    email?: string;
    mobile?: string;
    gender?: string;
    // Address
    address_line1?: string;
    address_line2?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    // Waiver / Program
    waiver_program_id?: string | null;
    case_manager_name?: string;
    case_manager_email?: string;
    // Minor Fields
    guardian_name?: string;
    guardian_mobile?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    use_primary_info?: boolean;
}

interface FamilyStepProps {
  data: FamilyMember[];
  updateData: (members: FamilyMember[]) => void;
  primaryData: any;
  updatePrimaryData: (key: string, value: any) => void;
  expectedCount: number;
}

export const FamilyStep: React.FC<FamilyStepProps> = ({ data, updateData, primaryData, updatePrimaryData, expectedCount }) => {
    const { ageGroups, waiverPrograms } = useConfig();
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

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
  }, [expectedCount, data.length]);

  const handleChange = (index: number, field: keyof FamilyMember, value: any) => {
      const updated = [...data];
      updated[index] = { ...updated[index], [field]: value };
      updateData(updated);
  };

  const getAgeProfile = (dob: string | null) => {
      return getAgeGroup(dob || '', ageGroups, 'Membership');
  };

  const isMinor = (dob: string | null) => {
      if (!dob) return false;
      const age = calculateAge(dob);
      return age < 18;
  };

  const handleTogglePrimaryInfo = (index: number, checked: boolean) => {
      const updated = [...data];
      if (checked) {
          updated[index] = {
              ...updated[index],
              use_primary_info: true,
              address_line1: primaryData.address_line1,
              address_line2: primaryData.address_line2,
              city: primaryData.city,
              state: primaryData.state,
              zip_code: primaryData.zip_code,
              country: primaryData.country,
              mobile: primaryData.mobile,
              email: primaryData.email,
              emergency_contact_name: primaryData.emergency_contact_name,
              emergency_contact_phone: primaryData.emergency_contact_phone,
              guardian_name: `${primaryData.first_name} ${primaryData.last_name}`,
              guardian_mobile: primaryData.mobile
          };
      } else {
          updated[index] = {
              ...updated[index],
              use_primary_info: false
          };
      }
      updateData(updated);
  };

  const copyPrimaryToGuardian = (index: number) => {
      const updated = [...data];
      updated[index] = {
          ...updated[index],
          guardian_name: `${primaryData.first_name} ${primaryData.last_name}`,
          guardian_mobile: primaryData.mobile
      };
      updateData(updated);
  };

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

                    <CardContent sx={{ p: isMobile ? 2 : 4, pt: isMobile ? 3 : 4 }}>
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
                                            label={`${ageProfile.name} ${getAgeRangeLabel(ageProfile)}`} 
                                            size="small" 
                                            sx={{ 
                                                mt: 0.5, 
                                                height: 20, 
                                                fontSize: '0.65rem', 
                                                fontWeight: 800, 
                                                bgcolor: '#f1f5f9', 
                                                color: '#475569',
                                                textTransform: 'uppercase',
                                                '& .MuiChip-label': { px: 1 }
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
                                    onChange={(e) => updatePrimaryData('first_name', e.target.value)}
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
                                    onChange={(e) => updatePrimaryData('last_name', e.target.value)}
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
                                    onChange={(e) => updatePrimaryData('date_of_birth', e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6 }}>
                                <FormControl fullWidth size="small">
                                    <InputLabel shrink>Gender (Optional)</InputLabel>
                                    <Select value={primaryData.gender || ''} onChange={e => updatePrimaryData('gender', e.target.value)} label="Gender (Optional)" displayEmpty>
                                        <MenuItem value=""><em>Prefer not to say</em></MenuItem>
                                        <MenuItem value="Male">Male</MenuItem>
                                        <MenuItem value="Female">Female</MenuItem>
                                        <MenuItem value="Other">Other</MenuItem>
                                    </Select>
                                </FormControl>
                            </Grid>
                             <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField 
                                    label="Mobile Number"
                                    placeholder="(555) 123-4567"
                                    size="small"
                                    fullWidth
                                    value={primaryData.mobile || ''}
                                    onChange={(e) => updatePrimaryData('mobile', e.target.value)}
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
                                    onChange={(e) => updatePrimaryData('email', e.target.value)}
                                    slotProps={{ inputLabel: { shrink: true } }}
                                />
                            </Grid>

                             {/* Waiver Program for Primary */}
                             <Grid size={{ xs: 12, sm: 6 }}>
                                <TextField
                                    select
                                    fullWidth
                                    size="small"
                                    label="Waiver Program (Optional)"
                                    value={waiverPrograms.some(p => p.waiver_program_id === primaryData.waiver_program_id) ? primaryData.waiver_program_id : ''}
                                    onChange={(e: any) => updatePrimaryData('waiver_program_id', e.target.value)}
                                    slotProps={{ 
                                        inputLabel: { shrink: true },
                                        select: { displayEmpty: true }
                                    }}
                                >
                                    <MenuItem value=""><em>None / Private Pay</em></MenuItem>
                                    {waiverPrograms.filter(p => p.is_active).map((p: any) => (
                                        <MenuItem key={p.waiver_program_id} value={p.waiver_program_id}>
                                            {p.name}
                                        </MenuItem>
                                    ))}
                                </TextField>
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
                                            onChange={(e) => updatePrimaryData('case_manager_name', e.target.value)}
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
                                            onChange={(e) => updatePrimaryData('case_manager_email', e.target.value)}
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
                <CardContent sx={{ p: isMobile ? 2 : 4 }}>
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
                                            label={`${ageProfile.name} ${getAgeRangeLabel(ageProfile)}`} 
                                            size="small" 
                                            sx={{ 
                                                height: 20, 
                                                fontSize: '0.65rem', 
                                                fontWeight: 800, 
                                                bgcolor: memberIsMinor ? '#e0f2fe' : '#f1f5f9', 
                                                color: memberIsMinor ? '#0369a1' : '#475569',
                                                textTransform: 'uppercase',
                                                '& .MuiChip-label': { px: 1 }
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
                                onChange={(e) => handleChange(index, 'first_name', e.target.value)}
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
                                onChange={(e) => handleChange(index, 'last_name', e.target.value)}
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
                                onChange={(e) => handleChange(index, 'date_of_birth', e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <FormControl fullWidth size="small">
                                <InputLabel shrink>Gender (Optional)</InputLabel>
                                <Select value={member.gender || ''} onChange={(e) => handleChange(index, 'gender', e.target.value)} label="Gender (Optional)" displayEmpty>
                                    <MenuItem value=""><em>Prefer not to say</em></MenuItem>
                                    <MenuItem value="Male">Male</MenuItem>
                                    <MenuItem value="Female">Female</MenuItem>
                                    <MenuItem value="Other">Other</MenuItem>
                                </Select>
                            </FormControl>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 12 }}>
                            <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mb: 1, 
                                mt: 1,
                                bgcolor: '#f1f5f9',
                                p: 1.5,
                                borderRadius: 2
                            }}>
                                <FormControlLabel
                                    control={
                                        <Checkbox 
                                            size="small"
                                            checked={member.use_primary_info || false} 
                                            onChange={(e) => handleTogglePrimaryInfo(index, e.target.checked)}
                                        />
                                    }
                                    label={
                                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#475569' }}>
                                            Same address and contact info as primary member
                                        </Typography>
                                    }
                                    sx={{ m: 0 }}
                                />
                            </Box>
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                                Address & Contact Information
                            </Typography>
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                             <TextField 
                                label="Mobile (Optional)"
                                placeholder="(555) 123-4567"
                                size="small"
                                fullWidth
                                value={member.mobile || ''}
                                onChange={(e) => handleChange(index, 'mobile', e.target.value)}
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
                                onChange={(e) => handleChange(index, 'email', e.target.value)}
                                slotProps={{ inputLabel: { shrink: true } }}
                            />
                        </Grid>

                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Address Line 1" size="small" fullWidth value={member.address_line1 || ''} onChange={(e) => handleChange(index, 'address_line1', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Address Line 2" placeholder="Apt, Suite, etc." size="small" fullWidth value={member.address_line2 || ''} onChange={(e) => handleChange(index, 'address_line2', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="City" size="small" fullWidth value={member.city || ''} onChange={(e) => handleChange(index, 'city', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="State" size="small" fullWidth value={member.state || ''} onChange={(e) => handleChange(index, 'state', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="Zip Code" size="small" fullWidth value={member.zip_code || ''} onChange={(e) => handleChange(index, 'zip_code', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 4 }}>
                            <TextField label="Country" size="small" fullWidth value={member.country || 'USA'} onChange={(e) => handleChange(index, 'country', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>

                        <Grid size={{ xs: 12 }}>
                            <Typography variant="caption" sx={{ fontWeight: 800, color: '#94a3b8', letterSpacing: '0.05em', textTransform: 'uppercase', mt: 1, display: 'block' }}>
                                Emergency Contact
                            </Typography>
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Emergency Name" size="small" fullWidth value={member.emergency_contact_name || ''} onChange={(e) => handleChange(index, 'emergency_contact_name', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <TextField label="Emergency Phone" size="small" fullWidth value={member.emergency_contact_phone || ''} onChange={(e) => handleChange(index, 'emergency_contact_phone', e.target.value)} slotProps={{ inputLabel: { shrink: true } }} />
                        </Grid>

                        {/* Waiver Program Selection */}
                         <Grid size={{ xs: 12, sm: 6 }}>
                             <TextField
                                select
                                fullWidth
                                size="small"
                                label="Waiver Program (Optional)"
                                value={waiverPrograms.some(p => p.waiver_program_id === member.waiver_program_id) ? member.waiver_program_id : ''}
                                onChange={(e: any) => handleChange(index, 'waiver_program_id', e.target.value)}
                                slotProps={{ 
                                    inputLabel: { shrink: true },
                                    select: { displayEmpty: true }
                                }}
                            >
                                <MenuItem value=""><em>None / Private Pay</em></MenuItem>
                                {waiverPrograms.filter(p => p.is_active).map((p: any) => (
                                    <MenuItem key={p.waiver_program_id} value={p.waiver_program_id}>
                                        {p.name}
                                    </MenuItem>
                                ))}
                            </TextField>
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
                                        onChange={(e) => handleChange(index, 'case_manager_name', e.target.value)}
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
                                        onChange={(e) => handleChange(index, 'case_manager_email', e.target.value)}
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
                                            Guardian Info
                                        </Typography>
                                        {!member.use_primary_info && (
                                            <Tooltip title="Copy name and mobile from Primary Member">
                                                <Button 
                                                    variant="outlined"
                                                    size="small" 
                                                    startIcon={<ContentCopy fontSize="inherit" />} 
                                                    onClick={() => copyPrimaryToGuardian(index)}
                                                    sx={{ fontSize: '0.65rem', textTransform: 'none', py: 0.5, borderRadius: 1.5 }}
                                                >
                                                    Copy Primary Info
                                                </Button>
                                            </Tooltip>
                                        )}
                                    </Box>
                                    
                                    <Grid container spacing={2}>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField 
                                                label="Guardian Name"
                                                placeholder="Full Name"
                                                size="small"
                                                fullWidth
                                                required
                                                value={member.guardian_name || ''}
                                                onChange={(e) => handleChange(index, 'guardian_name', e.target.value)}
                                                slotProps={{ inputLabel: { shrink: true } }}
                                            />
                                        </Grid>
                                        <Grid size={{ xs: 12, sm: 6 }}>
                                            <TextField 
                                                label="Guardian Mobile"
                                                placeholder="(555) 123-4567"
                                                size="small"
                                                fullWidth
                                                required
                                                value={member.guardian_mobile || ''}
                                                onChange={(e) => handleChange(index, 'guardian_mobile', e.target.value)}
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
