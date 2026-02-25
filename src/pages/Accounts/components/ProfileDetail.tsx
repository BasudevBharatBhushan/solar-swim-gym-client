
import React from 'react';
import { Box, Typography, Grid, Divider, Stack, Avatar, Chip } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import HomeIcon from '@mui/icons-material/Home';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import WaterIcon from '@mui/icons-material/Water';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import WcIcon from '@mui/icons-material/Wc';
import PhoneIcon from '@mui/icons-material/Phone';
import EditIcon from '@mui/icons-material/Edit';
import { Button } from '@mui/material';
import { useConfig } from '../../../context/ConfigContext';
import { getAgeGroup, getAgeRangeLabel } from '../../../lib/ageUtils';
import BadgeIcon from '@mui/icons-material/Badge';

interface ProfileDetailProps {
  profile: any;
  accountId?: string;
  onEdit?: () => void;
}

const DetailItem = ({ icon, label, value, faded }: { icon: any; label: string; value: string; faded?: boolean }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
    <Avatar sx={{ bgcolor: faded ? '#f8fafc' : '#f1f5f9', color: faded ? '#cbd5e1' : '#64748b', width: 40, height: 40, borderRadius: '10px' }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: faded ? 400 : 600, color: faded ? '#94a3b8' : '#1e293b', fontStyle: faded ? 'italic' : 'normal' }}>
        {value}
      </Typography>
    </Box>
  </Stack>
);

const SectionHeader = ({ icon, label }: { icon: React.ReactNode; label: string }) => (
  <Box sx={{ my: 2 }}>
    <Divider />
    <Typography
      variant="overline"
      sx={{
        mt: 2.5,
        mb: 0.5,
        display: 'flex',
        alignItems: 'center',
        gap: 0.75,
        fontWeight: 800,
        color: '#475569',
        letterSpacing: '0.8px',
        fontSize: '0.7rem',
      }}
    >
      {icon}
      {label}
    </Typography>
  </Box>
);

