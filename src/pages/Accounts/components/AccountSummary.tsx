
import { Box, Paper, Typography, Chip, Grid } from '@mui/material';

interface AccountSummaryProps {
  account: any;
}

export const AccountSummary = ({ account }: AccountSummaryProps) => {
  if (!account) return null;

  const primaryProfile = account.primary_profile || (account.profiles && account.profiles.find((p: any) => p.is_primary));
  const name = primaryProfile ? `${primaryProfile.first_name} ${primaryProfile.last_name}` : 'Unknown';
  const email = primaryProfile?.email || 'N/A';
  const memberCount = account.profiles?.length || 0;

  return (
    <Paper sx={{ p: 3, mb: 3, borderRadius: '12px', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}>
      <Grid container spacing={2} alignItems="center">
        <Grid size={{ xs: 12, md: 8 }}>
          <Typography variant="h5" fontWeight="600" color="#1e293b" gutterBottom>
            {name}
          </Typography>
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mb: 1 }}>
            <Typography variant="body1" color="#64748b">
              {email}
            </Typography>
            <Chip 
              label={account.status} 
              size="small" 
              color={account.status === 'ACTIVE' ? 'success' : account.status === 'PENDING' ? 'warning' : 'default'}
              variant="outlined"
            />
             <Chip 
              label={`${memberCount} Members`} 
              size="small" 
              variant="outlined"
              sx={{ borderColor: '#e2e8f0' }}
            />
          </Box>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }} sx={{ textAlign: 'right' }}>
           <Typography variant="caption" color="#94a3b8">
             Account ID: {account.account_id}
           </Typography>
           <br/>
           <Typography variant="caption" color="#94a3b8">
             Created: {new Date(account.created_at).toLocaleDateString()}
           </Typography>
        </Grid>
      </Grid>
    </Paper>
  );
};
