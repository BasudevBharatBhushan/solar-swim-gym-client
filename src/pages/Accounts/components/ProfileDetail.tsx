
import { Box, Typography, Grid, Divider, Stack, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import CakeIcon from '@mui/icons-material/Cake';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import ContactPhoneIcon from '@mui/icons-material/ContactPhone';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';

interface ProfileDetailProps {
  profile: any;
  accountId?: string;
}

const DetailItem = ({ icon, label, value }: { icon: any, label: string, value: string }) => (
  <Stack direction="row" spacing={2} alignItems="flex-start" sx={{ mb: 3 }}>
    <Avatar sx={{ bgcolor: '#f1f5f9', color: '#64748b', width: 40, height: 40, borderRadius: '10px' }}>
      {icon}
    </Avatar>
    <Box>
      <Typography variant="caption" sx={{ color: '#94a3b8', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
        {label}
      </Typography>
      <Typography variant="body1" sx={{ fontWeight: 600, color: '#1e293b' }}>
        {value}
      </Typography>
    </Box>
  </Stack>
);

export const ProfileDetail = ({ profile }: ProfileDetailProps) => {
  if (!profile) return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', py: 8 }}>
       <PersonIcon sx={{ fontSize: '4rem', color: '#e2e8f0', mb: 2 }} />
       <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 500 }}>Select a member to view details</Typography>
    </Box>
  );

  return (
    <Box>
        <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
            <AssignmentIndIcon sx={{ color: '#3b82f6' }} /> Member Profile
        </Typography>

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
                    icon={<CakeIcon fontSize="small" />} 
                    label="Date of Birth" 
                    value={profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString(undefined, { dateStyle: 'long' }) : 'N/A'} 
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem 
                    icon={<EmailIcon fontSize="small" />} 
                    label="Email Address" 
                    value={profile.email || 'N/A'} 
                />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
                <DetailItem 
                    icon={<ShieldIcon fontSize="small" />} 
                    label="Account Role" 
                    value={profile.is_primary ? 'Primary Member' : 'Family Member'} 
                />
            </Grid>
            <Grid size={12}>
                <DetailItem 
                    icon={<ContactPhoneIcon fontSize="small" />} 
                    label="Waiver Program" 
                    value={profile.waiver_program ? `${profile.waiver_program.name} (${profile.waiver_program.code})` : 'No Program Assigned'} 
                />
            </Grid>
        </Grid>

        {(profile.guardian_name || profile.emergency_contact_name) && (
            <>
            <Box sx={{ my: 2 }}>
                <Divider />
            </Box>
            
            <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', mb: 4, mt: 4, display: 'flex', alignItems: 'center', gap: 1 }}>
                <ShieldIcon sx={{ color: '#ef4444' }} /> Emergency & Guardian
            </Typography>

            <Grid container spacing={1}>
                {profile.guardian_name && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailItem 
                            icon={<ContactPhoneIcon fontSize="small" />} 
                            label="Guardian" 
                            value={`${profile.guardian_name} (${profile.guardian_mobile})`} 
                        />
                    </Grid>
                )}
                 {profile.emergency_contact_name && (
                    <Grid size={{ xs: 12, sm: 6 }}>
                        <DetailItem 
                            icon={<ContactPhoneIcon fontSize="small" />} 
                            label="Emergency Contact" 
                            value={`${profile.emergency_contact_name} (${profile.emergency_contact_phone})`} 
                        />
                    </Grid>
                )}
            </Grid>
            </>
        )}
    </Box>
  );
};

