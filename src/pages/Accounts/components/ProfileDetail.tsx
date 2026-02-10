import { Box, Paper, Typography, Grid, Divider } from '@mui/material';

interface ProfileDetailProps {
  profile: any;
  accountId?: string;
}

export const ProfileDetail = ({ profile }: ProfileDetailProps) => {
  if (!profile) return <Box sx={{ p: 3, textAlign: 'center', color: '#94a3b8' }}>Select a profile to view details</Box>;

  return (
    <Paper sx={{ width: '100%', minHeight: 400, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)', p: 3 }}>
        <Grid container spacing={2}>
            <Grid size={12}>
                <Typography variant="h6" gutterBottom>Profile Information</Typography>
            </Grid>
            <Grid size={6}>
                <Typography variant="subtitle2" color="text.secondary">Full Name</Typography>
                <Typography variant="body1">{profile.first_name} {profile.last_name}</Typography>
            </Grid>
            <Grid size={6}>
                <Typography variant="subtitle2" color="text.secondary">Date of Birth</Typography>
                <Typography variant="body1">{profile.date_of_birth ? new Date(profile.date_of_birth).toLocaleDateString() : 'N/A'}</Typography>
            </Grid>
            <Grid size={6}>
                 <Typography variant="subtitle2" color="text.secondary">Email</Typography>
                 <Typography variant="body1">{profile.email || 'N/A'}</Typography>
            </Grid>
             <Grid size={6}>
                 <Typography variant="subtitle2" color="text.secondary">Role</Typography>
                 <Typography variant="body1">{profile.is_primary ? 'Primary Member' : 'Family Member'}</Typography>
            </Grid>

            {/* Waiver Info */}
            <Grid size={12} sx={{ mt: 2 }}>
                <Typography variant="subtitle2" color="text.secondary">Waiver Program</Typography>
                <Typography variant="body1">
                    {profile.waiver_program ? `${profile.waiver_program.name} (${profile.waiver_program.code})` : 'None'}
                </Typography>
            </Grid>
            
            <Grid size={12} sx={{ mt: 2 }}>
                <Divider />
            </Grid>

            {/* Guardian Info if applicable */}
            {(profile.guardian_name || profile.emergency_contact_name) && (
                <>
                <Grid size={12} sx={{ mt: 1 }}>
                    <Typography variant="h6" gutterBottom>Emergency & Guardian</Typography>
                </Grid>
                {profile.guardian_name && (
                    <Grid size={6}>
                        <Typography variant="subtitle2" color="text.secondary">Guardian</Typography>
                        <Typography variant="body1">{profile.guardian_name} ({profile.guardian_mobile})</Typography>
                    </Grid>
                )}
                 {profile.emergency_contact_name && (
                    <Grid size={6}>
                        <Typography variant="subtitle2" color="text.secondary">Emergency Contact</Typography>
                        <Typography variant="body1">{profile.emergency_contact_name} ({profile.emergency_contact_phone})</Typography>
                    </Grid>
                )}
                </>
            )}
        </Grid>
    </Paper>
  );
};

