
import { Box, Paper, Typography, Chip, Grid, Stack } from '@mui/material';
import EmailIcon from '@mui/icons-material/Email';
import FingerprintIcon from '@mui/icons-material/Fingerprint';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PeopleIcon from '@mui/icons-material/People';

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
    <Paper 
      elevation={0}
      sx={{ 
        p: 3, 
        mb: 3, 
        borderRadius: '16px', 
        border: '1px solid #e2e8f0',
        background: 'linear-gradient(to right, #ffffff, #f8fafc)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: 0,
          width: '4px',
          height: '100%',
          bgcolor: account.status === 'ACTIVE' ? '#10b981' : account.status === 'PENDING' ? '#f59e0b' : '#94a3b8'
        }
      }}
    >
      <Grid container spacing={3} alignItems="center">
        <Grid size={{ xs: 12, md: 8 }}>
          <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 1 }}>
            <Typography variant="h4" fontWeight="800" color="#1e293b" sx={{ letterSpacing: '-0.5px' }}>
              {name}
            </Typography>
            <Chip 
              label={account.status} 
              size="small" 
              color={account.status === 'ACTIVE' ? 'success' : account.status === 'PENDING' ? 'warning' : 'default'}
              sx={{ fontWeight: 700, px: 1 }}
            />
          </Stack>
          
          <Stack direction="row" spacing={3} flexWrap="wrap" useFlexGap>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <EmailIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                {email}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <PeopleIcon sx={{ fontSize: '1rem', color: '#64748b' }} />
              <Typography variant="body2" color="#64748b" fontWeight={500}>
                {memberCount} {memberCount === 1 ? 'Member' : 'Members'}
              </Typography>
            </Box>
          </Stack>
        </Grid>
        
        <Grid size={{ xs: 12, md: 4 }}>
          <Box 
            sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: { xs: 'flex-start', md: 'flex-end' },
              gap: 1
            }}
          >
            <Stack direction="row" spacing={1} alignItems="center">
              <FingerprintIcon sx={{ fontSize: '0.9rem', color: '#94a3b8' }} />
              <Typography variant="caption" color="#94a3b8" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
                ID: {account.account_id}
              </Typography>
            </Stack>
            <Stack direction="row" spacing={1} alignItems="center">
              <CalendarMonthIcon sx={{ fontSize: '0.9rem', color: '#94a3b8' }} />
              <Typography variant="caption" color="#94a3b8" fontWeight={500}>
                Account Since {new Date(account.created_at).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </Typography>
            </Stack>
          </Box>
        </Grid>
      </Grid>
    </Paper>
  );
};