export const ProfileDetail = ({ profile, onEdit }: ProfileDetailProps) => {
  const { ageGroups } = useConfig();
  const membershipAgeGroup = profile?.date_of_birth ? getAgeGroup(profile.date_of_birth, ageGroups, 'Membership') : null;

  if (!profile) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
       <PersonIcon sx={{ fontSize: '4rem', color: '#e2e8f0', mb: 2 }} />
       <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>Select a member to view details</Typography>
    </Box>
  );

  const na = (val: any) => (val && String(val).trim()) ? String(val).trim() : null;

  // Build a formatted address string
  const buildAddress = () => {
    const line1 = na(profile.address_line1);
    const line2 = na(profile.address_line2);
    const city = na(profile.city);
    const state = na(profile.state);
    const zip = na(profile.zip_code);
    const country = na(profile.country);
    if (!line1 && !city && !state) return null;
    const parts = [
      line1,
      line2,
      [city, state].filter(Boolean).join(', '),
      [zip, country].filter(Boolean).join(' '),
    ].filter(Boolean);
    return parts.join('\n');
  };

  const addressText = buildAddress();
  const hasGuardianOrEmergency = profile.guardian_name || profile.emergency_contact_name;
  const hasWaiverProgram = profile.waiver_program_id || profile.waiver_program;
  const hasCaseManager = profile.case_manager_name || profile.case_manager_email;

  return (
    <Box>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <AssignmentIndIcon sx={{ color: '#3b82f6' }} /> Member Profile
                </Typography>
                {profile.is_primary && (
                    <Chip label="Primary" size="small" sx={{ fontWeight: 700, fontSize: '0.65rem', bgcolor: '#eff6ff', color: '#1d4ed8', border: '1px solid #bfdbfe' }} />
                )}
            </Box>
            <Button
                startIcon={<EditIcon sx={{ fontSize: '1rem !important' }} />}
                onClick={onEdit}
                size="small"
                sx={{
                    textTransform: 'none',
                    fontWeight: 700,
                    fontSize: '0.8rem',
                    color: '#64748b',
                    bgcolor: '#f1f5f9',
                    px: 1.5,
                    borderRadius: '8px',
                    '&:hover': { bgcolor: '#e2e8f0', color: '#1e293b' }
                }}
            >
                Edit
            </Button>
        </Box>

        {/* ── Basic Info ─────────────────────────────────────── */}
        <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<PersonIcon fontSize="small" />}
                    label="Full Name"
                    value={`${profile.first_name} ${profile.last_name}`}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<WcIcon fontSize="small" />}
                    label="Gender"
                    value={na(profile.gender) || 'Not specified'}
                    faded={!na(profile.gender)}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<CakeIcon fontSize="small" />}
                    label="Date of Birth"
                    value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'}
                    faded={!profile.date_of_birth}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<BadgeIcon fontSize="small" />}
                    label="Membership Age Profile"
                    value={membershipAgeGroup ? `${membershipAgeGroup.name} ${getAgeRangeLabel(membershipAgeGroup)}` : 'Not Assigned'}
                    faded={!membershipAgeGroup}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<EmailIcon fontSize="small" />}
                    label="Email Address"
                    value={na(profile.email) || 'None'}
                    faded={!na(profile.email)}
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<PhoneIcon fontSize="small" />}
                    label="Mobile Number"
                    value={na(profile.mobile) || 'Not provided'}
                    faded={!na(profile.mobile)}
                />
            </Grid>
            {!profile.is_primary && (
                <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailItem
                        icon={<WcIcon fontSize="small" />}
                        label="Relationship"
                        value={na(profile.relationship) || 'Not specified'}
                        faded={!na(profile.relationship)}
                    />
                </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem
                    icon={<ShieldIcon fontSize="small" />}
                    label="Account Role"
                    value={profile.is_primary ? 'Primary Member' : 'Family Member'}
                />
            </Grid>
        </Grid>

        {/* ── Address ─────────────────────────────────────────── */}
        <SectionHeader icon={<HomeIcon sx={{ fontSize: '0.85rem' }} />} label="Address" />
        <Grid container spacing={1}>
            <Grid size={12}>
                {addressText ? (
                    <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
                        <Avatar sx={{ bgcolor: '#f1f5f9', color: '#64748b', width: 40, height: 40, borderRadius: '10px', flexShrink: 0 }}>
                            <HomeIcon fontSize="small" />
                        </Avatar>
                        <Box>
                            <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                                Full Address
                            </Typography>
                            <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b', whiteSpace: 'pre-line' }}>
                                {addressText}
                            </Typography>
                        </Box>
                    </Stack>
                ) : (
                    <DetailItem icon={<HomeIcon fontSize="small" />} label="Full Address" value="No address on file" faded />
                )}
            </Grid>
        </Grid>

        {/* ── Waiver / Funding Program ─────────────────────────── */}
        <SectionHeader icon={<WaterIcon sx={{ fontSize: '0.85rem' }} />} label="Waiver / Funding Program" />
        <Grid container spacing={1}>
            <Grid size={{ xs: 12, sm: hasWaiverProgram && hasCaseManager ? 6 : 12 }}>
                <DetailItem
                    icon={<VerifiedUserIcon fontSize="small" />}
                    label="Waiver Program"
                    value={profile.waiver_program ? `${profile.waiver_program.name}${profile.waiver_program.code ? ` (${profile.waiver_program.code})` : ''}` : 'No Program Assigned'}
                    faded={!profile.waiver_program}
                />
            </Grid>
            {na(profile.case_manager_name) && (
                <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailItem icon={<ContactPhoneIcon fontSize="small" />} label="Case Manager Name" value={profile.case_manager_name} />
                </Grid>
            )}
            {na(profile.case_manager_email) && (
                <Grid size={{ xs: 12, sm: 6 }}>
                    <DetailItem icon={<EmailIcon fontSize="small" />} label="Case Manager Email" value={profile.case_manager_email} />
                </Grid>
            )}
            {!na(profile.case_manager_name) && !na(profile.case_manager_email) && (
                <Grid size={12}>
                    <DetailItem icon={<ContactPhoneIcon fontSize="small" />} label="Case Manager" value="Not assigned" faded />
                </Grid>
            )}
        </Grid>

        {/* ── Emergency & Guardian ─────────────────────────────── */}
        {hasGuardianOrEmergency && (
            <>
                <SectionHeader icon={<LocalHospitalIcon sx={{ fontSize: '0.85rem', color: '#ef4444' }} />} label="Emergency & Guardian" />
                <Grid container spacing={1}>
                    {profile.guardian_name ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DetailItem
                                icon={<ContactPhoneIcon fontSize="small" />}
                                label="Guardian"
                                value={`${profile.guardian_name}${profile.guardian_mobile ? ` · ${profile.guardian_mobile}` : ''}`}
                            />
                        </Grid>
                    ) : null}
                    {profile.guardian_email ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DetailItem
                                icon={<EmailIcon fontSize="small" />}
                                label="Guardian Email"
                                value={profile.guardian_email}
                            />
                        </Grid>
                    ) : null}
                    {profile.emergency_contact_name ? (
                        <Grid size={{ xs: 12, sm: 6 }}>
                            <DetailItem
                                icon={<ContactPhoneIcon fontSize="small" />}
                                label="Emergency Contact"
                                value={`${profile.emergency_contact_name}${profile.emergency_contact_phone ? ` · ${profile.emergency_contact_phone}` : ''}`}
                            />
                        </Grid>
                    ) : null}
                </Grid>
            </>
        )}
    </Box>
  );
};

